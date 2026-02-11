import { EFoodType, EFurnitureType, TPLayerId } from "@/types/level";
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
  // 多玩家高亮ID：每个玩家对应一个高亮家具ID
  highlightIds: Record<TPLayerId, string | false>;
  obstacles: Record<string, IFurniturePosition>;
  registryFurniture: boolean;
  // 多玩家高亮家具列表：每个玩家对应一个高亮家具数组
  highlightedFurniture: Record<TPLayerId, IFurniturePosition[]>;
}

const initialState: FurnitureState = {
  highlightIds: {
    firstPlayer: false,
    secondPlayer: false,
  },
  obstacles: {},
  openFoodTable: {},
  registryFurniture: false,
  highlightedFurniture: {
    firstPlayer: [],
    secondPlayer: [],
  },
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
      // 从所有玩家的高亮列表中移除
      state.highlightedFurniture.firstPlayer =
        state.highlightedFurniture.firstPlayer.filter((f) => f.id !== handle);
      state.highlightedFurniture.secondPlayer =
        state.highlightedFurniture.secondPlayer.filter((f) => f.id !== handle);
    },
    clearObstacles: (state) => {
      state.obstacles = {};
      state.highlightedFurniture.firstPlayer = [];
      state.highlightedFurniture.secondPlayer = [];
    },
    setHighlightedFurniture: (
      state,
      action: PayloadAction<{ playerId: TPLayerId; id: string; add: boolean }>,
    ) => {
      const { playerId, id, add } = action.payload;
      const furniture = state.obstacles[id];
      const playerList = state.highlightedFurniture[playerId];
      if (add) {
        if (furniture && !playerList.find((f) => f.id === id)) {
          state.highlightedFurniture[playerId] = [...playerList, furniture];
        }
      } else {
        state.highlightedFurniture[playerId] = playerList.filter(
          (f) => f.id !== id,
        );
      }
    },
    removeHighlightedById: (
      state,
      action: PayloadAction<{ playerId: TPLayerId; id: string }>,
    ) => {
      const { playerId, id } = action.payload;
      state.highlightedFurniture[playerId] = state.highlightedFurniture[
        playerId
      ].filter((f) => f.id !== id);
    },
    setHighlightId: (
      state,
      action: PayloadAction<{ playerId: TPLayerId; id: string | false }>,
    ) => {
      state.highlightIds[action.payload.playerId] = action.payload.id;
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
