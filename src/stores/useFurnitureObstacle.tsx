import { useAppDispatch, useAppSelector } from "@/stores";
import {
  clearObstacles,
  registerObstacle,
  removeHighlightedById,
  setHighlightedFurniture,
  setHighlightId,
  setOpenFoodTable,
  setRegistry,
  unregisterObstacle,
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

export interface ObstacleStore {
  // highlightId: string | false;
  // obstacles: Map<string, IFurniturePosition>;
  // registryFurniture: boolean;
  // openFoodTable: Record<string, boolean>;

  registerObstacle: (handle: string, info: IFurniturePosition) => void;
  unregisterObstacle: (handle: string) => void;
  clearObstacles: () => void;
  getOpenFoodTable: (handle: string) => boolean | undefined;
  isObstacleHandle: (handle: string) => boolean;
  getObstacleInfo: (handle: string) => IFurniturePosition | undefined;
  getAllObstacles: () => IFurniturePosition[];
  getObstacleCount: () => number;
  setRegistry: (registered: boolean) => void;
  // 多玩家高亮家具列表：每个玩家对应一个高亮家具数组
  setHighlightedFurniture: (
    playerId: TPLayerId,
    id: string,
    add: boolean,
  ) => void;
  removeHighlightedById: (playerId: TPLayerId, id: string) => void;
  setHighlightId: (playerId: TPLayerId, id: string | false) => void;
  setOpenFoodTable: (id: string) => void;
}

// A compatibility hook that exposes the same API shape as the previous zustand store
// but backed by Redux. Accepts an optional selector function (like zustand) that
// maps the API object to the desired subset.
export const useFurnitureObstacleStore = <T extends any = ObstacleStore>(
  selector: (s: ObstacleStore) => T,
): T => {
  const dispatch = useAppDispatch();
  // const state = useAppSelector((s) => s.furniture);
  const openFoodTable = useAppSelector((s) => s.furniture.openFoodTable);
  const obstacles = useAppSelector((s) => s.furniture.obstacles);
  const obstaclesMap = useMemo(() => {
    const m = new Map<string, IFurniturePosition>();
    const raw = obstacles || {};
    Object.keys(raw).forEach((k) => m.set(k, raw[k]));
    return m;
  }, [obstacles]);

  // const openFoodTableMap = useMemo(() => {
  //   const m = new Map<string, boolean>();
  //   const raw = openFoodTable || {};
  //   Object.keys(raw).forEach((k) => m.set(k, raw[k]));
  //   return m;
  // }, [openFoodTable]);

  // move selectors to top-level hooks (Hooks must not be called inside useMemo)
  // const highlightId = useAppSelector((s) => s.furniture.highlightId);
  // const registryFurniture = useAppSelector(
  //   (s) => s.furniture.registryFurniture,
  // );
  // const highlightedFurniture = useAppSelector(
  //   (s) => s.furniture.highlightedFurniture,
  // );

  const api = useMemo<ObstacleStore>(
    () => ({
      setOpenFoodTable: (id: string) => dispatch(setOpenFoodTable(id)),
      registerObstacle: (handle: string, info: IFurniturePosition) => {
        dispatch(registerObstacle({ handle, info }));
      },
      unregisterObstacle: (handle: string) =>
        dispatch(unregisterObstacle(handle)),
      clearObstacles: () => dispatch(clearObstacles()),
      isObstacleHandle: (handle: string) => obstaclesMap.has(handle),
      getObstacleInfo: (handle: string) => obstaclesMap.get(handle),
      getOpenFoodTable: (handle: string) => openFoodTable[handle],
      getAllObstacles: () => Array.from(obstaclesMap.values()),
      getObstacleCount: () => obstaclesMap.size,
      setRegistry: (registered: boolean) => dispatch(setRegistry(registered)),
      // 多玩家高亮家具列表
      setHighlightedFurniture: (
        playerId: TPLayerId,
        id: string,
        add: boolean,
      ) => dispatch(setHighlightedFurniture({ playerId, id, add })),
      removeHighlightedById: (playerId: TPLayerId, id: string) =>
        dispatch(removeHighlightedById({ playerId, id })),
      setHighlightId: (playerId: TPLayerId, id: string | false) =>
        dispatch(setHighlightId({ playerId, id })),
    }),
    [dispatch, obstaclesMap, openFoodTable],
  );

  return selector(api);
};

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

export const useObstaclesMap = () => {
  const obstacles = useAppSelector((s) => s.furniture.obstacles);
  return useMemo(
    () => new Map<string, IFurniturePosition>(Object.entries(obstacles || {})),
    [obstacles],
  );
};

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
