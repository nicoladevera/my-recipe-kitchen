import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { heroIngredientOptions } from "@shared/schema";

interface AddRecipeFormProps {
  onSuccess?: () => void;
}

export function AddRecipeForm({ onSuccess }: AddRecipeFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    heroIngredient: "",
    cookTime: "",
    servings: "",
    ingredients: "",
    instructions: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRecipeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        throw new Error("Failed to create recipe");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      resetForm();
      onSuccess?.();
      toast({
        title: "Recipe added!",
        description: "Your recipe has been successfully added to your collection.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("heroIngredient", formData.heroIngredient);
    formDataToSend.append("cookTime", formData.cookTime);
    formDataToSend.append("servings", formData.servings);
    formDataToSend.append("ingredients", formData.ingredients);
    formDataToSend.append("instructions", formData.instructions);
    
    if (photoFile) {
      formDataToSend.append("photo", photoFile);
    }

    createRecipeMutation.mutate(formDataToSend);
  };

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
    setFormData({
      name: "",
      heroIngredient: "",
      cookTime: "",
      servings: "",
      ingredients: "",
      instructions: "",
    });
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };



  return (
    <>
      {showSuccess && (
        <div className="success-message">
          Recipe added successfully! 🎉
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="recipe-form-group">
          <label htmlFor="recipe-name">Recipe Name *</label>
          <input
            type="text"
            id="recipe-name"
            className="recipe-input"
            required
            placeholder="Enter your recipe name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="recipe-form-group">
          <label htmlFor="hero-ingredient">Hero Ingredient *</label>
          <select
            id="hero-ingredient"
            className="recipe-select"
            required
            value={formData.heroIngredient}
            onChange={(e) => setFormData(prev => ({ ...prev, heroIngredient: e.target.value }))}
          >
            <option value="">Select main ingredient</option>
            {heroIngredientOptions.map(ingredient => (
              <option key={ingredient} value={ingredient}>{ingredient}</option>
            ))}
          </select>
        </div>

        <div className="recipe-form-group">
          <label htmlFor="cook-time">Cooking Time (minutes) *</label>
          <input
            type="number"
            id="cook-time"
            className="recipe-input"
            required
            min="1"
            placeholder="30"
            value={formData.cookTime}
            onChange={(e) => setFormData(prev => ({ ...prev, cookTime: e.target.value }))}
          />
        </div>

        <div className="recipe-form-group">
          <label htmlFor="servings">Servings *</label>
          <input
            type="number"
            id="servings"
            className="recipe-input"
            required
            min="1"
            placeholder="4"
            value={formData.servings}
            onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
          />
        </div>

        <div className="recipe-form-group">
          <label htmlFor="ingredients">Ingredients *</label>
          <textarea
            id="ingredients"
            className="recipe-textarea"
            required
            placeholder="List each ingredient on a new line...&#10;2 cups flour&#10;1 tsp salt&#10;3 eggs"
            value={formData.ingredients}
            onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
          />
        </div>

        <div className="recipe-form-group">
          <label htmlFor="instructions">Instructions *</label>
          <textarea
            id="instructions"
            className="recipe-textarea"
            required
            placeholder="Add each step on a new line..."
            value={formData.instructions}
            onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
          />
        </div>

        <div className="recipe-form-group">
          <label>Recipe Photo</label>
          <div className="photo-upload" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            <p style={{ color: 'var(--recipe-green)', fontWeight: 500 }}>📷 Click to upload photo</p>
            <p style={{ fontSize: '12px', color: 'var(--recipe-accent)', marginTop: '4px' }}>
              JPG, PNG or WebP (max 5MB)
            </p>
          </div>
          {photoPreview && (
            <div className="mt-4 text-center">
              <img
                src={photoPreview}
                alt="Recipe preview"
                className="max-w-[200px] max-h-[200px] rounded-xl shadow-lg mx-auto"
              />
            </div>
          )}
        </div>



        <button 
          type="submit" 
          className="recipe-btn"
          disabled={createRecipeMutation.isPending}
        >
          {createRecipeMutation.isPending ? "Adding Recipe..." : "Add Recipe"}
        </button>
        <button 
          type="button" 
          className="recipe-btn recipe-btn-secondary" 
          onClick={resetForm}
        >
          Clear Form
        </button>
      </form>
    </>
  );
}
