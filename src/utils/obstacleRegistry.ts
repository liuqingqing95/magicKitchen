export type ObstacleInfo = {
  id: string;
  type: "spinner" | "limbo" | "axe" | "wall" | string;
  position?: [number, number, number];
};

const obstacleMap = new Map<number, ObstacleInfo>();

export function registerObstacle(handle: number, info: ObstacleInfo) {
  obstacleMap.set(handle, info);
}

export function unregisterObstacle(handle: number) {
  obstacleMap.delete(handle);
}

export function isObstacleHandle(handle: number) {
  return obstacleMap.has(handle);
}

export function getObstacleInfo(handle: number) {
  return obstacleMap.get(handle);
}

// 添加获取所有障碍物的函数
export function getAllObstacles() {
  return Array.from(obstacleMap.values());
}
