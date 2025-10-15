"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { firebasePostUtils } from "@/lib/firebase-posts";
import { Post } from "@/lib/types";
import { POST_CATEGORIES, PHASES } from "@/lib/constants";
import { phaseUtils } from "@/lib/phase-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    content: "",
    hashtags: "",
    businessName: "",
    category: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  };

  const handleHashtagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      hashtags: e.target.value,
    }));
  };

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      businessName: e.target.value,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      category: e.target.value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    setImages((prev) => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      const hashtagsArray = formData.hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Create post data without images first
      const postData = {
        authorId: user.id,
        authorName: user.preferredName,
        businessName: formData.businessName || user.businessName || "",
        content: formData.content,
        images: [], // Will be populated after upload
        hashtags: hashtagsArray,
        category: formData.category,
        likes: [],
        comments: [],
        phase: user.phase || PHASES.PHASE_1,
      };

      // Create the post in Firestore first
      const postId = await firebasePostUtils.createPost(postData);
      if (!postId) {
        throw new Error("Failed to create post");
      }

      // Upload images if any
      if (images.length > 0) {
        const imageUrls = await firebasePostUtils.uploadImages(images, postId);
        // Update the post with image URLs
        await firebasePostUtils.updatePost(postId, { images: imageUrls });
      }

      // Advance user to Phase 2 after creating their first post
      if (user.phase === 1) {
        await firebasePostUtils.updateUserPhase(user.id, 2);
      }

      router.push("/feed");
    } catch (err) {
      setError("Failed to create post. Please try again.");
      console.error("Error creating post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Check if user can create posts in their current phase
  const currentPhase = phaseUtils.getCurrentPhase(user);
  const canCreate = phaseUtils.canCreateInPhase(user, currentPhase);

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Phase 2: View Only
            </h2>
            <p className="text-gray-600 mb-4">
              You have completed Phase 1! You can now view the gallery and
              interact with posts, but cannot create new posts.
            </p>
            <Button onClick={() => router.push("/feed")}>
              Back to Gallery
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Post</CardTitle>
          <CardDescription>
            Share your business compatibility experiences and insights
          </CardDescription>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {phaseUtils.getPhaseName(currentPhase)}
            </Badge>
          </div>
          {currentPhase === 1 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Phase 1:</strong> Create your first post to unlock the
                gallery and view other posts!
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Name
              </label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={handleBusinessNameChange}
                placeholder="Enter the business name you're reviewing"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                {POST_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Experience
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Share your business compatibility experience..."
                className="min-h-[120px]"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Images (Optional)
              </label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload images or drag and drop
                    </span>
                  </label>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden"
                      >
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label
                htmlFor="hashtags"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Hashtags (Optional)
              </label>
              <Input
                id="hashtags"
                value={formData.hashtags}
                onChange={handleHashtagsChange}
                placeholder="Enter hashtags separated by commas (e.g., food, review, experience)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple hashtags with commas
              </p>
            </div>

            {/* Preview Hashtags */}
            {formData.hashtags && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Preview:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0)
                    .map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/feed")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.content.trim()}
              >
                {isLoading ? "Creating Post..." : "Create Post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
