export interface User {
  id: string;
  email: string;
  studentId: string;
  formalName: string;
  preferredName: string;
  createdAt: Date;
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
  content: string;
  images: string[];
  hashtags: string[];
  likes: string[];
  comments: Comment[];
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, studentId: string) => Promise<boolean>;
  signup: (
    email: string,
    studentId: string,
    formalName: string,
    preferredName: string
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface CreatePostData {
  content: string;
  images: string[];
  hashtags: string[];
}
