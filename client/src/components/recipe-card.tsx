import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CookingLogModal } from "./cooking-log-modal";
import { ConfirmationDialog } from "./confirmation-dialog";
import type { Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [showCookingLog, setShowCookingLog] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogDeleteConfirm, setShowLogDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recipe deleted",
        description: "Your recipe has been removed from your collection.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeLogMutation = useMutation({
    mutationFn: async ({ recipeId, logIndex }: { recipeId: string; logIndex: number }) => {
      await apiRequest("DELETE", `/api/recipes/${recipeId}/cooking-log/${logIndex}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Cooking log entry removed",
        description: "The entry has been deleted from your cooking log.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove cooking log entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(recipe.id);
    setShowDeleteConfirm(false);
  };

  const handleRemoveLog = (logIndex: number) => {
    setLogToDelete(logIndex);
    setShowLogDeleteConfirm(true);
  };

  const confirmRemoveLog = () => {
    if (logToDelete !== null) {
      removeLogMutation.mutate({ recipeId: recipe.id, logIndex: logToDelete });
    }
    setShowLogDeleteConfirm(false);
    setLogToDelete(null);
  };

  return (
    <div className="recipe-card">
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1">
          <h3 className="recipe-title">{recipe.name}</h3>
          <div className="recipe-meta">
            <span className="hero-ingredient">{recipe.heroIngredient}</span>
            <span className="time-badge">{recipe.cookTime} min</span>
            <span style={{ color: 'var(--recipe-accent)' }}>Serves {recipe.servings}</span>
          </div>
          <div className="recipe-rating">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`recipe-star non-interactive ${i < (recipe.rating || 0) ? 'filled' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        {recipe.photo && (
          <img 
            src={recipe.photo} 
            alt={recipe.name} 
            className="recipe-photo"
          />
        )}
      </div>
      
      <div className="mb-4">
        <strong>Ingredients:</strong>
        <div className="mt-2 text-gray-600 whitespace-pre-line">
          {recipe.ingredients}
        </div>
      </div>
      
      <div className="mb-4">
        <strong>Instructions:</strong>
        <div className="mt-2 text-gray-600">
          {recipe.instructions.split('\n').filter(step => step.trim()).map((step, index) => (
            <div key={index} className="mb-2">
              {step.trim()}
            </div>
          ))}
        </div>
      </div>
      
      <div className="recipe-actions mt-5">
        <button 
          className="recipe-btn"
          onClick={() => setShowLogModal(true)}
        >
          Log Cooking Session
        </button>
        <button 
          className="delete-btn desktop-delete"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Deleting..." : "🗑️ Delete"}
        </button>
      </div>

      {(recipe.cookingLog && recipe.cookingLog.length > 0) && (
        <div className="cooking-log">
          <div className="flex justify-between items-center mb-3">
            <h4 style={{ color: 'var(--recipe-green)' }}>Cooking Log</h4>
            <button
              onClick={() => setShowCookingLog(!showCookingLog)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showCookingLog ? "Hide" : "Show"} ({recipe.cookingLog?.length || 0})
            </button>
          </div>
          {showCookingLog && recipe.cookingLog?.map((log, index) => (
            <div key={index} className="cooking-log-entry">
              <div className="cooking-log-content">
                <div>
                  <span>{new Date((log as any).timestamp || (log as any).date).toLocaleDateString()}</span>
                  <div className="recipe-rating mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`recipe-star non-interactive ${i < log.rating ? 'filled' : ''}`}
                        style={{ fontSize: '0.9em' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-gray-600 cooking-log-notes">{log.notes}</span>
              </div>
              <button
                onClick={() => handleRemoveLog(index)}
                className="cooking-log-delete"
                disabled={removeLogMutation.isPending}
                title="Remove this cooking log entry"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button 
        className="delete-btn mobile-delete"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? "Deleting..." : "🗑️ Delete"}
      </button>

      <CookingLogModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        recipeId={recipe.id}
        recipeName={recipe.name}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`}
        confirmText="Delete Recipe"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={showLogDeleteConfirm}
        onClose={() => {
          setShowLogDeleteConfirm(false);
          setLogToDelete(null);
        }}
        onConfirm={confirmRemoveLog}
        title="Remove Cooking Log"
        message="Are you sure you want to remove this cooking log entry? This action cannot be undone."
        confirmText="Remove Entry"
        isLoading={removeLogMutation.isPending}
      />
    </div>
  );
}
