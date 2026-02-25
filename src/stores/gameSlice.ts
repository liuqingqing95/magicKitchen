import { EFoodType } from "@/types/level";
import { Burger } from "@/types/public";
import { ProgressUpdate } from "@/workers/progressWorker";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GameState {
  canvasPosition: [number, number, number];
  target: [number, number, number];
  score: number;
  burgers: Burger[];
  phase: "ready" | "playing" | "ended";
  startTime: number;
  endTime: number;
  receiveFood: boolean;
}

const initialState: GameState = {
  // canvasPosition: [7, 15, 2],
  canvasPosition: [0, 15, 22],
  target: [-6, 0, 7],
  score: 0,
  burgers: [],
  phase: "ready",
  startTime: 0,
  endTime: 0,
  receiveFood: false,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setCanvasPosition(state, action: PayloadAction<[number, number, number]>) {
      state.canvasPosition = action.payload;
    },
    setControlsTarget(state, action: PayloadAction<[number, number, number]>) {
      state.target = action.payload;
    },
    updateBurgerTime(state, action: PayloadAction<ProgressUpdate[]>) {
      state.burgers = state.burgers.map((burger) => {
        const u = action.payload.find((x) => x.label === burger.label);
        return u
          ? {
              ...burger,
              timeLeft: u.timeLeftSec,
              isActive: u.isActive,
              progressPercentage: u.progress,
            }
          : burger;
      });
    },
    setBurgers(state, action: PayloadAction<Burger[]>) {
      state.burgers = [...state.burgers, ...action.payload];
    },
    removeBurger(state, action: PayloadAction<string>) {
      state.burgers = state.burgers.filter((b) => b.label !== action.payload);
    },
    setReceiveFood(state, action: PayloadAction<boolean>) {
      state.receiveFood = action.payload;
    },
    setScore(state, action: PayloadAction<EFoodType[]>) {
      const wanted = action.payload;
      if (!wanted || wanted.length === 0) return; // guard empty payload

      state.receiveFood = true;

      const arr = state.burgers.filter(
        (item) =>
          Array.isArray(item.materials) &&
          wanted.every((w) => item.materials.includes(w)),
      );

      if (arr.length === 0) return;

      const min = arr.reduce((a, b) =>
        (a.progressPercentage ?? Infinity) <= (b.progressPercentage ?? Infinity)
          ? a
          : b,
      );

      state.score = state.score + (min.score ?? 0);
    },
    start(state) {
      state.phase = "playing";
      state.startTime = Date.now();
      state.endTime = 0;
    },
    end(state) {
      state.phase = "ended";
      state.endTime = Date.now();
    },
    restart(state) {
      state.phase = "ready";
      state.startTime = 0;
      state.endTime = 0;
      state.burgers = [];
      state.score = 0;
    },
  },
});

export const {
  setCanvasPosition,
  setControlsTarget,
  updateBurgerTime,
  setBurgers,
  setScore,
  start,
  end,
  setReceiveFood,
  removeBurger,
  restart,
} = gameSlice.actions;

export default gameSlice.reducer;
