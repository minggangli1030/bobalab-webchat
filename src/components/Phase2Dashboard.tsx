"use client";

import { useState, useEffect } from "react";
import { Post } from "@/lib/types";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { phaseUtils } from "@/lib/phase-utils";

interface Phase2DashboardProps {
  posts: Post[];
  currentUser?: any;
}

export default function Phase2Dashboard({ posts, currentUser }: Phase2DashboardProps) {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Use currentUser if provided, otherwise fall back to user from context
  const activeUser = currentUser || user;

  // Get user's own post for the dashboard
  const userPost = posts.find((post) => post.authorId === activeUser?.id);

  if (!userPost || !userPost.serviceExperience) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No service experience data found.</p>
      </div>
    );
  }

  const serviceExp = userPost.serviceExperience;

  // Sort attributes by ranking (1-6)
  const sortedAttributes = [...(serviceExp.serviceAttributes || [])].sort(
    (a, b) => a.userRanking - b.userRanking
  );

  // Get variability assessments
  const variabilityAssessments = serviceExp.variabilityAssessments || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {activeUser && phaseUtils.getCurrentPhase(activeUser) === 1 
            ? "Your Post Details" 
            : "Phase 2: Peer Feedback Dashboard"}
        </h1>
        <p className="text-gray-600">
          {activeUser && phaseUtils.getCurrentPhase(activeUser) === 1
            ? "Review your service experience details"
            : "Comprehensive analysis of your service experience"}
        </p>
      </div>

      {/* Phase 1 Note */}
      {activeUser && phaseUtils.getCurrentPhase(activeUser) === 1 && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">
            Good job on posting! You can review your post here, and wait for your instructor to start Phase 2.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Attribute Maps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Attribute Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedAttributes.map((attr, index) => (
                  <div
                    key={attr.name}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-24 text-sm text-gray-600 truncate">
                      {attr.name}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{
                          width: `${attr.performanceRating || 0}%`,
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {attr.performanceRating || 0}
                      </div>
                    </div>
                    <div className="w-8 text-sm text-gray-600 text-center">
                      #{attr.userRanking}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Customer Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Experience Narrative
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {serviceExp.experienceNarrative || "No narrative provided"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Lesson</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {serviceExp.generalizableLesson || "No lesson provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Photos */}
          {userPost.imgurLinks && userPost.imgurLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Experience Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userPost.imgurLinks.map((link, index) => {
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
                              const linkElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (linkElement) linkElement.style.display = "block";
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
                        <div key={index} className="p-2 bg-white rounded border">
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

        {/* Right Column */}
        <div className="space-y-6">
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
                  <h4 className="font-medium text-gray-900 mb-2">Exposure</h4>
                  <div className="bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full"
                      style={{ width: `${serviceExp.needsAlignment || 0}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                      {serviceExp.needsAlignment || 0}%
                    </div>
                  </div>
                </div>

                {/* Evaluation Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Evaluation</h4>
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
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-20 text-sm text-gray-600">
                          {metric.label}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className="bg-blue-500 h-4 rounded-full"
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
                  {serviceExp.googlePriceRange && (
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
                  )}

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
                                star <= Math.floor(serviceExp.googleScore || 0)
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
        </div>
      </div>

      {/* Managing Variability Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Managing Variability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Variability
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Company Response
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
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
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {variabilityTypes[assessment.type] || assessment.type}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {assessment.description || "No description"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            assessment.companyResponse === "accommodate"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {assessment.companyResponse === "accommodate"
                            ? "Accommodate variability"
                            : "Reduce variability"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
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
                            className={`text-sm font-medium ${
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
    </div>
  );
}
