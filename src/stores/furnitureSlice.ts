import { EFoodType, EFurnitureType } from "@/types/level";
import { EDirection } from "@/types/public";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IFurniturePosition {
  id: string;
  position: [number, number, number];
  type: EFurnitureType;
  size: [number, number, number];
  rotateDirection?: EDirection;
  isMovable: boolean;
  foodType?: EFoodType;
}

interface FurnitureState {
  openFoodTable: Record<string, boolean>;
  highlightId: string | false;
  obstacles: Record<string, IFurniturePosition>;
  registryFurniture: boolean;
  highlightedFurniture: IFurniturePosition[];
}

const initialState: FurnitureState = {
  highlightId: false,
  obstacles: {},
  openFoodTable: {},
  registryFurniture: false,
  highlightedFurniture: [],
};

const furnitureSlice = createSlice({
  name: "furniture",
  initialState,
  reducers: {
    registerObstacle: (
      state,
      action: PayloadAction<{ handle: string; info: IFurniturePosition }>,
    ) => {
      const { handle, info } = action.payload;
      if (state.obstacles[handle]) return;
      state.obstacles = { ...state.obstacles, [handle]: info };
    },
    unregisterObstacle: (state, action: PayloadAction<string>) => {
      const handle = action.payload;
      const { [handle]: _removed, ...rest } = state.obstacles;
      state.obstacles = rest;
      state.highlightedFurniture = state.highlightedFurniture.filter(
        (f) => f.id !== handle,
      );
    },
    clearObstacles: (state) => {
      state.obstacles = {};
      state.highlightedFurniture = [];
    },
    setHighlightedFurniture: (
      state,
      action: PayloadAction<{ id: string; add: boolean }>,
    ) => {
      const { id, add } = action.payload;
      const furniture = state.obstacles[id];
      if (add) {
        if (furniture && !state.highlightedFurniture.find((f) => f.id === id)) {
          state.highlightedFurniture = [
            ...state.highlightedFurniture,
            furniture,
          ];
        }
      } else {
        state.highlightedFurniture = state.highlightedFurniture.filter(
          (f) => f.id !== id,
        );
      }
    },
    removeHighlightedById: (state, action: PayloadAction<string>) => {
      state.highlightedFurniture = state.highlightedFurniture.filter(
        (f) => f.id !== action.payload,
      );
    },
    setHighlightId: (state, action: PayloadAction<string | false>) => {
      state.highlightId = action.payload;
    },
    setRegistry: (state, action: PayloadAction<boolean>) => {
      state.registryFurniture = action.payload;
    },
    setOpenFoodTable: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.openFoodTable[id] = !state.openFoodTable[id];
    },
  },
});

export const {
  registerObstacle,
  unregisterObstacle,
  clearObstacles,
  setHighlightedFurniture,
  removeHighlightedById,
  setHighlightId,
  setRegistry,
  setOpenFoodTable,
} = furnitureSlice.actions;

export default furnitureSlice.reducer;
