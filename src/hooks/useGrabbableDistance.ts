// hooks/useGrabbableDistance.ts
// import { getAllObstacles, ObstacleInfo } from "@/utils/obstacleRegistry";
import { ObstacleInfo, useObstacleStore } from "@/stores/useObstacle";
import { useEffect, useState } from "react";

const GRAB_DISTANCE = 1.5; // 可抓取距离阈值
const getClosestPoint = (obstacle: ObstacleInfo, playerPos: [number, number, number]) => {
  if (!obstacle.position || !obstacle.size) {
    return obstacle.position!;
  }

  const [px, py, pz] = playerPos;
  const [ox, oy, oz] = obstacle.position;
  const [width, height, depth] = obstacle.size;

  // 计算边界框的最近点
  const closestX = Math.max(ox - width/2, Math.min(px, ox + width/2));
  const closestY = Math.max(oy - height/2, Math.min(py, oy + height/2));
  const closestZ = Math.max(oz - depth/2, Math.min(pz, oz + depth/2));

  return [closestX, closestY, closestZ];
};


export function useGrabbableDistance(playerPosition: [number, number, number]) {
  const [nearbyObstacles, setNearbyObstacles] = useState<ObstacleInfo[]>([]);
  const obstacles = useObstacleStore((state) =>
    Array.from(state.obstacles.values())
  );

  useEffect(() => {
    const nearbyWithDistance = obstacles
      .map((obstacle) => {
        if (!obstacle.position) {
          return null;
        }

        // 获取最近点
        const closestPoint = getClosestPoint(obstacle, playerPosition);
      
        // 计算到最近点的距离
        const distance = Math.sqrt(
          Math.pow(playerPosition[0] - closestPoint[0], 2) +
        Math.pow(playerPosition[2] - closestPoint[2], 2)
        );

        return { obstacle, distance };
      })
      .filter(
        (item): item is { obstacle: ObstacleInfo; distance: number } =>
          item !== null && item.distance < GRAB_DISTANCE
      )
      .sort((a, b) => a.distance - b.distance);

    const nearest =
    nearbyWithDistance.length > 0 ? [nearbyWithDistance[0].obstacle] : [];
    setNearbyObstacles(nearest);
  }, [playerPosition, obstacles]);


  return {
    nearbyObstacles,
    isNearby: (handle: string) =>
      nearbyObstacles.some((obstacle) => obstacle.id === handle),
  };
}
