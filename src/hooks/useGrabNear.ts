import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "@/stores/useFurnitureObstacle";
import { useGrabObstacleStore } from "@/stores/useGrabObstacle";
import { IFoodWithRef, IGrabPosition } from "@/types/level";
import { useCallback, useRef } from "react";
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
) {
  // 添加位置比较，避免重复计算
  const lastPos = useRef(playerPosRef.current);
  const lastFurnitureResult = useRef<IFurniturePosition | false>(false);
  const lastGrabResult = useRef<IGrabPosition | false>(false);

  // Reader mode: subscribe to highlighted lists when playerPos is provided
  const {
    highlightedGrab,
    grabOnFurniture,
    getGrabOnFurniture,
    setHighlightedGrab,
  } = useGrabObstacleStore((s) => {
    return {
      // setHighlightedFurniture: s.setHighlightedFurniture,
      grabOnFurniture: s.grabOnFurniture,
      setHighlightedGrab: s.setHighlightedGrab,
      getGrabOnFurniture: s.getGrabOnFurniture,
      highlightedGrab: s.highlightedGrab,
      // highlightedFurniture: s.highlightedFurniture,
    };
  });

  // subscribe to serialized id list so callbacks re-create reliably
  const highlightedGrabIds = useGrabObstacleStore((s) =>
    s.highlightedGrab.map((f) => f.id).join(","),
  );

  const {
    // getObstacleInfo,
    setHighlightedFurniture,
    // highlightedGrab,
    // setHighlightedGrab,
    highlightedFurniture,
    furnitureHighlightId,
  } = useFurnitureObstacleStore((s) => {
    return {
      furnitureHighlightId: s.highlightId,
      setHighlightedFurniture: s.setHighlightedFurniture,
      getObstacleInfo: s.getObstacleInfo,
      // setHighlightedGrab: s.setHighlightedGrab,
      // highlightedGrab: s.highlightedGrab,
      highlightedFurniture: s.highlightedFurniture,
      // getObstacleInfo: s.getObstacleInfo,
      // setHighlightedGrab: s.setHighlightedGrab,
      // highlightedGrab: s.highlightedGrab,
    };
  });

  const isHighLight = (id: string, light: boolean) => {
    if (id.startsWith("Grab") || id.startsWith("Tableware")) {
      setHighlightedGrab(id, light);
    } else {
      setHighlightedFurniture(id, light);
    }

    // if (!obstacle) return;
    // // only update if changed
    // if (!highlightedFurniture.find((item) => item.id === id)) {
    //   if (id.startsWith("Grab") || id.startsWith("Tableware")) {
    //     setHighlightedGrab({ ...obstacle } as IGrabPosition, true);
    //   } else {
    //     setHighlightedFurniture({ ...obstacle } as IFurniturePosition, true);
    //   }
    // }
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
