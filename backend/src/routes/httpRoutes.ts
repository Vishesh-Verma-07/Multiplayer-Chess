import type { IncomingMessage, ServerResponse } from "http";
import { handleHealthRequest } from "../controllers/healthController";

export const handleHttpRequest = (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  if (handleHealthRequest(req, res)) {
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
};
