import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertMenuItemSchema, insertVotingSessionSchema, insertVoteSchema } from "@shared/schema";

// Simple in-memory rate limiter for student login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // Maximum attempts per window

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);

  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > attempts.resetTime) {
    // Reset window
    loginAttempts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return false; // Rate limited
  }

  attempts.count++;
  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - integration with javascript_log_in_with_replit blueprint
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Student login route (alternative to OAuth)
  app.post('/api/auth/student-login', async (req, res) => {
    try {
      const { studentId, birthDate } = req.body;
      
      if (!studentId || !birthDate) {
        return res.status(400).json({ message: "Student ID and birth date required" });
      }

      // Rate limiting check using IP + studentId to prevent abuse
      const identifier = `${req.ip}-${studentId}`;
      if (!checkRateLimit(identifier)) {
        return res.status(429).json({ 
          message: "Too many login attempts. Please try again in 15 minutes." 
        });
      }

      const user = await storage.getUserByStudentCredentials(studentId, new Date(birthDate));
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session for student
      req.login({ claims: { sub: user.id } }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Menu item routes
  app.get('/api/menu-items', async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post('/api/menu-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Staff access required" });
      }

      const validatedData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(validatedData);
      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.put('/api/menu-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Staff access required" });
      }

      const { id } = req.params;
      const updates = req.body;
      const menuItem = await storage.updateMenuItem(id, updates);
      res.json(menuItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  app.delete('/api/menu-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Staff access required" });
      }

      const { id } = req.params;
      await storage.deleteMenuItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Voting session routes
  app.get('/api/voting-sessions', async (req, res) => {
    try {
      const sessions = await storage.getVotingSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching voting sessions:", error);
      res.status(500).json({ message: "Failed to fetch voting sessions" });
    }
  });

  app.get('/api/voting-sessions/active', async (req, res) => {
    try {
      const sessions = await storage.getActiveVotingSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });

  app.post('/api/voting-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Staff access required" });
      }

      const validatedData = insertVotingSessionSchema.parse(req.body);
      const session = await storage.createVotingSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating voting session:", error);
      res.status(500).json({ message: "Failed to create voting session" });
    }
  });

  // Vote routes
  app.post('/api/votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'student') {
        return res.status(403).json({ message: "Student access required" });
      }

      const { sessionId, menuItemId } = req.body;
      
      // Check if user already voted in this session
      const existingVotes = await storage.getUserVotes(userId, sessionId);
      if (existingVotes.length > 0) {
        return res.status(400).json({ message: "Already voted in this session" });
      }

      const voteData = insertVoteSchema.parse({
        userId,
        sessionId,
        menuItemId
      });
      
      const vote = await storage.createVote(voteData);
      res.status(201).json(vote);
    } catch (error) {
      console.error("Error creating vote:", error);
      res.status(500).json({ message: "Failed to create vote" });
    }
  });

  app.get('/api/votes/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const votes = await storage.getVotesBySession(sessionId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching votes:", error);
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
