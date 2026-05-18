import "dotenv/config";
import { app } from "./app.js";
import { PORT } from "./config/env.js";

const server = app.listen(PORT, () => {
  console.log(`HTTPS backend listening on http://localhost:${PORT}`);
});

// const shutdown = (signal: NodeJS.Signals) => {
//   console.log(`${signal} received, shutting down HTTPS backend...`);
//   server.close(() => {
//     process.exit(0);
//   });
// };

// process.on("SIGINT", () => shutdown("SIGINT"));
// process.on("SIGTERM", () => shutdown("SIGTERM"));
