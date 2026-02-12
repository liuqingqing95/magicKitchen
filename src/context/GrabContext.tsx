import useHandleIngredients from "@/hooks/useHandleIngredients";
import { IFoodWithRef } from "@/types/level";
import React, { useMemo } from "react";
import * as THREE from "three";

interface GrabContextValue {
  modelMapRef: React.MutableRefObject<Map<
    string,
    THREE.Group<THREE.Object3DEventMap>
  > | null>;
  grabRef: React.MutableRefObject<IFoodWithRef | null>;
  handleIngredientsApi: ReturnType<typeof useHandleIngredients>;
  toolPosRef: React.MutableRefObject<Map<string, [number, number]> | null>;
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

export const GrabContext = React.createContext<GrabContextValue>({
  modelMapRef,
  grabRef,

  toolPosRef,
  handleIngredientsApi: {} as ReturnType<typeof useHandleIngredients>,
});

export const GrabContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const handleIngredientsApi = useHandleIngredients();

  const value = useMemo(
    () => ({
      handleIngredientsApi,
      modelMapRef,
      grabRef,

      toolPosRef,
    }),
    [handleIngredientsApi, modelMapRef, grabRef, toolPosRef],
  );

  return <GrabContext.Provider value={value}>{children}</GrabContext.Provider>;
};
