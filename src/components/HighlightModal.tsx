"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flag } from "lucide-react";

interface HighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isHighlighted: boolean;
  highlightCount: number;
}

export function HighlightModal({
  isOpen,
  onClose,
  onConfirm,
  isHighlighted,
  highlightCount,
}: HighlightModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (error) {
      console.error("Error highlighting post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-orange-500" />
            {isHighlighted ? "Remove Highlight" : "Highlight Experience"}
          </DialogTitle>
          <DialogDescription>
            {isHighlighted
              ? "This experience is currently highlighted. Click confirm to remove the highlight."
              : "Why are you highlighting this experience for discussion?"}
          </DialogDescription>
        </DialogHeader>

        {!isHighlighted && (
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Explain why this experience is worth discussing in class..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {reason.length}/500 characters
                </span>
                {reason.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Ready to highlight
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {isHighlighted ? "Cancel" : "Do Not Highlight"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!isHighlighted && !reason.trim())}
            className={
              isHighlighted
                ? "bg-gray-600 hover:bg-gray-700"
                : "bg-orange-600 hover:bg-orange-700"
            }
          >
            {isSubmitting
              ? "Processing..."
              : isHighlighted
              ? "Remove Highlight"
              : "Highlight"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
