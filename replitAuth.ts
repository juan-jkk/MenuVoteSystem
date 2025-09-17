// Simplified no-auth implementation: all routes are accessible without login
import type { Express, RequestHandler } from "express";

export function setupAuth(app: Express) {
  // no-op: no session or passport setup
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  // set a default anonymous user id so code expecting req.user.claims.sub works in routes
  // @ts-ignore
  req.user = { claims: { sub: 'anonymous' } };
  next();
};
