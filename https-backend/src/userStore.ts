import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import type { UserRecord } from "./types.js";

const SALT_ROUNDS = 10;

type CreateUserInput = {
  username: string;
  email: string;
  password: string;
};

const toUserRecord = (user: {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}): UserRecord => ({
  id: user.id,
  username: user.username,
  email: user.email,
  passwordHash: user.passwordHash,
  createdAt: user.createdAt.toISOString(),
});

export const findUserByEmail = async (
  email: string,
): Promise<UserRecord | null> => {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  return user ? toUserRecord(user) : null;
};

export const findUserByUsername = async (
  username: string,
): Promise<UserRecord | null> => {
  const normalized = username.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalized,
        mode: "insensitive",
      },
    },
  });

  return user ? toUserRecord(user) : null;
};

export const findUserById = async (id: string): Promise<UserRecord | null> => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUserRecord(user) : null;
};

export const createUser = async ({
  username,
  email,
  password,
}: CreateUserInput): Promise<UserRecord> => {
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    },
  });

  return toUserRecord(user);
};

export const verifyPassword = async (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, passwordHash);
};
