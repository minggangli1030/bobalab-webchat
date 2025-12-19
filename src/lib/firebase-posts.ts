import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, functions } from "./firebase";
import { Post, Comment, User, SystemSettings, Highlight } from "./types";

export const firebasePostUtils = {
  // System Settings Logic
  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      if (!db) return { currentBatch: 1, previousBatchVisible: false };
      const settingsRef = doc(db!, "settings", "general");
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          currentBatch: data.currentBatch || 1,
          previousBatchVisible: data.previousBatchVisible || false,
        };
      }

      // Initialize if not exists
      await setDoc(settingsRef, {
        currentBatch: 1,
        previousBatchVisible: false,
      });
      return { currentBatch: 1, previousBatchVisible: false };
    } catch (error) {
      console.error("Error getting system settings:", error);
      return { currentBatch: 1, previousBatchVisible: false };
    }
  },

  updateSystemSettings: async (
    settings: Partial<SystemSettings>
  ): Promise<boolean> => {
    try {
      if (!db) {
        console.error("Firebase db not initialized");
        return false;
      }
      const settingsRef = doc(db!, "settings", "general");
      // Ensure we have all required fields
      const completeSettings: SystemSettings = {
        currentBatch: settings.currentBatch ?? 1,
        previousBatchVisible: settings.previousBatchVisible ?? false,
      };
      console.log("Saving settings to Firestore:", completeSettings);
      await setDoc(settingsRef, completeSettings, { merge: true });
      console.log("Settings saved successfully");
      return true;
    } catch (error) {
      console.error("Error updating system settings:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return false;
    }
  },

  // Upload image to Firebase Storage
  uploadImage: async (file: File, postId: string): Promise<string | null> => {
    try {
      if (!storage) return null;
      const storageRef = ref(
        storage!,
        `posts/${postId}/${Date.now()}_${file.name}`
      );
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  },

  // Upload multiple images
  uploadImages: async (files: File[], postId: string): Promise<string[]> => {
    const uploadPromises = files.map((file) =>
      firebasePostUtils.uploadImage(file, postId)
    );
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  },

  // Create a new post
  createPost: async (
    postData: Omit<Post, "id" | "createdAt">
  ): Promise<string | null> => {
    try {
      console.log("Firebase createPost called with:", postData);

      // Check if Firebase is initialized
      if (!db) {
        console.error("Firebase not initialized");
        return null;
      }

      const postRef = await addDoc(collection(db!, "posts"), {
        ...postData,
        createdAt: Timestamp.now(),
      });

      console.log("Post created successfully with ID:", postRef.id);
      return postRef.id;
    } catch (error) {
      console.error("Error creating post:", error);
      return null;
    }
  },

  // Get all posts (with pagination)
  getAllPosts: async (limitCount: number = 1000): Promise<Post[]> => {
    try {
      // Check if Firebase is initialized
      if (!db) {
        return [];
      }

      // Fetch all posts without orderBy to ensure we get every post
      // Some posts might be missing createdAt or have data issues, so we fetch all and sort in memory
      // Fetch all posts without orderBy to ensure we get every post
      // Some posts might be missing createdAt or have data issues, so we fetch all and sort in memory
      const querySnapshot = await getDocs(collection(db!, "posts"));

      const posts = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          authorId: data.authorId || "",
          authorName: data.authorName || "",
          businessName: data.businessName,
          content: data.content || "",
          images: data.images || [],
          imgurLinks: data.imgurLinks || [],
          hashtags: data.hashtags || [],
          category: data.category,
          phase: data.phase,

          batch: data.batch || 1, // Default to batch 1 if missing
          serviceExperience: data.serviceExperience,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt instanceof Date
            ? data.createdAt
            : data.createdAt
            ? new Date(data.createdAt)
            : new Date(), // Fallback to current date if missing
          highlights:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.highlights?.map((highlight: any) => ({
              ...highlight,
              createdAt: highlight.createdAt?.toDate
                ? highlight.createdAt.toDate()
                : highlight.createdAt instanceof Date
                ? highlight.createdAt
                : highlight.createdAt
                ? new Date(highlight.createdAt)
                : new Date(),
            })) || [],
          comments:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.comments?.map((comment: any) => ({
              ...comment,
              createdAt: comment.createdAt?.toDate
                ? comment.createdAt.toDate()
                : comment.createdAt instanceof Date
                ? comment.createdAt
                : comment.createdAt
                ? new Date(comment.createdAt)
                : new Date(),
            })) || [],
        } as Post;
      });

      // Sort by createdAt in memory (newest first) if we didn't use orderBy
      // This ensures all posts are included even if some are missing createdAt
      posts.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return dateB - dateA; // Descending order
      });

      // Apply limit after sorting
      return posts.slice(0, limitCount);
    } catch (error) {
      console.error("Error getting posts:", error);
      return [];
    }
  },

  // Get a specific post by ID
  getPostById: async (postId: string): Promise<Post | null> => {
    try {
      if (!db) return null;
      const postDoc = await getDoc(doc(db!, "posts", postId));
      if (postDoc.exists()) {
        const data = postDoc.data();

        return {
          id: postDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
          highlights:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.highlights?.map((highlight: any) => ({
              ...highlight,
              createdAt: highlight.createdAt?.toDate
                ? highlight.createdAt.toDate()
                : new Date(highlight.createdAt),
            })) || [],
          comments:
            data.comments?.map((comment: Record<string, unknown>) => ({
              ...comment,
              createdAt: (comment.createdAt as { toDate?: () => Date })?.toDate
                ? (comment.createdAt as { toDate: () => Date }).toDate()
                : new Date(comment.createdAt as string | number | Date),
            })) || [],
        } as Post;
      }
      return null;
    } catch (error) {
      console.error("Error getting post:", error);
      return null;
    }
  },

  // Update a post (for highlights, comments, etc.)
  updatePost: async (
    postId: string,
    updates: Partial<Post>
  ): Promise<boolean> => {
    try {
      if (!db) return false;
      const postRef = doc(db!, "posts", postId);

      // Convert dates to Timestamps for Firestore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firestoreUpdates: any = { ...updates };

      // Convert highlight dates to Timestamps
      if (
        firestoreUpdates.highlights &&
        Array.isArray(firestoreUpdates.highlights)
      ) {
        firestoreUpdates.highlights = (
          firestoreUpdates.highlights as Highlight[]
        ).map((h: Highlight) => ({
          ...h,
          createdAt:
            h.createdAt instanceof Date
              ? Timestamp.fromDate(h.createdAt)
              : (h.createdAt as { toDate?: () => Date })?.toDate
              ? (h.createdAt as { toDate: () => Date }).toDate()
              : Timestamp.fromDate(
                  new Date(h.createdAt as string | number | Date)
                ),
        }));
      }

      // Convert comment dates to Timestamps
      if (
        firestoreUpdates.comments &&
        Array.isArray(firestoreUpdates.comments)
      ) {
        firestoreUpdates.comments = (
          firestoreUpdates.comments as Comment[]
        ).map((c: Comment) => ({
          ...c,
          createdAt:
            c.createdAt instanceof Date
              ? Timestamp.fromDate(c.createdAt)
              : (c.createdAt as { toDate?: () => Date })?.toDate
              ? (c.createdAt as { toDate: () => Date }).toDate()
              : Timestamp.fromDate(
                  new Date(c.createdAt as string | number | Date)
                ),
        }));
      }

      await updateDoc(postRef, firestoreUpdates);
      return true;
    } catch (error) {
      console.error("Error updating post:", error);
      return false;
    }
  },

  // Delete a post
  deletePost: async (postId: string): Promise<boolean> => {
    try {
      if (!db) return false;
      await deleteDoc(doc(db!, "posts", postId));
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  },

  // Add a comment to a post
  addComment: async (postId: string, comment: Comment): Promise<boolean> => {
    try {
      const post = await firebasePostUtils.getPostById(postId);

      if (post) {
        // Add the new comment to the existing comments array
        // The updatePost function will handle date conversion to Timestamps
        const updatedComments = [...post.comments, comment];

        await firebasePostUtils.updatePost(postId, {
          comments: updatedComments,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding comment:", error);

      return false;
    }
  },

  // Update user batch (admin only)
  updateUserBatch: async (userId: string, batch: number): Promise<boolean> => {
    try {
      if (!db) return false;
      await updateDoc(doc(db!, "users", userId), { batch });
      return true;
    } catch (error) {
      console.error("Error updating user batch:", error);
      return false;
    }
  },

  // Update post batch (admin only)
  updatePostBatch: async (postId: string, batch: number): Promise<boolean> => {
    try {
      if (!db) return false;
      await updateDoc(doc(db!, "posts", postId), { batch });
      return true;
    } catch (error) {
      console.error("Error updating post batch:", error);
      return false;
    }
  },

  // Add highlight to a post (and create corresponding comment)
  addHighlight: async (
    postId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const post = await firebasePostUtils.getPostById(postId);
      if (!post) return false;

      // Check if user already highlighted this post
      const existingHighlight = post.highlights?.find(
        (h) => h.userId === userId
      );
      if (existingHighlight) {
        // Remove existing highlight and corresponding comment
        const updatedHighlights = post.highlights.filter(
          (h) => h.userId !== userId
        );
        const updatedComments = post.comments.filter(
          (c) => !(c.authorId === userId && c.content.includes("Highlighted: "))
        );
        await firebasePostUtils.updatePost(postId, {
          highlights: updatedHighlights,
          comments: updatedComments,
        });
        return true;
      }

      // Add new highlight
      const newHighlight = {
        userId,
        userName,
        reason,
        createdAt: new Date(),
      };

      // Create corresponding comment
      const highlightComment = {
        id: `highlight-${userId}-${Date.now()}`,
        postId: postId,
        authorId: userId,
        authorName: userName,
        content: `Highlighted: ${reason}`,
        createdAt: new Date(),
      };

      const updatedHighlights = [...(post.highlights || []), newHighlight];
      const updatedComments = [...(post.comments || []), highlightComment];

      await firebasePostUtils.updatePost(postId, {
        highlights: updatedHighlights,
        comments: updatedComments,
      });
      return true;
    } catch (error) {
      console.error("Error adding highlight:", error);
      return false;
    }
  },

  // Remove highlight from a post
  removeHighlight: async (postId: string, userId: string): Promise<boolean> => {
    try {
      const post = await firebasePostUtils.getPostById(postId);
      if (!post) return false;

      const updatedHighlights = (post.highlights || []).filter(
        (h) => h.userId !== userId
      );
      await firebasePostUtils.updatePost(postId, {
        highlights: updatedHighlights,
      });
      return true;
    } catch (error) {
      console.error("Error removing highlight:", error);
      return false;
    }
  },

  // Get all users (admin only)
  getAllUsers: async (): Promise<User[]> => {
    try {
      // Check if Firebase is initialized
      if (!db) {
        console.error("Firebase not initialized");
        return [];
      }

      const querySnapshot = await getDocs(collection(db!, "users"));
      const users = querySnapshot.docs.map((doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          batch: data.batch || 1, // Default to batch 1
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
        } as User;
      });

      console.log("Retrieved users:", users.length);
      return users;
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  },

  // Update user phase (admin only)
  updateUserPhase: async (
    userId: string,
    newPhase: number
  ): Promise<boolean> => {
    try {
      if (!db) {
        console.error("Firebase not initialized");
        return false;
      }

      const userRef = doc(db!, "users", userId);
      await updateDoc(userRef, { phase: newPhase });
      console.log(`User ${userId} phase updated to ${newPhase}`);
      return true;
    } catch (error) {
      console.error("Error updating user phase:", error);
      return false;
    }
  },

  // Delete all data (admin only)
  deleteAllData: async (): Promise<boolean> => {
    try {
      // Delete all posts
      if (!db) return false;
      const postsSnapshot = await getDocs(collection(db!, "posts"));
      const deletePostPromises = postsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePostPromises);

      // Delete all users except admin
      const usersSnapshot = await getDocs(collection(db!, "users"));
      const deleteUserPromises = usersSnapshot.docs
        .filter((doc) => !doc.data().isAdmin)
        .map((doc) => deleteDoc(doc.ref));
      await Promise.all(deleteUserPromises);

      return true;
    } catch (error) {
      console.error("Error deleting all data:", error);
      return false;
    }
  },

  // Delete a specific user and their posts (admin only) - now uses Cloud Function
  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      if (!functions) {
        console.error("Firebase Functions not initialized");
        return false;
      }

      const deleteUserFunction = httpsCallable(functions, "deleteUser");
      const result = await deleteUserFunction({ userId });

      console.log("User deleted successfully:", result.data);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  },

  // Delete all posts by a specific user (admin only) - now uses Cloud Function
  deleteUserPosts: async (userId: string): Promise<boolean> => {
    try {
      if (!functions) {
        console.error("Firebase Functions not initialized");
        return false;
      }

      const deleteUserPostsFunction = httpsCallable(
        functions,
        "deleteUserPosts"
      );
      const result = await deleteUserPostsFunction({ userId });

      console.log("User posts deleted successfully:", result.data);
      return true;
    } catch (error) {
      console.error("Error deleting user posts:", error);
      return false;
    }
  },

  // Get all posts by a specific user
  getPostsByUser: async (userId: string): Promise<Post[]> => {
    try {
      if (!db) return [];
      const postsRef = collection(db!, "posts");
      const q = query(postsRef, where("authorId", "==", userId));
      const querySnapshot = await getDocs(q);

      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          authorId: data.authorId,
          authorName: data.authorName,
          businessName: data.businessName,
          content: data.content,
          images: data.images || [],
          imgurLinks: data.imgurLinks || [],
          hashtags: data.hashtags || [],
          category: data.category,
          highlights:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.highlights?.map((highlight: any) => ({
              ...highlight,
              createdAt: highlight.createdAt?.toDate
                ? highlight.createdAt.toDate()
                : new Date(highlight.createdAt),
            })) || [],
          comments:
            data.comments?.map((comment: Record<string, unknown>) => ({
              ...comment,
              createdAt: (comment.createdAt as { toDate?: () => Date })?.toDate
                ? (comment.createdAt as { toDate: () => Date }).toDate()
                : new Date(comment.createdAt as string | number | Date),
            })) || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          phase: data.phase,
          batch: data.batch || 1,
          serviceExperience: data.serviceExperience,
        });
      });

      return posts;
    } catch (error) {
      console.error("Error getting posts by user:", error);
      return [];
    }
  },
};
