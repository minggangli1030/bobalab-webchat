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

export interface ServiceAttribute {
  name: string;
  userRanking: number; // 1-6, where 1 is most important
  targetCustomerRanking?: number; // 1-6, where 1 is most important
  performanceRating?: number; // 0-100 scale
}

export interface VariabilityAssessment {
  type:
    | "arrival"
    | "request"
    | "capability"
    | "effort"
    | "subjective_preference";
  applied: boolean;
  companyResponse: "accommodate" | "reduce" | "not_applicable";
  description?: string;
  impactRating?: number; // -100 to 100, where 0 is no impact
}

export interface ServiceExperience {
  organizationName: string;
  organizationType: string;
  relationshipLength: "new_customer" | "long_time_customer";
  serviceAttributes: ServiceAttribute[];
  variabilityAssessments: VariabilityAssessment[];
  satisfactionRating: number; // 0-100 scale
  loyaltyRating: number; // 0-100 scale
  recommendationLikelihood: number; // 0-100 scale
  needsAlignment: number; // 0-100 scale
  yelpScore?: number; // 1-5 stars
  yelpPriceRange?: number; // 1-4 dollar signs
  experienceNarrative: string;
  generalizableLesson: string;
  operationDisruptiveness: number; // 0-100 scale
  lifeDisruptiveness: number; // 0-100 scale
}

export interface Highlight {
  userId: string;
  userName: string;
  reason: string;
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
  highlights: Highlight[]; // Array of highlight objects with reasons
  comments: Comment[];
  createdAt: Date;
  phase?: number; // Which phase this post belongs to
  serviceExperience?: ServiceExperience; // Detailed service experience data
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
