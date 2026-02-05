import { EFoodType } from "@/types/level";
import { Burger } from "@/types/public";
import { ProgressUpdate } from "@/workers/progressWorker";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { intersection } from "lodash";

interface GameState {
  canvasPosition: [number, number, number];
  score: number;
  burgers: Burger[];
  phase: "ready" | "playing" | "ended";
  startTime: number;
  endTime: number;
}

const initialState: GameState = {
  canvasPosition: [1, 15, 10],
  score: 0,
  burgers: [],
  phase: "ready",
  startTime: 0,
  endTime: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setCanvasPosition(state, action: PayloadAction<[number, number, number]>) {
      state.canvasPosition = action.payload;
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
    setScore(state, action: PayloadAction<EFoodType[]>) {
      const arr = state.burgers.filter(
        (item) =>
          intersection(item.materials, action.payload).length ===
          action.payload.length,
      );
      const min =
        arr.length === 0
          ? undefined
          : arr.reduce((a, b) =>
              a.progressPercentage <= b.progressPercentage ? a : b,
            );
      if (min) {
        state.score = state.score + min.score;
      }
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
  updateBurgerTime,
  setBurgers,
  setScore,
  start,
  end,
  removeBurger,
  restart,
} = gameSlice.actions;

export default gameSlice.reducer;
