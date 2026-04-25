import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { UserRecord } from "./types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SALT_ROUNDS = 10;

type CreateUserInput = {
  username: string;
  email: string;
  password: string;
};

const ensureUserFile = async (): Promise<void> => {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(USERS_FILE, "utf8");
  } catch {
    await writeFile(USERS_FILE, "[]", "utf8");
  }
};

const readUsers = async (): Promise<UserRecord[]> => {
  await ensureUserFile();
  const fileContents = await readFile(USERS_FILE, "utf8");

  try {
    const parsed = JSON.parse(fileContents) as UserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = async (users: UserRecord[]): Promise<void> => {
  await ensureUserFile();
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
};

export const findUserByEmail = async (
  email: string,
): Promise<UserRecord | null> => {
  const normalized = email.trim().toLowerCase();
  const users = await readUsers();
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
};

export const findUserByUsername = async (
  username: string,
): Promise<UserRecord | null> => {
  const normalized = username.trim().toLowerCase();
  const users = await readUsers();
  return (
    users.find((user) => user.username.toLowerCase() === normalized) ?? null
  );
};

export const findUserById = async (id: string): Promise<UserRecord | null> => {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
};

export const createUser = async ({
  username,
  email,
  password,
}: CreateUserInput): Promise<UserRecord> => {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser: UserRecord = {
    id: randomUUID(),
    username: username.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
};

export const verifyPassword = async (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, passwordHash);
};
