import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  TOKEN_STORAGE_KEY,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "./authClient";

type AuthContextValue = {
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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const result = await getCurrentUser(token);
        setUser(result.user);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token]);

  const saveSession = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (identifier: string, password: string) => {
    const response = await loginUser({ identifier, password });
    saveSession(response.token, response.user);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const response = await registerUser({ username, email, password });
    saveSession(response.token, response.user);
  };

  const logout = async () => {
    const currentToken = token;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);

    if (currentToken) {
      await logoutUser(currentToken);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};
