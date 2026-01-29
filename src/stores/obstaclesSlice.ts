import { IFoodWithRef } from "@/types/level";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ObstacleInfo = IFoodWithRef;

type ObstaclesState = {
  obstacles: Record<string, ObstacleInfo>;
  grabOnFurniture: { [key: string]: string };
  registryGrab: boolean;
  highlightedGrab: ObstacleInfo[];
  realHighLight: ObstacleInfo | false;
};

const initialState: ObstaclesState = {
  obstacles: {},
  grabOnFurniture: {},
  registryGrab: false,
  highlightedGrab: [],
  realHighLight: false,
};

const slice = createSlice({
  name: "grab",
  initialState,
  reducers: {
    registerObstacle(
      state,
      action: PayloadAction<{ handle: string; info: ObstacleInfo }>,
    ) {
      const { handle, info } = action.payload;
      if (!state.obstacles[handle]) state.obstacles[handle] = info;
    },
    unregisterObstacle(state, action: PayloadAction<{ handle: string }>) {
      const { handle } = action.payload;
      delete state.obstacles[handle];
      state.highlightedGrab = state.highlightedGrab.filter(
        (g) => g.id !== handle,
      );
      delete state.grabOnFurniture[handle];
    },
    setRealHighlight(state, action: PayloadAction<string | false>) {
      if (action.payload === false) state.realHighLight = false;
      else state.realHighLight = state.obstacles[action.payload] || false;
    },
    updateObstacleInfo(
      state,
      action: PayloadAction<{ handle: string; updates: Partial<ObstacleInfo> }>,
    ) {
      const { handle, updates } = action.payload;
      const existing = state.obstacles[handle];
      if (existing)
        state.obstacles[handle] = { ...existing, ...updates } as ObstacleInfo;
    },
    clearObstacles(state) {
      state.obstacles = {};
      state.highlightedGrab = [];
      state.grabOnFurniture = {};
    },
    setGrabOnFurniture(
      state,
      action: PayloadAction<{
        furnitureId: string;
        obstacleId: string;
      }>,
    ) {
      const { furnitureId, obstacleId } = action.payload;
      // if (!state.grabOnFurniture[furnitureId]) {
      state.grabOnFurniture[furnitureId] = obstacleId;
      // }
    },
    removeGrabOnFurniture(
      state,
      action: PayloadAction<{ furnitureId: string }>,
    ) {
      const { furnitureId } = action.payload;
      delete state.grabOnFurniture[furnitureId];
      // const arr = state.grabOnFurniture[furnitureId] || [];
      // state.grabOnFurniture[furnitureId] = arr.filter((i) => i.id !== grabId);
    },
    setRegistry(state, action: PayloadAction<{ registered: boolean }>) {
      state.registryGrab = action.payload.registered;
    },
    setHighlightedGrab(
      state,
      action: PayloadAction<{ id: string; add: boolean }>,
    ) {
      const { id, add } = action.payload;
      if (add) {
        const g = state.obstacles[id];
        if (g && !state.highlightedGrab.find((x) => x.id === id))
          state.highlightedGrab.push(g);
      } else {
        state.highlightedGrab = state.highlightedGrab.filter(
          (x) => x.id !== id,
        );
      }
    },
    removeHighlightedById(state, action: PayloadAction<{ id: string }>) {
      state.highlightedGrab = state.highlightedGrab.filter(
        (x) => x.id !== action.payload.id,
      );
    },
  },
});

export const {
  registerObstacle,
  unregisterObstacle,
  setRealHighlight,
  updateObstacleInfo,
  clearObstacles,
  setGrabOnFurniture,
  removeGrabOnFurniture,
  setRegistry,
  setHighlightedGrab,
  removeHighlightedById,
} = slice.actions;

export default slice.reducer;
