import { EFoodType, EFurnitureType } from "@/types/level";
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

export interface ObstacleStore {
  // 状态
  highlightId: string | false;
  obstacles: Map<string, IFurniturePosition>;
  registryFurniture: boolean;

  // 动作
  registerObstacle: (handle: string, info: IFurniturePosition) => void;
  unregisterObstacle: (handle: string, furnitureHighlightId?: string) => void;

  clearObstacles: () => void;

  // 查询
  isObstacleHandle: (handle: string) => boolean;
  getObstacleInfo: (handle: string) => IFurniturePosition | undefined;
  getAllObstacles: () => IFurniturePosition[];
  getObstacleCount: () => number;
  setRegistry: (registered: boolean) => void;
  // highlight state for nearby furniture (shared)
  highlightedFurniture: IFurniturePosition[];
  setHighlightedFurniture: (id: string, add: boolean) => void;
  removeHighlightedById: (id: string) => void;
  setHighlightId: (id: string | false) => void;
}

export const useFurnitureObstacleStore = create<ObstacleStore>()(
  subscribeWithSelector((set, get) => {
    return {
      highlightId: false,
      obstacles: new Map(),
      registryFurniture: false,
      // shared highlight state
      highlightedFurniture: [],

      // 注册障碍物
      registerObstacle: (handle: string, info: IFurniturePosition) => {
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

          return {
            obstacles: newObstacles,
            highlightedFurniture: newHighlightedFurniture,
          };
        });
      },

      // 清空所有障碍物
      clearObstacles: () => {
        set({ obstacles: new Map() });
      },

      setHighlightedFurniture: (id: string, add: boolean) => {
        set((state) => {
          const current = state.highlightedFurniture;
          const furniture = state.obstacles.get(id);
          if (add) {
            if (!furniture) return {};
            // 添加模式：保留原有，添加新的
            return { highlightedFurniture: [...current, furniture] };
          } else {
            // 移除模式：移除指定的家具
            return {
              highlightedFurniture: current.filter((item) => item.id !== id),
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

      getObstacleCount: () => {
        return get().obstacles.size;
      },

      setRegistry: (registered: boolean) => {
        set({ registryFurniture: registered });
      },

      // remove highlighted furniture or grab by id (defensive cleanup)
      removeHighlightedById: (id: string) => {
        set((state) => {
          return {
            highlightedFurniture: state.highlightedFurniture.filter(
              (item) => item.id !== id
            ),
          };
        });
      },

      setHighlightId: (id: string | false) => {
        set({ highlightId: id });
      },
    };
  })
);
