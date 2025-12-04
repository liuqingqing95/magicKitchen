import { EFurnitureType, EGrabType, IGrabPosition } from '@/types/level';
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface IFurniturePosition {
  id: string;
  position: [number, number, number];
  type: EFurnitureType;
  size: [number, number, number];
  rotation?: [number, number, number, number];
  isMovable: boolean;
  isFurniture: true;
}
export type ObstacleInfo = IGrabPosition | IFurniturePosition;

interface ObstacleStore {
  // 状态
  obstacles: Map<number | string, ObstacleInfo>;
  furnitureItems: Map<string, {id: string, type: EGrabType}[]>;
  
  // 动作
  registerObstacle: (handle: number | string, info: ObstacleInfo) => void;
  unregisterObstacle: (handle: number | string) => void;
  updateObstaclePosition: (
    handle: number | string,
    position: [number, number, number],
    rotation?: [number, number, number, number]
  ) => void;
  clearObstacles: () => void;

  // 查询
  isObstacleHandle: (handle: number | string) => boolean;
  getObstacleInfo: (handle: number | string) => ObstacleInfo | undefined;
  getAllObstacles: () => ObstacleInfo[];
  getObstaclesByType: (type: EGrabType) => ObstacleInfo[];
  getObstacleCount: () => number;
  getFurnitureItems: (furnitureId: string) => {id: string, type: EGrabType}[];
  setFurnitureItems: (furnitureId: string, items: {id: string, type: EGrabType}[]) => void;
}

export const useObstacleStore = create<ObstacleStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    obstacles: new Map(),
    furnitureItems: new Map(),

    // 注册障碍物
    registerObstacle: (handle: number | string, info: ObstacleInfo) => {
      set((state) => {
        const newObstacles = new Map(state.obstacles);
        newObstacles.set(handle, info);
        if (info.isFurniture === false) {
          state.setFurnitureItems(handle.toString(), []);
        }
        return { obstacles: newObstacles };
      });
    },

    // 注销障碍物
    unregisterObstacle: (handle: number | string) => {
      set((state) => {
        const newObstacles = new Map(state.obstacles);
        newObstacles.delete(handle);
        return { obstacles: newObstacles };
      });
    },

    // 更新障碍物位置
    updateObstaclePosition: (
      handle: number | string,
      position: [number, number, number],
      rotation?: [number, number, number, number]
    ) => {
      set((state) => {
        const existing = state.obstacles.get(handle);
        if (!existing) {
          return state;
        }

        const newObstacles = new Map(state.obstacles);
        newObstacles.set(handle, { ...existing, position, rotation } as IGrabPosition);
        return { obstacles: newObstacles };
      });
    },

    // 清空所有障碍物
    clearObstacles: () => {
      set({ obstacles: new Map() });
    },

    // 查询函数
    isObstacleHandle: (handle: number | string) => {
      return get().obstacles.has(handle);
    },

    getObstacleInfo: (handle: number | string) => {
      return get().obstacles.get(handle);
    },

    getAllObstacles: () => {
      return Array.from(get().obstacles.values());
    },

    getObstaclesByType: (type: EGrabType) => {
      return Array.from(get().obstacles.values()).filter(
        (obstacle) => obstacle.type === type
      );
    },

    getObstacleCount: () => {
      return get().obstacles.size;
    },

    getFurnitureItems: (furnitureId: string) => {
      return get().furnitureItems.get(furnitureId) || [];
    },
    
    setFurnitureItems: (furnitureId: string, items: {id: string, type: EGrabType}[]) => {
      set((state) => {
        const newFurnitureItems = new Map(state.furnitureItems);
        newFurnitureItems.set(furnitureId, items);
        return { furnitureItems: newFurnitureItems };
      });
    },
  }))
);
