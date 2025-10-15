"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { Post, User } from "@/lib/types";
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
import {
  Trash2,
  Eye,
  Users,
  MessageSquare,
  Flag,
  Calendar,
  ArrowUp,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "posts" | "users" | "stats" | "analysis"
  >("stats");

  useEffect(() => {
    // Redirect if not admin
    if (user && !user.isAdmin) {
      router.push("/feed");
      return;
    }

    const loadData = async () => {
      try {
        const allPosts = await firebasePostUtils.getAllPosts();
        setPosts(allPosts);

        // Load all users from Firebase
        const allUsers = await firebasePostUtils.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, router]);

  const deletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const success = await firebasePostUtils.deletePost(postId);
      if (success) {
        setPosts(posts.filter((p) => p.id !== postId));
        alert("Post deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }
  };

  const advanceUserPhase = async (userId: string, currentPhase: number) => {
    if (
      !window.confirm(
        `Are you sure you want to advance this user to Phase ${
          currentPhase + 1
        }?`
      )
    )
      return;

    try {
      const success = await firebasePostUtils.updateUserPhase(
        userId,
        currentPhase + 1
      );
      if (success) {
        // Refresh users list
        const allUsers = await firebasePostUtils.getAllUsers();
        setUsers(allUsers);
        alert("User phase advanced successfully!");
      } else {
        alert("Failed to advance user phase.");
      }
    } catch (error) {
      console.error("Error advancing user phase:", error);
      alert("Failed to advance user phase.");
    }
  };

  const deleteAllData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL data? This action cannot be undone!"
      )
    )
      return;
    if (
      !window.confirm(
        "This will delete ALL posts and users (except admin). Are you absolutely sure?"
      )
    )
      return;

    try {
      const success = await firebasePostUtils.deleteAllData();
      if (success) {
        // Refresh data
        const allPosts = await firebasePostUtils.getAllPosts();
        const allUsers = await firebasePostUtils.getAllUsers();
        setPosts(allPosts);
        setUsers(allUsers);
        alert("All data deleted successfully!");
      } else {
        alert("Failed to delete all data.");
      }
    } catch (error) {
      console.error("Error deleting all data:", error);
      alert("Failed to delete all data.");
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

  const handlePhaseChange = async (userId: string, newPhase: number) => {
    const phaseName = phaseUtils.getPhaseName(newPhase);
    if (
      !window.confirm(
        `Are you sure you want to move this user to ${phaseName}?`
      )
    )
      return;

    try {
      const success = await firebasePostUtils.updateUserPhase(userId, newPhase);
      if (success) {
        // Refresh users list
        const allUsers = await firebasePostUtils.getAllUsers();
        setUsers(allUsers);
        alert(`User moved to ${phaseName} successfully!`);
      } else {
        alert("Failed to change user phase.");
      }
    } catch (error) {
      console.error("Error changing user phase:", error);
      alert("Failed to change user phase.");
    }
  };

  const handleDeleteUserPosts = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete all posts by this user? This action cannot be undone!"
      )
    )
      return;

    try {
      const success = await firebasePostUtils.deleteUserPosts(userId);
      if (success) {
        // Refresh posts and users lists
        const allPosts = await firebasePostUtils.getAllPosts();
        const allUsers = await firebasePostUtils.getAllUsers();
        setPosts(allPosts);
        setUsers(allUsers);
        alert("User posts deleted successfully!");
      } else {
        alert("Failed to delete user posts.");
      }
    } catch (error) {
      console.error("Error deleting user posts:", error);
      alert("Failed to delete user posts.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user completely? This will delete their posts and user data. This action cannot be undone!"
      )
    )
      return;

    try {
      const success = await firebasePostUtils.deleteUser(userId);
      if (success) {
        // Refresh posts and users lists
        const allPosts = await firebasePostUtils.getAllPosts();
        const allUsers = await firebasePostUtils.getAllUsers();
        setPosts(allPosts);
        setUsers(allUsers);
        alert(
          "User deleted successfully! Firebase Authentication account has been completely removed."
        );
      } else {
        alert("Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const downloadCSV = () => {
    // Create CSV data for all posts with their service experience data
    const csvData = posts.map((post) => {
      const serviceExp = post.serviceExperience;
      const highlights = post.highlights || [];
      const comments = post.comments || [];

      return {
        // Basic post info
        "Post ID": post.id,
        "Author ID": post.authorId,
        "Author Name": post.authorName,
        "Business Name": post.businessName || "",
        Content: post.content,
        "Created At": formatDate(post.createdAt),
        Phase: post.phase || 1,
        Category: post.category || "",
        Hashtags: post.hashtags.join("; "),
        "Images Count": post.images.length,

        // Service Experience Data
        "Organization Name": serviceExp?.organizationName || "",
        "Organization Type": serviceExp?.organizationType || "",
        "Relationship Length": serviceExp?.relationshipLength || "",
        "Satisfaction Rating": serviceExp?.satisfactionRating || "",
        "Loyalty Rating": serviceExp?.loyaltyRating || "",
        "Recommendation Likelihood": serviceExp?.recommendationLikelihood || "",
        "Needs Alignment": serviceExp?.needsAlignment || "",
        "Google Score": serviceExp?.yelpScore || "",
        "Google Price Range": serviceExp?.yelpPriceRange || "",
        "Experience Narrative": serviceExp?.experienceNarrative || "",
        "Generalizable Lesson": serviceExp?.generalizableLesson || "",
        "Operation Disruptiveness": serviceExp?.operationDisruptiveness || "",
        "Life Disruptiveness": serviceExp?.lifeDisruptiveness || "",

        // Service Attributes (ranked 1-6)
        "Price Ranking":
          serviceExp?.serviceAttributes?.find((attr) => attr.name === "Price")
            ?.userRanking || "",
        "Convenience Ranking":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Convenience"
          )?.userRanking || "",
        "Speed Ranking":
          serviceExp?.serviceAttributes?.find((attr) => attr.name === "Speed")
            ?.userRanking || "",
        "Atmosphere Ranking":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Atmosphere"
          )?.userRanking || "",
        "Taste/Quality Ranking":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Taste/Quality"
          )?.userRanking || "",
        "Social Experience Ranking":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Social Experience"
          )?.userRanking || "",

        // Performance Ratings (0-100)
        "Price Performance":
          serviceExp?.serviceAttributes?.find((attr) => attr.name === "Price")
            ?.performanceRating || "",
        "Convenience Performance":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Convenience"
          )?.performanceRating || "",
        "Speed Performance":
          serviceExp?.serviceAttributes?.find((attr) => attr.name === "Speed")
            ?.performanceRating || "",
        "Atmosphere Performance":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Atmosphere"
          )?.performanceRating || "",
        "Taste/Quality Performance":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Taste/Quality"
          )?.performanceRating || "",
        "Social Experience Performance":
          serviceExp?.serviceAttributes?.find(
            (attr) => attr.name === "Social Experience"
          )?.performanceRating || "",

        // Variability Assessments
        "Arrival Variability Applied":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "arrival")
            ?.applied || false,
        "Arrival Company Response":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "arrival")
            ?.companyResponse || "",
        "Arrival Description":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "arrival")
            ?.description || "",
        "Arrival Impact Rating":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "arrival")
            ?.impactRating || "",

        "Request Variability Applied":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "request")
            ?.applied || false,
        "Request Company Response":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "request")
            ?.companyResponse || "",
        "Request Description":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "request")
            ?.description || "",
        "Request Impact Rating":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "request")
            ?.impactRating || "",

        "Capability Variability Applied":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "capability"
          )?.applied || false,
        "Capability Company Response":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "capability"
          )?.companyResponse || "",
        "Capability Description":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "capability"
          )?.description || "",
        "Capability Impact Rating":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "capability"
          )?.impactRating || "",

        "Effort Variability Applied":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "effort")
            ?.applied || false,
        "Effort Company Response":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "effort")
            ?.companyResponse || "",
        "Effort Description":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "effort")
            ?.description || "",
        "Effort Impact Rating":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "effort")
            ?.impactRating || "",

        "Subjective Preference Variability Applied":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "subjective_preference"
          )?.applied || false,
        "Subjective Preference Company Response":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "subjective_preference"
          )?.companyResponse || "",
        "Subjective Preference Description":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "subjective_preference"
          )?.description || "",
        "Subjective Preference Impact Rating":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "subjective_preference"
          )?.impactRating || "",

        // Highlights and Comments
        "Highlight Count": highlights.length,
        "Highlight Reasons": highlights
          .map((h) => `"${h.userName}: ${h.reason}"`)
          .join("; "),
        "Comment Count": comments.length,
        Comments: comments
          .map((c) => `"${c.authorName}: ${c.content}"`)
          .join("; "),
      };
    });

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = (row as any)[header];
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (
              typeof value === "string" &&
              (value.includes(",") ||
                value.includes('"') ||
                value.includes("\n"))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `customer-compatibility-exercise-data-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => router.push("/feed")}>Go to Feed</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalPosts: posts.length,
    totalUsers: users.length,
    recentPosts: posts.filter((p) => {
      const postDate = new Date(p.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return postDate > weekAgo;
    }).length,
    totalHighlights: posts.reduce(
      (sum, post) => sum + (post.highlights?.length || 0),
      0
    ),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Phase 3: Discovering Results
            </h1>
            <p className="text-gray-600">
              Analyze data, manage users, and export comprehensive reports
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={downloadCSV}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAllData}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Data</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Note: Authentication Accounts Not Deleted
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              "Delete All Data" removes posts and user profiles, but does NOT
              delete Firebase Authentication accounts. To fully reset, manually
              delete auth users from the Firebase Console (Authentication →
              Users tab).
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPosts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Recent Posts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recentPosts}
                </p>
                <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Flag className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Highlights
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalHighlights}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("stats")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "stats"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "posts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Post ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Gallery ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "analysis"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Analysis
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest posts from the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts
                  .filter((p) => {
                    const postDate = new Date(p.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return postDate > weekAgo;
                  })
                  .slice(0, 5)
                  .map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {post.authorName}
                        </p>
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {post.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {post.highlights?.length || 0} highlights
                        </Badge>
                        <Badge variant="outline">
                          {post.comments.length} comments
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>Key metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Average highlights per post
                  </span>
                  <span className="font-semibold">
                    {stats.totalPosts > 0
                      ? (stats.totalHighlights / stats.totalPosts).toFixed(1)
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Posts this week</span>
                  <span className="font-semibold">{stats.recentPosts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement rate</span>
                  <span className="font-semibold">
                    {stats.totalPosts > 0
                      ? (
                          (stats.totalHighlights +
                            posts.reduce(
                              (sum, p) => sum + p.comments.length,
                              0
                            )) /
                          stats.totalPosts
                        ).toFixed(1)
                      : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "posts" && (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge variant="outline">{post.authorName}</Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-800 mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Flag className="h-4 w-4 mr-1" />
                        {post.highlights?.length || 0} highlights
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.comments.length} comments
                      </span>
                      {post.hashtags.length > 0 && (
                        <span className="flex items-center">
                          {post.hashtags.slice(0, 3).map((tag, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="mr-1 text-xs"
                            >
                              #{tag}
                            </Badge>
                          ))}
                          {post.hashtags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{post.hashtags.length - 3} more
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/post/${post.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 text-center py-8">
                  No users found.
                </p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => {
              const userPosts = posts.filter((p) => p.authorId === user.id);
              const userPost = userPosts[0]; // Since there's 1 post per user
              const currentPhase = phaseUtils.getCurrentPhase(user);

              return (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge
                            variant={user.isAdmin ? "destructive" : "outline"}
                          >
                            {user.isAdmin ? "Admin" : "User"}
                          </Badge>
                          <span className="font-medium text-gray-900">
                            {user.formalName} ({user.preferredName})
                          </span>
                          <span className="text-sm text-gray-500">
                            {user.email}
                          </span>
                        </div>

                        {/* Business Name and Post Info */}
                        {userPost && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {userPost.businessName || "No Business Name"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {userPost.serviceExperience
                                    ?.organizationType || "Unknown Type"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2 text-sm">
                                  <Flag className="h-4 w-4 text-orange-500" />
                                  <span>
                                    {userPost.highlights?.length || 0}{" "}
                                    highlights
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>
                                    {userPost.comments.length} comments
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>ID: {user.id}</span>
                          <span>Joined: {formatDate(user.createdAt)}</span>
                          {user.studentId && (
                            <span>Student ID: {user.studentId}</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {phaseUtils.getPhaseName(currentPhase)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <div className="flex space-x-2">
                          <Badge variant="secondary">
                            {userPosts.length} posts
                          </Badge>
                          {userPost && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/post/${userPost.id}`)
                              }
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Post
                            </Button>
                          )}
                        </div>

                        {/* User Management Buttons */}
                        {!user.isAdmin && (
                          <div className="flex space-x-2">
                            {/* Phase Management */}
                            <div className="flex space-x-1">
                              {currentPhase > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePhaseChange(user.id, currentPhase - 1)
                                  }
                                  className="text-xs"
                                >
                                  ← Phase {currentPhase - 1}
                                </Button>
                              )}
                              {currentPhase < 2 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePhaseChange(user.id, currentPhase + 1)
                                  }
                                  className="text-xs"
                                >
                                  Phase {currentPhase + 1} →
                                </Button>
                              )}
                            </div>

                            {/* Delete User Posts */}
                            {userPosts.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUserPosts(user.id)}
                                className="text-xs text-orange-600 hover:text-orange-700"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete Posts
                              </Button>
                            )}

                            {/* Delete User Completely */}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete User
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* Data Table Section */}
          <Card>
            <CardHeader>
              <CardTitle>Respondent Experiences</CardTitle>
              <CardDescription>
                Comprehensive view of all service experiences with metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">
                        Organization
                      </th>
                      <th className="text-left p-3 font-semibold">
                        Respondent
                      </th>
                      <th className="text-left p-3 font-semibold">
                        Highlighted
                      </th>
                      <th className="text-left p-3 font-semibold">Tenure</th>
                      <th className="text-left p-3 font-semibold">Alignment</th>
                      <th className="text-left p-3 font-semibold">
                        Satisfaction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => {
                      const serviceExp = post.serviceExperience;
                      const highlightCount = post.highlights?.length || 0;

                      return (
                        <tr key={post.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {post.businessName || "N/A"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/post/${post.id}`)}
                                className="p-1 h-auto"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">{post.authorName}</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-1">
                              <span>{highlightCount}</span>
                              <Flag className="h-4 w-4 text-orange-500" />
                            </div>
                          </td>
                          <td className="p-3">
                            {serviceExp?.relationshipLength ===
                            "long_time_customer"
                              ? "100"
                              : serviceExp?.relationshipLength ===
                                "new_customer"
                              ? "1"
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            {serviceExp?.needsAlignment || "N/A"}
                          </td>
                          <td className="p-3">
                            {serviceExp?.satisfactionRating || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Data Analysis</CardTitle>
              <CardDescription>
                Advanced analytics and visualizations (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Analysis Dashboard
                </h3>
                <p className="text-gray-600 mb-4">
                  Interactive charts and correlation analysis will be available
                  here.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={downloadCSV}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Dataset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
