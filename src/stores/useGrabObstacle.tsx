import store, {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@/stores/index";
import { EFoodType, EGrabType, IFoodWithRef, TPLayerId } from "@/types/level";
import { useMemo } from "react";
import {
  clearObstacles as clearObstaclesAction,
  registerObstacle as registerObstacleAction,
  removeCleanPlate as removeCleanPlateAction,
  removeDirtyPlate as removeDirtyPlateAction,
  removeGrabOnFurniture as removeGrabOnFurnitureAction,
  removePendingGrabId as removePendingGrabIdAction,
  setDirtyPlates as setDirtyPlatesAction,
  setGrabOnFurniture as setGrabOnFurnitureAction,
  setHeldItem as setHeldItemAction,
  setHighlightedGrab as setHighlightedGrabAction,
  setPendingGrabId as setPendingGrabIdAction,
  setRealHighlight as setRealHighlightAction,
  setRegistry as setRegistryAction,
  unregisterObstacle as unregisterObstacleAction,
  updateObstacleInfo as updateObstacleInfoAction,
} from "./obstaclesSlice";

export type ObstacleInfo = IFoodWithRef;

export type GrabOnFurnitureItem = { id: string; type: EGrabType | EFoodType };

export type GrabObstacleAPI = {
  // obstacles: Map<string, ObstacleInfo>;
  // grabOnFurniture: { [key: string]: string };
  // tempGrabOnFurniture: { [key: string]: string };
  // registryGrab: boolean;
  // highlightedGrab: ObstacleInfo[];
  // realHighLight: ObstacleInfo | false;

  registerObstacle: (handle: string, info: ObstacleInfo) => void;
  unregisterObstacle: (handle: string, playerId?: TPLayerId) => void;
  setRealHighlight: (playerId: TPLayerId, id: string | false) => void;
  updateObstacleInfo: (handle: string, updates: Partial<ObstacleInfo>) => void;
  clearObstacles: () => void;
  isObstacleHandle: (handle: string) => boolean;
  getObstacleInfo: (handle: string) => ObstacleInfo | undefined;
  getAllObstacles: () => ObstacleInfo[];
  getObstaclesByType: (type: EGrabType | EFoodType) => ObstacleInfo[];
  getObstacleCount: () => number;
  getGrabOnFurniture: (
    furnitureId: string,
    temp?: boolean,
  ) => string | undefined;
  setGrabOnFurniture: (
    furnitureId: string,
    obstacleId: string,
    temp?: boolean,
  ) => void;
  removeGrabOnFurniture: (furnitureId: string, temp?: boolean) => void;
  setRegistry: (registered: boolean) => void;
  setHighlightedGrab: (playerId: TPLayerId, id: string, add: boolean) => void;
  setDirtyPlates: (plates: string[]) => void;
  removeDirtyPlate: () => void;
  removeCleanPlate: () => void;
  setPendingGrabId: (playerId: TPLayerId, id: string) => void;
  removePendingGrabId: (playerId: TPLayerId, id: string) => void;
  setHeldItem: (playerId: TPLayerId, itemId: string) => void;
};

// Compatibility hook that mimics the original Zustand API surface for quick migration.
export function useGrabObstacleStore<T>(selector: (s: GrabObstacleAPI) => T): T;
export function useGrabObstacleStore(selector?: (s: GrabObstacleAPI) => any) {
  const obstaclesRecord = useAppSelector((s: RootState) => s.grab.obstacles);
  const grabOnFurniture = useAppSelector(
    (s: RootState) => s.grab.grabOnFurniture,
  );
  const tempGrabOnFurniture = useAppSelector(
    (s: RootState) => s.grab.tempGrabOnFurniture,
  );
  //
  // const highlightedGrab = useAppSelector(
  //   (s: RootState) => s.grab.highlightedGrab,
  // );
  // const realHighLight = useAppSelector((s: RootState) => s.grab.realHighLight);
  const dispatch = useAppDispatch();

  const api = useMemo<GrabObstacleAPI>(() => {
    // const obstaclesMap = new Map<string, ObstacleInfo>(
    //   Object.entries(obstaclesRecord),
    // );

    return {
      // obstacles: obstaclesMap,
      // tempGrabOnFurniture: { ...tempGrabOnFurniture },
      // grabOnFurniture: { ...grabOnFurniture },
      // registryGrab,
      // highlightedGrab,
      // realHighLight,
      registerObstacle: (handle: string, info: ObstacleInfo) =>
        dispatch(registerObstacleAction({ handle, info })),
      unregisterObstacle: (handle: string, playerId?: TPLayerId) =>
        dispatch(unregisterObstacleAction({ handle, playerId })),
      setRealHighlight: (playerId: TPLayerId, id: string | false) =>
        dispatch(setRealHighlightAction({ playerId, id })),
      updateObstacleInfo: (handle: string, updates: Partial<ObstacleInfo>) =>
        dispatch(updateObstacleInfoAction({ handle, updates })),
      clearObstacles: () => dispatch(clearObstaclesAction()),
      isObstacleHandle: (handle: string) => !!obstaclesRecord[handle],
      getObstacleInfo: (handle: string) => obstaclesRecord[handle],
      getAllObstacles: () => Object.values(obstaclesRecord),
      getObstaclesByType: (type: EGrabType | EFoodType) =>
        Object.values(obstaclesRecord).filter((o) => o.type === type),
      getObstacleCount: () => Object.keys(obstaclesRecord).length,
      getGrabOnFurniture: (furnitureId: string, temp?: boolean) =>
        temp ? tempGrabOnFurniture[furnitureId] : grabOnFurniture[furnitureId],
      setGrabOnFurniture: (
        furnitureId: string,
        obstacleId: string,
        temp?: boolean,
      ) =>
        dispatch(setGrabOnFurnitureAction({ furnitureId, obstacleId, temp })),
      removeGrabOnFurniture: (furnitureId: string, temp?: boolean) =>
        dispatch(removeGrabOnFurnitureAction({ furnitureId, temp })),
      setRegistry: (registered: boolean) =>
        dispatch(setRegistryAction({ registered })),
      setHighlightedGrab: (playerId: TPLayerId, id: string, add: boolean) =>
        dispatch(setHighlightedGrabAction({ playerId, id, add })),
      setDirtyPlates: (plates: string[]) =>
        dispatch(setDirtyPlatesAction(plates)),
      removeDirtyPlate: () => dispatch(removeDirtyPlateAction()),
      removeCleanPlate: () => dispatch(removeCleanPlateAction()),
      setPendingGrabId: (playerId: TPLayerId, id: string) =>
        dispatch(setPendingGrabIdAction({ playerId, id })),
      removePendingGrabId: (playerId: TPLayerId, id: string) =>
        dispatch(removePendingGrabIdAction({ playerId, id })),
      setHeldItem: (playerId: TPLayerId, itemId: string) =>
        dispatch(setHeldItemAction({ playerId, itemId })),
    };
  }, [obstaclesRecord, grabOnFurniture, tempGrabOnFurniture, dispatch]);

  if (typeof selector === "function") return selector(api as GrabObstacleAPI);
  return api;
}

// Provide getState compatibility used by utilities
useGrabObstacleStore.getState = (): GrabObstacleAPI => {
  const s = store.getState().grab;
  return {
    // obstacles: new Map<string, ObstacleInfo>(Object.entries(s.obstacles)),
    // grabOnFurniture: {},
    // tempGrabOnFurniture: {},
    // registryGrab: s.registryGrab,
    // highlightedGrab: s.highlightedGrab,
    // realHighLight: s.realHighLight,

    registerObstacle: (handle: string, info: ObstacleInfo) =>
      store.dispatch(registerObstacleAction({ handle, info })),
    unregisterObstacle: (handle: string, playerId?: TPLayerId) =>
      store.dispatch(unregisterObstacleAction({ handle, playerId })),
    setRealHighlight: (playerId: TPLayerId, id: string | false) =>
      store.dispatch(setRealHighlightAction({ playerId, id })),
    updateObstacleInfo: (handle: string, updates: Partial<ObstacleInfo>) =>
      store.dispatch(updateObstacleInfoAction({ handle, updates })),
    clearObstacles: () => store.dispatch(clearObstaclesAction()),
    isObstacleHandle: (handle: string) => !!s.obstacles[handle],
    getObstacleInfo: (handle: string) => s.obstacles[handle],
    getAllObstacles: () => Object.values(s.obstacles),
    getObstaclesByType: (type: EGrabType | EFoodType) =>
      Object.values(s.obstacles).filter((o) => o.type === type),
    getObstacleCount: () => Object.keys(s.obstacles).length,
    getGrabOnFurniture: (furnitureId: string, temp?: boolean) =>
      temp
        ? s.tempGrabOnFurniture[furnitureId]
        : s.grabOnFurniture[furnitureId],
    setGrabOnFurniture: (
      furnitureId: string,
      obstacleId: string,
      temp?: boolean,
    ) =>
      store.dispatch(
        setGrabOnFurnitureAction({ furnitureId, obstacleId, temp }),
      ),
    removeGrabOnFurniture: (furnitureId: string, temp?: boolean) =>
      store.dispatch(removeGrabOnFurnitureAction({ furnitureId, temp })),
    setRegistry: (registered: boolean) =>
      store.dispatch(setRegistryAction({ registered })),
    setHighlightedGrab: (playerId: TPLayerId, id: string, add: boolean) =>
      store.dispatch(setHighlightedGrabAction({ playerId, id, add })),
    setDirtyPlates: (plates: string[]) => {
      store.dispatch(setDirtyPlatesAction(plates));
    },
    removeDirtyPlate: () => {
      store.dispatch(removeDirtyPlateAction());
    },
    removeCleanPlate: () => {
      store.dispatch(removeCleanPlateAction());
    },
    setPendingGrabId: (playerId: TPLayerId, id: string) => {
      store.dispatch(setPendingGrabIdAction({ playerId, id }));
    },
    removePendingGrabId: (playerId: TPLayerId, id: string) => {
      store.dispatch(removePendingGrabIdAction({ playerId, id }));
    },
    setHeldItem: (playerId: TPLayerId, itemId: string) => {
      store.dispatch(setHeldItemAction({ playerId, itemId }));
    },
  };
};

export default useGrabObstacleStore;

// Narrow selector hooks for precise subscriptions
export const useGrabObstaclesMap = () => {
  const obstacles = useAppSelector((s: RootState) => s.grab.obstacles);
  return useMemo(
    () => new Map<string, ObstacleInfo>(Object.entries(obstacles || {})),
    [obstacles],
  );
};
export const useGrabHeldItem = () =>
  useAppSelector((s: RootState) => s.grab.heldItem);

export const useGrabPendingIds = () =>
  useAppSelector((s: RootState) => s.grab.pendingGrabId);

export const useGrabObstacleById = (id?: string) =>
  useAppSelector((s: RootState) => (id ? s.grab.obstacles[id] : undefined));

export const useIsGrabObstacleHandle = (id?: string) =>
  useAppSelector((s: RootState) => (id ? !!s.grab.obstacles[id] : false));

export const useGrabOnFurniture = () =>
  useAppSelector((s: RootState) => s.grab.grabOnFurniture);

export const useTempGrabOnFurniture = () =>
  useAppSelector((s: RootState) => s.grab.tempGrabOnFurniture);

export const useGetCleanPlates = () =>
  useAppSelector((s: RootState) => s.grab.cleanPlates);

export const useGetGrabOnFurnitureById = (
  furnitureId?: string,
  temp?: boolean,
) =>
  useAppSelector((s: RootState) =>
    furnitureId
      ? temp
        ? s.grab.tempGrabOnFurniture[furnitureId]
        : s.grab.grabOnFurniture[furnitureId]
      : undefined,
  );

export const useRegistryGrab = () =>
  useAppSelector((s: RootState) => s.grab.registryGrab);

// 获取指定玩家的高亮物品列表
export const useHighlightedGrab = (playerId: TPLayerId) =>
  useAppSelector((s: RootState) => s.grab.highlightedGrab[playerId]);

// 获取指定玩家的高亮物品
export const useRealHighlight = (playerId: TPLayerId) =>
  useAppSelector((s: RootState) => s.grab.realHighLight[playerId]);

export const useGetDirtyPlates = () =>
  useAppSelector((s: RootState) => s.grab.dirtyPlates);
