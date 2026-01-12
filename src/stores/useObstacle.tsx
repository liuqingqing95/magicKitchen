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
  registryFurniture: boolean;
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
  removeGrabOnFurniture: (furnitureId: string, grabId: string) => void;
  getAllGrabOnFurniture: () => { id: string; type: EGrabType | EFoodType }[][];
  setRegistry: (registered: boolean, type: "furniture" | "grab") => void;
  // highlight state for nearby furniture (shared)
  highlightedFurniture: IFurniturePosition[];
  setHighlightedFurniture: (
    furniture: IFurniturePosition,
    add: boolean
  ) => void;
  highlightedGrab: IGrabPosition[];
  setHighlightedGrab: (grab: IGrabPosition, add: boolean) => void;
}

export const useObstacleStore = create<ObstacleStore>()(
  subscribeWithSelector((set, get) => {
    return {
      // 初始状态
      obstacles: new Map(),
      grabOnFurniture: new Map(),
      registryFurniture: false,
      // shared highlight state
      highlightedFurniture: [],
      highlightedGrab: [],

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
      unregisterObstacle: (handle: string, furnitureHighlightId?: string) => {
        set((state) => {
          const newObstacles = new Map(state.obstacles);
          newObstacles.delete(handle);

          const newHighlightedFurniture = furnitureHighlightId
            ? state.highlightedFurniture.filter(
                (item) => item.id !== furnitureHighlightId
              )
            : state.highlightedFurniture;
          const newHighlightedGrab = handle
            ? state.highlightedGrab.filter((item) => item.id !== handle)
            : state.highlightedGrab;
          return {
            obstacles: newObstacles,
            highlightedFurniture: newHighlightedFurniture,
            highlightedGrab: newHighlightedGrab,
          };
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

      // highlight setter
      setHighlightedFurniture: (
        furniture: IFurniturePosition,
        add: boolean
      ) => {
        set((state) => {
          const current = state.highlightedFurniture;
          if (add) {
            // 添加模式：保留原有，添加新的
            return { highlightedFurniture: [...current, furniture] };
          } else {
            // 移除模式：移除指定的家具
            return {
              highlightedFurniture: current.filter(
                (item) => item.id !== furniture.id
              ),
            };
          }
        });
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
      getAllGrabOnFurniture: () => {
        return Array.from(get().grabOnFurniture.values());
      },
      setRegistry: (registered: boolean, type: "furniture" | "grab") => {
        if (type === "furniture") {
          set({ registryFurniture: registered });
        } else if (type === "grab") {
          set({ registryGrab: registered });
        }
      },
      setHighlightedGrab: (grab: IGrabPosition, add: boolean) => {
        set((state) => {
          const current = state.highlightedGrab;
          if (add) {
            // 添加模式：保留原有，添加新的
            return { highlightedGrab: [...current, grab] };
          } else {
            // 移除模式：移除指定的物品
            return {
              highlightedGrab: current.filter((item) => item.id !== grab.id),
            };
          }
        });
      },
      // remove highlighted furniture or grab by id (defensive cleanup)
      removeHighlightedById: (id: string) => {
        set((state) => {
          return {
            highlightedFurniture: state.highlightedFurniture.filter(
              (item) => item.id !== id
            ),
            highlightedGrab: state.highlightedGrab.filter(
              (item) => item.id !== id
            ),
          };
        });
      },
    };
  })
);
