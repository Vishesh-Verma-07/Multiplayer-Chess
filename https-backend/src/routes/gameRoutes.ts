import { Router } from "express";
import {
  createGame,
  finishGame,
  getActiveGame,
  saveSnapshot,
} from "../controllers/gameController.js";

const router = Router();

router.get("/active/:userId", getActiveGame);
router.post("/", createGame);
router.post("/:gameId/snapshots", saveSnapshot);
router.post("/:gameId/finish", finishGame);

export { router as gameRoutes };
