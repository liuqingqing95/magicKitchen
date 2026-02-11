import { useGrabSystem } from "@/hooks/useGrabSystem";
import useHandleIngredients from "@/hooks/useHandleIngredients";
import { IFoodWithRef, TPLayerId } from "@/types/level";
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
    isGrab: Record<TPLayerId, boolean>;
    setIsGrab: (
      playerId: TPLayerId,
      value: boolean | ((prev: boolean) => boolean),
    ) => void;
  };
  clickIngredient: {
    isIngredient: Record<TPLayerId, boolean>;
    setIsIngredient: (
      playerId: TPLayerId,
      value: boolean | ((prev: boolean) => boolean),
    ) => void;
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

const createPlayerSetter = (
  setter: React.Dispatch<React.SetStateAction<Record<TPLayerId, boolean>>>,
) => {
  return (
    playerId: TPLayerId,
    value: boolean | ((prev: boolean) => boolean),
  ) => {
    setter((prev) => {
      const newValue =
        typeof value === "function"
          ? (value as (prev: boolean) => boolean)(prev[playerId])
          : value;
      return { ...prev, [playerId]: newValue };
    });
  };
};

export const GrabContext = React.createContext<GrabContextValue>({
  modelMapRef,
  grabRef,
  clickGrab: {
    isGrab: { firstPlayer: false, secondPlayer: false },
    setIsGrab: (() => {}) as any,
  },
  clickIngredient: {
    isIngredient: { firstPlayer: false, secondPlayer: false },
    setIsIngredient: (() => {}) as any,
  },
  pendingGrabIdRef,
  toolPosRef,
  grabSystemApi: {} as ReturnType<typeof useGrabSystem>,
  handleIngredientsApi: {} as ReturnType<typeof useHandleIngredients>,
});

export const GrabContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isGrab, setIsGrab] = useState<Record<TPLayerId, boolean>>({
    firstPlayer: false,
    secondPlayer: false,
  });
  const [isIngredient, setIsIngredient] = useState<Record<TPLayerId, boolean>>({
    firstPlayer: false,
    secondPlayer: false,
  });

  // 调用一次 useGrabSystem 并把返回的 API 对象放到 context 中，保证所有消费者拿到相同实例
  const grabSystemApi = useGrabSystem();
  const handleIngredientsApi = useHandleIngredients();

  const wrappedSetIsGrab = useMemo(() => createPlayerSetter(setIsGrab), []);
  const wrappedSetIsIngredient = useMemo(
    () => createPlayerSetter(setIsIngredient),
    [],
  );

  const value = useMemo(
    () => ({
      grabSystemApi,
      handleIngredientsApi,
      modelMapRef,
      grabRef,
      clickGrab: { isGrab, setIsGrab: wrappedSetIsGrab },
      clickIngredient: {
        isIngredient,
        setIsIngredient: wrappedSetIsIngredient,
      },
      pendingGrabIdRef,
      toolPosRef,
    }),
    [
      grabSystemApi,
      handleIngredientsApi,
      isGrab,
      isIngredient,
      wrappedSetIsGrab,
      wrappedSetIsIngredient,
    ],
  );

  return <GrabContext.Provider value={value}>{children}</GrabContext.Provider>;
};
