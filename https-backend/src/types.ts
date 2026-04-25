export type UserRecord = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type SafeUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

export type AuthTokenPayload = {
  sub: string;
  username: string;
  email: string;
};
