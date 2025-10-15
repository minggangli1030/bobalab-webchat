"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/feed");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to /feed
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            STUDENT VIEW
          </h1>
          <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Customer Compatibility Exercise
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Left Column - About Content */}
          <div className="space-y-8">
            {/* About This Exercise */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
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
                  ABOUT THIS EXERCISE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Customers impose considerable variability on the operating
                  systems of service organizations. They show up when they wish
                  (arrival variability), they ask for different things (request
                  variability), they vary in their willingness and ability to
                  help themselves (effort and capability variability), and they
                  have different preferences (subjective preference
                  variability). All this variability leaves the front lines of
                  many service organizations struggling to deliver consistent,
                  high-quality service. The Customer Compatibility Exercise
                  provides students with a window into this reality through the
                  lens of their own experiences, surfacing lessons about the
                  daunting and seemingly-incongruous task of reactively managing
                  customer relationships and efficient operations. Moreover,
                  analysis of student data provided through the exercise reveals
                  a set of proactive strategies that companies can use to pursue
                  more compatible customer relationships.
                </p>
                <p>
                  In Phase I of this exercise, students are invited to document
                  two of their own face-to-face interactions with service
                  providers. In Phase II, after all students have documented
                  their experience interactions, a searchable online gallery is
                  launched so that students can browse and learn from each
                  other's experiences, as well as highlight service interactions
                  they find interesting and would like to discuss in class.
                  During the third and final Phase III, certain underlying
                  trends and correlations between key attributes are identified
                  by graphical analysis of the recorded data. This final
                  analysis sets the stage for the introduction of strategies
                  companies can use to proactively cultivate more compatible
                  customer relationships, yielding delighted customers and more
                  efficient operations.
                </p>
              </CardContent>
            </Card>

            {/* Authorship */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  AUTHORSHIP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 leading-relaxed">
                <p>
                  Professor Ryan W. Buell prepared this application with the
                  assistance of the Harvard Business School Technology Products
                  Group: Mohsen Haidar, Victoria Keirnan, David Lieberman, Anne
                  Macdonald, Edward Rustan, and Aizan Radzi. Funding for the
                  development of the application was provided by Harvard
                  Business School. This application was developed solely as the
                  basis for class discussion. Applications are not intended to
                  serve as endorsements, sources of primary data, or
                  illustrations of effective or ineffective management.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Login/Signup */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Get Started
                    </h2>
                    <p className="text-gray-600">
                      Create your account or sign in to participate
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Link href="/signup" className="block">
                      <Button className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
                        Create Account
                      </Button>
                    </Link>

                    <Link href="/login" className="block">
                      <Button
                        variant="outline"
                        className="w-full h-12 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-200"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>Courseware #620-707</p>
          <p className="mt-2">
            Copyright ©2021 President and Fellows of Harvard College. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
