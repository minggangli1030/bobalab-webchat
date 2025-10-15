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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showLikedBy, setShowLikedBy] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const postId = params.id as string;
        const foundPost = await firebasePostUtils.getPostById(postId);
        setPost(foundPost);
        if (foundPost && user) {
          setIsLiked(foundPost.likes.includes(user.id));
          setLikesCount(foundPost.likes.length);
        }
      } catch (error) {
        console.error("Error loading post:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [params.id, user]);

  const handleLike = async () => {
    if (!user || !post) return;

    try {
      const success = await firebasePostUtils.toggleLike(post.id, user.id);
      if (success) {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
        // Refresh the post to get updated data
        const updatedPost = await firebasePostUtils.getPostById(post.id);
        if (updatedPost) {
          setPost(updatedPost);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
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

  // Remove this line since we're using state now

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

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((hashtag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{hashtag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-2 ${
                  isLiked ? "text-red-600" : "text-gray-600"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLikedBy(!showLikedBy)}
                className="flex items-center space-x-2 text-gray-600"
              >
                <Users className="h-4 w-4" />
                <span>Who liked</span>
              </Button>

              <div className="flex items-center space-x-2 text-gray-600">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments.length}</span>
              </div>
            </div>
          </div>

          {/* Show who liked (if any) */}
          {showLikedBy && post.likes.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600 mb-2">Liked by:</p>
              <div className="flex flex-wrap gap-2">
                {post.likes.map((userId, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    User {userId.slice(-4)}
                  </Badge>
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
    </div>
  );
}
