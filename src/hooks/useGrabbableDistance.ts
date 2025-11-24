// hooks/useGrabbableDistance.ts
import { getAllObstacles, ObstacleInfo } from "@/utils/obstacleRegistry";
import { useEffect, useState } from "react";

const GRAB_DISTANCE = 1; // 可抓取距离阈值

export function useGrabbableDistance(playerPosition: [number, number, number]) {
  // const [nearbyObstacles, setNearbyObstacles] = useState<ObstacleInfo[]>([]);
  const [nearbyObstacles, setNearbyObstacles] = useState<ObstacleInfo[]>([]);

  useEffect(() => {
    const obstacles = getAllObstacles();
    const nearbyWithDistance = obstacles
      .map((obstacle) => {
        if (!obstacle.position) {
          return null;
        }

        const distance = Math.sqrt(
          Math.pow(playerPosition[0] - obstacle.position[0], 2) +
            Math.pow(playerPosition[2] - obstacle.position[2], 2)
        );

        return { obstacle, distance };
      })
      .filter(
        (item): item is { obstacle: ObstacleInfo; distance: number } =>
          item !== null && item.distance < GRAB_DISTANCE
      )
      .sort((a, b) => a.distance - b.distance); // 按距离排序

    // 只取最近的障碍物
    const nearest =
      nearbyWithDistance.length > 0 ? [nearbyWithDistance[0].obstacle] : [];
    setNearbyObstacles(nearest);
  }, [playerPosition]);

  return {
    nearbyObstacles,
    isNearby: (handle: string) =>
      nearbyObstacles.some((obstacle) => obstacle.id === handle),
  };
}
