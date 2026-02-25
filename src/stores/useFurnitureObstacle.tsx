import store, { useAppSelector } from "@/stores";
import {
  clearObstacles as clearObstaclesAction,
  registerObstacle as registerObstacleAction,
  removeHighlightedById as removeHighlightedByIdAction,
  setHighlightedFurniture as setHighlightedFurnitureAction,
  setHighlightId as setHighlightIdAction,
  setOpenFoodTable as setOpenFoodTableAction,
  setRegistry as setRegistryAction,
  unregisterObstacle as unregisterObstacleAction,
} from "@/stores/furnitureSlice";
import { EFoodType, EFurnitureType, TPLayerId } from "@/types/level";
import { EDirection } from "@/types/public";
import { useMemo } from "react";

export interface IFurniturePosition {
  id: string;
  position: [number, number, number];
  type: EFurnitureType;
  size: [number, number, number];
  rotateDirection?: EDirection;
  isMovable: boolean;
  foodType?: EFoodType;
}

export const setOpenFoodTable = (id: string) =>
  store.dispatch(setOpenFoodTableAction(id));

export const registerObstacle = (handle: string, info: IFurniturePosition) =>
  store.dispatch(registerObstacleAction({ handle, info }));

export const unregisterObstacle = (handle: string) =>
  store.dispatch(unregisterObstacleAction(handle));

export const clearObstacles = () => store.dispatch(clearObstaclesAction());

export const setRegistry = (registered: boolean) =>
  store.dispatch(setRegistryAction(registered));

export const setHighlightedFurniture = (
  playerId: TPLayerId,
  id: string,
  add: boolean,
) => store.dispatch(setHighlightedFurnitureAction({ playerId, id, add }));

// Hook: returns a Map view of `furniture.obstacles`
export const useObstaclesMap = () => {
  const obstacles = useAppSelector((s) => s.furniture.obstacles);
  return useMemo(() => {
    const m = new Map<string, IFurniturePosition>();
    const raw = obstacles || {};
    Object.keys(raw).forEach((k) => m.set(k, raw[k]));
    return m;
  }, [obstacles]);
};

export const getOpenFoodTable = (handle: string) => {
  const openFoodTable = store.getState().furniture.openFoodTable || {};
  return openFoodTable[handle];
};
export const isObstacleHandle = (handle: string) => {
  const obstacles = store.getState().furniture.obstacles || {};
  return Object.prototype.hasOwnProperty.call(obstacles, handle);
};
export const getObstacleInfo = (handle: string) =>
  store.getState().furniture.obstacles?.[handle];
export const removeHighlightedById = (playerId: TPLayerId, id: string) =>
  store.dispatch(removeHighlightedByIdAction({ playerId, id }));

export const setHighlightId = (playerId: TPLayerId, id: string | false) =>
  store.dispatch(setHighlightIdAction({ playerId, id }));

// Narrow selector hooks for precise subscriptions
// 返回所有玩家的高亮ID
export const useHighlightId = () =>
  useAppSelector((s) => s.furniture.highlightIds);

// 检查指定家具是否被任一玩家高亮
export const useIsFurnitureHighlighted = (furnitureId?: string) =>
  useAppSelector((s) =>
    furnitureId
      ? Object.values(s.furniture.highlightIds).some((id) => id === furnitureId)
      : false,
  );

export const useRegistryFurniture = () =>
  useAppSelector((s) => s.furniture.registryFurniture);

export const useOpenFoodTableById = (id?: string) =>
  useAppSelector((s) =>
    id ? (s.furniture.openFoodTable?.[id] ?? undefined) : undefined,
  );

export const useObstacleById = (id?: string) =>
  useAppSelector((s) => (id ? s.furniture.obstacles?.[id] : undefined));

// 返回指定玩家的高亮家具
export const useclosedFurnitureArr = (playerId: TPLayerId) =>
  useAppSelector((s) => s.furniture.highlightedFurniture[playerId] || []);

// export const useIsHighlightedById = (id?: string) =>
//   useAppSelector((s) =>
//     id
//       ? [
//           ...(s.furniture.highlightedFurniture.firstPlayer || []),
//           ...(s.furniture.highlightedFurniture.secondPlayer || []),
//         ].some((f) => f.id === id)
//       : false,
//   );
