"use client";

import { useState } from "react";
import { Post } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Eye, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(
    user ? post.likes.includes(user.id) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [showLikedBy, setShowLikedBy] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    try {
      const success = await firebasePostUtils.toggleLike(post.id, user.id);
      if (success) {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Gallery Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {post.businessName || "Business Name"}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>by {post.authorName}</span>
              <span>•</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
          {post.category && (
            <Badge variant="outline" className="text-xs">
              {post.category}
            </Badge>
          )}
        </div>

        {/* Photo Preview */}
        {post.images.length > 0 && (
          <div className="mb-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={post.images[0]}
                alt={`${post.businessName} preview`}
                fill
                className="object-cover"
              />
              {post.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  +{post.images.length - 1} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.hashtags.slice(0, 3).map((hashtag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{hashtag}
              </Badge>
            ))}
            {post.hashtags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.hashtags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
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

            <Link href={`/post/${post.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-600"
              >
                <Eye className="h-4 w-4" />
                <span>View Details</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Show who liked (if any) */}
        {showLikedBy && post.likes.length > 0 && (
          <div className="mt-3 pt-3 border-t">
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
  );
}
