"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserPosts = exports.deleteUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Cloud Function to delete a user completely (Auth + Firestore data)
exports.deleteUser = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    // Check if the user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // Check if the user is an admin
    const adminUser = await admin.firestore()
        .collection("users")
        .doc(request.auth.uid)
        .get();
    if (!adminUser.exists || !((_a = adminUser.data()) === null || _a === void 0 ? void 0 : _a.isAdmin)) {
        throw new https_1.HttpsError("permission-denied", "Only admins can delete users.");
    }
    const { userId } = request.data;
    if (!userId) {
        throw new https_1.HttpsError("invalid-argument", "userId is required.");
    }
    try {
        // Prevent admin from deleting themselves
        if (userId === request.auth.uid) {
            throw new https_1.HttpsError("permission-denied", "Admins cannot delete themselves.");
        }
        // Check if the user to be deleted is an admin
        const userToDelete = await admin.firestore()
            .collection("users")
            .doc(userId)
            .get();
        if (userToDelete.exists && ((_b = userToDelete.data()) === null || _b === void 0 ? void 0 : _b.isAdmin)) {
            throw new https_1.HttpsError("permission-denied", "Cannot delete admin users.");
        }
        // Delete all posts by this user
        const postsSnapshot = await admin.firestore()
            .collection("posts")
            .where("authorId", "==", userId)
            .get();
        const deletePostPromises = postsSnapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deletePostPromises);
        // Delete the user document from Firestore
        await admin.firestore().collection("users").doc(userId).delete();
        // Delete the Firebase Authentication account
        await admin.auth().deleteUser(userId);
        return {
            success: true,
            message: "User deleted successfully from both Firestore and Authentication.",
            deletedPosts: postsSnapshot.docs.length,
        };
    }
    catch (error) {
        console.error("Error deleting user:", error);
        // If it's already an HttpsError, re-throw it
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Otherwise, throw a generic error
        throw new https_1.HttpsError("internal", "An error occurred while deleting the user.");
    }
});
// Cloud Function to delete only user posts (without deleting the user)
exports.deleteUserPosts = (0, https_1.onCall)(async (request) => {
    var _a;
    // Check if the user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // Check if the user is an admin
    const adminUser = await admin.firestore()
        .collection("users")
        .doc(request.auth.uid)
        .get();
    if (!adminUser.exists || !((_a = adminUser.data()) === null || _a === void 0 ? void 0 : _a.isAdmin)) {
        throw new https_1.HttpsError("permission-denied", "Only admins can delete user posts.");
    }
    const { userId } = request.data;
    if (!userId) {
        throw new https_1.HttpsError("invalid-argument", "userId is required.");
    }
    try {
        // Delete all posts by this user
        const postsSnapshot = await admin.firestore()
            .collection("posts")
            .where("authorId", "==", userId)
            .get();
        const deletePostPromises = postsSnapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deletePostPromises);
        return {
            success: true,
            message: "User posts deleted successfully.",
            deletedPosts: postsSnapshot.docs.length,
        };
    }
    catch (error) {
        console.error("Error deleting user posts:", error);
        throw new https_1.HttpsError("internal", "An error occurred while deleting user posts.");
    }
});
//# sourceMappingURL=index.js.map