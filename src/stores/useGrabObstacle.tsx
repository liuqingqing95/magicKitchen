import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  IGrabPosition,
} from "@/types/level";
import { EDirection } from "@/types/public";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface IFurniturePosition {
  id: string;
  position: [number, number, number];
  type: EFurnitureType;
  size: [number, number, number];
  rotateDirection?: EDirection;
  isMovable: boolean;
  isFurniture: true;
  foodType?: EFoodType;
}
export type ObstacleInfo = IGrabPosition | IFurniturePosition;

export interface ObstacleStore {
  // 状态
  obstacles: Map<string, ObstacleInfo>;
  grabOnFurniture: Map<string, { id: string; type: EGrabType | EFoodType }[]>;

  registryGrab: boolean;
  // 动作
  registerObstacle: (handle: string, info: ObstacleInfo) => void;
  unregisterObstacle: (handle: string, furnitureHighlightId?: string) => void;
  updateObstaclePosition: (
    handle: string,
    position: [number, number, number],
    rotation?: [number, number, number, number],
    opts?: { source?: "frame" | "manual"; lockMs?: number }
  ) => void;
  clearObstacles: () => void;
  updateObstacleInfo: (
    handle: string,
    { isCut, isCook }: { isCut?: boolean; isCook?: boolean }
  ) => void;
  // 查询
  isObstacleHandle: (handle: string) => boolean;
  getObstacleInfo: (handle: string) => ObstacleInfo | undefined;
  getAllObstacles: () => ObstacleInfo[];
  getObstaclesByType: (type: EGrabType | EFoodType) => ObstacleInfo[];
  getObstacleCount: () => number;
  getGrabOnFurniture: (
    furnitureId: string
  ) => { id: string; type: EGrabType | EFoodType }[];
  setGrabOnFurniture: (
    furnitureId: string,
    items: { id: string; type: EGrabType | EFoodType }[]
  ) => void;
  setRegistry: (registered: boolean, type: "furniture" | "grab") => void;
  realHighLight: ObstacleInfo | false;
  highlightedGrab: ObstacleInfo[];
  setRealHighlight: (id: string | false) => void;
  setHighlightedGrab: (id: string, add: boolean) => void;
  removeHighlightedById: (id: string) => void;
}

export const useGrabObstacleStore = create<ObstacleStore>()(
  subscribeWithSelector((set, get) => {
    return {
      // 初始状态
      obstacles: new Map(),
      grabOnFurniture: new Map(),
      registryGrab: false,
      highlightedGrab: [],
      realHighLight: false,
      // 注册障碍物
      registerObstacle: (handle: string, info: ObstacleInfo) => {
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
      unregisterObstacle: (handle: string) => {
        set((state) => {
          const newObstacles = new Map(state.obstacles);
          newObstacles.delete(handle);

          const newHighlightedGrab = handle
            ? state.highlightedGrab.filter((item) => item.id !== handle)
            : state.highlightedGrab;
          return {
            obstacles: newObstacles,
            highlightedGrab: newHighlightedGrab,
          };
        });
      },
      setRealHighlight: (id: string | false) => {
        set((state) => {
          if (id === false) {
            return { realHighLight: false };
          }
          return { realHighLight: state.obstacles.get(id) };
        });
      },
      updateObstacleInfo: (
        handle: string,
        { isCut, isCook }: { isCut?: boolean; isCook?: boolean }
      ) => {
        set((state) => {
          const existing = state.obstacles.get(handle);
          if (!existing) {
            return state;
          }

          const newObstacles = new Map(state.obstacles);
          newObstacles.set(handle, {
            ...existing,
            isCut,
            isCook,
          } as IGrabPosition);
          return { obstacles: newObstacles };
        });
      },

      // 更新障碍物位置
      updateObstaclePosition: (
        handle: string,
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
      isObstacleHandle: (handle: string) => {
        return get().obstacles.has(handle);
      },

      getObstacleInfo: (handle: string) => {
        return get().obstacles.get(handle);
      },

      getAllObstacles: () => {
        return Array.from(get().obstacles.values());
      },

      getObstaclesByType: (type: EGrabType | EFoodType) => {
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
        items: { id: string; type: EGrabType | EFoodType }[]
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

      setRegistry: (registered: boolean) => {
        set({ registryGrab: registered });
      },
      setHighlightedGrab: (id: string, add: boolean) => {
        set((state) => {
          const current = state.highlightedGrab;

          if (add) {
            const grab = state.obstacles.get(id);
            if (!grab) return {};
            // 添加模式：保留原有，添加新的
            return { highlightedGrab: [...current, grab] };
          } else {
            // 移除模式：移除指定的物品
            return {
              highlightedGrab: current.filter((item) => item.id !== id),
            };
          }
        });
      },
      // remove highlighted furniture or grab by id (defensive cleanup)
      removeHighlightedById: (id: string) => {
        set((state) => {
          return {
            highlightedGrab: state.highlightedGrab.filter(
              (item) => item.id !== id
            ),
          };
        });
      },
    };
  })
);
