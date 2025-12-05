import { EFurnitureType, EGrabType, IGrabPosition } from "@/types/level";
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
  grabOnFurniture: Map<string, { id: string; type: EGrabType }[]>;
  registryFurniture: boolean;
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
  getGrabOnFurniture: (
    furnitureId: string
  ) => { id: string; type: EGrabType }[];
  setGrabOnFurniture: (
    furnitureId: string,
    items: { id: string; type: EGrabType }[]
  ) => void;
  removeGrabOnFurniture: (furnitureId: string, grabId: string) => void;
  getAllGrabOnFurniture: () => { id: string; type: EGrabType }[][];
  setRegistryFurniture: (registered: boolean) => void;
}

export const useObstacleStore = create<ObstacleStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    obstacles: new Map(),
    grabOnFurniture: new Map(),
    registryFurniture: false,

    // 注册障碍物
    registerObstacle: (handle: number | string, info: ObstacleInfo) => {
      set((state) => {
        // 检查是否已经注册
        if (state.obstacles.has(handle)) {
          return state; // 如果已存在，直接返回当前状态
        }

        const newObstacles = new Map(state.obstacles);
        newObstacles.set(handle, info);
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
        newObstacles.set(handle, {
          ...existing,
          position,
          rotation,
        } as IGrabPosition);
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

    getGrabOnFurniture: (furnitureId: string) => {
      return get().grabOnFurniture.get(furnitureId) || [];
    },

    setGrabOnFurniture: (
      furnitureId: string,
      items: { id: string; type: EGrabType }[]
    ) => {
      set((state) => {
        const newGrabOnFurniture = new Map(state.grabOnFurniture);
        newGrabOnFurniture.set(furnitureId, items);
        return { grabOnFurniture: newGrabOnFurniture };
      });
    },
    removeGrabOnFurniture: (furnitureId: string, grabId: string) => {
      set((state) => {
        const newGrabOnFurniture = new Map(state.grabOnFurniture);
        const items = newGrabOnFurniture.get(furnitureId) || [];
        newGrabOnFurniture.set(
          furnitureId,
          items.filter((item) => item.id !== grabId)
        );
        return { grabOnFurniture: newGrabOnFurniture };
      });
    },
    getAllGrabOnFurniture: () => {
      return Array.from(get().grabOnFurniture.values());
    },
    setRegistryFurniture: (registered: boolean) => {
      set({ registryFurniture: registered });
    },
  }))
);
