import { User } from "./types";

const STORAGE_KEYS = {
  USER: "web_chat_user",
  POSTS: "web_chat_posts",
  COMMENTS: "web_chat_comments",
};

export const authUtils = {
  // User management
  saveUser: (user: User): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  },

  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Authentication
  login: async (email: string, studentId: string): Promise<User | null> => {
    const users = authUtils.getAllUsers();
    const user = users.find(
      (u) => u.email === email && u.studentId === studentId
    );

    if (user) {
      authUtils.saveUser(user);
      return user;
    }
    return null;
  },

  signup: async (
    email: string,
    studentId: string,
    formalName: string,
    preferredName: string
  ): Promise<User | null> => {
    const users = authUtils.getAllUsers();

    // Check if user already exists
    if (users.find((u) => u.email === email || u.studentId === studentId)) {
      return null;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      studentId,
      formalName,
      preferredName,
      createdAt: new Date(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    localStorage.setItem("web_chat_all_users", JSON.stringify(users));

    return newUser;
  },

  getAllUsers: (): User[] => {
    if (typeof window === "undefined") return [];
    const usersData = localStorage.getItem("web_chat_all_users");
    return usersData ? JSON.parse(usersData) : [];
  },
};

export const postUtils = {
  // Post management
  getAllPosts: (): any[] => {
    if (typeof window === "undefined") return [];
    const postsData = localStorage.getItem(STORAGE_KEYS.POSTS);
    return postsData ? JSON.parse(postsData) : [];
  },

  savePost: (post: any): void => {
    const posts = postUtils.getAllPosts();
    posts.unshift(post); // Add to beginning for chronological order
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  },

  updatePost: (postId: string, updates: Partial<any>): void => {
    const posts = postUtils.getAllPosts();
    const index = posts.findIndex((p) => p.id === postId);
    if (index !== -1) {
      posts[index] = { ...posts[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }
  },

  getPostById: (postId: string): any | null => {
    const posts = postUtils.getAllPosts();
    return posts.find((p) => p.id === postId) || null;
  },
};
