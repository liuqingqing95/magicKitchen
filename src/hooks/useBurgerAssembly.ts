import { GrabContext } from "@/context/GrabContext";
import * as THREE from "three";

import { IFurniturePosition } from "@/stores/useObstacle";
import {
  EFoodType,
  EGrabType,
  IFoodWithRef,
  IGrabPosition,
  MultiFoodModelType,
} from "@/types/level";
import assemblyUtils from "@/utils/assembly";
import { useCallback, useContext } from "react";

export interface AssembleResult {
  newId: string;
  deleteIds: string[];
  dePositId: string;
}

export default function useBurgerAssembly() {
  const { grabSystemApi, obstacleStore } = useContext(GrabContext);
  const store = obstacleStore;
  const { heldItem, releaseItem } = grabSystemApi;

  const placeHeldItemOnFurniture = useCallback(
    (
      furnId: string,
      highlightedFurniture: IFurniturePosition | false,
      pos?: [number, number, number]
    ): {
      ok: boolean;
      mapping?: { id: string; type: EFoodType | EGrabType }[];
    } => {
      const held = heldItem as IFoodWithRef | undefined | null;
      if (!held || !held.ref || !held.ref.current) return { ok: false };
      const itemId = held.ref.current.id;
      const mapping = store.getGrabOnFurniture(furnId) || [];
      const ok = assemblyUtils.placeItemOnFurniture(furnId, itemId, pos);
      // release the item (changes its physics state)
      const rigidBody = heldItem?.ref.current?.rigidBody;

      try {
        releaseItem();
        if (rigidBody && highlightedFurniture !== false) {
          rigidBody.setTranslation(
            {
              x: highlightedFurniture.position[0],
              y: rigidBody.translation().y,
              z: highlightedFurniture.position[2],
            },
            true
          );
        }
      } catch (e) {
        // ignore
      }
      if (!ok) return { ok: false };

      return { ok: true, mapping };
    },
    [heldItem, releaseItem, store]
  );

  const removeItemFromFurniture = useCallback(
    (furnId: string, itemId: string) => {
      assemblyUtils.removeItemFromFurniture(furnId, itemId);
    },
    []
  );

  /**
   * Assemble burger on furniture and return typed result.
   * Note: we collect the part ids from furniture first, ensure at least one bread,
   * then call the assembly util which will unregister old obstacles and register the new one.
   */
  const assembleBurgerOnPlate = useCallback(
    (
      furnId: string,
      info: IGrabPosition,
      burgerId: string
    ): AssembleResult | null => {
      const current = store.getGrabOnFurniture(furnId) || [];
      if (!current.length) return null;

      const fillings = current
        .filter(
          (i) =>
            [
              EFoodType.cheese,
              EFoodType.eggCooked,
              EFoodType.meatPatty,
            ].findIndex((item) => item === i.type) !== -1
        )
        .map((i) => i.id);
      const deleteIds = current
        .filter((i) => {
          return i.type !== EGrabType.plate && i.type !== EFoodType.burger;
        })
        .map((i) => i.id)
        .concat(info.id);

      const hasBread = current.some(
        (i) =>
          i.type === EFoodType.cuttingBoardRound || i.type === EFoodType.burger
      );
      if (!hasBread) {
        if (
          info.type !== EFoodType.cuttingBoardRound &&
          info.type !== EFoodType.burger
        ) {
          return null;
        }
      }

      const newId = assemblyUtils.replaceItemsWithNewObstacle(
        furnId,
        deleteIds,
        {
          id: burgerId,
          type: EFoodType.burger,
        }
      );
      // hamberger组件中底座id(汉堡或者盘子)
      const dePositId =
        current.find((i) => i.type === EGrabType.plate)?.id || newId;
      return { newId, dePositId, deleteIds };
    },
    [store]
  );

  /**
   * Given the part ids and the local foods array (UI state), build a proper IFoodWithRef
   * representing the new burger with flattened layer descriptors (BaseFoodModelType[]).
   */
  const buildBurgerFood = useCallback(
    (
      newId: string,
      furnPosition: [number, number, number],
      info: IGrabPosition,
      foodModelTypes: {
        id: string;
        type: EFoodType;
      }[] = [],
      burgerModelClone: THREE.Group
    ): IFoodWithRef => {
      // Helper to extract layer descriptors from a food's foodModel or from its model
      // const extractLayers = (food: IFoodWithRef): BaseFoodModelType[] => {
      //   const layers: BaseFoodModelType[] = [];
      //   if (!food) return layers;
      //   if (food.foodModel) {
      //     // MultiFoodModelType
      //     if ((food.foodModel as MultiFoodModelType).type) {
      //       const multi = food.foodModel as MultiFoodModelType;
      //       multi.type.forEach((sub) => {
      //         // clone sub.model to avoid shared meshes
      //         layers.push({
      //           id: sub.id,
      //           model: sub.model.clone(),
      //           type: sub.type,
      //         });
      //       });
      //     } else {
      //       // BaseFoodModelType
      //       const base = food.foodModel as BaseFoodModelType;
      //       layers.push({
      //         id: base.id,
      //         model: base.model.clone(),
      //         type: base.type,
      //       });
      //     }
      //   } else {
      //     // fallback: use the food's model itself as a single layer
      //     layers.push({
      //       id: food.id,
      //       model: food.model.clone(),
      //       type: food.type as EFoodType,
      //     });
      //   }
      //   return layers;
      // };

      // Flatten layers from all parts preserving order from partIds
      const flattened: {
        id: string;
        type: EFoodType;
      }[] =
        info.type === EFoodType.cuttingBoardRound
          ? foodModelTypes
          : foodModelTypes.concat({
              id: info.id,
              type: info.type as EFoodType,
            });
      // partIds.forEach((pid) => {
      //   const f = foodModelTypes.find((it) => it.id === pid);
      //   if (!f) return;
      //   const l = extractLayers(f);
      //   flattened.push(...l);
      // });

      const burgerFood: IFoodWithRef = {
        id: newId,
        position: furnPosition,
        type: EFoodType.burger,
        model: burgerModelClone,
        size: [1, 1, 1],
        grabbingPosition: undefined,
        isFurniture: false,
        foodModel: {
          id: newId,
          model: burgerModelClone,
          type: flattened,
        } as MultiFoodModelType,
        ref: { current: { id: newId, rigidBody: undefined } },
        area: "table",
      };

      return burgerFood;
    },
    []
  );

  const startCooking = useCallback((itemId: string) => {
    assemblyUtils.startCooking(itemId);
  }, []);

  const finishCooking = useCallback((itemId: string) => {
    assemblyUtils.finishCooking(itemId);
  }, []);

  const markCutDone = useCallback((itemId: string) => {
    assemblyUtils.markCutDone(itemId);
  }, []);

  return {
    placeHeldItemOnFurniture,
    removeItemFromFurniture,
    assembleBurgerOnPlate,
    buildBurgerFood,
    startCooking,
    finishCooking,
    markCutDone,
  };
}
