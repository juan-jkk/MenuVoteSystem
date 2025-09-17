import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp,
  boolean,
  integer,
  jsonb,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth - mandatory
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table for Replit Auth - mandatory
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["staff", "student"] }).notNull().default("student"),
  shift: varchar("shift", { enum: ["morning", "afternoon", "full-time"] }),
  studentId: varchar("student_id").unique(), // For student login
  birthDate: timestamp("birth_date"), // For student login
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  imageUrl: varchar("image_url"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voting sessions table
export const votingSessions = pgTable("voting_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shift: varchar("shift", { enum: ["morning", "afternoon", "both"] }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { enum: ["scheduled", "active", "ended"] }).notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session menu items (many-to-many)
export const sessionMenuItems = pgTable("session_menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => votingSessions.id, { onDelete: "cascade" }),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
});

// Votes table
export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull().references(() => votingSessions.id, { onDelete: "cascade" }),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  votes: many(votes),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  sessionMenuItems: many(sessionMenuItems),
  votes: many(votes),
}));

export const votingSessionsRelations = relations(votingSessions, ({ many }) => ({
  sessionMenuItems: many(sessionMenuItems),
  votes: many(votes),
}));

export const sessionMenuItemsRelations = relations(sessionMenuItems, ({ one }) => ({
  session: one(votingSessions, {
    fields: [sessionMenuItems.sessionId],
    references: [votingSessions.id],
  }),
  menuItem: one(menuItems, {
    fields: [sessionMenuItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  session: one(votingSessions, {
    fields: [votes.sessionId],
    references: [votingSessions.id],
  }),
  menuItem: one(menuItems, {
    fields: [votes.menuItemId],
    references: [menuItems.id],
  }),
}));

// Zod schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVotingSessionSchema = createInsertSchema(votingSessions).omit({ id: true, createdAt: true });
export const insertVoteSchema = createInsertSchema(votes).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertVotingSession = z.infer<typeof insertVotingSessionSchema>;
export type VotingSession = typeof votingSessions.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
