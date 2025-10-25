"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { Post, User } from "@/lib/types";
import { phaseUtils } from "@/lib/phase-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Eye,
  Users,
  MessageSquare,
  Heart,
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
  const [activeTab, setActiveTab] = useState<"posts" | "users">("users");

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
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
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
      console.log(`Attempting to change user ${userId} to phase ${newPhase}`);
      const success = await firebasePostUtils.updateUserPhase(userId, newPhase);
      if (success) {
        console.log(`Phase change successful for user ${userId}`);
        // Refresh users list
        const allUsers = await firebasePostUtils.getAllUsers();
        setUsers(allUsers);
        alert(
          `User moved to ${phaseName} successfully! The user will need to refresh their browser or log out and log back in to see the change.`
        );
      } else {
        console.error(`Failed to change phase for user ${userId}`);
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

  const handleEditPost = async (postId: string, updates: any) => {
    try {
      const success = await firebasePostUtils.updatePost(postId, updates);
      if (success) {
        // Refresh posts list
        const allPosts = await firebasePostUtils.getAllPosts();
        setPosts(allPosts);
        alert("Post updated successfully!");
      } else {
        alert("Failed to update post.");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post.");
    }
  };

  const handleBulkPhaseTransition = async (targetPhase: number) => {
    const phaseName = phaseUtils.getPhaseName(targetPhase);
    if (
      !window.confirm(
        `Are you sure you want to move ALL users to ${phaseName}? This will affect all non-admin users.`
      )
    )
      return;

    try {
      const nonAdminUsers = users.filter((user) => !user.isAdmin);
      let successCount = 0;
      let failCount = 0;

      for (const user of nonAdminUsers) {
        try {
          const success = await firebasePostUtils.updateUserPhase(
            user.id,
            targetPhase
          );
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error updating user ${user.id}:`, error);
          failCount++;
        }
      }

      // Refresh users list
      const allUsers = await firebasePostUtils.getAllUsers();
      setUsers(allUsers);

      alert(
        `Bulk phase transition completed!\nSuccess: ${successCount} users\nFailed: ${failCount} users`
      );
    } catch (error) {
      console.error("Error in bulk phase transition:", error);
      alert("Failed to perform bulk phase transition.");
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

        // Service Experience - Basic Info
        "Organization Name": serviceExp?.organizationName || "",
        "Organization Type": serviceExp?.organizationType || "",
        "Relationship Length (years)": serviceExp?.relationshipLength || "",
        "Street Address": serviceExp?.streetAddress || "",

        // Service Experience - Ratings
        "Satisfaction Rating": serviceExp?.satisfactionRating || "",
        "Loyalty Rating": serviceExp?.loyaltyRating || "",
        "Recommendation Likelihood": serviceExp?.recommendationLikelihood || "",
        "Needs Alignment": serviceExp?.needsAlignment || "",

        // Service Experience - Google Data
        "Google Score (1-5)": serviceExp?.googleScore || "",
        "Google Price Range (1-4)": serviceExp?.googlePriceRange || "",

        // Service Experience - Narratives
        "Experience Narrative": serviceExp?.experienceNarrative || "",
        "Generalizable Lesson": serviceExp?.generalizableLesson || "",

        // Service Experience - Disruptiveness
        "Operation Disruptiveness": serviceExp?.operationDisruptiveness || "",
        "Life Disruptiveness": serviceExp?.lifeDisruptiveness || "",

        // Service Attributes (dynamic - all 6 custom attributes)
        ...(serviceExp?.serviceAttributes?.reduce((acc, attr, index) => {
          acc[`Attribute ${index + 1} Name`] = attr.name;
          acc[`Attribute ${index + 1} Ranking`] = attr.userRanking || "";
          acc[`Attribute ${index + 1} Performance`] =
            attr.performanceRating || "";
          return acc;
        }, {} as Record<string, any>) || {}),

        // Variability Assessments - Arrival
        "Arrival - Company Response":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "arrival")
            ?.companyResponse || "",
        "Arrival - Description":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "arrival")
            ?.description || "",
        "Arrival - Impact Rating":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "arrival")
            ?.impactRating || "",

        // Variability Assessments - Request
        "Request - Company Response":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "request")
            ?.companyResponse || "",
        "Request - Description":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "request")
            ?.description || "",
        "Request - Impact Rating":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "request")
            ?.impactRating || "",

        // Variability Assessments - Capability
        "Capability - Company Response":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "capability"
          )?.companyResponse || "",
        "Capability - Description":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "capability"
          )?.description || "",
        "Capability - Impact Rating":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "capability"
          )?.impactRating || "",

        // Variability Assessments - Effort
        "Effort - Company Response":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "effort")
            ?.companyResponse || "",
        "Effort - Description":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "effort")
            ?.description || "",
        "Effort - Impact Rating":
          serviceExp?.variabilityAssessments?.find((v) => v.type === "effort")
            ?.impactRating || "",

        // Variability Assessments - Subjective Preference
        "Subjective Preference - Company Response":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "subjective_preference"
          )?.companyResponse || "",
        "Subjective Preference - Description":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "subjective_preference"
          )?.description || "",
        "Subjective Preference - Impact Rating":
          serviceExp?.variabilityAssessments?.find(
            (v) => v.type === "subjective_preference"
          )?.impactRating || "",

        // Media
        "Imgur Links": post.imgurLinks?.join("; ") || "",

        // Engagement
        "Highlight Count": highlights.length,
        "Highlight Reasons": highlights
          .map((h) => `${h.userName}: ${h.reason}`)
          .join("; "),
        "Comment Count": comments.length,
        Comments: comments
          .map((c) => `${c.authorName}: ${c.content}`)
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
    totalUsers: users.filter((user) => !user.isAdmin).length, // Exclude admin users
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 w-full">
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
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
            Phase 3: Admin Access and Data Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Manage users, view posts, and export comprehensive reports
          </p>
        </div>

        {/* Important Notes */}
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Phase Management
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  <strong>Phase 1:</strong> Users create their initial service
                  experience posts (max 2 posts).
                  <br />
                  <strong>Phase 2:</strong> Users can view all posts, provide
                  feedback, and engage with the gallery.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                  "Delete All Data" removes posts and user profiles, but does
                  NOT delete Firebase Authentication accounts. To fully reset,
                  manually delete auth users from the Firebase Console
                  (Authentication → Users tab).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Posts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPosts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-orange-600" />
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

        {/* Control Buttons */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={downloadCSV}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </Button>
            <Button
              onClick={() => handleBulkPhaseTransition(1)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <ArrowUp className="h-4 w-4" />
              <span>Move All Users to Phase 1: Initial Assessment</span>
            </Button>
            <Button
              onClick={() => handleBulkPhaseTransition(2)}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
            >
              <ArrowUp className="h-4 w-4" />
              <span>Move All Users to Phase 2: Peer Feedback</span>
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("posts")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "posts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Users ({users.filter((u) => !u.isAdmin).length})
            </button>
          </nav>
        </div>

        {/* Content */}

        {activeTab === "posts" && (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="border-2">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <Badge variant="outline" className="px-3 py-1">
                          {post.authorName}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {post.serviceExperience?.organizationName ||
                            "No Organization"}
                        </h3>
                        <p className="text-gray-800 mb-3">{post.content}</p>
                      </div>

                      {/* Engagement Metrics */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1 text-orange-500" />
                          {post.highlights?.length || 0} highlights
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {post.comments.length} comments
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Dashboard
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newImgurLinks = prompt(
                            "Enter new Imgur links (one per line):",
                            post.imgurLinks?.join("\n") || ""
                          );
                          if (newImgurLinks !== null) {
                            const links = newImgurLinks
                              .split("\n")
                              .filter((link) => link.trim());
                            handleEditPost(post.id, { imgurLinks: links });
                          }
                        }}
                        className="text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Add Media
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePost(post.id)}
                        className="text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            {users.length === 0 ? (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <p className="text-gray-600 text-center py-8">
                    No users found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              users
                .filter((user) => !user.isAdmin)
                .map((user) => {
                  const userPosts = posts.filter((p) => p.authorId === user.id);
                  const currentPhase = phaseUtils.getCurrentPhase(user);

                  return (
                    <Card key={user.id} className="border-2">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-4">
                            {/* User Info Header */}
                            <div className="flex items-center space-x-4">
                              <Badge
                                variant={
                                  user.isAdmin ? "destructive" : "outline"
                                }
                                className="px-3 py-1"
                              >
                                {user.isAdmin ? "Admin" : "User"}
                              </Badge>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {user.formalName} ({user.preferredName})
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                              {/* Phase Badge with Color Coding */}
                              <Badge
                                variant={
                                  currentPhase === 1 ? "default" : "secondary"
                                }
                                className={`px-4 py-2 text-sm font-medium ${
                                  currentPhase === 1
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : "bg-orange-100 text-orange-800 border-orange-200"
                                }`}
                              >
                                {phaseUtils.getPhaseName(currentPhase)}
                              </Badge>
                            </div>

                            {/* Posts Info */}
                            {userPosts.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">
                                  Posts ({userPosts.length})
                                </h4>
                                {userPosts.map((post, index) => (
                                  <div
                                    key={post.id}
                                    className="p-4 bg-gray-50 rounded-lg border"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h5 className="font-medium text-gray-900">
                                          {post.businessName ||
                                            `Post ${index + 1}`}
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          {post.serviceExperience
                                            ?.organizationType ||
                                            "Unknown Type"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {formatDate(post.createdAt)}
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <div className="text-right">
                                          <div className="flex items-center space-x-2 text-sm">
                                            <Heart className="h-4 w-4 text-orange-500" />
                                            <span>
                                              {post.highlights?.length || 0}{" "}
                                              highlights
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>
                                              {post.comments.length} comments
                                            </span>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            router.push(`/post/${post.id}`)
                                          }
                                          className="text-sm"
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* User Details */}
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <span>ID: {user.id}</span>
                              <span>Joined: {formatDate(user.createdAt)}</span>
                              {user.studentId && (
                                <span>Student ID: {user.studentId}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col space-y-4 ml-6">
                            {/* User Management Buttons */}
                            {!user.isAdmin && (
                              <div className="flex flex-col space-y-3">
                                {/* Phase Management */}
                                <div className="flex space-x-2">
                                  {currentPhase > 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handlePhaseChange(
                                          user.id,
                                          currentPhase - 1
                                        )
                                      }
                                      className="text-sm border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                      ← Move to Phase {currentPhase - 1}
                                    </Button>
                                  )}
                                  {currentPhase < 2 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handlePhaseChange(
                                          user.id,
                                          currentPhase + 1
                                        )
                                      }
                                      className="text-sm border-orange-200 text-orange-700 hover:bg-orange-50"
                                    >
                                      Move to Phase {currentPhase + 1} →
                                    </Button>
                                  )}
                                </div>

                                {/* Delete Actions */}
                                <div className="flex space-x-2">
                                  {userPosts.length > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteUserPosts(user.id)
                                      }
                                      className="text-sm text-orange-600 hover:text-orange-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Posts
                                    </Button>
                                  )}

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-sm"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </Button>
                                </div>
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
        </div>
      </div>
    </div>
  );
}
