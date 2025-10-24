"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Post, Comment } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, ArrowLeft, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HighlightModal } from "@/components/HighlightModal";
import Phase2Dashboard from "@/components/Phase2Dashboard";
import { phaseUtils } from "@/lib/phase-utils";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [highlightCount, setHighlightCount] = useState(0);
  const [showHighlightedBy, setShowHighlightedBy] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const postId = params.id as string;
        const foundPost = await firebasePostUtils.getPostById(postId);

        // Check if Phase 1 user is trying to view someone else's post
        if (foundPost && user && !user.isAdmin) {
          const userPhase = user.phase || 1;
          if (userPhase === 1 && foundPost.authorId !== user.id) {
            // Phase 1 users can only view their own posts
            router.push("/feed");
            return;
          }
        }

        setPost(foundPost);
        if (foundPost && user) {
          setIsHighlighted(
            foundPost.highlights?.some((h) => h.userId === user.id) || false
          );
          setHighlightCount(foundPost.highlights?.length || 0);
        }
      } catch (error) {
        console.error("Error loading post:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [params.id, user, router]);

  const handleHighlightClick = () => {
    if (!user) return;
    setShowHighlightModal(true);
  };

  const handleHighlightConfirm = async (reason: string) => {
    if (!user || !post) return;

    try {
      const success = await firebasePostUtils.addHighlight(
        post.id,
        user.id,
        user.preferredName,
        reason
      );
      if (success) {
        setIsHighlighted(!isHighlighted);
        setHighlightCount(
          isHighlighted ? highlightCount - 1 : highlightCount + 1
        );
        // Refresh the post to get updated data
        const updatedPost = await firebasePostUtils.getPostById(post.id);
        if (updatedPost) {
          setPost(updatedPost);
        }
      }
    } catch (error) {
      console.error("Error highlighting post:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim()) return;

    setIsSubmittingComment(true);

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        postId: post.id,
        authorId: user.id,
        authorName: user.preferredName,
        content: newComment.trim(),
        createdAt: new Date(),
      };

      const success = await firebasePostUtils.addComment(post.id, comment);
      if (success) {
        // Refresh the post to get updated comments
        const updatedPost = await firebasePostUtils.getPostById(post.id);
        if (updatedPost) {
          setPost(updatedPost);
        }
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Post Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The post you're looking for doesn't exist.
        </p>
        <Link href="/feed">
          <Button>Back to Feed</Button>
        </Link>
      </div>
    );
  }

  // Show Dashboard for Phase 2 users and Phase 1 users viewing their own posts
  if (user && post && !user.isAdmin) {
    const userPhase = phaseUtils.getCurrentPhase(user);
    const isViewingOwnPost = post.authorId === user.id;
    
    if (userPhase === 2 || (userPhase === 1 && isViewingOwnPost)) {
      return <Phase2Dashboard posts={[post]} currentUser={user} />;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/feed">
        <Button variant="ghost" className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Button>
      </Link>

      {/* Post */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {post.authorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {post.authorName}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>
            {post.category && <Badge variant="outline">{post.category}</Badge>}
          </div>
          {post.businessName && (
            <div className="mt-2">
              <h2 className="text-xl font-bold text-gray-900">
                {post.businessName}
              </h2>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Post Content */}
          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Service Experience Data - Comprehensive View */}
          {post.serviceExperience && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Service Experience Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Organization:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.organizationName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Type:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.organizationType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Relationship Length:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.relationshipLength} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Address:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.streetAddress}
                    </span>
                  </div>
                </div>

                {/* Ratings */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Satisfaction:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.satisfactionRating}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Loyalty:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.loyaltyRating}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Recommendation:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.recommendationLikelihood}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Needs Alignment:
                    </span>
                    <span className="text-sm text-gray-900">
                      {post.serviceExperience.needsAlignment}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Attributes */}
              {post.serviceExperience.serviceAttributes &&
                post.serviceExperience.serviceAttributes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Service Attributes (Ranked by Importance)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {post.serviceExperience.serviceAttributes
                        .sort((a, b) => a.userRanking - b.userRanking)
                        .map((attr, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-white rounded border"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {attr.userRanking}. {attr.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              Performance: {attr.performanceRating || 0}/100
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Google Review Data */}
              {(post.serviceExperience.googleScore ||
                post.serviceExperience.googlePriceRange) && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Google Review Data
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {post.serviceExperience.googleScore && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          Google Score:
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const score =
                                post.serviceExperience?.googleScore || 0;
                              const isFull = star <= Math.floor(score);
                              const isHalf =
                                star === Math.ceil(score) && score % 1 >= 0.5;

                              return (
                                <span key={star} className="text-yellow-400">
                                  {isFull ? "★" : isHalf ? "☆" : "☆"}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-sm text-gray-900">
                            ({post.serviceExperience?.googleScore}/5)
                          </span>
                        </div>
                      </div>
                    )}
                    {post.serviceExperience.googlePriceRange && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Price Range:
                        </span>
                        <span className="text-sm text-gray-900">
                          {"$".repeat(post.serviceExperience.googlePriceRange)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Imgur Media */}
              {post.imgurLinks && post.imgurLinks.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Media
                  </h4>
                  <div className="space-y-4">
                    {post.imgurLinks.map((link, index) => {
                      // Check if it's an Imgur image link
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
                              alt={`Media ${index + 1}`}
                              className="max-w-full h-auto rounded"
                              onError={(e) => {
                                // Fallback to link if image fails to load
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
                        // For non-image links, show as regular link
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
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {post.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {post.images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden"
                >
                  <Image
                    src={image}
                    alt={`Post image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHighlightClick}
                className={`flex items-center space-x-2 ${
                  isHighlighted ? "text-orange-600" : "text-gray-600"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isHighlighted ? "fill-current" : ""}`}
                />
                <span>{highlightCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHighlightedBy(!showHighlightedBy)}
                className="flex items-center space-x-2 text-gray-600"
              >
                <Users className="h-4 w-4" />
                <span>Who highlighted</span>
              </Button>

              <div className="flex items-center space-x-2 text-gray-600">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments.length}</span>
              </div>
            </div>
          </div>

          {/* Show who highlighted (if any) */}
          {showHighlightedBy &&
            post.highlights &&
            post.highlights.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">Highlighted by:</p>
                <div className="space-y-2">
                  {post.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {highlight.userName}
                      </Badge>
                      <span className="text-xs text-gray-500 italic">
                        "{highlight.reason}"
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Comments ({post.comments.length})
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleAddComment} className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.preferredName.charAt(0).toUpperCase()}
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
          {post.comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {post.comments.map((comment) => (
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
                      <p className="text-sm text-gray-800">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlight Modal */}
      <HighlightModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        onConfirm={handleHighlightConfirm}
        isHighlighted={isHighlighted}
        highlightCount={highlightCount}
      />
    </div>
  );
}
