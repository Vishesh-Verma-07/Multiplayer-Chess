import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../services/auth/jwtAuth.js";
import type { AuthTokenPayload } from "../types/auth.js";

export type AuthenticatedLocals = {
  auth: AuthTokenPayload;
};

export const requireAuth = (
  req: Request,
  res: Response<unknown, AuthenticatedLocals>,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  res.locals.auth = payload;
  next();
};
