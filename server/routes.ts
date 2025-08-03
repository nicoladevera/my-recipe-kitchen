import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertRecipeSchema } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all recipes
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

  // Create new recipe
  app.post("/api/recipes", upload.single('photo'), async (req, res) => {
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

      const recipe = await storage.createRecipe(recipeData);
      res.status(201).json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create recipe" });
      }
    }
  });

  // Update recipe
  app.patch("/api/recipes/:id", upload.single('photo'), async (req, res) => {
    try {
      const updates = insertRecipeSchema.partial().parse(req.body);
      
      // If photo was uploaded, set the photo path
      if (req.file) {
        updates.photo = `/uploads/${req.file.filename}`;
      }

      const recipe = await storage.updateRecipe(req.params.id, updates);
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

  // Delete recipe
  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRecipe(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Add cooking log entry
  app.post("/api/recipes/:id/cooking-log", async (req, res) => {
    try {
      const { date, timestamp, notes, rating } = req.body;
      // Accept either 'timestamp' (new format) or 'date' (legacy format)
      const logTimestamp = timestamp || date;
      
      if (!logTimestamp || !notes || rating === undefined) {
        return res.status(400).json({ error: "Timestamp/date, notes, and rating are required" });
      }

      // Store as timestamp for new entries, maintain backward compatibility
      const logEntry = { timestamp: logTimestamp, notes, rating };
      const recipe = await storage.addCookingLog(req.params.id, logEntry);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to add cooking log" });
    }
  });

  // Remove cooking log entry
  app.delete("/api/recipes/:id/cooking-log/:index", async (req, res) => {
    try {
      const logIndex = parseInt(req.params.index, 10);
      if (isNaN(logIndex)) {
        return res.status(400).json({ error: "Invalid log index" });
      }

      const recipe = await storage.removeCookingLog(req.params.id, logIndex);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found or invalid log index" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove cooking log entry" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
