import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { Post, Comment } from "./types";

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
      const postRef = await addDoc(collection(db, "posts"), {
        ...postData,
        createdAt: Timestamp.now(),
      });
      return postRef.id;
    } catch (error) {
      console.error("Error creating post:", error);
      return null;
    }
  },

  // Get all posts (with pagination)
  getAllPosts: async (limitCount: number = 50): Promise<Post[]> => {
    try {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Post[];
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
        return {
          id: postDoc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Post;
      }
      return null;
    } catch (error) {
      console.error("Error getting post:", error);
      return null;
    }
  },

  // Update a post (for likes, comments, etc.)
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
        const updatedComments = [...post.comments, comment];
        await updateDoc(postRef, { comments: updatedComments });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding comment:", error);
      return false;
    }
  },

  // Toggle like on a post
  toggleLike: async (postId: string, userId: string): Promise<boolean> => {
    try {
      const post = await firebasePostUtils.getPostById(postId);
      if (!post) return false;

      const isLiked = post.likes.includes(userId);
      const updatedLikes = isLiked
        ? post.likes.filter((id) => id !== userId)
        : [...post.likes, userId];

      await firebasePostUtils.updatePost(postId, { likes: updatedLikes });
      return true;
    } catch (error) {
      console.error("Error toggling like:", error);
      return false;
    }
  },
};
