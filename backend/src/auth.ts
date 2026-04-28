import jwt, { JwtPayload } from "jsonwebtoken";
import type { AuthenticatedUser } from "./types/auth";

const AUTH_JWT_SECRET =
  process.env.AUTH_JWT_SECRET ?? "dev-only-secret-change-me";

export const verifyAuthToken = (token: string): AuthenticatedUser | null => {
  try {
    const decoded = jwt.verify(token, AUTH_JWT_SECRET) as JwtPayload & {
      sub?: string;
      username?: string;
      email?: string;
    };

    if (
      typeof decoded.sub !== "string" ||
      typeof decoded.username !== "string" ||
      typeof decoded.email !== "string"
    ) {
      return null;
    }

    return {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
    };
  } catch {
    return null;
  }
};
