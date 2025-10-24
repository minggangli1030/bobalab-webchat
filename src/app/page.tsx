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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Customer Compatibility Exercise
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Understanding customer variability in service organizations through
            real-world experiences
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Get Started Card */}
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
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
                      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                        Get Started
                      </h2>
                      <p className="text-gray-600">
                        Create your account or sign in to participate
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Link href="/signup" className="block">
                        <Button className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
                          Create Account
                        </Button>
                      </Link>

                      <Link href="/login" className="block">
                        <Button
                          variant="outline"
                          className="w-full h-12 text-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                        >
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* About This Exercise Card */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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
                    About This Exercise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Customers impose considerable variability on the operating
                    systems of service organizations. They show up when they
                    wish (arrival variability), they ask for different things
                    (request variability), they vary in their willingness and
                    ability to help themselves (effort and capability
                    variability), and they have different preferences
                    (subjective preference variability). All this variability
                    leaves the front lines of many service organizations
                    struggling to deliver consistent, high-quality service.
                  </p>
                  <p>
                    The Customer Compatibility Exercise provides students with a
                    window into this reality through the lens of their own
                    experiences, surfacing lessons about the daunting and
                    seemingly-incongruous task of reactively managing customer
                    relationships and efficient operations.
                  </p>
                </CardContent>
              </Card>

            {/* Two Phases Card */}
            <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Two Phases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Phase I: Documentation
                        </h4>
                        <p className="text-sm text-gray-600">
                          Document two face-to-face interactions with service
                          providers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Phase II: Gallery
                        </h4>
                        <p className="text-sm text-gray-600">
                          Browse and learn from others' experiences in a
                          searchable gallery
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="shadow-lg border-0 bg-white mt-6">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    If you're having trouble with the exercise or need assistance, 
                    please contact your instructor:
                  </p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">Park Sinchaisri</p>
                    <p className="text-blue-600 hover:text-blue-800">
                      <a href="mailto:parksinchaisri@berkeley.edu">
                        parksinchaisri@berkeley.edu
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
