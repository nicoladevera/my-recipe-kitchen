import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";

export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });
}
