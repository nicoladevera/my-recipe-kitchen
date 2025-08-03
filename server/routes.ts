import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertRecipeSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

// Configure multer for photo uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  }
});

// Middleware to check if user owns a recipe
const requireRecipeOwnership = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const recipe = await storage.getRecipe(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }
  
  if (recipe.userId !== req.user!.id) {
    return res.status(403).json({ error: "Not authorized to modify this recipe" });
  }
  
  next();
};

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Get recipes for a specific user (public)
  app.get("/api/users/:username/recipes", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const recipes = await storage.getRecipes(user.id);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // Get all recipes (legacy endpoint - now returns all public recipes)
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // Get single recipe
  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const recipe = await storage.getRecipe(req.params.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Create new recipe (requires authentication)
  app.post("/api/recipes", requireAuth, upload.single('photo'), async (req, res) => {
    try {
      // Parse numbers from form data strings
      const formData = {
        ...req.body,
        cookTime: parseInt(req.body.cookTime),
        servings: parseInt(req.body.servings),
      };
      
      const recipeData = insertRecipeSchema.parse(formData);
      
      // If photo was uploaded, set the photo path
      if (req.file) {
        recipeData.photo = `/uploads/${req.file.filename}`;
      }

      const recipe = await storage.createRecipe(recipeData, req.user!.id);
      res.status(201).json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create recipe" });
      }
    }
  });

  // Update recipe (requires ownership)
  app.patch("/api/recipes/:id", requireRecipeOwnership, upload.single('photo'), async (req, res) => {
    try {
      const updates = insertRecipeSchema.partial().parse(req.body);
      
      // If photo was uploaded, set the photo path
      if (req.file) {
        updates.photo = `/uploads/${req.file.filename}`;
      }

      const recipe = await storage.updateRecipe(req.params.id, updates, req.user!.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid update data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update recipe" });
      }
    }
  });

  // Delete recipe (requires ownership)
  app.delete("/api/recipes/:id", requireRecipeOwnership, async (req, res) => {
    try {
      const deleted = await storage.deleteRecipe(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Add cooking log entry (requires ownership)
  app.post("/api/recipes/:id/cooking-log", requireRecipeOwnership, async (req, res) => {
    try {
      const { date, timestamp, notes, rating } = req.body;
      // Accept either 'timestamp' (new format) or 'date' (legacy format)
      const logTimestamp = timestamp || date;
      
      if (!logTimestamp || !notes || rating === undefined) {
        return res.status(400).json({ error: "Timestamp/date, notes, and rating are required" });
      }

      // Store as timestamp for new entries, maintain backward compatibility
      const logEntry = { timestamp: logTimestamp, notes, rating };
      const recipe = await storage.addCookingLog(req.params.id, logEntry, req.user!.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to add cooking log" });
    }
  });

  // Remove cooking log entry (requires ownership)
  app.delete("/api/recipes/:id/cooking-log/:index", requireRecipeOwnership, async (req, res) => {
    try {
      const logIndex = parseInt(req.params.index, 10);
      if (isNaN(logIndex)) {
        return res.status(400).json({ error: "Invalid log index" });
      }

      const recipe = await storage.removeCookingLog(req.params.id, logIndex, req.user!.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found or invalid log index" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove cooking log entry" });
    }
  });

  // User profile update endpoints
  app.patch("/api/user", requireAuth, async (req, res) => {
    try {
      const updates = z.object({
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
        displayName: z.string().min(1).optional(),
        bio: z.string().optional(),
      }).parse(req.body);

      // Check if username is already taken (if being changed)
      if (updates.username && updates.username !== req.user!.username) {
        const existingUser = await storage.getUserByUsername(updates.username);
        if (existingUser) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      const updatedUser = await storage.updateUser(req.user!.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  });

  app.patch("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      // This would require implementing password verification in the storage layer
      // For now, return a placeholder response
      res.status(501).json({ error: "Password update not yet implemented" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
