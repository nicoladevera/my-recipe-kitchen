import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";

export function useRecipes(fetchAll = false) {
  return useQuery<Recipe[]>({
    queryKey: fetchAll ? ["/api/recipes"] : ["no-recipes"],
    enabled: fetchAll,
  });
}
