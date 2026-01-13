import { IFurniturePosition, useObstacleStore } from "@/stores/useObstacle";
import { ERigidBodyType, IGrabPosition } from "@/types/level";
import { useCallback, useRef } from "react";
const getClosestPoint = (
  obstacle: IGrabPosition | IFurniturePosition,
  playerPos: [number, number, number]
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

export function useGrabNear(playerPos?: [number, number, number]) {
  // 添加位置比较，避免重复计算
  const lastPos = useRef(playerPos);
  const lastFurnitureResult = useRef<IFurniturePosition | false>(false);
  const lastGrabResult = useRef<IGrabPosition | false>(false);

  // Writer-only mode: when no playerPos is provided, return only writer functions
  if (!playerPos) {
    const isHighLight = useCallback((id: string, light: boolean) => {
      const store = useObstacleStore.getState();
      const obstacle = store.getObstacleInfo(id);
      if (!obstacle) return;

      if (!light) {
        if (id.startsWith("Grab") || id.startsWith("Tableware")) {
          store.setHighlightedGrab(obstacle as IGrabPosition, false);
        } else {
          store.setHighlightedFurniture(obstacle as IFurniturePosition, false);
        }
        return;
      }

      // only update if changed
      if (!store.highlightedFurniture.find((item) => item.id === id)) {
        if (id.startsWith("Grab") || id.startsWith("Tableware")) {
          store.setHighlightedGrab({ ...obstacle } as IGrabPosition, true);
        } else {
          store.setHighlightedFurniture(
            { ...obstacle } as IFurniturePosition,
            true
          );
        }
      }
    }, []);

    return { isHighLight } as any;
  }

  // Reader mode: subscribe to highlighted lists when playerPos is provided
  const {
    getObstacleInfo,
    setHighlightedFurniture,
    highlightedGrab,
    setHighlightedGrab,
    highlightedFurniture,
  } = useObstacleStore((s) => {
    return {
      setHighlightedFurniture: s.setHighlightedFurniture,
      getObstacleInfo: s.getObstacleInfo,
      setHighlightedGrab: s.setHighlightedGrab,
      highlightedGrab: s.highlightedGrab,
      highlightedFurniture: s.highlightedFurniture,
    };
  });

  const isHighLight = (id: string, light: boolean) => {
    const obstacle = getObstacleInfo(id);
    if (!light) {
      if (id.startsWith("Grab") || id.startsWith("Tableware")) {
        setHighlightedGrab(obstacle as IGrabPosition, false);
      } else {
        setHighlightedFurniture(obstacle as IFurniturePosition, false);
      }

      return;
    }

    if (!obstacle) return;
    // only update if changed
    if (!highlightedFurniture.find((item) => item.id === id)) {
      if (id.startsWith("Grab") || id.startsWith("Tableware")) {
        setHighlightedGrab({ ...obstacle } as IGrabPosition, true);
      } else {
        setHighlightedFurniture({ ...obstacle } as IFurniturePosition, true);
      }
    }
  };

  const getNearest = useCallback(
    (type: ERigidBodyType, isHolding: boolean = false) => {
      if (!playerPos) return false;
      const obj: IFurniturePosition[] | IGrabPosition[] =
        type === ERigidBodyType.furniture
          ? highlightedFurniture
          : highlightedGrab;
      if (isHolding) {
        return obj[0];
      }

      if (
        lastPos.current &&
        Math.abs(lastPos.current[0] - playerPos[0]) < 0.1 &&
        Math.abs(lastPos.current[2] - playerPos[2]) < 0.1
      ) {
        return type === ERigidBodyType.furniture
          ? lastFurnitureResult.current
          : lastGrabResult.current;
      }

      const nearbyWithDistance = obj
        .map((obstacle) => {
          if (!obstacle.position) {
            return null;
          }

          const closestPoint = getClosestPoint(obstacle, playerPos);
          const distance = Math.sqrt(
            Math.pow(playerPos[0] - closestPoint[0], 2) +
              Math.pow(playerPos[2] - closestPoint[2], 2)
          );

          return { obstacle, distance };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);

      const nearest =
        nearbyWithDistance.length > 0 ? nearbyWithDistance[0]!.obstacle : false;

      lastPos.current = playerPos;
      if (type === ERigidBodyType.furniture) {
        lastFurnitureResult.current = nearest as IFurniturePosition | false;
      } else {
        lastGrabResult.current = nearest as IGrabPosition | false;
      }

      return nearest;
    },
    [highlightedFurniture, highlightedGrab]
  );

  return {
    grabNearList: highlightedGrab,
    furnitureNearList: highlightedFurniture,
    isHighLight,
    getNearest,
  };
}
