import { WebSocket } from "ws";

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthenticatedSocket = WebSocket & {
  user: AuthenticatedUser;
};
