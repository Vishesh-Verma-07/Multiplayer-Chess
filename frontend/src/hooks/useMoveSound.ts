import { useCallback, useEffect, useRef } from "react";

const MOVE_SOUND_URL = "/sounds/chessMove.mp3";

export function useMoveSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(MOVE_SOUND_URL);
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const playMoveSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay blocked; the user gesture is required before this is called.
    });
  }, []);

  return { playMoveSound };
}