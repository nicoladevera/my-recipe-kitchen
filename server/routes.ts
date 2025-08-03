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

  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  // Get user data by username (public)
  app.get("/api/users/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Return public user data (exclude sensitive fields)
      const { password, passwordResetToken, passwordResetExpires, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

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

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const success = await storage.updateUserPassword(req.user!.id, currentPassword, newPassword);
      if (!success) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Generate recipe images endpoint
  app.get("/api/generate-image/:recipe", (req, res) => {
    const recipe = req.params.recipe;
    const width = 400;
    const height = 300;
    
    // Create a simple SVG image based on recipe type
    let svg = '';
    let bgColor = '#8B4513';
    let title = '';
    
    switch(recipe) {
      case 'seafood-paella':
        bgColor = '#FFD700';
        title = 'Seafood Paella';
        svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#FFE55C;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DAA520;stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)"/>
          <circle cx="200" cy="150" r="120" fill="#CD853F" stroke="#8B4513" stroke-width="8"/>
          <circle cx="150" cy="120" r="15" fill="#FF6347"/>
          <circle cx="250" cy="140" r="15" fill="#FF6347"/>
          <circle cx="180" cy="180" r="12" fill="#90EE90"/>
          <circle cx="220" cy="170" r="12" fill="#90EE90"/>
          <path d="M160 100 Q200 80 240 100" stroke="#228B22" stroke-width="4" fill="none"/>
          <text x="200" y="280" text-anchor="middle" fill="#654321" font-family="serif" font-size="20" font-weight="bold">${title}</text>
        </svg>`;
        break;
      case 'chicken-parmesan':
        bgColor = '#CD853F';
        title = 'Chicken Parmesan';
        svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#F5DEB3;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DEB887;stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)"/>
          <ellipse cx="200" cy="150" rx="100" ry="60" fill="#D2691E"/>
          <ellipse cx="200" cy="150" rx="95" ry="55" fill="#FF6347"/>
          <ellipse cx="200" cy="145" rx="85" ry="45" fill="#FFFACD"/>
          <circle cx="170" cy="130" r="8" fill="#228B22"/>
          <circle cx="230" cy="140" r="8" fill="#228B22"/>
          <text x="200" y="280" text-anchor="middle" fill="#654321" font-family="serif" font-size="20" font-weight="bold">${title}</text>
        </svg>`;
        break;
      case 'beef-stroganoff':
        bgColor = '#8B4513';
        title = 'Beef Stroganoff';
        svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#F5F5DC;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#DDD;stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)"/>
          <ellipse cx="200" cy="160" rx="110" ry="50" fill="#A0522D"/>
          <ellipse cx="200" cy="155" rx="100" ry="45" fill="#F5F5DC"/>
          <rect x="150" y="130" width="15" height="30" fill="#8B4513" rx="2"/>
          <rect x="170" y="125" width="12" height="35" fill="#8B4513" rx="2"/>
          <rect x="185" y="135" width="18" height="25" fill="#8B4513" rx="2"/>
          <rect x="210" y="130" width="14" height="30" fill="#8B4513" rx="2"/>
          <rect x="230" y="128" width="16" height="32" fill="#8B4513" rx="2"/>
          <ellipse cx="175" cy="140" rx="12" ry="8" fill="#D2691E"/>
          <ellipse cx="220" cy="145" rx="10" ry="6" fill="#D2691E"/>
          <text x="200" y="280" text-anchor="middle" fill="#654321" font-family="serif" font-size="20" font-weight="bold">${title}</text>
        </svg>`;
        break;
      default:
        svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="200" y="150" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="16">Recipe Image</text>
        </svg>`;
    }
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
