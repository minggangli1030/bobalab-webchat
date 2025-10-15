import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Cloud Function to delete a user completely (Auth + Firestore data)
export const deleteUser = onCall(async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  const adminUser = await admin
    .firestore()
    .collection("users")
    .doc(request.auth.uid)
    .get();

  if (!adminUser.exists || !adminUser.data()?.isAdmin) {
    throw new HttpsError("permission-denied", "Only admins can delete users.");
  }

  const { userId } = request.data;

  if (!userId) {
    throw new HttpsError("invalid-argument", "userId is required.");
  }

  try {
    // Prevent admin from deleting themselves
    if (userId === request.auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "Admins cannot delete themselves."
      );
    }

    // Check if the user to be deleted is an admin
    const userToDelete = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (userToDelete.exists && userToDelete.data()?.isAdmin) {
      throw new HttpsError("permission-denied", "Cannot delete admin users.");
    }

    // Delete all posts by this user
    const postsSnapshot = await admin
      .firestore()
      .collection("posts")
      .where("authorId", "==", userId)
      .get();

    const deletePostPromises = postsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePostPromises);

    // Delete the user document from Firestore
    await admin.firestore().collection("users").doc(userId).delete();

    // Delete the Firebase Authentication account
    await admin.auth().deleteUser(userId);

    return {
      success: true,
      message:
        "User deleted successfully from both Firestore and Authentication.",
      deletedPosts: postsSnapshot.docs.length,
    };
  } catch (error) {
    console.error("Error deleting user:", error);

    // If it's already an HttpsError, re-throw it
    if (error instanceof HttpsError) {
      throw error;
    }

    // Otherwise, throw a generic error
    throw new HttpsError(
      "internal",
      "An error occurred while deleting the user."
    );
  }
});

// Cloud Function to delete only user posts (without deleting the user)
export const deleteUserPosts = onCall(async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  const adminUser = await admin
    .firestore()
    .collection("users")
    .doc(request.auth.uid)
    .get();

  if (!adminUser.exists || !adminUser.data()?.isAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can delete user posts."
    );
  }

  const { userId } = request.data;

  if (!userId) {
    throw new HttpsError("invalid-argument", "userId is required.");
  }

  try {
    // Delete all posts by this user
    const postsSnapshot = await admin
      .firestore()
      .collection("posts")
      .where("authorId", "==", userId)
      .get();

    const deletePostPromises = postsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePostPromises);

    return {
      success: true,
      message: "User posts deleted successfully.",
      deletedPosts: postsSnapshot.docs.length,
    };
  } catch (error) {
    console.error("Error deleting user posts:", error);
    throw new HttpsError(
      "internal",
      "An error occurred while deleting user posts."
    );
  }
});
