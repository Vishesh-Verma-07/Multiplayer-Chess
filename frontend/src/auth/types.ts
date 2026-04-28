export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

export type AuthSuccessResponse = {
  token: string;
  expiresIn: string;
  user: AuthUser;
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};
