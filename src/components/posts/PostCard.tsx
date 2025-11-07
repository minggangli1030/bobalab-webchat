"use client";

import { useState } from "react";
import { Post } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HighlightModal } from "@/components/HighlightModal";

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [isHighlighted, setIsHighlighted] = useState(
    user ? post.highlights?.some((h) => h.userId === user.id) : false
  );
  const [highlightCount, setHighlightCount] = useState(
    post.highlights?.length || 0
  );
  const [showHighlightModal, setShowHighlightModal] = useState(false);

  const handleHighlightClick = () => {
    if (!user) return;
    setShowHighlightModal(true);
  };

  const handleHighlightConfirm = async (reason: string) => {
    if (!user) return;

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
        onUpdate();
      }
    } catch (error) {
      console.error("Error highlighting post:", error);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return dateObj.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 break-inside-avoid mb-4">
      <CardContent className="p-0">
        {/* Photo Preview */}
        {post.images.length > 0 && (
          <div className="relative">
            <div className="relative w-full">
              <Image
                src={post.images[0]}
                alt={`${post.businessName} preview`}
                width={300}
                height={400}
                className="w-full object-cover rounded-t-lg"
                style={{ aspectRatio: "auto" }}
              />
              {post.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                  +{post.images.length - 1}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          {/* Business Name */}
          <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
            {(() => {
              const businessName = post.businessName || "Business Name";
              const location = post.serviceExperience?.streetAddress;
              return location 
                ? `${businessName} (${location})`
                : businessName;
            })()}
          </h3>

          {/* Author and Date */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className="truncate">by {post.authorName}</span>
            <span className="flex-shrink-0 ml-2">
              {formatDate(post.createdAt)}
            </span>
          </div>

          {/* Category */}
          {post.category && (
            <div className="mb-2">
              <Badge variant="outline" className="text-xs">
                {post.category}
              </Badge>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHighlightClick}
                className={`flex items-center space-x-1 p-1 h-auto ${
                  isHighlighted ? "text-orange-600" : "text-gray-600"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isHighlighted ? "fill-current" : ""}`}
                />
                <span className="text-xs">{highlightCount}</span>
              </Button>
            </div>

            <Link href={`/post/${post.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-gray-600"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>

      {/* Highlight Modal */}
      <HighlightModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        onConfirm={handleHighlightConfirm}
        isHighlighted={isHighlighted}
        highlightCount={highlightCount}
      />
    </Card>
  );
}
