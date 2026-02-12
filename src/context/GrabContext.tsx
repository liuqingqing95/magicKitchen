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
  // heldItem: {
  //   heldItemsMap: Map<TPLayerId, GrabbedItem>;
  //   setHeldItemsMap: React.Dispatch<
  //     React.SetStateAction<Map<TPLayerId, GrabbedItem>>
  //   >;
  // };
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
  toolPosRef,
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

  const handleIngredientsApi = useHandleIngredients();
  const wrappedSetIsGrab = useMemo(() => createPlayerSetter(setIsGrab), []);
  const wrappedSetIsIngredient = useMemo(
    () => createPlayerSetter(setIsIngredient),
    [],
  );

  const value = useMemo(
    () => ({
      handleIngredientsApi,
      modelMapRef,
      grabRef,
      clickGrab: { isGrab, setIsGrab: wrappedSetIsGrab },
      clickIngredient: {
        isIngredient,
        setIsIngredient: wrappedSetIsIngredient,
      },
      toolPosRef,
    }),
    [
      handleIngredientsApi,
      isGrab,
      isIngredient,

      wrappedSetIsGrab,
      wrappedSetIsIngredient,
    ],
  );

  return <GrabContext.Provider value={value}>{children}</GrabContext.Provider>;
};
