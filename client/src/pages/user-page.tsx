import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Home from "./home";
import NotFound from "./not-found";
import { Recipe } from "@shared/schema";

export default function UserPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's data and recipes
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/users", username],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
  });

  const { data: recipes, isLoading: recipesLoading, error: recipesError } = useQuery<Recipe[]>({
    queryKey: ["/api/users", username, "recipes"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/recipes`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch recipes");
      }
      return response.json();
    },
  });

  // Check if current user owns this page
  const isOwner = user?.username === username;

  // Set dynamic page title when user data is loaded
  useEffect(() => {
    if (userData) {
      const displayName = userData.displayName || username;
      document.title = `My Recipe Kitchen - ${displayName}`;
    }
  }, [userData, username]);

  if (userLoading || recipesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-recipe-green mx-auto mb-4"></div>
          <p className="text-recipe-brown">Loading recipes...</p>
        </div>
      </div>
    );
  }

  if (userError || recipesError || !recipes || !userData) {
    return <NotFound />;
  }

  // Pass the recipes, user data, and ownership status to Home
  return (
    <Home 
      recipes={recipes} 
      isOwner={isOwner}
      username={username}
      profileUser={userData}
    />
  );
}