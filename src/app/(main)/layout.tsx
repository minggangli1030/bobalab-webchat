"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { phaseUtils } from "@/lib/phase-utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { LogOut, Home, Plus, User } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && !user.isAdmin) {
      const userPhase = phaseUtils.getCurrentPhase(user);

      // Allow Phase 1 users to access /feed (they'll see appropriate message there)
      // This prevents redirect loops when transitioning from Phase 1 to Phase 2
      if (userPhase === 1 && pathname !== "/create-post" && pathname !== "/" && pathname !== "/feed") {
        console.log("Phase 1 user redirecting to create-post");
        router.push("/create-post");
        return;
      }

      // Only redirect Phase 2 users away from create-post if they manually navigate there
      if (userPhase === 2 && pathname === "/create-post") {
        console.log("Phase 2 user redirecting to feed");
        router.push("/feed");
        return;
      }

      // If user is on root path, redirect based on phase
      if (pathname === "/" || pathname === "") {
        if (userPhase === 1) {
          console.log("Root redirect: Phase 1 -> create-post");
          router.push("/create-post");
        } else {
          console.log("Root redirect: Phase 2 -> feed");
          router.push("/feed");
        }
        return;
      }
    }
  }, [user, isLoading, router, pathname]);

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

  if (!user) {
    return null; // Will redirect to /login
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/feed" className="text-xl font-bold text-gray-900">
                Customer Compatibility Exercise
              </Link>

              <nav className="hidden md:flex space-x-6">
                {user &&
                  (user.isAdmin || phaseUtils.getCurrentPhase(user) >= 2) && (
                    <Link
                      href="/feed"
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      <span>Gallery</span>
                    </Link>
                  )}
                {user?.isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.preferredName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.preferredName}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
