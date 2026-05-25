export type ActiveGameSummary = {
  gameId: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  whiteUsername: string | null;
  blackUsername: string | null;
  movesCount: number;
  lastMoveAt: string | null;
  startedAt: string | null;
};

const HTTPS_BACKEND_URL =
  import.meta.env.VITE_HTTPS_BACKEND_URL ?? "http://localhost:8000";

const assertJsonResponse = async (response: Response) => {
  const data = await response
    .json()
    .catch(() => ({ error: "Invalid JSON response." }));

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data;
};

export const listActiveGames = async (): Promise<ActiveGameSummary[]> => {
  const response = await fetch(`${HTTPS_BACKEND_URL}/api/games/active`);
  const data = await assertJsonResponse(response);
  return data.games ?? [];
};
