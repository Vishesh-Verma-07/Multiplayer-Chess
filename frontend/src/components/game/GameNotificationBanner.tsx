import { GameNotification } from "./types";

type GameNotificationBannerProps = {
  gameNotification: GameNotification;
};

export const GameNotificationBanner = ({
  gameNotification,
}: GameNotificationBannerProps) => {
  if (!gameNotification) {
    return null;
  }

  return (
    <div
      className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
        gameNotification.tone === "critical"
          ? "border-rose-400/60 bg-rose-500/15 text-rose-100"
          : "border-amber-300/60 bg-amber-500/15 text-amber-100"
      }`}
    >
      {gameNotification.message}
    </div>
  );
};
