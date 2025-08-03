import { useState } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { AddRecipeForm } from "@/components/add-recipe-form";
import { RecipeFilters } from "@/components/recipe-filters";
import { useRecipes } from "@/hooks/use-recipes";
import { useAuth } from "@/hooks/use-auth";
import { Recipe } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HomeProps {
  recipes?: Recipe[];
  isOwner?: boolean;
  username?: string;
}

export default function Home({ recipes: propRecipes, isOwner = false, username }: HomeProps) {
  const [activeSection, setActiveSection] = useState<"my-recipes" | "add-recipe">("my-recipes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Use prop recipes if provided (for user pages), otherwise fetch all recipes (for home page)
  const { data: fetchedRecipes = [], isLoading } = useRecipes(propRecipes ? undefined : true);
  const recipes = propRecipes || fetchedRecipes;

  // Sort recipes based on cooking logs and creation date
  const sortedRecipes = [...recipes].sort((a, b) => {
    // Helper function to get the most recent cooking log timestamp
    const getMostRecentLogTimestamp = (recipe: any): number | null => {
      if (!recipe.cookingLog || recipe.cookingLog.length === 0) return null;
      return Math.max(...recipe.cookingLog.map((log: any) => {
        // Handle both old 'date' format and new 'timestamp' format for backward compatibility
        const dateValue = log.timestamp || log.date;
        return new Date(dateValue).getTime();
      }));
    };

    const aRecentLog = getMostRecentLogTimestamp(a);
    const bRecentLog = getMostRecentLogTimestamp(b);
    const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    
    // Check if recipes have cooking logs
    const aHasLogs = a.cookingLog && a.cookingLog.length > 0;
    const bHasLogs = b.cookingLog && b.cookingLog.length > 0;

    // If both have cooking logs, sort by most recent log
    if (aHasLogs && bHasLogs && aRecentLog !== null && bRecentLog !== null) {
      return bRecentLog - aRecentLog;
    }
    
    // Prioritize recipes with cooking logs over those without
    if (aHasLogs && !bHasLogs) return -1;
    if (!aHasLogs && bHasLogs) return 1;
    
    // If neither has cooking logs, sort by creation date (newest first)
    // This ensures new recipes appear at the top
    return bCreatedAt - aCreatedAt;
  });

  const filteredRecipes = sortedRecipes.filter(recipe => {
    const matchesSearch = !searchTerm || 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.heroIngredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = !filterRating || (recipe.rating || 0) >= parseInt(filterRating);
    const matchesTime = !filterTime || recipe.cookTime <= parseInt(filterTime);

    return matchesSearch && matchesRating && matchesTime;
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-screen">
      <div className="recipe-header">
        <div className="recipe-container">
          <h1>🌿 My Recipe Kitchen</h1>
          {username && (
            <p className="text-recipe-brown-light text-sm mb-4">by <span className="font-semibold text-recipe-green">{username}</span></p>
          )}
          <p>A thoughtful collection of your favorite recipes, beautifully organized</p>
          
          {/* Auth controls */}
          <div className="mt-4 flex justify-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {!isOwner && (
                  <Button
                    onClick={() => setLocation(`/${user.username}`)}
                    variant="outline"
                  >
                    My Recipes
                  </Button>
                )}
                {isOwner && (
                  <Button
                    onClick={() => setLocation("/settings")}
                    variant="outline"
                  >
                    Settings
                  </Button>
                )}
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={() => setLocation("/auth")}>
                Sign In / Register
              </Button>
            )}
          </div>
          
          {/* Explanatory section for non-logged in users */}
          {!user && !isOwner && (
            <div className="mt-12">
              <div className="recipe-card max-w-4xl mx-auto">
                <div className="text-center">
                  <h2 className="recipe-title text-2xl mb-4">Welcome to My Recipe Kitchen</h2>
                  <p className="text-recipe-brown-light text-lg mb-8 leading-relaxed">
                    Your personal culinary companion for creating, organizing, and sharing your favorite recipes.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 md:gap-8 text-center">
                    <div className="p-3 md:p-6">
                      <div className="text-3xl mb-2 md:mb-4">📝</div>
                      <h3 className="font-semibold text-recipe-green mb-1 md:mb-3">Create & Organize</h3>
                      <p className="text-sm text-recipe-brown-light leading-relaxed">
                        Build your personal recipe collection with detailed ingredients, instructions, and photos
                      </p>
                    </div>
                    <div className="p-3 md:p-6">
                      <div className="text-3xl mb-2 md:mb-4">📸</div>
                      <h3 className="font-semibold text-recipe-green mb-1 md:mb-3">Track Your Cooking</h3>
                      <p className="text-sm text-recipe-brown-light leading-relaxed">
                        Log cooking sessions with photos, notes, and ratings to perfect your dishes over time
                      </p>
                    </div>
                    <div className="p-3 md:p-6">
                      <div className="text-3xl mb-2 md:mb-4">🌐</div>
                      <h3 className="font-semibold text-recipe-green mb-1 md:mb-3">Share & Discover</h3>
                      <p className="text-sm text-recipe-brown-light leading-relaxed">
                        Share your recipes publicly and explore collections from other passionate cooks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="recipe-container">
        {isOwner && (
          <div className="recipe-nav">
            <button
              className={`recipe-nav-btn ${activeSection === "my-recipes" ? "active" : ""}`}
              onClick={() => setActiveSection("my-recipes")}
            >
              Recipes
            </button>
            <button
              className={`recipe-nav-btn ${activeSection === "add-recipe" ? "active" : ""}`}
              onClick={() => setActiveSection("add-recipe")}
            >
              Add Recipe
            </button>
          </div>
        )}

        {(activeSection === "my-recipes" || !isOwner) ? (
          <div className="recipe-section">
            <h2>{username && user?.displayName ? `${user.displayName}'s Recipe Collection` : username ? `${username}'s Recipe Collection` : "Recipe Collection"}</h2>
            
            <RecipeFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterRating={filterRating}
              setFilterRating={setFilterRating}
              filterTime={filterTime}
              setFilterTime={setFilterTime}
            />

            {isLoading ? (
              <div className="text-center py-8">
                <p>Loading recipes...</p>
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">
                  {recipes.length === 0 
                    ? "No recipes found. Add your first recipe to get started!"
                    : "No recipes match your current filters."
                  }
                </p>
                {recipes.length > 0 && (
                  <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                )}
              </div>
            ) : (
              <div>
                {filteredRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} isOwner={isOwner} />
                ))}
              </div>
            )}
          </div>
        ) : isOwner ? (
          <div className="recipe-section">
            <h2>Add New Recipe</h2>
            <AddRecipeForm onSuccess={() => setActiveSection("my-recipes")} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
