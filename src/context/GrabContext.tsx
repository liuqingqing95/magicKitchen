import { useGrabSystem } from "@/hooks/useGrabSystem";
import { ObstacleStore, useObstacleStore } from "@/stores/useObstacle";
import React from "react";

interface GrabContextValue {
  obstacleStore: ObstacleStore;
  // grabApi 是 useGrabSystem() 的返回对象实例（在 Provider 中只调用一次）
  grabSystemApi: ReturnType<typeof useGrabSystem>;
}

export const GrabContext = React.createContext<GrabContextValue>({
  obstacleStore: {} as ObstacleStore,
  grabSystemApi: {} as ReturnType<typeof useGrabSystem>,
});

export const GrabContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const obstacleStore = useObstacleStore();
  // 调用一次 useGrabSystem 并把返回的 API 对象放到 context 中，保证所有消费者拿到相同实例
  const grabSystemApi = useGrabSystem();
  return (
    <GrabContext.Provider value={{ obstacleStore, grabSystemApi }}>
      {children}
    </GrabContext.Provider>
  );
};
