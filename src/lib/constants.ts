// Category options for posts
export const POST_CATEGORIES = [
  "Product Review",
  "Service Experience",
  "Customer Support",
  "Business Partnership",
  "Market Analysis",
  "Innovation",
  "Sustainability",
  "Technology",
  "Marketing",
  "Operations",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

// Phase definitions
export const PHASES = {
  PHASE_1: 1,
  PHASE_2: 2,
} as const;

export type Phase = (typeof PHASES)[keyof typeof PHASES];
