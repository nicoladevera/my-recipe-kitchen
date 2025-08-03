import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CookingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
}

export function CookingLogModal({ isOpen, onClose, recipeId, recipeName }: CookingLogModalProps) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const logCookingMutation = useMutation({
    mutationFn: async () => {
      // First log the cooking session
      const logResponse = await apiRequest("POST", `/api/recipes/${recipeId}/cooking-log`, {
        timestamp: new Date().toISOString(),
        notes: notes || "Cooked this recipe",
        rating,
      });

      // If there's a photo, update the recipe with the new photo
      if (photoFile) {
        const formData = new FormData();
        formData.append("photo", photoFile);
        await fetch(`/api/recipes/${recipeId}`, {
          method: "PATCH",
          body: formData,
        });
      }

      return logResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Cooking session logged",
        description: "Your cooking experience has been recorded!",
      });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log cooking session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setRating(0);
    setNotes("");
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating between 1 and 5 stars.",
        variant: "destructive",
      });
      return;
    }
    logCookingMutation.mutate();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Log Cooking Session</h3>
          <p className="text-gray-600">{recipeName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate this cooking session? *
            </label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className={`text-2xl transition-colors ${
                    i < rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="How did it turn out? Any modifications or tips?"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Recipe Photo (optional)
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              {photoPreview ? (
                <div>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-w-full max-h-32 mx-auto rounded-lg mb-2"
                  />
                  <p className="text-sm text-gray-600">Click to change photo</p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-gray-600">Click to upload new photo</p>
                  <p className="text-xs text-gray-500 mt-1">This will replace the current recipe photo</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logCookingMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {logCookingMutation.isPending ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}