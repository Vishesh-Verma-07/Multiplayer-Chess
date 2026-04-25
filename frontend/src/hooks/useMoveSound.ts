import { useCallback, useEffect, useRef } from "react";

/**
 * A single shared AudioContext is reused across all calls.
 * Creating a new one per move is wasteful and can hit browser limits (~6 contexts).
 */
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!sharedContext || sharedContext.state === "closed") {
    const Ctor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    sharedContext = new Ctor();
  }

  return sharedContext;
}

export function useMoveSound() {
  /**
   * Track scheduled node stop times so we can defer context suspension
   * until the full sound (including delay tail) has finished.
   */
  const tailEndRef = useRef(0);
  const suspendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (suspendTimerRef.current) clearTimeout(suspendTimerRef.current);
    };
  }, []);

  const playMoveSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Browsers auto-suspend AudioContext until a user gesture.
    // Always resume before scheduling — it's a no-op if already running.
    const schedule = () => {
      const now = ctx.currentTime;

      // ─── Shared routing ───────────────────────────────────────────────────

      // Convolution-free "room" using two short delays panned slightly apart.
      // This gives width and a sense of a wooden surface without a full reverb.
      const delayL = ctx.createDelay(0.1);
      const delayR = ctx.createDelay(0.1);
      delayL.delayTime.value = 0.028;
      delayR.delayTime.value = 0.041;

      const delayGainL = ctx.createGain();
      const delayGainR = ctx.createGain();
      delayGainL.gain.value = 0.18; // capped well below 1 — no feedback loop risk
      delayGainR.gain.value = 0.14;

      const panL = ctx.createStereoPanner();
      const panR = ctx.createStereoPanner();
      panL.pan.value = -0.35;
      panR.pan.value = 0.35;

      const highPass = ctx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 90; // let the low-wood body through

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.85, now + 0.002);
      // Gentle overall fade so the tail doesn't hard-cut
      masterGain.gain.setValueAtTime(0.85, now + 0.09);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      // Dry signal path
      highPass.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Wet (delay) path — separate gain so it doesn't muddy the dry signal
      delayL.connect(delayGainL);
      delayR.connect(delayGainR);
      delayGainL.connect(panL);
      delayGainR.connect(panR);
      panL.connect(ctx.destination);
      panR.connect(ctx.destination);

      // Helper: route a source node into both dry and wet paths
      const route = (node: AudioNode) => {
        node.connect(highPass);
        node.connect(delayL);
        node.connect(delayR);
      };

      // ─── Layer 1: Attack tap ──────────────────────────────────────────────
      // Sharp triangle burst — the "click" of wood hitting wood.
      // Pitch sweeps down fast (600→280 Hz in 25ms) to mimic a knock, not a tone.

      const attackOsc = ctx.createOscillator();
      const attackGain = ctx.createGain();

      attackOsc.type = "triangle";
      attackOsc.frequency.setValueAtTime(480, now);         // was 600 — less shrill, still punchy
      attackOsc.frequency.exponentialRampToValueAtTime(260, now + 0.022);

      attackGain.gain.setValueAtTime(0.0001, now);
      attackGain.gain.exponentialRampToValueAtTime(0.65, now + 0.0015); // faster peak = more punch
      attackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      attackOsc.connect(attackGain);
      route(attackGain);
      attackOsc.start(now);
      attackOsc.stop(now + 0.03);

      // ─── Layer 2: Wood body resonance ────────────────────────────────────
      // Two detuned sine oscillators for the "hollow log" body resonance.
      // Slightly detuned from each other (190 Hz vs 198 Hz) for natural warmth.

      const bodyFreqs = [190, 198] as const;
      const bodyGains = [0.18, 0.12] as const;

      bodyFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + 0.1);

        // Delayed onset — the body resonates a few ms after the tap
        gain.gain.setValueAtTime(0.0001, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(bodyGains[i]!, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc.connect(gain);
        route(gain);
        osc.start(now + 0.004);
        osc.stop(now + 0.15);
      });

    };

    if (ctx.state === "suspended") {
      ctx.resume().then(schedule);
    } else {
      schedule();
    }
  }, []);

  return { playMoveSound };
}