import { RootState, default as store, useAppSelector } from "@/stores/index";
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

export const useGrabObstaclesMap = () => {
  const obstacles = useAppSelector((s: RootState) => s.grab.obstacles);
  return useMemo(
    () => new Map<string, ObstacleInfo>(Object.entries(obstacles || {})),
    [obstacles],
  );
};
export const getObstacleInfo = (handle: string) =>
  store.getState().grab.obstacles[handle];
export const getGrabOnFurniture = (furnitureId: string, temp?: boolean) => {
  const s = store.getState().grab;
  return temp
    ? s.tempGrabOnFurniture[furnitureId]
    : s.grabOnFurniture[furnitureId];
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

// Direct store action helpers (non-hook, for utilities/tests)
export const clearObstacles = () => store.dispatch(clearObstaclesAction());

export const registerObstacle = (handle: string, info: ObstacleInfo) =>
  store.dispatch(registerObstacleAction({ handle, info }));

export const unregisterObstacle = (handle: string, playerId?: TPLayerId) =>
  store.dispatch(unregisterObstacleAction({ handle, playerId }));

export const setRealHighlight = (playerId: TPLayerId, id: string | false) =>
  store.dispatch(setRealHighlightAction({ playerId, id }));

export const updateObstacleInfo = (
  handle: string,
  updates: Partial<ObstacleInfo>,
) => store.dispatch(updateObstacleInfoAction({ handle, updates }));

export const removeGrabOnFurniture = (furnitureId: string, temp?: boolean) =>
  store.dispatch(removeGrabOnFurnitureAction({ furnitureId, temp }));

export const setGrabOnFurniture = (
  furnitureId: string,
  obstacleId: string,
  temp?: boolean,
) =>
  store.dispatch(setGrabOnFurnitureAction({ furnitureId, obstacleId, temp }));

export const setDirtyPlates = (plates: string[]) =>
  store.dispatch(setDirtyPlatesAction(plates));

export const removeDirtyPlate = () => store.dispatch(removeDirtyPlateAction());

export const removeCleanPlate = () => store.dispatch(removeCleanPlateAction());

export const setPendingGrabId = (playerId: TPLayerId, id: string) =>
  store.dispatch(setPendingGrabIdAction({ playerId, id }));

export const removePendingGrabId = (playerId: TPLayerId, id: string) =>
  store.dispatch(removePendingGrabIdAction({ playerId, id }));

export const setHeldItem = (playerId: TPLayerId, itemId: string) =>
  store.dispatch(setHeldItemAction({ playerId, itemId }));

export const setHighlightedGrab = (
  playerId: TPLayerId,
  id: string,
  add: boolean,
) => store.dispatch(setHighlightedGrabAction({ playerId, id, add }));

export const setRealHighlightActionExport = setRealHighlightAction; // raw action if needed

export const setRegistry = (registered: boolean) =>
  store.dispatch(setRegistryAction({ registered }));
