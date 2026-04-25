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

export const TOKEN_STORAGE_KEY = "chess_auth_token";

const HTTPS_BACKEND_URL =
  import.meta.env.VITE_HTTPS_BACKEND_URL ?? "http://localhost:8000";

const assertJsonResponse = async (response: Response): Promise<any> => {
  const data = await response
    .json()
    .catch(() => ({ error: "Invalid JSON response." }));

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data;
};

export const registerUser = async (payload: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthSuccessResponse> => {
  const response = await fetch(`${HTTPS_BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return assertJsonResponse(response);
};

export const loginUser = async (payload: {
  identifier: string;
  password: string;
}): Promise<AuthSuccessResponse> => {
  const response = await fetch(`${HTTPS_BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return assertJsonResponse(response);
};

export const getCurrentUser = async (
  token: string,
): Promise<{ user: AuthUser }> => {
  const response = await fetch(`${HTTPS_BACKEND_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return assertJsonResponse(response);
};

export const logoutUser = async (token: string): Promise<void> => {
  await fetch(`${HTTPS_BACKEND_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {
    // Ignore network errors for local token cleanup.
  });
};
