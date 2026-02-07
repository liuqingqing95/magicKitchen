import { useGrabSystem } from "@/hooks/useGrabSystem";
import useHandleIngredients from "@/hooks/useHandleIngredients";
import { IFoodWithRef } from "@/types/level";
import React, { useMemo, useState } from "react";
import * as THREE from "three";

interface GrabContextValue {
  modelMapRef: React.MutableRefObject<Map<
    string,
    THREE.Group<THREE.Object3DEventMap>
  > | null>;
  grabRef: React.MutableRefObject<IFoodWithRef | null>;
  pendingGrabIdRef: React.MutableRefObject<string | null>;
  grabSystemApi: ReturnType<typeof useGrabSystem>;
  handleIngredientsApi: ReturnType<typeof useHandleIngredients>;
  toolPosRef: React.MutableRefObject<Map<string, [number, number]> | null>;
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
// 洗碗，切菜位置
const toolPosRef: React.RefObject<Map<string, [number, number]>> = {
  current: new Map(),
};
const pendingGrabIdRef = React.createRef<string | null>();
export const GrabContext = React.createContext<GrabContextValue>({
  modelMapRef,
  grabRef,
  clickGrab: {
    isGrab: false,
    setIsGrab: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  },
  pendingGrabIdRef,
  toolPosRef,
  grabSystemApi: {} as ReturnType<typeof useGrabSystem>,
  handleIngredientsApi: {} as ReturnType<typeof useHandleIngredients>,
});

export const GrabContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isGrab, setIsGrab] = useState<boolean>(false);
  // 调用一次 useGrabSystem 并把返回的 API 对象放到 context 中，保证所有消费者拿到相同实例
  const grabSystemApi = useGrabSystem();
  const handleIngredientsApi = useHandleIngredients();
  const value = useMemo(
    () => ({
      grabSystemApi,
      handleIngredientsApi,
      modelMapRef,
      grabRef,
      clickGrab: { isGrab, setIsGrab },
      pendingGrabIdRef,
      toolPosRef,
    }),
    [grabSystemApi, handleIngredientsApi, isGrab, setIsGrab],
  );

  return <GrabContext.Provider value={value}>{children}</GrabContext.Provider>;
};
