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
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, functions } from "./firebase";
import { Post, Comment, User } from "./types";

export const firebasePostUtils = {
  // Upload image to Firebase Storage
  uploadImage: async (file: File, postId: string): Promise<string | null> => {
    try {
      const storageRef = ref(
        storage,
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

      if (!db) {
        console.error("Firebase not initialized");
        return null;
      }

      const postRef = await addDoc(collection(db, "posts"), {
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
  getAllPosts: async (limitCount: number = 50): Promise<Post[]> => {
    try {
      // Check if Firebase is initialized
      if (!db) {
        return [];
      }

      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
          comments:
            data.comments?.map((comment: any) => ({
              ...comment,
              createdAt: comment.createdAt?.toDate
                ? comment.createdAt.toDate()
                : new Date(comment.createdAt),
            })) || [],
        } as Post;
      });
    } catch (error) {
      console.error("Error getting posts:", error);
      return [];
    }
  },

  // Get a specific post by ID
  getPostById: async (postId: string): Promise<Post | null> => {
    try {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) {
        const data = postDoc.data();

        // Highlights are already stored with user info, no need to fetch separately

        return {
          id: postDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
          comments:
            data.comments?.map((comment: any) => ({
              ...comment,
              createdAt: comment.createdAt?.toDate
                ? comment.createdAt.toDate()
                : new Date(comment.createdAt),
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
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, updates);
      return true;
    } catch (error) {
      console.error("Error updating post:", error);
      return false;
    }
  },

  // Delete a post
  deletePost: async (postId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  },

  // Add a comment to a post
  addComment: async (postId: string, comment: Comment): Promise<boolean> => {
    try {
      const postRef = doc(db, "posts", postId);
      const post = await firebasePostUtils.getPostById(postId);

      if (post) {
        // Ensure comment has proper date format using Timestamp
        const commentWithTimestamp = {
          ...comment,
          createdAt: Timestamp.fromDate(
            comment.createdAt instanceof Date
              ? comment.createdAt
              : new Date(comment.createdAt)
          ),
        };

        const updatedComments = [...post.comments, commentWithTimestamp];
        await updateDoc(postRef, { comments: updatedComments });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding comment:", error);
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

      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
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

      const userRef = doc(db, "users", userId);
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
      const postsSnapshot = await getDocs(collection(db, "posts"));
      const deletePostPromises = postsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePostPromises);

      // Delete all users except admin
      const usersSnapshot = await getDocs(collection(db, "users"));
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
      const postsRef = collection(db, "posts");
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
          highlights: data.highlights || [],
          comments: data.comments || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          phase: data.phase,
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
