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

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    formalName: "",
    preferredName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        setIsLoading(false);
        return;
      }

      const result = await signup(
        formData.email,
        formData.password,
        formData.formalName,
        formData.preferredName,
        "", // No student ID needed anymore
        "" // No business name needed anymore
      );

      if (result.success) {
        router.push("/feed");
      } else {
        setError(result.error || "Account creation failed");
      }
    } catch (err) {
      setError("An unexpected error occurred during signup");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Join the Customer Compatibility Exercise platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address (Login ID)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Your email address will be used as your login ID
              </p>
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
                placeholder="Create a password"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label
                htmlFor="formalName"
                className="block text-sm font-medium text-gray-700"
              >
                Formal Name
              </label>
              <Input
                id="formalName"
                name="formalName"
                type="text"
                required
                value={formData.formalName}
                onChange={handleChange}
                className="mt-1"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="preferredName"
                className="block text-sm font-medium text-gray-700"
              >
                Preferred Name
              </label>
              <Input
                id="preferredName"
                name="preferredName"
                type="text"
                required
                value={formData.preferredName}
                onChange={handleChange}
                className="mt-1"
                placeholder="Johnny"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
