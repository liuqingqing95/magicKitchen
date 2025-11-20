import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type Phase = "ready" | "playing" | "ended";

interface GameState {
  blocksCount: number;
  blocksSeed: number;
  startTime: number;
  endTime: number;
  phase: Phase;
  start: () => void;
  restart: () => void;
  end: () => void;
}

export default create<GameState>()(
  subscribeWithSelector((set) => {
    return {
      blocksCount: 2,
      blocksSeed: 0,
      startTime: 0,
      endTime: 0,
      phase: "ready",

      start: () => {
        set((state) => {
          if (state.phase === "ready") {
            return { phase: "playing", startTime: Date.now() };
          }
          return {};
        });
      },

      restart: () => {
        set((state) => {
          if (state.phase === "playing" || state.phase === "ended") {
            return { phase: "ready", blocksSeed: Math.random() };
          }
          return {};
        });
      },

      end: () => {
        set((state) => {
          if (state.phase === "playing") {
            return { phase: "ended", endTime: Date.now() };
          }
          return {};
        });
      },
    };
  })
);
