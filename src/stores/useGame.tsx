import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// type Phase = "ready" | "playing" | "ended";

interface GameState {
  canvasPosition?: [number, number, number];
  // blocksCount: number;
  // blocksSeed: number;
  // startTime: number;
  // endTime: number;
  // phase: Phase;
  setCanvasPosition: (position: [number, number, number]) => void;
  // restart: () => void;
  // end: () => void;
}

export default create<GameState>()(
  subscribeWithSelector((set) => {
    return {
      canvasPosition: [1, 15, 10],

      // blocksCount: 2,
      // blocksSeed: 0,
      // startTime: 0,
      // endTime: 0,
      // phase: "ready",
      setCanvasPosition: (position: [number, number, number]) => {
        set({ canvasPosition: position });
      },
      // start: () => {
      //   set((state) => {
      //     if (state.phase === "ready") {
      //       return { phase: "playing", startTime: Date.now() };
      //     }
      //     return {};
      //   });
      // },

      // restart: () => {
      //   set((state) => {
      //     if (state.phase === "playing" || state.phase === "ended") {
      //       return { phase: "ready", blocksSeed: Math.random() };
      //     }
      //     return {};
      //   });
      // },

      // end: () => {
      //   set((state) => {
      //     if (state.phase === "playing") {
      //       return { phase: "ended", endTime: Date.now() };
      //     }
      //     return {};
      //   });
      // },
    };
  })
);
