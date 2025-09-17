
/*
 Simple file-based storage to avoid external DB complexity.
 Stores users, menuItems, votingSessions and votes in a JSON file persisted to disk.
 This satisfies the requirement of a clean DB at start and keeps data between restarts in Docker.
*/
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), "data.json");

function load() {
  try {
    const txt = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(txt);
  } catch (e) {
    return { users: [], menuItems: [], votingSessions: [], votes: [], sessionMenuItems: [] };
  }
}

function save(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

class Storage {
  data: any;
  constructor() {
    this.data = load();
  }

  // Users
  async getUser(id: string) {
    return this.data.users.find((u: any) => u.id === id) || null;
  }

  async getUserByStudentCredentials(studentId: string, password: string) {
    // for simplicity, student login is matched by studentId and password stored in user.studentPassword
    return this.data.users.find((u: any) => u.studentId === studentId && u.studentPassword === password) || null;
  }

  async upsertUser(user: any) {
    if (!user.id) {
      user.id = uuidv4();
      this.data.users.push(user);
    } else {
      const idx = this.data.users.findIndex((u: any) => u.id === user.id);
      if (idx !== -1) this.data.users[idx] = { ...this.data.users[idx], ...user };
      else this.data.users.push(user);
    }
    save(this.data);
    return user;
  }

  // Menu items
  async getMenuItems() {
    return this.data.menuItems;
  }

  async createMenuItem(item: any) {
    item.id = uuidv4();
    item.createdAt = new Date().toISOString();
    this.data.menuItems.push(item);
    save(this.data);
    return item;
  }

  async deleteMenuItem(id: string) {
    this.data.menuItems = this.data.menuItems.filter((m: any) => m.id !== id);
    // also remove from sessionMenuItems
    this.data.sessionMenuItems = this.data.sessionMenuItems.filter((s: any) => s.menuItemId !== id);
    save(this.data);
    return true;
  }

  async updateMenuItem(id: string, partial: any) {
    const idx = this.data.menuItems.findIndex((m: any) => m.id === id);
    if (idx === -1) throw new Error('Not found');
    this.data.menuItems[idx] = { ...this.data.menuItems[idx], ...partial };
    save(this.data);
    return this.data.menuItems[idx];
  }

  // Voting sessions
  async getVotingSessions() {
    return this.data.votingSessions;
  }

  async getActiveVotingSessions() {
    return this.data.votingSessions.filter((s: any) => s.status === 'active');
  }

  async createVotingSession(session: any) {
    session.id = uuidv4();
    session.createdAt = new Date().toISOString();
    this.data.votingSessions.push(session);
    save(this.data);
    return session;
  }

  async updateVotingSession(id: string, partial: any) {
    const idx = this.data.votingSessions.findIndex((s: any) => s.id === id);
    if (idx === -1) throw new Error('Not found');
    this.data.votingSessions[idx] = { ...this.data.votingSessions[idx], ...partial };
    save(this.data);
    return this.data.votingSessions[idx];
  }

  // Votes
  async createVote(vote: any) {
    vote.id = uuidv4();
    vote.createdAt = new Date().toISOString();
    this.data.votes.push(vote);
    save(this.data);
    return vote;
  }

  async getVotesBySession(sessionId: string) {
    return this.data.votes.filter((v: any) => v.sessionId === sessionId);
  }

  async getUserVotes(userId: string) {
    return this.data.votes.filter((v: any) => v.userId === userId);
  }
}

export const storage = new Storage();
