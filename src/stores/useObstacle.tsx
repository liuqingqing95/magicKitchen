import { EGrabType, IGrabPosition } from '@/types/level';
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type ObstacleInfo = IGrabPosition & {
  rotation?: [number, number, number, number];
};

interface ObstacleStore {
  // 状态
  obstacles: Map<number, ObstacleInfo>;

  // 动作
  registerObstacle: (handle: number, info: ObstacleInfo) => void;
  unregisterObstacle: (handle: number) => void;
  updateObstaclePosition: (
    handle: number,
    position: [number, number, number],
    rotation?: [number, number, number, number]
  ) => void;
  clearObstacles: () => void;

  // 查询
  isObstacleHandle: (handle: number) => boolean;
  getObstacleInfo: (handle: number) => ObstacleInfo | undefined;
  getAllObstacles: () => ObstacleInfo[];
  getObstaclesByType: (type: EGrabType) => ObstacleInfo[];
  getObstacleCount: () => number;
}

export const useObstacleStore = create<ObstacleStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    obstacles: new Map(),

    // 注册障碍物
    registerObstacle: (handle: number, info: ObstacleInfo) => {
      set((state) => {
        const newObstacles = new Map(state.obstacles);
        newObstacles.set(handle, info);
        return { obstacles: newObstacles };
      });
    },

    // 注销障碍物
    unregisterObstacle: (handle: number) => {
      set((state) => {
        const newObstacles = new Map(state.obstacles);
        newObstacles.delete(handle);
        return { obstacles: newObstacles };
      });
    },

    // 更新障碍物位置
    updateObstaclePosition: (
      handle: number,
      position: [number, number, number],
      rotation?: [number, number, number, number]
    ) => {
      set((state) => {
        const existing = state.obstacles.get(handle);
        if (!existing) {
          return state;
        }

        const newObstacles = new Map(state.obstacles);
        newObstacles.set(handle, { ...existing, position, rotation });
        return { obstacles: newObstacles };
      });
    },

    // 清空所有障碍物
    clearObstacles: () => {
      set({ obstacles: new Map() });
    },

    // 查询函数
    isObstacleHandle: (handle: number) => {
      return get().obstacles.has(handle);
    },

    getObstacleInfo: (handle: number) => {
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
  }))
);
