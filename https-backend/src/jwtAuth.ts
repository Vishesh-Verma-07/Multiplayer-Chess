import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload, SafeUser, UserRecord } from "./types.js";

const AUTH_JWT_SECRET =
  process.env.AUTH_JWT_SECRET ?? "dev-only-secret-change-me";
export const AUTH_TOKEN_EXPIRES_IN = "7d";

export const sanitizeAuthUser = (user: UserRecord): SafeUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
});

export const createAuthToken = (user: UserRecord): string => {
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, AUTH_JWT_SECRET, {
    expiresIn: AUTH_TOKEN_EXPIRES_IN,
  });
};

export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, AUTH_JWT_SECRET) as JwtPayload &
      AuthTokenPayload;

    if (
      typeof decoded.sub !== "string" ||
      typeof decoded.username !== "string" ||
      typeof decoded.email !== "string"
    ) {
      return null;
    }

    return {
      sub: decoded.sub,
      username: decoded.username,
      email: decoded.email,
    };
  } catch {
    return null;
  }
};
