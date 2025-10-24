"use client";

import { useState, useEffect, useMemo } from "react";
import { Post } from "@/lib/types";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { phaseUtils } from "@/lib/phase-utils";
import { useAuth } from "@/contexts/AuthContext";
import { PostCard } from "@/components/posts/PostCard";
import Phase2Dashboard from "@/components/Phase2Dashboard";
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
  const [sortBy, setSortBy] = useState<"time" | "highlights" | "category">(
    "highlights"
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

  // Check if user has created any posts (for handling phase transition)
  const userHasCreatedPost =
    user && posts.some((post) => post.authorId === user.id);

  // Count user's posts
  const userPostCount = user
    ? posts.filter((post) => post.authorId === user.id).length
    : 0;

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Phase filter - only show posts user can view
    // Phase 1 users can only view their own posts
    // Phase 2 users can view all posts
    // Admins can always view all posts
    if (user && !user.isAdmin) {
      const userPhase = phaseUtils.getCurrentPhase(user);
      if (userPhase === 1) {
        // Phase 1 users can only see their own posts
        filtered = filtered.filter((post) => post.authorId === user.id);
      } else {
        // Phase 2 users can see all posts
        filtered = filtered.filter((post) => {
          const postPhase = post.phase || 1;
          return phaseUtils.canViewPhasePosts(user, postPhase);
        });
      }
    }

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

    // Sort posts
    switch (sortBy) {
      case "time":
        return filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "highlights":
        return filtered.sort(
          (a, b) => (b.highlights?.length || 0) - (a.highlights?.length || 0)
        );
      case "category":
        return filtered.sort((a, b) =>
          (a.category || "").localeCompare(b.category || "")
        );
      default:
        return filtered;
    }
  }, [posts, searchTerm, selectedCategory, sortBy, user]);

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

  // Phase 1 users can view their own posts, but show a message if they haven't created any
  if (
    user &&
    !user.isAdmin &&
    phaseUtils.getCurrentPhase(user) === 1 &&
    !userHasCreatedPost
  ) {
    console.log("Feed page: User in Phase 1, no posts created yet");
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Phase 1!
          </h2>
          <p className="text-gray-700 mb-6">
            You haven't created any posts yet. Create your first business
            compatibility assessment to get started!
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

  // Show Phase 2 Dashboard for Phase 2 users
  if (user && phaseUtils.getCurrentPhase(user) === 2 && !user.isAdmin) {
    return <Phase2Dashboard posts={posts} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user && phaseUtils.getCurrentPhase(user) === 1
              ? "Phase 1: Initial Assessment"
              : "Phase 2: Peer Feedback"}
          </h1>
          <p className="text-gray-600 mt-1">Customer Compatibility Exercise</p>
          {user && user.isAdmin && (
            <p className="text-sm text-blue-600 mt-1">
              Admin View - Full Access
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {user &&
            (user.isAdmin ||
              (phaseUtils.getCurrentPhase(user) === 1 &&
                userPostCount < 2)) && (
              <Link href="/create-post">
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>
                    {user.isAdmin
                      ? "Create Test Post"
                      : userPostCount === 0
                      ? "Create Post"
                      : "Create Another Post"}
                  </span>
                </Button>
              </Link>
            )}
        </div>
      </div>

      {/* Search and Filter Controls - Only show for Phase 2 users and admins */}
      {user && (user.isAdmin || phaseUtils.getCurrentPhase(user) === 2) && (
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

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "time" | "highlights" | "category"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="highlights">Most Highlighted</option>
                <option value="time">Most Recent</option>
                <option value="category">By Category</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedCategory) && (
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
            </div>
          )}
        </div>
      )}

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
