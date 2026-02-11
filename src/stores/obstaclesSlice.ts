import { IFoodWithRef, TPLayerId } from "@/types/level";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ObstacleInfo = IFoodWithRef;

type ObstaclesState = {
  obstacles: Record<string, ObstacleInfo>;
  grabOnFurniture: { [key: string]: string };
  dirtyPlates: string[];
  cleanPlates: string[];
  tempGrabOnFurniture: { [key: string]: string };
  registryGrab: boolean;
  // 多玩家高亮物品列表：每个玩家对应一个高亮物品数组
  highlightedGrab: Record<TPLayerId, ObstacleInfo[]>;
  // 多玩家高亮物品：每个玩家对应一个高亮物品
  realHighLight: Record<TPLayerId, ObstacleInfo | false>;
};

const initialState: ObstaclesState = {
  obstacles: {},
  grabOnFurniture: {},
  tempGrabOnFurniture: {},
  registryGrab: false,
  highlightedGrab: {
    firstPlayer: [],
    secondPlayer: [],
  },
  realHighLight: {
    firstPlayer: false,
    secondPlayer: false,
  },
  dirtyPlates: [],
  cleanPlates: [],
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
    unregisterObstacle(
      state,
      action: PayloadAction<{ handle: string; playerId?: TPLayerId }>,
    ) {
      const { handle, playerId } = action.payload;
      delete state.obstacles[handle];
      // 从所有玩家的高亮列表中移除
      if (playerId) {
        state.highlightedGrab[playerId] = state.highlightedGrab[
          playerId
        ].filter((g) => g.id !== handle);
      } else {
        Object.keys(state.highlightedGrab).forEach((key: string) => {
          state.highlightedGrab[key as TPLayerId] = state.highlightedGrab[
            key as TPLayerId
          ].filter((g) => g.id !== handle);
        });
      }

      delete state.grabOnFurniture[handle];
    },
    setRealHighlight(
      state,
      action: PayloadAction<{ playerId: TPLayerId; id: string | false }>,
    ) {
      const { playerId, id } = action.payload;
      if (id === false) {
        state.realHighLight[playerId] = false;
      } else {
        state.realHighLight[playerId] = state.obstacles[id] || false;
      }
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
      Object.keys(state.highlightedGrab).forEach((key: string) => {
        state.highlightedGrab[key as TPLayerId] = [];
      });

      state.grabOnFurniture = {};
    },
    setGrabOnFurniture(
      state,
      action: PayloadAction<{
        furnitureId: string;
        obstacleId: string;
        temp?: boolean;
      }>,
    ) {
      const { furnitureId, obstacleId, temp = false } = action.payload;

      if (temp) {
        state.tempGrabOnFurniture[furnitureId] = obstacleId;
      } else {
        state.grabOnFurniture[furnitureId] = obstacleId;
      }
    },
    removeGrabOnFurniture(
      state,
      action: PayloadAction<{ furnitureId: string; temp?: boolean }>,
    ) {
      const { furnitureId, temp = false } = action.payload;
      if (temp) {
        delete state.tempGrabOnFurniture[furnitureId];
      } else {
        delete state.grabOnFurniture[furnitureId];
      }
    },
    setRegistry(state, action: PayloadAction<{ registered: boolean }>) {
      state.registryGrab = action.payload.registered;
    },
    setHighlightedGrab(
      state,
      action: PayloadAction<{ playerId: TPLayerId; id: string; add: boolean }>,
    ) {
      const { playerId, id, add } = action.payload;
      const playerList = state.highlightedGrab[playerId];
      if (add) {
        const g = state.obstacles[id];
        if (g && !playerList.find((x) => x.id === id)) {
          state.highlightedGrab[playerId] = [...playerList, g];
        }
      } else {
        state.highlightedGrab[playerId] = playerList.filter((x) => x.id !== id);
      }
    },

    setDirtyPlates(state, action: PayloadAction<string[]>) {
      state.dirtyPlates = [...state.dirtyPlates, ...action.payload];
    },
    removeDirtyPlate(state) {
      const id = state.dirtyPlates.length ? state.dirtyPlates[0] : null;
      if (id) {
        state.cleanPlates = [...state.cleanPlates, id];
      }
      state.dirtyPlates = state.dirtyPlates.slice(1);
    },
    removeCleanPlate(state) {
      state.cleanPlates = state.cleanPlates.slice(0, -1);
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
  setDirtyPlates,
  removeDirtyPlate,
  removeCleanPlate,
} = slice.actions;

export default slice.reducer;
