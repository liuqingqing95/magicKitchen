import { useAppDispatch, useAppSelector } from "@/stores";
import {
  clearObstacles,
  registerObstacle,
  removeHighlightedById,
  setHighlightedFurniture,
  setHighlightId,
  setRegistry,
  unregisterObstacle,
} from "@/stores/furnitureSlice";
import { EFoodType, EFurnitureType } from "@/types/level";
import { EDirection } from "@/types/public";
import { useMemo } from "react";

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
  highlightId: string | false;
  obstacles: Map<string, IFurniturePosition>;
  registryFurniture: boolean;

  registerObstacle: (handle: string, info: IFurniturePosition) => void;
  unregisterObstacle: (handle: string) => void;
  clearObstacles: () => void;

  isObstacleHandle: (handle: string) => boolean;
  getObstacleInfo: (handle: string) => IFurniturePosition | undefined;
  getAllObstacles: () => IFurniturePosition[];
  getObstacleCount: () => number;
  setRegistry: (registered: boolean) => void;
  highlightedFurniture: IFurniturePosition[];
  setHighlightedFurniture: (id: string, add: boolean) => void;
  removeHighlightedById: (id: string) => void;
  setHighlightId: (id: string | false) => void;
}

// A compatibility hook that exposes the same API shape as the previous zustand store
// but backed by Redux. Accepts an optional selector function (like zustand) that
// maps the API object to the desired subset.
export const useFurnitureObstacleStore = <T extends any = ObstacleStore>(
  selector?: (s: ObstacleStore) => T,
): T => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.furniture);

  const obstaclesMap = useMemo(() => {
    const m = new Map<string, IFurniturePosition>();
    const raw = state.obstacles || {};
    Object.keys(raw).forEach((k) => m.set(k, raw[k]));
    return m;
  }, [state.obstacles]);

  const api = useMemo<ObstacleStore>(() => {
    return {
      highlightId: state.highlightId,
      obstacles: obstaclesMap,
      registryFurniture: state.registryFurniture,
      registerObstacle: (handle: string, info: IFurniturePosition) =>
        dispatch(registerObstacle({ handle, info })),
      unregisterObstacle: (handle: string) =>
        dispatch(unregisterObstacle(handle)),
      clearObstacles: () => dispatch(clearObstacles()),
      isObstacleHandle: (handle: string) => !!state.obstacles?.[handle],
      getObstacleInfo: (handle: string) => state.obstacles?.[handle],
      getAllObstacles: () => Object.values(state.obstacles || {}),
      getObstacleCount: () => Object.keys(state.obstacles || {}).length,
      setRegistry: (registered: boolean) => dispatch(setRegistry(registered)),
      highlightedFurniture: state.highlightedFurniture || [],
      setHighlightedFurniture: (id: string, add: boolean) =>
        dispatch(setHighlightedFurniture({ id, add })),
      removeHighlightedById: (id: string) =>
        dispatch(removeHighlightedById(id)),
      setHighlightId: (id: string | false) => dispatch(setHighlightId(id)),
    };
  }, [state, obstaclesMap, dispatch]);

  if (selector) return selector(api);
  return api as unknown as T;
};
