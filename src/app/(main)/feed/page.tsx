"use client";

import { useState, useEffect, useMemo } from "react";
import { Post } from "@/lib/types";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { phaseUtils } from "@/lib/phase-utils";
import { useAuth } from "@/contexts/AuthContext";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, SortAsc } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedHashtag, setSelectedHashtag] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "interactions" | "category">(
    "interactions"
  );

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const allPosts = await firebasePostUtils.getAllPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, []);

  const refreshPosts = async () => {
    try {
      const allPosts = await firebasePostUtils.getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error("Error refreshing posts:", error);
    }
  };

  // Get unique categories and hashtags for filtering
  const categories = useMemo(() => {
    const cats = [
      ...new Set(posts.map((post) => post.category).filter(Boolean)),
    ];
    return cats.sort();
  }, [posts]);

  const hashtags = useMemo(() => {
    const tags = [...new Set(posts.flatMap((post) => post.hashtags))];
    return tags.sort();
  }, [posts]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Phase filter - only show posts user can view
    // Special case: if user is Phase 1 but has created posts, they can view all posts
    // (handles race condition during phase transition)
    const userHasCreatedPost =
      user && posts.some((post) => post.authorId === user.id);
    const canViewAllPosts =
      phaseUtils.canViewPhasePosts(user, 1) || userHasCreatedPost;

    filtered = filtered.filter((post) => {
      const postPhase = post.phase || 1;
      return canViewAllPosts || phaseUtils.canViewPhasePosts(user, postPhase);
    });

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // Hashtag filter
    if (selectedHashtag) {
      filtered = filtered.filter((post) =>
        post.hashtags.includes(selectedHashtag)
      );
    }

    // Sort posts
    switch (sortBy) {
      case "time":
        return filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "interactions":
        return filtered.sort(
          (a, b) =>
            b.likes.length +
            b.comments.length -
            (a.likes.length + a.comments.length)
        );
      case "category":
        return filtered.sort((a, b) =>
          (a.category || "").localeCompare(b.category || "")
        );
      default:
        return filtered;
    }
  }, [posts, searchTerm, selectedCategory, selectedHashtag, sortBy, user]);

  // Check if user has created any posts (for handling phase transition)
  const userHasCreatedPost =
    user && posts.some((post) => post.authorId === user.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  // Check if user is in Phase 1 (shouldn't be able to view posts yet)
  // BUT if they've already created a post, let them through (handles race condition during phase transition)
  const userHasCreatedPost =
    user && posts.some((post) => post.authorId === user.id);

  if (user && phaseUtils.getCurrentPhase(user) === 1 && !userHasCreatedPost) {
    console.log("Feed page: User in Phase 1, no posts created yet");
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Phase 1!
          </h2>
          <p className="text-gray-700 mb-6">
            You need to create your first post before you can view the gallery.
            Share your business compatibility experience to unlock access to other posts!
          </p>
          <Link href="/create-post">
            <Button size="lg" className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create Your First Post</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Log phase transition if user has created a post but phase hasn't updated yet
  if (user && phaseUtils.getCurrentPhase(user) === 1 && userHasCreatedPost) {
    console.log(
      "Feed page: User in Phase 1 but has created a post - allowing access (phase transition in progress)"
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Gallery</h1>
          <p className="text-gray-600 mt-1">Customer Compatibility Exercise</p>
          {user && (
            <p className="text-sm text-blue-600 mt-1">
              {phaseUtils.getPhaseName(phaseUtils.getCurrentPhase(user))}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {user &&
            phaseUtils.canCreateInPhase(
              user,
              phaseUtils.getCurrentPhase(user)
            ) && (
              <Link href="/create-post">
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Post</span>
                </Button>
              </Link>
            )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search businesses, authors, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Hashtag Filter */}
          <div className="sm:w-48">
            <select
              value={selectedHashtag}
              onChange={(e) => setSelectedHashtag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Hashtags</option>
              {hashtags.map((hashtag) => (
                <option key={hashtag} value={hashtag}>
                  #{hashtag}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "time" | "interactions" | "category"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="interactions">Most Interactions</option>
              <option value="time">Most Recent</option>
              <option value="category">By Category</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategory || selectedHashtag) && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-xs"
              >
                Search: "{searchTerm}" ×
              </Button>
            )}
            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory("")}
                className="text-xs"
              >
                Category: {selectedCategory} ×
              </Button>
            )}
            {selectedHashtag && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedHashtag("")}
                className="text-xs"
              >
                Hashtag: #{selectedHashtag} ×
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Posts */}
      {filteredAndSortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {posts.length === 0
              ? "No posts yet"
              : "No posts match your filters"}
          </h3>
          <p className="text-gray-600 mb-6">
            {posts.length === 0
              ? "Be the first to share your business compatibility experience!"
              : "Try adjusting your search or filter criteria."}
          </p>
          <Link href="/create-post">
            <Button>Create Your First Post</Button>
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredAndSortedPosts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={refreshPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
