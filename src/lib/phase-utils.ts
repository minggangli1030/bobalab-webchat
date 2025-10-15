import { User, Post } from "./types";
import { PHASES } from "./constants";

export const phaseUtils = {
  // Check if user can access a specific phase
  canAccessPhase: (user: User | null, phase: number): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true; // Admins can access all phases

    const userPhase = user.phase || PHASES.PHASE_1;

    // Users can only access their current phase and below
    return userPhase >= phase;
  },

  // Check if user can create posts in a specific phase
  canCreateInPhase: (user: User | null, phase: number): boolean => {
    if (!user) return false;
    if (user.isAdmin) return false; // Admins cannot create posts (view-only mode)

    const userPhase = user.phase || PHASES.PHASE_1;

    // Only Phase 1 users can create posts
    return userPhase === PHASES.PHASE_1;
  },

  // Check if user can view posts from a specific phase
  canViewPhasePosts: (user: User | null, phase: number): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true; // Admins can view all phases

    const userPhase = user.phase || PHASES.PHASE_1;

    // Users in Phase 1 cannot view any posts (including their own)
    // Users in Phase 2 can view all posts
    return userPhase >= PHASES.PHASE_2;
  },

  // Get user's current phase
  getCurrentPhase: (user: User | null): number => {
    if (!user) return PHASES.PHASE_1;
    return user.phase || PHASES.PHASE_1;
  },

  // Check if user can advance to next phase
  canAdvancePhase: (user: User | null): boolean => {
    if (!user) return false;
    if (user.isAdmin) return false; // Admins don't advance phases

    const userPhase = user.phase || PHASES.PHASE_1;
    return userPhase < PHASES.PHASE_2;
  },

  // Get phase name
  getPhaseName: (phase: number): string => {
    switch (phase) {
      case PHASES.PHASE_1:
        return "Phase 1: Initial Assessment";
      case PHASES.PHASE_2:
        return "Phase 2: Peer Feedback";
      default:
        return "Unknown Phase";
    }
  },

  // Get phase description
  getPhaseDescription: (phase: number): string => {
    switch (phase) {
      case PHASES.PHASE_1:
        return "Create and share initial business compatibility assessments";
      case PHASES.PHASE_2:
        return "View and interact with other students' business compatibility posts";
      default:
        return "Unknown phase";
    }
  },
};
