export interface User {
  id: string;
  email: string;
  studentId: string;
  formalName: string;
  preferredName: string;
  createdAt: Date;
  isAdmin?: boolean;
  phase?: number; // 1 or 2 for phase-based access
  businessName?: string; // For business compatibility exercise
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  businessName?: string; // Business name for compatibility exercise
  content: string;
  images: string[];
  hashtags: string[];
  category?: string; // Limited category options
  likes: string[];
  likedBy?: User[]; // Public list of users who liked
  comments: Comment[];
  createdAt: Date;
  phase?: number; // Which phase this post belongs to
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    formalName: string,
    preferredName: string,
    studentId?: string,
    businessName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPhaseLocally: (newPhase: number) => void;
  isLoading: boolean;
}

export interface CreatePostData {
  content: string;
  images: string[];
  hashtags: string[];
  businessName?: string;
  category?: string;
  phase?: number;
}
