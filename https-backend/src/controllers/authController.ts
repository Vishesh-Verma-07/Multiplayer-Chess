import type { Request, Response } from "express";
import {
  AUTH_TOKEN_EXPIRES_IN,
  createAuthToken,
  sanitizeAuthUser,
} from "../services/auth/jwtAuth.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  verifyPassword,
} from "../services/users/userStore.js";
import type { LoginBody, RegisterBody } from "../types/http.js";
import type { AuthenticatedLocals } from "../middleware/auth.js";
import { isValidEmail } from "../utils/validation.js";

export const register = async (
  req: Request<unknown, unknown, RegisterBody>,
  res: Response,
) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!username || username.length < 3 || username.length > 20) {
    res
      .status(400)
      .json({ error: "Username must be between 3 and 20 characters." });
    return;
  }

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  if (!password || password.length < 8 || password.length > 72) {
    res
      .status(400)
      .json({ error: "Password must be between 8 and 72 characters." });
    return;
  }

  const existingEmailUser = await findUserByEmail(email);
  if (existingEmailUser) {
    res
      .status(409)
      .json({ error: "An account with this email already exists." });
    return;
  }

  const existingUsernameUser = await findUserByUsername(username);
  if (existingUsernameUser) {
    res.status(409).json({ error: "This username is already taken." });
    return;
  }

  const user = await createUser({ username, email, password });
  const token = createAuthToken(user);

  res.status(201).json({
    token,
    expiresIn: AUTH_TOKEN_EXPIRES_IN,
    user: sanitizeAuthUser(user),
  });
};

export const login = async (
  req: Request<unknown, unknown, LoginBody>,
  res: Response,
) => {
  const identifier = req.body.identifier?.trim().toLowerCase();
  const password = req.body.password;

  if (!identifier || !password) {
    res.status(400).json({ error: "Identifier and password are required." });
    return;
  }

  const userByEmail = await findUserByEmail(identifier);
  const user = userByEmail ?? (await findUserByUsername(identifier));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = createAuthToken(user);
  res.status(200).json({
    token,
    expiresIn: AUTH_TOKEN_EXPIRES_IN,
    user: sanitizeAuthUser(user),
  });
};

export const getMe = async (
  _req: Request,
  res: Response<unknown, AuthenticatedLocals>,
) => {
  const userById = await findUserById(res.locals.auth.sub);
  if (!userById) {
    res.status(401).json({ error: "Account no longer exists." });
    return;
  }

  res.status(200).json({ user: sanitizeAuthUser(userById) });
};

export const logout = (_req: Request, res: Response) => {
  // JWT auth is stateless. The client forgets the token on logout.
  res.status(200).json({ ok: true });
};
