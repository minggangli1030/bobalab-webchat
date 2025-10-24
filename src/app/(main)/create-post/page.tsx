"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { Post, ServiceExperience } from "@/lib/types";
import { POST_CATEGORIES, PHASES } from "@/lib/constants";
import { phaseUtils } from "@/lib/phase-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ServiceExperienceForm from "@/components/ServiceExperienceForm";

export default function CreatePostPage() {
  const { user, refreshUser, updateUserPhaseLocally } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPostCount, setUserPostCount] = useState(0);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [existingPost, setExistingPost] = useState<Post | null>(null);

  // Check for edit mode and load existing post
  useEffect(() => {
    const checkEditMode = async () => {
      const editPostId = searchParams.get("edit");
      if (editPostId && user) {
        try {
          const post = await firebasePostUtils.getPostById(editPostId);
          if (post && post.authorId === user.id) {
            setExistingPost(post);
            setIsEditing(true);
          }
        } catch (error) {
          console.error("Error loading post for editing:", error);
        }
      }
    };
    checkEditMode();
  }, [searchParams, user]);

  // Check user's post count on component load
  useEffect(() => {
    const checkUserPostCount = async () => {
      if (!user) return;

      try {
        const userPosts = await firebasePostUtils.getPostsByUser(user.id);
        const postCount = userPosts.length;
        setUserPostCount(postCount);
        
        // If editing, always allow (bypass post limit)
        const editPostId = searchParams.get("edit");
        if (editPostId) {
          setCanCreateMore(true);
        } else {
          setCanCreateMore(phaseUtils.canCreateMorePosts(user, postCount));
        }
      } catch (error) {
          console.error("Error checking user post count:", error);
        }
    };

    checkUserPostCount();
  }, [user, searchParams]);

  const handleServiceExperienceSubmit = async (
    experience: ServiceExperience
  ) => {
    console.log("Service experience submitted", { experience, user });

    if (!user) {
      console.error("No user found");
      setError("No user found. Please log in again.");
      return;
    }

    const editPostId = searchParams.get("edit");
    const isCurrentlyEditing = !!editPostId;

    // Check if user can create more posts (only for new posts, not editing)
    if (!isCurrentlyEditing && !canCreateMore) {
      setError(
        "You have reached the maximum number of posts (2). You cannot create more posts."
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create post data with service experience
      const postData = {
        authorId: user.id,
        authorName: user.preferredName,
        businessName: experience.organizationName,
        content: experience.experienceNarrative,
        images: [], // Keep for backward compatibility
        imgurLinks: experience.imgurLinks || [], // New field for Imgur links
        hashtags: [], // Can be derived from experience data
        category: experience.organizationType,
        highlights: [],
        comments: [],
        phase: user.phase || PHASES.PHASE_1,
        serviceExperience: experience,
      };

      if (isCurrentlyEditing && existingPost) {
        // Update existing post
        console.log("Updating post with service experience data:", postData);
        const success = await firebasePostUtils.updatePost(existingPost.id, {
          ...postData,
          id: existingPost.id, // Keep the original ID
          createdAt: existingPost.createdAt, // Keep original creation date
        });

        if (!success) {
          throw new Error("Failed to update post");
        }

        console.log("Post updated successfully");
        router.push("/feed");
      } else {
        // Create new post
        console.log("Creating post with service experience data:", postData);
        const postId = await firebasePostUtils.createPost(postData);
        console.log("Post created with ID:", postId);

        if (!postId) {
          throw new Error("Failed to create post");
        }

        // Phase advancement is now manual - controlled by admin
        // Users stay in Phase 1 until admin manually moves them to Phase 2
        console.log(
          "Post created successfully. User remains in Phase 1 until admin manually advances them."
        );

        console.log("Redirecting to feed...");
        router.push("/feed");
      }
    } catch (err) {
      setError("Failed to create post. Please try again.");
      console.error("Error creating post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Check if user can create posts in their current phase
  const currentPhase = phaseUtils.getCurrentPhase(user);
  const editPostId = searchParams.get("edit");
  const isCurrentlyEditing = !!editPostId;
  
  // Allow editing even if post limit is reached
  const canCreate =
    phaseUtils.canCreateInPhase(user, currentPhase) && (canCreateMore || isCurrentlyEditing);

  if (!canCreate) {
    const isPhaseRestriction = !phaseUtils.canCreateInPhase(user, currentPhase);
    const isPostLimit = !canCreateMore;

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isPostLimit ? "Maximum Posts Reached" : "Phase 2: View Only"}
            </h2>
            <p className="text-gray-600 mb-4">
              {isPostLimit
                ? `You have created ${userPostCount} posts (maximum: 2). You can review and edit your existing posts, but cannot create new ones.`
                : "You have completed Phase 1! You can now view the gallery and interact with posts, but cannot create new posts."}
            </p>
            <Button onClick={() => router.push("/feed")}>
              Back to Gallery
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            Customer Compatibility Exercise
          </CardTitle>
          <CardDescription>
            Document your service experience to contribute to the class
            discussion
          </CardDescription>
          {currentPhase === 1 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Phase 1:</strong> Complete your service experience
                documentation to unlock the gallery and view other experiences!
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Posts created: {userPostCount}/2 (maximum 2 posts allowed)
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <ServiceExperienceForm
        onSubmit={handleServiceExperienceSubmit}
        onCancel={() => router.push("/feed")}
        isLoading={isLoading}
        initialData={existingPost?.serviceExperience}
      />
    </div>
  );
}
