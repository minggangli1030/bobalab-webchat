"use client";

import { useState } from "react";
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
}

interface SortableAttributeItemProps {
  attribute: ServiceAttribute;
  index: number;
  onRankingChange: (index: number, ranking: number) => void;
}

function SortableAttributeItem({
  attribute,
  index,
  onRankingChange,
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
          value={attribute.userRanking}
          onChange={(e) => onRankingChange(index, parseInt(e.target.value))}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value={0}>Select rank</option>
          {[1, 2, 3, 4, 5, 6].map((rank) => (
            <option key={rank} value={rank}>
              {rank}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const ORGANIZATION_TYPES = [
  "Restaurant",
  "Retail Store",
  "Bank/Financial Services",
  "Healthcare Provider",
  "Transportation",
  "Hotel/Hospitality",
  "Education",
  "Government Services",
  "Technology Services",
  "Other",
];

const DEFAULT_ATTRIBUTES = [
  "Speed",
  "Price",
  "Convenience",
  "Atmosphere",
  "Taste/Quality",
  "Social Experience",
];

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
}: ServiceExperienceFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ServiceExperience>>({
    serviceAttributes: DEFAULT_ATTRIBUTES.map((name) => ({
      name,
      userRanking: 0,
      performanceRating: 0,
    })),
    variabilityAssessments: VARIABILITY_TYPES.map((v) => ({
      type: v.type,
      applied: false,
      companyResponse: "not_applicable" as const,
      description: "",
      impactRating: 0,
    })),
  });

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

      updateFormData({ serviceAttributes: newAttributes });
    }
  };

  const handleRankingChange = (index: number, ranking: number) => {
    const newAttributes = [...(formData.serviceAttributes || [])];
    newAttributes[index].userRanking = ranking;
    updateFormData({ serviceAttributes: newAttributes });
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
            Length of relationship with service organization{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="relationshipLength"
                value="new_customer"
                checked={formData.relationshipLength === "new_customer"}
                onChange={(e) =>
                  updateFormData({
                    relationshipLength: e.target.value as
                      | "new_customer"
                      | "long_time_customer",
                  })
                }
                className="mr-2"
              />
              New Customer
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="relationshipLength"
                value="long_time_customer"
                checked={formData.relationshipLength === "long_time_customer"}
                onChange={(e) =>
                  updateFormData({
                    relationshipLength: e.target.value as
                      | "new_customer"
                      | "long_time_customer",
                  })
                }
                className="mr-2"
              />
              Long-time Customer
            </label>
          </div>
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
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Service Attributes - Your Perspective</CardTitle>
        <p className="text-sm text-gray-600">
          Rank these attributes by importance from your perspective (drag to
          reorder)
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Performance Evaluation</CardTitle>
        <p className="text-sm text-gray-600">
          Rate the organization's performance on each attribute relative to
          competitors
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
                  Did this type of variability apply to your experience?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`${assessment.type}-applied`}
                      checked={assessment.applied}
                      onChange={(e) => {
                        const newAssessments = [
                          ...(formData.variabilityAssessments || []),
                        ];
                        newAssessments[index].applied = true;
                        updateFormData({
                          variabilityAssessments: newAssessments,
                        });
                      }}
                      className="mr-2"
                    />
                    Yes, this applied
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`${assessment.type}-applied`}
                      checked={!assessment.applied}
                      onChange={(e) => {
                        const newAssessments = [
                          ...(formData.variabilityAssessments || []),
                        ];
                        newAssessments[index].applied = false;
                        newAssessments[index].companyResponse =
                          "not_applicable";
                        updateFormData({
                          variabilityAssessments: newAssessments,
                        });
                      }}
                      className="mr-2"
                    />
                    No, this did not apply
                  </label>
                </div>
              </div>

              {assessment.applied && (
                <>
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
                        newAssessments[index].companyResponse = e.target
                          .value as "accommodate" | "reduce" | "not_applicable";
                        updateFormData({
                          variabilityAssessments: newAssessments,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="not_applicable">Did not apply</option>
                      <option value="accommodate">
                        Accommodate variability
                      </option>
                      <option value="reduce">Reduce variability</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe how you imposed this variability
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
            How well do your needs align with this organization's capabilities?
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Not at all well aligned
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.needsAlignment || 0}
              onChange={(e) =>
                updateFormData({ needsAlignment: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Very well aligned</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.needsAlignment || 0}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please rate your satisfaction with your service interaction
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Very dissatisfied</span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.satisfactionRating || 0}
              onChange={(e) =>
                updateFormData({ satisfactionRating: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Very satisfied</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.satisfactionRating || 0}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please rate your intended loyalty to this organization
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Very low</span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.loyaltyRating || 0}
              onChange={(e) =>
                updateFormData({ loyaltyRating: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Very high</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.loyaltyRating || 0}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How likely are you to recommend this organization to a friend or
            colleague?
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Not at all likely</span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.recommendationLikelihood || 0}
              onChange={(e) =>
                updateFormData({
                  recommendationLikelihood: parseInt(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Extremely likely</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.recommendationLikelihood || 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Review Score (if applicable)
            </label>
            <select
              value={formData.yelpScore || ""}
              onChange={(e) =>
                updateFormData({
                  yelpScore: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Not applicable</option>
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((score) => (
                <option key={score} value={score}>
                  {score} {score === 1 ? "★" : "★".repeat(Math.floor(score))}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Review Price Range (if applicable)
            </label>
            <select
              value={formData.yelpPriceRange || ""}
              onChange={(e) =>
                updateFormData({
                  yelpPriceRange: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Not applicable</option>
              {[1, 2, 3, 4].map((range) => (
                <option key={range} value={range}>
                  {range} {"$".repeat(range)}
                </option>
              ))}
            </select>
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
            How disruptive to the operation was the variability you imposed?
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Not at all disruptive</span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.operationDisruptiveness || 0}
              onChange={(e) =>
                updateFormData({
                  operationDisruptiveness: parseInt(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Extremely disruptive</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.operationDisruptiveness || 0}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How disruptive to your life was the company's response to the
            variability you imposed?
          </label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Not at all disruptive</span>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.lifeDisruptiveness || 0}
              onChange={(e) =>
                updateFormData({ lifeDisruptiveness: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500">Extremely disruptive</span>
            <span className="text-sm font-medium w-12 text-center">
              {formData.lifeDisruptiveness || 0}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please provide a brief narrative describing your service experience
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
            experience?
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
          formData.relationshipLength &&
          formData.organizationType
        );
      case 2:
        return formData.serviceAttributes?.every(
          (attr) => attr.userRanking > 0
        );
      case 3:
        return formData.serviceAttributes?.every(
          (attr) => (attr.performanceRating || 0) > 0
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
