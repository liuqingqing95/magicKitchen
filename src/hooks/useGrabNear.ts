import {
  IFurniturePosition,
  useFurnitureObstacleStore,
  useclosedFurnitureArr,
} from "@/stores/useFurnitureObstacle";
import {
  useGrabObstacleStore,
  useHighlightedGrab,
} from "@/stores/useGrabObstacle";
import { IFoodWithRef, IGrabPosition, TPLayerId } from "@/types/level";
import { useCallback, useEffect, useMemo, useRef } from "react";

const getClosestPoint = (
  obstacle: IGrabPosition | IFurniturePosition,
  playerPos: [number, number, number],
) => {
  if (!obstacle.position || !obstacle.size) {
    return obstacle.position!;
  }

  const [px, py, pz] = playerPos;
  const [ox, oy, oz] = obstacle.position;
  const [width, height, depth] = obstacle.size;

  // 计算边界框的最近点
  const closestX = Math.max(ox - width / 2, Math.min(px, ox + width / 2));
  const closestY = Math.max(oy - height / 2, Math.min(py, oy + height / 2));
  const closestZ = Math.max(oz - depth / 2, Math.min(pz, oz + depth / 2));

  return [closestX, closestY, closestZ];
};

export function useGrabNear(
  playerPosRef: React.MutableRefObject<[number, number, number]>,
  playerId: TPLayerId,
) {
  const lastFurnitureResult = useRef<IFurniturePosition | false>(false);
  // 模块级的 ref，跨所有玩家实例共享，跟踪每个高亮物品对应的玩家集合
  const highlightedByPlayers = useRef<Record<string, Set<TPLayerId>>>({});

  // Reader mode: subscribe to highlighted lists when playerPos is provided
  const setHighlightedGrab = useGrabObstacleStore((s) => s.setHighlightedGrab);
  const highlightedGrab = useHighlightedGrab(playerId);
  // subscribe to serialized id list so callbacks re-create reliably
  const highlightedGrabIds = useMemo(() => {
    return highlightedGrab.map((f) => f.id).join(",");
  }, [highlightedGrab]);

  const { setHighlightedFurniture } = useFurnitureObstacleStore((s) => {
    return {
      // furnitureHighlightId: s.highlightId,
      setHighlightedFurniture: s.setHighlightedFurniture,
      getObstacleInfo: s.getObstacleInfo,
      // setHighlightedGrab: s.setHighlightedGrab,
      // highlightedGrab: s.highlightedGrab,
      // highlightedFurniture: s.highlightedFurniture,
      // getObstacleInfo: s.getObstacleInfo,
      // setHighlightedGrab: s.setHighlightedGrab,
      // highlightedGrab: s.highlightedGrab,
    };
  });

  const highlightedFurniture = useclosedFurnitureArr(playerId);
  useEffect(() => {
    console.log("Highlighted furniture updated:", highlightedFurniture);
  }, [highlightedFurniture]);
  const isHighLight = (id: string, light: boolean) => {
    // 初始化该物品的玩家集合（如果不存在）
    if (!highlightedByPlayers.current[id]) {
      highlightedByPlayers.current[id] = new Set();
    }
    const players = highlightedByPlayers.current[id];

    if (light) {
      // 添加当前玩家到集合
      // 只有当第一个玩家触发时才设置高亮
      if (players.size === 0) {
        if (id.startsWith("Grab") || id.startsWith("Tableware")) {
          setHighlightedGrab(playerId, id, true);
        } else {
          setHighlightedFurniture(playerId, id, true);
        }
      }
      players.add(playerId);
    } else {
      // 从集合中移除当前玩家
      players.delete(playerId);
      // 只有当所有玩家都离开时才取消高亮
      if (players.size === 0) {
        if (id.startsWith("Grab") || id.startsWith("Tableware")) {
          setHighlightedGrab(playerId, id, false);
        } else {
          setHighlightedFurniture(playerId, id, false);
        }
        delete highlightedByPlayers.current[id];
      }
    }
  };
  // const lightedTableObstacle = useMemo(() => {
  //   return getGrabOnFurniture(furnitureHighlightId || "");
  // }, [furnitureHighlightId, getGrabOnFurniture]);

  // const lightedGrabFilter = useMemo(() => {
  //   return highlightedGrab.filter((item) => {
  //     if (Object.values(grabOnFurniture).includes(item.id)) {
  //       if (item.id === lightedTableObstacle) {
  //         return true;
  //       }
  //       return false;
  //     }
  //     return true;
  //   });
  //   // return Object.values(grabOnFurniture).filter((item) => item === lightedTableObstacle);
  // }, [grabOnFurniture, highlightedGrab, lightedTableObstacle]);
  const getNearByDistance = useCallback(
    (arr: IFurniturePosition[] | IFoodWithRef[]) => {
      const playerPos = playerPosRef.current;
      const nearbyWithDistance = arr
        .map((obstacle) => {
          const closestPoint = getClosestPoint(obstacle, playerPos);
          const distance = Math.sqrt(
            Math.pow(playerPos[0] - closestPoint[0], 2) +
              Math.pow(playerPos[2] - closestPoint[2], 2),
          );

          return { obstacle, distance };
        })
        // .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);
      return nearbyWithDistance;
    },
    [],
  );
  const getFurnitureNearest = useCallback(() => {
    if (!playerPosRef.current) return false;
    const arr: IFurniturePosition[] = highlightedFurniture;

    const nearestEntry = getNearByDistance(arr);
    console.log(arr, nearestEntry, "dddd near furniture");
    const nearest = nearestEntry.length > 0 ? nearestEntry[0]!.obstacle : false;

    // lastPos.current = playerPosRef.current;
    lastFurnitureResult.current = nearest as IFurniturePosition | false;

    return nearest;
  }, [highlightedFurniture.map((f) => f.id).join(","), getNearByDistance]);

  const getGrabNearest = useCallback(
    (grabId?: string) => {
      const playerPos = playerPosRef.current;
      if (!playerPos) return false;
      const arr: IFoodWithRef[] = highlightedGrab;

      // if (
      //   lastPos.current &&
      //   Math.abs(lastPos.current[0] - playerPos[0]) < 0.1 &&
      //   Math.abs(lastPos.current[2] - playerPos[2]) < 0.1
      // ) {
      //   const nearest =
      //     type === ERigidBodyType.furniture
      //       ? lastFurnitureResult.current
      //       : lastGrabResult.current;
      //   if (grabId) {
      //     if (
      //       type === ERigidBodyType.grab &&
      //       nearest &&
      //       nearest.id === grabId
      //     ) {
      //       return false;
      //     }
      //     return nearest;
      //   } else {
      //     return nearest;
      //   }
      // }
      const nearbyWithDistance = getNearByDistance(arr);
      const nearest =
        nearbyWithDistance.length > 0 ? nearbyWithDistance[0]!.obstacle : false;

      // lastPos.current = playerPos;

      // lastGrabResult.current = nearest as IGrabPosition | false;

      if (grabId) {
        const obj =
          nearbyWithDistance.filter((item) => item?.obstacle.id !== grabId)?.[0]
            ?.obstacle || false;
        console.log("getNearest with grabId:", grabId, obj);
        return obj;
      }
      return nearest;
    },
    [highlightedGrabIds, getNearByDistance],
  );

  return {
    highlightedGrabIds,
    furnitureNearList: highlightedFurniture,
    isHighLight,
    getGrabNearest,
    getFurnitureNearest,
  };
}
