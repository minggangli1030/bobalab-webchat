"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetUtils } from "@/lib/reset-accounts";
import { firebaseAuthUtils } from "@/lib/firebase-auth";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await login(formData.email, formData.password);

      if (success) {
        router.push("/feed");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const success = await firebaseAuthUtils.resetPassword(resetEmail);
      if (success) {
        setResetSent(true);
        setError("");
      } else {
        setError(
          "Failed to send reset email. Please check your email address."
        );
      }
    } catch (error) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = () => {
    const cleared = resetUtils.confirmAndClear();
    if (cleared) {
      setError("");
      alert("All local data cleared! You can now start fresh.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1"
                placeholder="your.email@university.edu"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1"
                placeholder="Your password"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Password Reset Section */}
          <div className="mt-4">
            {!showReset ? (
              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setShowReset(true)}
              >
                Forgot your password?
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700">
                  Reset Password
                </h4>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="text-sm"
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={isLoading || !resetEmail}
                    className="flex-1"
                  >
                    {isLoading ? "Sending..." : "Send Reset Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowReset(false);
                      setResetEmail("");
                      setResetSent(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {resetSent && (
                  <p className="text-green-600 text-xs">
                    Reset email sent! Check your inbox.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Admin Login */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-2">
              Admin Access:
            </p>
            <p className="text-xs text-blue-600">
              Username: admin123 | Password: admin123
            </p>
          </div>

          {/* Data Reset Section */}
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium mb-2">
              Having trouble?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllData}
              className="w-full text-xs text-red-600 border-red-300 hover:bg-red-100"
            >
              Clear All Local Data & Start Fresh
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
