import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [showCookingLog, setShowCookingLog] = useState(false);
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

  const logCookingMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const response = await apiRequest("POST", `/api/recipes/${id}/cooking-log`, {
        date: new Date().toISOString().split('T')[0],
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Cooking session logged",
        description: "Your cooking experience has been recorded!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log cooking session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      deleteMutation.mutate(recipe.id);
    }
  };

  const handleLogCooking = () => {
    const notes = prompt("How did it turn out? Add any notes:");
    if (notes !== null) {
      logCookingMutation.mutate({ id: recipe.id, notes: notes || "Cooked this recipe" });
    }
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
        <div className="mt-2 text-gray-600">
          {recipe.ingredients.split('\n').slice(0, 3).join(', ')}
          {recipe.ingredients.split('\n').length > 3 && '...'}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-5 gap-3">
        <button 
          className="recipe-btn"
          onClick={handleLogCooking}
          disabled={logCookingMutation.isPending}
        >
          {logCookingMutation.isPending ? "Logging..." : "Log Cooking Session"}
        </button>
        <button 
          className="delete-btn"
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
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
              <span>{log.date}</span>
              <span className="text-gray-600">{log.notes}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
