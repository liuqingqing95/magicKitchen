import store, {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@/stores/index";
import { EFoodType, EGrabType, IFoodWithRef } from "@/types/level";
import { useMemo } from "react";
import {
  clearObstacles as clearObstaclesAction,
  registerObstacle as registerObstacleAction,
  removeGrabOnFurniture as removeGrabOnFurnitureAction,
  removeHighlightedById as removeHighlightedByIdAction,
  setGrabOnFurniture as setGrabOnFurnitureAction,
  setHighlightedGrab as setHighlightedGrabAction,
  setRealHighlight as setRealHighlightAction,
  setRegistry as setRegistryAction,
  unregisterObstacle as unregisterObstacleAction,
  updateObstacleInfo as updateObstacleInfoAction,
} from "./obstaclesSlice";

export type ObstacleInfo = IFoodWithRef;

export type GrabOnFurnitureItem = { id: string; type: EGrabType | EFoodType };

export type GrabObstacleAPI = {
  obstacles: Map<string, ObstacleInfo>;
  grabOnFurniture: { [key: string]: string };
  registryGrab: boolean;
  highlightedGrab: ObstacleInfo[];
  realHighLight: ObstacleInfo | false;
  registerObstacle: (handle: string, info: ObstacleInfo) => void;
  unregisterObstacle: (handle: string) => void;
  setRealHighlight: (id: string | false) => void;
  updateObstacleInfo: (handle: string, updates: Partial<ObstacleInfo>) => void;
  clearObstacles: () => void;
  isObstacleHandle: (handle: string) => boolean;
  getObstacleInfo: (handle: string) => ObstacleInfo | undefined;
  getAllObstacles: () => ObstacleInfo[];
  getObstaclesByType: (type: EGrabType | EFoodType) => ObstacleInfo[];
  getObstacleCount: () => number;
  getGrabOnFurniture: (furnitureId: string) => string | undefined;
  setGrabOnFurniture: (furnitureId: string, obstacleId: string) => void;
  removeGrabOnFurniture: (furnitureId: string) => void;
  setRegistry: (registered: boolean) => void;
  setHighlightedGrab: (id: string, add: boolean) => void;
  removeHighlightedById: (id: string) => void;
};

// Compatibility hook that mimics the original Zustand API surface for quick migration.
export function useGrabObstacleStore<T>(selector: (s: GrabObstacleAPI) => T): T;
export function useGrabObstacleStore(selector?: (s: GrabObstacleAPI) => any) {
  const obstaclesRecord = useAppSelector(
    (s: RootState) => s.obstacles.obstacles
  );
  const grabOnFurniture = useAppSelector(
    (s: RootState) => s.obstacles.grabOnFurniture
  );
  const registryGrab = useAppSelector(
    (s: RootState) => s.obstacles.registryGrab
  );
  const highlightedGrab = useAppSelector(
    (s: RootState) => s.obstacles.highlightedGrab
  );
  const realHighLight = useAppSelector(
    (s: RootState) => s.obstacles.realHighLight
  );
  const dispatch = useAppDispatch();

  const api = useMemo<GrabObstacleAPI>(() => {
    const obstaclesMap = new Map<string, ObstacleInfo>(
      Object.entries(obstaclesRecord)
    );

    return {
      obstacles: obstaclesMap,
      grabOnFurniture: grabOnFurniture,
      registryGrab,
      highlightedGrab,
      realHighLight,
      registerObstacle: (handle: string, info: ObstacleInfo) =>
        dispatch(registerObstacleAction({ handle, info })),
      unregisterObstacle: (handle: string) =>
        dispatch(unregisterObstacleAction({ handle })),
      setRealHighlight: (id: string | false) =>
        dispatch(setRealHighlightAction(id)),
      updateObstacleInfo: (handle: string, updates: Partial<ObstacleInfo>) =>
        dispatch(updateObstacleInfoAction({ handle, updates })),
      clearObstacles: () => dispatch(clearObstaclesAction()),
      isObstacleHandle: (handle: string) => !!obstaclesRecord[handle],
      getObstacleInfo: (handle: string) => obstaclesRecord[handle],
      getAllObstacles: () => Object.values(obstaclesRecord),
      getObstaclesByType: (type: EGrabType | EFoodType) =>
        Object.values(obstaclesRecord).filter((o) => o.type === type),
      getObstacleCount: () => Object.keys(obstaclesRecord).length,
      getGrabOnFurniture: (furnitureId: string) => grabOnFurniture[furnitureId],
      setGrabOnFurniture: (furnitureId: string, obstacleId: string) =>
        dispatch(setGrabOnFurnitureAction({ furnitureId, obstacleId })),
      removeGrabOnFurniture: (furnitureId: string) =>
        dispatch(removeGrabOnFurnitureAction({ furnitureId })),
      setRegistry: (registered: boolean) =>
        dispatch(setRegistryAction({ registered })),
      setHighlightedGrab: (id: string, add: boolean) =>
        dispatch(setHighlightedGrabAction({ id, add })),
      removeHighlightedById: (id: string) =>
        dispatch(removeHighlightedByIdAction({ id })),
    };
  }, [
    obstaclesRecord,
    grabOnFurniture,
    registryGrab,
    highlightedGrab,
    realHighLight,
    dispatch,
  ]);

  if (typeof selector === "function") return selector(api as GrabObstacleAPI);
  return api;
}

// Provide getState compatibility used by utilities
useGrabObstacleStore.getState = (): GrabObstacleAPI => {
  const s = store.getState().obstacles;
  return {
    obstacles: new Map<string, ObstacleInfo>(Object.entries(s.obstacles)),
    grabOnFurniture: {},
    registryGrab: s.registryGrab,
    highlightedGrab: s.highlightedGrab,
    realHighLight: s.realHighLight,
    registerObstacle: (handle: string, info: ObstacleInfo) =>
      store.dispatch(registerObstacleAction({ handle, info })),
    unregisterObstacle: (handle: string) =>
      store.dispatch(unregisterObstacleAction({ handle })),
    setRealHighlight: (id: string | false) =>
      store.dispatch(setRealHighlightAction(id)),
    updateObstacleInfo: (handle: string, updates: Partial<ObstacleInfo>) =>
      store.dispatch(updateObstacleInfoAction({ handle, updates })),
    clearObstacles: () => store.dispatch(clearObstaclesAction()),
    isObstacleHandle: (handle: string) => !!s.obstacles[handle],
    getObstacleInfo: (handle: string) => s.obstacles[handle],
    getAllObstacles: () => Object.values(s.obstacles),
    getObstaclesByType: (type: EGrabType | EFoodType) =>
      Object.values(s.obstacles).filter((o) => o.type === type),
    getObstacleCount: () => Object.keys(s.obstacles).length,
    getGrabOnFurniture: (furnitureId: string) =>
      s.grabOnFurniture.get(furnitureId),
    setGrabOnFurniture: (furnitureId: string, obstacleId: string) =>
      store.dispatch(setGrabOnFurnitureAction({ furnitureId, obstacleId })),
    removeGrabOnFurniture: (furnitureId: string) =>
      store.dispatch(removeGrabOnFurnitureAction({ furnitureId })),
    setRegistry: (registered: boolean) =>
      store.dispatch(setRegistryAction({ registered })),
    setHighlightedGrab: (id: string, add: boolean) =>
      store.dispatch(setHighlightedGrabAction({ id, add })),
    removeHighlightedById: (id: string) =>
      store.dispatch(removeHighlightedByIdAction({ id })),
  };
};

export default useGrabObstacleStore;
