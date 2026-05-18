import cors from "cors";
import express from "express";
import { FRONTEND_ORIGIN } from "./config/env.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use("/api", apiRouter);

export { app };
