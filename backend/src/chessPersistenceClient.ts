import type {
  ActivePersistedGame,
  CreatePersistedGameInput,
  FinishPersistedGameInput,
  SaveBoardSnapshotInput,
} from "./types/persistence";

const PERSISTENCE_BACKEND_URL =
  process.env.HTTPS_BACKEND_URL ??
  process.env.PERSISTENCE_BACKEND_URL ??
  "http://localhost:8000";

const requestJson = async <T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<T> => {
  const response = await fetch(new URL(path, PERSISTENCE_BACKEND_URL), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({
    error: "Invalid JSON response from persistence backend.",
  }));

  if (!response.ok) {
    throw new Error(data.error ?? "Persistence backend request failed.");
  }

  return data as T;
};

export const createPersistedGame = async (
  input: CreatePersistedGameInput,
): Promise<{ id: string }> => {
  return requestJson<{ id: string }>("/games", "POST", input);
};

export const saveBoardSnapshot = async (
  input: SaveBoardSnapshotInput,
): Promise<void> => {
  await requestJson(`/games/${input.gameId}/snapshots`, "POST", input);
};

export const finishPersistedGame = async (
  input: FinishPersistedGameInput,
): Promise<void> => {
  await requestJson(`/games/${input.gameId}/finish`, "POST", input);
};

export const getActivePersistedGameForUser = async (
  userId: string,
): Promise<ActivePersistedGame | null> => {
  const response = await requestJson<{ game: ActivePersistedGame | null }>(
    `/games/active/${userId}`,
    "GET",
  );

  return response.game;
};
