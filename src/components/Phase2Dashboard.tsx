"use client";

import { useState, useEffect } from "react";
import { Post, Comment, User } from "@/lib/types";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, TrendingUp, BarChart3, Edit, MessageCircle } from "lucide-react";
import { phaseUtils } from "@/lib/phase-utils";
import Link from "next/link";

interface Phase2DashboardProps {
  posts: Post[];
  currentUser?: User;
  isAdminView?: boolean; // Flag to indicate admin is viewing someone else's post
}

export default function Phase2Dashboard({
  posts,
  currentUser,
  isAdminView = false,
}: Phase2DashboardProps) {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [refreshedPost, setRefreshedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Use currentUser if provided, otherwise fall back to user from context
  const activeUser = currentUser || user;

  // Get the post to display
  // When viewing a post detail page, we should use the post that was passed in (posts[0])
  // Only when viewing the user's own post in phase 1 should we search for their post
  // For phase 2 users viewing any post, or admin viewing any post, use the passed post
  const userPhase = activeUser ? phaseUtils.getCurrentPhase(activeUser) : 1;
  const isViewingOwnPost = posts[0] && posts[0].authorId === activeUser?.id;
  
  let userPost: Post | undefined;
  if (isAdminView) {
    // Admin viewing any post - use the passed post
    userPost = posts[0];
  } else if (userPhase === 2) {
    // Phase 2 users viewing any post - use the passed post
    userPost = posts[0];
  } else if (userPhase === 1 && isViewingOwnPost) {
    // Phase 1 users viewing their own post - use their post
    userPost = posts.find((post) => post.authorId === activeUser?.id);
  } else {
    // Fallback: use the first post
    userPost = posts[0];
  }

  // Refresh post data when post ID changes to ensure we have the latest highlights/comments
  useEffect(() => {
    const refreshPost = async () => {
      if (userPost?.id) {
        try {
          const freshPost = await firebasePostUtils.getPostById(userPost.id);
          if (freshPost) {
            setRefreshedPost(freshPost);
          }
        } catch (error) {
          console.error("Error refreshing post:", error);
        }
      }
    };
    refreshPost();
  }, [userPost?.id]);

  // Use refreshed post if available, otherwise use the passed post
  const displayPost = refreshedPost || userPost;

  // Handle adding a comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !displayPost || !newComment.trim()) return;

    setIsSubmittingComment(true);

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        postId: displayPost.id,
        authorId: activeUser.id,
        authorName: activeUser.preferredName,
        content: newComment.trim(),
        createdAt: new Date(),
      };

      const success = await firebasePostUtils.addComment(displayPost.id, comment);
      if (success) {
        // Refresh the post to get updated comments
        const updatedPost = await firebasePostUtils.getPostById(displayPost.id);
        if (updatedPost) {
          setRefreshedPost(updatedPost);
        }
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!displayPost || !displayPost.serviceExperience) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No service experience data found.</p>
      </div>
    );
  }

  const serviceExp = displayPost.serviceExperience;

  // Debug: Log the post data to see what's available
  // console.log("Phase2Dashboard - userPost:", userPost);
  // console.log("Phase2Dashboard - comments:", userPost.comments);
  // console.log("Phase2Dashboard - highlights:", userPost.highlights);
  // console.log(
  //   "Phase2Dashboard - highlight dates:",
  //   userPost.highlights?.map((h) => ({
  //     userName: h.userName,
  //     createdAt: h.createdAt,
  //     type: typeof h.createdAt,
  //     isDate: h.createdAt instanceof Date,
  //   }))
  // );

  // Sort attributes by ranking (1-6)
  const sortedAttributes = [...(serviceExp.serviceAttributes || [])].sort(
    (a, b) => a.userRanking - b.userRanking
  );

  // Get variability assessments
  const variabilityAssessments = serviceExp.variabilityAssessments || [];

  // Robust date formatting function
  const formatDate = (date: unknown) => {
    if (!date) {
      // If no date is provided, return current date as fallback
      return new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    try {
      let dateObj: Date;

      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === "string") {
        // Try different date parsing methods
        dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          // Try parsing as timestamp
          const timestamp = parseInt(date);
          if (!isNaN(timestamp)) {
            dateObj = new Date(timestamp);
          }
        }
      } else if (typeof date === "number") {
        dateObj = new Date(date);
      } else {
        // Fallback to current date for unknown types
        dateObj = new Date();
      }

      if (isNaN(dateObj.getTime())) {
        // If all parsing fails, use current date as fallback
        dateObj = new Date();
      }

      return dateObj.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Error formatting date:", error, "Original date:", date);
      // Fallback to current date on error
      return new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 w-full">
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Interactive Learning Platform
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isAdminView
                ? "Service Experience Dashboard"
                : activeUser && phaseUtils.getCurrentPhase(activeUser) === 1
                ? "Your Post Details"
                : "Phase 2: Peer Feedback Dashboard"}
            </h1>
            {(isAdminView || (activeUser && phaseUtils.getCurrentPhase(activeUser) === 1)) && (
              <p className="text-xl text-gray-600">
                {isAdminView
                  ? "Comprehensive analysis of service experience"
                  : "Review your service experience details"}
              </p>
            )}
          </div>

          {/* Business Details */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  Business Details
                </CardTitle>
                {!isAdminView &&
                  activeUser &&
                  phaseUtils.getCurrentPhase(activeUser) === 1 && (
                    <Link href={`/create-post?edit=${displayPost.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Post</span>
                      </Button>
                    </Link>
                  )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">
                      Organization:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {serviceExp.organizationName || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="text-gray-900 font-medium">
                      {serviceExp.organizationType || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="text-gray-900 font-medium">
                      {serviceExp.streetAddress || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">
                      Relationship Length:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {serviceExp.relationshipLength || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Author:</span>
                    <span className="text-gray-900 font-medium">
                      {displayPost.authorName || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(displayPost.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Attribute Maps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Attribute Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedAttributes.map((attr, index) => (
                      <div
                        key={attr.name}
                        className="flex items-center space-x-4 py-2"
                      >
                        <div className="w-32 text-sm font-medium text-gray-700 flex-shrink-0">
                          {attr.name}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div
                            className="bg-green-500 h-6 rounded-full transition-all duration-300"
                            style={{
                              width: `${attr.performanceRating || 0}%`,
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                            {attr.performanceRating || 0}
                          </div>
                        </div>
                        <div className="w-12 text-sm font-semibold text-gray-600 text-center bg-gray-100 px-2 py-1 rounded">
                          #{attr.userRanking}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Service Evaluation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Service Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Exposure */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Exposure
                      </h4>
                      <div className="bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-purple-500 h-6 rounded-full"
                          style={{
                            width: `${serviceExp.needsAlignment || 0}%`,
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                          {serviceExp.needsAlignment || 0}%
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Evaluation
                      </h4>
                      <div className="space-y-3">
                        {[
                          {
                            label: "Satisfaction",
                            value: serviceExp.satisfactionRating || 0,
                          },
                          {
                            label: "Loyalty",
                            value: serviceExp.loyaltyRating || 0,
                          },
                          {
                            label: "Recommend",
                            value: serviceExp.recommendationLikelihood || 0,
                          },
                          {
                            label: "Alignment",
                            value: serviceExp.needsAlignment || 0,
                          },
                        ].map((metric, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-20 text-sm text-gray-600">
                              {metric.label}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                              <div
                                className="bg-purple-500 h-4 rounded-full"
                                style={{ width: `${metric.value}%` }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                {metric.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Google Data */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* COMMENTED OUT: Google Price Range display - keeping stars only */}
                      {/* {serviceExp.googlePriceRange && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-green-800">
                            Price Range
                          </span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {"$".repeat(serviceExp.googlePriceRange)}
                        </div>
                      </div>
                    )} */}

                      {serviceExp.googleScore && (
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Star className="h-4 w-4 text-yellow-600 mr-1" />
                            <span className="text-sm font-medium text-yellow-800">
                              Rating
                            </span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-lg font-bold text-yellow-600 mr-1">
                              {serviceExp.googleScore}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <=
                                    Math.floor(serviceExp.googleScore || 0)
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              {displayPost.imgurLinks && displayPost.imgurLinks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {displayPost.imgurLinks.map((link, index) => {
                        const isImgurImage =
                          link.includes("imgur.com") &&
                          (link.includes(".jpg") ||
                            link.includes(".jpeg") ||
                            link.includes(".png") ||
                            link.includes(".gif") ||
                            link.includes(".webp"));

                        if (isImgurImage) {
                          return (
                            <div
                              key={index}
                              className="bg-white rounded border p-2"
                            >
                              <img
                                src={link}
                                alt={`Experience photo ${index + 1}`}
                                className="max-w-full h-auto rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const linkElement = e.currentTarget
                                    .nextElementSibling as HTMLElement;
                                  if (linkElement)
                                    linkElement.style.display = "block";
                                }}
                              />
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 break-all hidden"
                              >
                                {link}
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={index}
                              className="p-2 bg-white rounded border"
                            >
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 break-all"
                              >
                                {link}
                              </a>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Customer Experience - Full Width */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Customer Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Experience Narrative
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                    {serviceExp.experienceNarrative || "No narrative provided"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Lesson</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                    {serviceExp.generalizableLesson || "No lesson provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managing Variability Table */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Managing Variability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">
                        Variability
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">
                        Description
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">
                        Company Response
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">
                        Impact On Experience
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variabilityAssessments.map((assessment, index) => {
                      const variabilityTypes = {
                        arrival: "Arrival",
                        request: "Request",
                        capability: "Capability",
                        effort: "Effort",
                        subjective_preference: "Subjective Preference",
                      };

                      if (assessment.companyResponse === "not_applicable")
                        return null;

                      return (
                        <tr
                          key={index}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6 font-medium text-gray-900">
                            {variabilityTypes[assessment.type] ||
                              assessment.type}
                          </td>
                          <td className="py-4 px-6 text-gray-600 max-w-xs">
                            <div className="break-words">
                              {assessment.description || "No description"}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge
                              variant={
                                assessment.companyResponse === "accommodate"
                                  ? "default"
                                  : "destructive"
                              }
                              className="inline-block"
                            >
                              {assessment.companyResponse === "accommodate"
                                ? "Accommodate variability"
                                : "Reduce variability"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                                <div
                                  className={`h-4 rounded-full ${
                                    (assessment.impactRating || 0) >= 0
                                      ? "bg-blue-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${Math.abs(
                                      assessment.impactRating || 0
                                    )}%`,
                                    marginLeft:
                                      (assessment.impactRating || 0) < 0
                                        ? "auto"
                                        : "0",
                                  }}
                                ></div>
                              </div>
                              <span
                                className={`text-sm font-medium min-w-[3rem] text-right ${
                                  (assessment.impactRating || 0) >= 0
                                    ? "text-blue-600"
                                    : "text-red-600"
                                }`}
                              >
                                {(assessment.impactRating || 0) >= 0 ? "+" : ""}
                                {assessment.impactRating || 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Peer Feedback Section */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Peer Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Who Highlighted
                </h4>
                {displayPost.highlights && displayPost.highlights.length > 0 ? (
                  <div className="space-y-3">
                    {displayPost.highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 p-3 rounded border-l-4 border-blue-400"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-blue-900">
                            {highlight.userName}
                          </span>
                          <span className="text-xs text-blue-600">
                            {formatDate(highlight.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800">
                          {highlight.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No highlights yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Comments ({displayPost.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment Form */}
              {activeUser && (
                <form onSubmit={handleAddComment} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {activeUser.preferredName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    size="sm"
                  >
                    {isSubmittingComment ? "Posting..." : "Post"}
                  </Button>
                </form>
              )}

              {/* Comments List */}
              {!displayPost.comments || displayPost.comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayPost.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.authorName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
