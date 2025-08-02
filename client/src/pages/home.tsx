import { useState } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { AddRecipeForm } from "@/components/add-recipe-form";
import { RecipeFilters } from "@/components/recipe-filters";
import { useRecipes } from "@/hooks/use-recipes";

export default function Home() {
  const [activeSection, setActiveSection] = useState<"my-recipes" | "add-recipe">("my-recipes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [filterTime, setFilterTime] = useState("");

  const { data: recipes = [], isLoading } = useRecipes();

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

  return (
    <div className="min-h-screen">
      <div className="recipe-header">
        <div className="recipe-container">
          <h1>🌿 My Recipe Kitchen</h1>
          <p>A thoughtful collection of your favorite recipes, beautifully organized</p>
        </div>
      </div>

      <div className="recipe-container">
        <div className="recipe-nav">
          <button
            className={`recipe-nav-btn ${activeSection === "my-recipes" ? "active" : ""}`}
            onClick={() => setActiveSection("my-recipes")}
          >
            My Recipes
          </button>
          <button
            className={`recipe-nav-btn ${activeSection === "add-recipe" ? "active" : ""}`}
            onClick={() => setActiveSection("add-recipe")}
          >
            Add Recipe
          </button>
        </div>

        {activeSection === "my-recipes" ? (
          <div className="recipe-section">
            <h2>My Recipe Collection</h2>
            
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
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="recipe-section">
            <h2>Add New Recipe</h2>
            <AddRecipeForm onSuccess={() => setActiveSection("my-recipes")} />
          </div>
        )}
      </div>
    </div>
  );
}
