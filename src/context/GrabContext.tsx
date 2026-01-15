import { useGrabSystem } from "@/hooks/useGrabSystem";
import { IFoodWithRef } from "@/types/level";
import React, { useMemo, useState } from "react";
import * as THREE from "three";

interface GrabContextValue {
  modelMapRef: React.MutableRefObject<Map<
    string,
    THREE.Group<THREE.Object3DEventMap>
  > | null>;
  grabRef: React.MutableRefObject<IFoodWithRef | null>;
  grabSystemApi: ReturnType<typeof useGrabSystem>;
  clickGrab: {
    isGrab: boolean;
    setIsGrab: React.Dispatch<React.SetStateAction<boolean>>;
  };
}
const modelMapRef: React.RefObject<
  Map<string, THREE.Group<THREE.Object3DEventMap>>
> = {
  current: new Map(),
};

const grabRef = React.createRef<IFoodWithRef | null>();

export const GrabContext = React.createContext<GrabContextValue>({
  modelMapRef,
  grabRef,
  clickGrab: {
    isGrab: false,
    setIsGrab: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  },

  grabSystemApi: {} as ReturnType<typeof useGrabSystem>,
});

export const GrabContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isGrab, setIsGrab] = useState<boolean>(false);
  // 调用一次 useGrabSystem 并把返回的 API 对象放到 context 中，保证所有消费者拿到相同实例
  const grabSystemApi = useGrabSystem();
  const value = useMemo(
    () => ({
      grabSystemApi,
      modelMapRef,
      grabRef,
      clickGrab: { isGrab, setIsGrab },
    }),
    [grabSystemApi, isGrab, setIsGrab]
  );

  return <GrabContext.Provider value={value}>{children}</GrabContext.Provider>;
};
