// hooks/useGrabbableDistance.ts
// import { getAllObstacles, ObstacleInfo } from "@/utils/obstacleRegistry";
import {
  IFurniturePosition,
  ObstacleInfo,
  useObstacleStore,
} from "@/stores/useObstacle";
import { IGrabPosition } from "@/types/level";
import { useEffect, useState } from "react";
import * as THREE from "three";

const GRAB_DISTANCE = 1.5; // 可抓取距离阈值
const getClosestPoint = (
  obstacle: ObstacleInfo,
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

export function useGrabbableDistance(playerPosition: [number, number, number]) {
  const [nearbyGrabObstacles, setNearbyGrabObstacles] = useState<
    ObstacleInfo[]
  >([]);
  const [furnitureHighlight, setFurnitureHighlight] = useState<
    IFurniturePosition | false
  >(false);
  const obstacles = useObstacleStore((state) =>
    Array.from(state.obstacles.values()),
  );
  const furnitureObstacles = obstacles.filter(
    (obstacle) => obstacle.isFurniture === true,
  );
  const grabObstacles = obstacles.filter(
    (obstacle) => obstacle.isFurniture !== true,
  );

  useEffect(() => {
    const nearbyWithDistance = grabObstacles
      .map((obstacle) => {
        if (!obstacle.position) {
          return null;
        }

        // 获取最近点
        const closestPoint = getClosestPoint(obstacle, playerPosition);

        // 计算到最近点的距离
        const distance = Math.sqrt(
          Math.pow(playerPosition[0] - closestPoint[0], 2) +
            Math.pow(playerPosition[2] - closestPoint[2], 2),
        );

        return { obstacle, distance };
      })
      .filter(
        (item): item is { obstacle: IGrabPosition; distance: number } =>
          item !== null && item.distance < GRAB_DISTANCE,
      )
      .sort((a, b) => a.distance - b.distance);

    const nearest =
      nearbyWithDistance.length > 0 ? [nearbyWithDistance[0].obstacle] : [];
    setNearbyGrabObstacles(nearest);

    isPositionOnFurniture(playerPosition);
  }, [playerPosition]);
  const isPositionOnFurniture = (pos: [number, number, number]) => {
    const position = new THREE.Vector3(...pos);
    let nearestFurniture: ObstacleInfo | null = null;
    let minDistance = Infinity;

    Array.from(obstacles.values()).forEach((obstacle) => {
      if (!obstacle.isFurniture) {
        return;
      }

      // 获取家具的最近点
      const closestPoint = new THREE.Vector3(
        Math.max(
          obstacle.position[0] - obstacle.size[0] / 2,
          Math.min(position.x, obstacle.position[0] + obstacle.size[0] / 2),
        ),
        Math.max(
          obstacle.position[1] - obstacle.size[1] / 2,
          Math.min(position.y, obstacle.position[1] + obstacle.size[1] / 2),
        ),
        Math.max(
          obstacle.position[2] - obstacle.size[2] / 2,
          Math.min(position.z, obstacle.position[2] + obstacle.size[2] / 2),
        ),
      );

      // 计算到最近点的距离
      const distance = position.distanceTo(closestPoint);

      if (distance < minDistance) {
        minDistance = distance;
        nearestFurniture = obstacle;
      }
    });

    // 设置一个阈值来判断是否在家具附近
    const NEARBY_THRESHOLD = 1.5;
    if (minDistance <= NEARBY_THRESHOLD) {
      setFurnitureHighlight(nearestFurniture! as IFurniturePosition);
    } else {
      setFurnitureHighlight(false);
    }
  };
  return {
    nearbyGrabObstacles,
    furnitureObstacles,
    furnitureHighlight,
    isNearby: (handle: string) =>
      nearbyGrabObstacles.some((obstacle) => obstacle.id === handle),
  };
}
