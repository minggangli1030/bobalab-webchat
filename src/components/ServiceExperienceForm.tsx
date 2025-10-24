"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Star,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  ServiceExperience,
  ServiceAttribute,
  VariabilityAssessment,
} from "@/lib/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ServiceExperienceFormProps {
  onSubmit: (experience: ServiceExperience) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: ServiceExperience;
}

interface SortableAttributeItemProps {
  attribute: ServiceAttribute;
  index: number;
  onRankingChange: (index: number, ranking: number) => void;
  onRemove: (index: number) => void;
}

function SortableAttributeItem({
  attribute,
  index,
  onRankingChange,
  onRemove,
}: SortableAttributeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attribute.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-4 p-3 border rounded-lg bg-white"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <span className="font-medium">{attribute.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Rank:</span>
        <select
          value={index + 1} // Show current position as rank
          onChange={(e) => onRankingChange(index, parseInt(e.target.value))}
          className="px-2 py-1 border rounded text-sm"
        >
          {[1, 2, 3, 4, 5, 6].map((rank) => (
            <option key={rank} value={rank}>
              {rank}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
      >
        Remove
      </button>
    </div>
  );
}

const ORGANIZATION_TYPES = [
  "Activities",
  "Airlines",
  "Arts & Entertainment",
  "Automotive",
  "Beauty & Spas",
  "Bicycles",
  "Education",
  "Event Planning & Services",
  "Financial Services",
  "Food",
  "Health & Medical",
  "Home Services",
  "Hotels & Travel",
  "Mass Media",
  "Nightlife",
  "Other",
  "Pets",
  "Professional Services",
  "Public Services & Government",
  "Real Estate",
  "Religious Organizations",
  "Restaurants",
  "Retail",
  "Telecom",
  "Transportation",
];

const DEFAULT_ATTRIBUTES: string[] = []; // Start with empty array for custom attributes

const VARIABILITY_TYPES = [
  {
    type: "arrival" as const,
    label: "Arrival Variability",
    description:
      "Customers may want service at times that are not convenient for the company.",
  },
  {
    type: "request" as const,
    label: "Request Variability",
    description:
      "Customers may ask for different things or have unique requests.",
  },
  {
    type: "capability" as const,
    label: "Capability Variability",
    description:
      "Customers may not possess the knowledge, skills, or ability to complete their part of the service transaction.",
  },
  {
    type: "effort" as const,
    label: "Effort Variability",
    description: "Customers may not wish to put forth the required effort.",
  },
  {
    type: "subjective_preference" as const,
    label: "Subjective Preference Variability",
    description:
      "Customers may have different ideas about what constitutes a good service experience.",
  },
];

export default function ServiceExperienceForm({
  onSubmit,
  onCancel,
  isLoading,
  initialData,
}: ServiceExperienceFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ServiceExperience>>(
    initialData || {
      serviceAttributes: [], // Start with empty array for custom attributes
      relationshipLength: 0, // Start with 0 years
      streetAddress: "", // Initialize street address
      imgurLinks: [], // Initialize Imgur links array
      variabilityAssessments: VARIABILITY_TYPES.map((v) => ({
        type: v.type,
        applied: false,
        companyResponse: "not_applicable" as const,
        description: "",
        impactRating: 0,
      })),
    }
  );

  // Update form data when initialData becomes available (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const totalSteps = 6;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateFormData = (updates: Partial<ServiceExperience>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex =
        formData.serviceAttributes?.findIndex(
          (attr) => attr.name === active.id
        ) ?? 0;
      const newIndex =
        formData.serviceAttributes?.findIndex(
          (attr) => attr.name === over.id
        ) ?? 0;

      const newAttributes = arrayMove(
        formData.serviceAttributes || [],
        oldIndex,
        newIndex
      );

      // Update ranks based on new positions (1 = top, 6 = bottom)
      const updatedAttributes = newAttributes.map((attr, index) => ({
        ...attr,
        userRanking: index + 1,
      }));

      updateFormData({ serviceAttributes: updatedAttributes });
    }
  };

  const handleRankingChange = (index: number, ranking: number) => {
    if (ranking === 0) {
      // If "Select rank" is chosen, just update the ranking without reordering
      const newAttributes = [...(formData.serviceAttributes || [])];
      newAttributes[index].userRanking = ranking;
      updateFormData({ serviceAttributes: newAttributes });
      return;
    }

    const currentAttributes = [...(formData.serviceAttributes || [])];
    const itemToMove = currentAttributes[index];

    // Remove the item from its current position
    const attributesWithoutItem = currentAttributes.filter(
      (_, i) => i !== index
    );

    // Insert the item at the new position (ranking - 1 because array is 0-indexed)
    const newPosition = Math.min(ranking - 1, attributesWithoutItem.length);
    const newAttributes = [
      ...attributesWithoutItem.slice(0, newPosition),
      { ...itemToMove, userRanking: ranking },
      ...attributesWithoutItem.slice(newPosition),
    ];

    // Update all rankings to reflect the new order
    const updatedAttributes = newAttributes.map((attr, idx) => ({
      ...attr,
      userRanking: idx + 1,
    }));

    updateFormData({ serviceAttributes: updatedAttributes });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (formData.serviceAttributes && formData.variabilityAssessments) {
      onSubmit(formData as ServiceExperience);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 <= currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  i + 1 < currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Service Organization Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name of service organization <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.organizationName || ""}
            onChange={(e) =>
              updateFormData({ organizationName: e.target.value })
            }
            placeholder="Enter organization name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Length of relationship with service organization (enter a number in
            years, enter 0 if new) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.relationshipLength || 0}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              const cappedValue = Math.min(value, 50);
              updateFormData({
                relationshipLength: cappedValue,
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter number of years (0-50, 0 for new customer)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type of service organization <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.organizationType || ""}
            onChange={(e) =>
              updateFormData({ organizationType: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select organization type</option>
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.streetAddress || ""}
            onChange={(e) => updateFormData({ streetAddress: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter store location"
            required
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => {
    const addAttribute = () => {
      const newAttribute = prompt("Enter attribute name:");
      if (newAttribute && newAttribute.trim()) {
        const currentAttributes = formData.serviceAttributes || [];
        const trimmedName = newAttribute.trim();

        // Check for duplicates
        const isDuplicate = currentAttributes.some(
          (attr) => attr.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
          alert(
            "This attribute already exists. Please enter a different name."
          );
          return;
        }

        if (currentAttributes.length < 6) {
          const newAttributes = [
            ...currentAttributes,
            {
              name: trimmedName,
              userRanking: currentAttributes.length + 1,
              performanceRating: 50,
            },
          ];
          updateFormData({ serviceAttributes: newAttributes });
        } else {
          alert("You can only add up to 6 attributes.");
        }
      }
    };

    const removeAttribute = (index: number) => {
      const currentAttributes = formData.serviceAttributes || [];
      const newAttributes = currentAttributes.filter((_, i) => i !== index);
      // Re-rank the remaining attributes
      const reRankedAttributes = newAttributes.map((attr, idx) => ({
        ...attr,
        userRanking: idx + 1,
      }));
      updateFormData({ serviceAttributes: reRankedAttributes });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Attributes - Your Perspective</CardTitle>
          <p className="text-sm text-gray-600">
            <strong>Step 1:</strong> Add exactly 6 service attributes that are
            important to you.
            <br />
            <strong>Step 2:</strong> Drag to reorder by importance (most
            important at top).
            <br />
            <strong>Step 3:</strong> In the next step, you'll evaluate each
            attribute's performance.
          </p>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={formData.serviceAttributes?.map((attr) => attr.name) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {formData.serviceAttributes?.map((attr, index) => (
                  <SortableAttributeItem
                    key={attr.name}
                    attribute={attr}
                    index={index}
                    onRankingChange={handleRankingChange}
                    onRemove={removeAttribute}
                  />
                ))}

                {(!formData.serviceAttributes ||
                  formData.serviceAttributes.length < 6) && (
                  <button
                    onClick={addAttribute}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Attribute ({formData.serviceAttributes?.length || 0}
                    /6)
                  </button>
                )}

                {formData.serviceAttributes?.length === 6 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ You have added 6 attributes. Drag to reorder by
                      importance, then proceed to evaluate their performance.
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    );
  };

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Performance Evaluation</CardTitle>
        <p className="text-sm text-gray-600">
          <strong>Step 3:</strong> Rate the organization's performance on each
          of your 6 attributes relative to competitors. Use the sliders to
          evaluate how well this organization performed on each attribute.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.serviceAttributes?.map((attr, index) => (
          <div key={attr.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {attr.name}
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Worst in Class</span>
              <input
                type="range"
                min="0"
                max="100"
                value={attr.performanceRating || 0}
                onChange={(e) => {
                  const newAttributes = [...(formData.serviceAttributes || [])];
                  newAttributes[index].performanceRating = parseInt(
                    e.target.value
                  );
                  updateFormData({ serviceAttributes: newAttributes });
                }}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">Best in Class</span>
              <span className="text-sm font-medium w-12 text-center">
                {attr.performanceRating || 0}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Customer Variability Assessment</CardTitle>
        <p className="text-sm text-gray-600">
          Consider the variability you imposed on the organization
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.variabilityAssessments?.map((assessment, index) => (
          <div key={assessment.type} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              {VARIABILITY_TYPES[index].label}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              {VARIABILITY_TYPES[index].description}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did the company respond to this variability?
                </label>
                <select
                  value={assessment.companyResponse}
                  onChange={(e) => {
                    const newAssessments = [
                      ...(formData.variabilityAssessments || []),
                    ];
                    newAssessments[index].companyResponse = e.target.value as
                      | "accommodate"
                      | "reduce"
                      | "not_applicable";
                    newAssessments[index].applied =
                      e.target.value !== "not_applicable";
                    updateFormData({
                      variabilityAssessments: newAssessments,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="not_applicable">Did not apply</option>
                  <option value="accommodate">Accommodate variability</option>
                  <option value="reduce">Reduce variability</option>
                </select>
              </div>

              {assessment.companyResponse !== "not_applicable" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your experience{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={assessment.description || ""}
                      onChange={(e) => {
                        const newAssessments = [
                          ...(formData.variabilityAssessments || []),
                        ];
                        newAssessments[index].description = e.target.value;
                        updateFormData({
                          variabilityAssessments: newAssessments,
                        });
                      }}
                      placeholder="Describe your experience..."
                      className="min-h-[80px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How did the company's response affect your service
                      experience?
                    </label>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        Significantly Worsen
                      </span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={assessment.impactRating || 0}
                        onChange={(e) => {
                          const newAssessments = [
                            ...(formData.variabilityAssessments || []),
                          ];
                          newAssessments[index].impactRating = parseInt(
                            e.target.value
                          );
                          updateFormData({
                            variabilityAssessments: newAssessments,
                          });
                        }}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500">
                        Significantly Improve
                      </span>
                      <span className="text-sm font-medium w-12 text-center">
                        {assessment.impactRating || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Note: Minimum value must be at least 1
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Experience Ratings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How well do your needs align with this organization's capabilities?{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 w-32 text-right">
              Not at all well aligned
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.needsAlignment || 50}
              onChange={(e) =>
                updateFormData({ needsAlignment: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-32">
              Very well aligned
            </span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.needsAlignment || 50}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please rate your satisfaction with your service interaction{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 w-32 text-right">
              Very dissatisfied
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.satisfactionRating || 50}
              onChange={(e) =>
                updateFormData({ satisfactionRating: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-32">Very satisfied</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.satisfactionRating || 50}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please rate your intended loyalty to this organization{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 w-32 text-right">
              Very low
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.loyaltyRating || 50}
              onChange={(e) =>
                updateFormData({ loyaltyRating: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-32">Very high</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.loyaltyRating || 50}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How likely are you to recommend this organization to a friend or
            colleague? <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 w-32 text-right">
              Not at all likely
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.recommendationLikelihood || 50}
              onChange={(e) =>
                updateFormData({
                  recommendationLikelihood: parseInt(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-32">Extremely likely</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.recommendationLikelihood || 50}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Review Score (please research and enter){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.01"
              value={formData.googleScore || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  updateFormData({ googleScore: undefined });
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
                    // Round to 2 decimal places
                    const roundedValue = Math.round(numValue * 100) / 100;
                    updateFormData({ googleScore: roundedValue });
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter score (1.00-5.00)"
            />
            {formData.googleScore && (
              <div className="mt-2 flex items-center space-x-1">
                <span className="text-sm text-gray-600">Rating:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const score = formData.googleScore || 0;
                    const isFull = star <= Math.floor(score);
                    const isHalf =
                      star === Math.ceil(score) && score % 1 >= 0.5;

                    return (
                      <span key={star} className="text-yellow-400">
                        {isFull ? "★" : isHalf ? "☆" : "☆"}
                      </span>
                    );
                  })}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  ({formData.googleScore}/5)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Review Price Range (please research and enter){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={formData.googlePriceRange || ""}
              onChange={(e) =>
                updateFormData({
                  googlePriceRange: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter price range (1-4)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Final Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How disruptive to the operation was the variability you imposed?{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Not at all disruptive</span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.operationDisruptiveness || 50}
              onChange={(e) =>
                updateFormData({
                  operationDisruptiveness: parseInt(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Extremely disruptive</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.operationDisruptiveness || 50}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How disruptive to your life was the company's response to the
            variability you imposed? <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Not at all disruptive</span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.lifeDisruptiveness || 50}
              onChange={(e) =>
                updateFormData({ lifeDisruptiveness: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Extremely disruptive</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.lifeDisruptiveness || 50}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please provide a brief narrative describing your service experience{" "}
            <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={formData.experienceNarrative || ""}
            onChange={(e) =>
              updateFormData({ experienceNarrative: e.target.value })
            }
            placeholder="Describe your service experience, noting the dimensions of the interaction that stand out most to you..."
            className="min-h-[120px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What is the key generalizable lesson you draw from this service
            experience? <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={formData.generalizableLesson || ""}
            onChange={(e) =>
              updateFormData({ generalizableLesson: e.target.value })
            }
            placeholder="What lesson can be learned about how to best design mechanisms to manage customers in service organizations?"
            className="min-h-[120px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Media to Imgur and Submit Links
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Please upload any relevant photos or media to{" "}
            <a
              href="https://imgur.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              imgur.com
            </a>{" "}
            and paste the links here (one per line).
          </p>
          <Textarea
            value={formData.imgurLinks?.join("\n") || ""}
            onChange={(e) => {
              const links = e.target.value
                .split("\n")
                .filter((link) => link.trim());
              updateFormData({ imgurLinks: links });
            }}
            placeholder="Paste Imgur links here, one per line..."
            className="min-h-[100px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Upload images to imgur.com and copy the direct image links
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.organizationName &&
          formData.relationshipLength !== undefined &&
          formData.organizationType &&
          formData.streetAddress
        );
      case 2:
        return formData.serviceAttributes?.length === 6; // Must have exactly 6 attributes
      case 3:
        return formData.serviceAttributes?.every(
          (attr) => (attr.performanceRating || 0) >= 0
        );
      case 4:
        return true; // Variability assessment is optional
      case 5:
        return true; // Ratings are optional
      case 6:
        return formData.experienceNarrative && formData.generalizableLesson;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      {renderCurrentStep()}

      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Experience"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
