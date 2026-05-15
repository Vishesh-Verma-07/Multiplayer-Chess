import type { IncomingMessage, ServerResponse } from "http";

export const handleHealthRequest = (
  req: IncomingMessage,
  res: ServerResponse,
): boolean => {
  if (req.method === "GET" && req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "chess-backend",
        uptime: process.uptime(),
      }),
    );
    return true;
  }

  return false;
};
