import {
  EFoodType,
  EGrabType,
  GrabbedItem,
  IFoodWithRef,
  TPLayerId,
} from "@/types/level";

import { Collider as RapierCollider } from "@dimforge/rapier3d-compat";
import { RapierRigidBody } from "@react-three/rapier";
import { useCallback, useMemo, useState } from "react";
import * as THREE from "three";

type GrabbedColliderState = {
  collider: RapierCollider;
  prevSensor: boolean;
};
interface IGrabItemProps {
  food: IFoodWithRef;
  model: THREE.Group<THREE.Object3DEventMap> | null;
  baseFoodModel: THREE.Group<THREE.Object3DEventMap> | null;
  clone?: boolean;
  customRotation?: [number, number, number];
}

const disableColliders = (rigidBody: RapierRigidBody) => {
  const states: GrabbedColliderState[] = [];
  const count = rigidBody?.numColliders() || 0;
  for (let i = 0; i < count; i += 1) {
    const collider = rigidBody.collider(i);
    if (!collider) {
      continue;
    }
    states.push({
      collider,
      prevSensor: collider.isSensor(),
    });
    collider.setSensor(true);
  }
  return states;
};

const restoreColliders = (states: GrabbedColliderState[] | null) => {
  if (!states) {
    return;
  }
  states.forEach((state) => {
    state.collider.setSensor(state.prevSensor);
  });
};
export const getOffset = (foodType: EFoodType | EGrabType, posY: number) => {
  let offsetZ = 1.4;
  switch (foodType) {
    case EGrabType.plate:
    case EGrabType.fireExtinguisher:
      offsetZ = 1.5;
      break;
    case EFoodType.tomato:
      offsetZ = 1.3;
      break;
    case EGrabType.pan:
      offsetZ = 1.4;
      break;
    case EFoodType.burger:
    case EFoodType.cheese:

    case EFoodType.meatPatty:
      offsetZ = 1.2;
      break;
    default:
      offsetZ = 1.4;
  }
  return [0, posY || 0, offsetZ] as [number, number, number]; //new THREE.Vector3(0, posY || 0, offsetZ);
};
export function useGrabSystem() {
  // 多玩家状态：使用 Map 存储每个玩家的持有物品
  const [heldItemsMap, setHeldItemsMap] = useState<Map<TPLayerId, GrabbedItem>>(
    new Map(),
  );

  // const grabbedCollidersRef = useRef<GrabbedColliderState[] | null>(null);

  // const unsubscribeRef = useRef<(() => void) | null>(null);

  // unsubscribeRef.current = useObstacleStore.subscribe(
  //   (state) => state.obstacles.get(heldItem?.ref.current?.id || ""),
  //   (obstacle) => {
  //     if (rigidBody && obstacle && obstacle.position) {
  //       rigidBody.setTranslation(
  //         {
  //           x: obstacle.position[0],
  //           y: obstacle.position[1],
  //           z: obstacle.position[2],
  //         },
  //         true
  //       );
  //       const grab = obstacle as IGrabPosition;
  //       if (grab.rotation) {
  //         rigidBody.setRotation(
  //           {
  //             x: grab.rotation[0],
  //             y: grab.rotation[1],
  //             z: grab.rotation[2],
  //             w: grab.rotation[3],
  //           },
  //           true
  //         );
  //       }
  //     }
  //   }
  // );

  const grabItem = useCallback(
    (
      playerId: TPLayerId,
      {
        food,
        model,
        baseFoodModel,
        customRotation,
        clone = true,
      }: IGrabItemProps,
    ) => {
      console.log(model, "ddd");
      if (model) {
        // model.rotation.set(0, 0, 0);
        // rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        // rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        // grabbedCollidersRef.current = disableColliders(rigidBody);
      }
      if (baseFoodModel) {
        baseFoodModel.rotation.set(0, 0, 0);
      }
      console.log(`heldItem before (${playerId}):`, heldItemsMap.get(playerId));

      // Ensure the held item state and its cloned models are applied synchronously
      // so the hand-mounted model is available the same frame the world instance
      // is hidden. This avoids a one-frame flash where neither is visible.
      const modelTemp = model ? model.clone() : null;
      const baseFoodModelTemp = baseFoodModel ? baseFoodModel.clone() : null;

      setHeldItemsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(playerId, {
          id: food.id,
          hand: food,
          // foodModelId: food.foodModel?.id,
          model: modelTemp,
          baseFoodModel: baseFoodModelTemp || null,
          offset: getOffset(food.type, food.grabbingPosition?.inHand || 0),
          rotation: customRotation,
        });
        return newMap;
      });
    },
    [heldItemsMap],
  );

  const releaseItem = useCallback(
    (playerId: TPLayerId) => {
      const heldItem = heldItemsMap.get(playerId);
      if (heldItem) {
        console.log(`Released item (${playerId}):`, heldItem);
        setIsReleasing(true); // 设置释放状态
        // restoreColliders(grabbedCollidersRef.current);
        // grabbedCollidersRef.current = null;
        setHeldItemsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(playerId);
          return newMap;
        });
      }
    },
    [heldItemsMap],
  );

  const updateGrabPosition = useCallback(
    (playerId: TPLayerId, position: [number, number, number]) => {
      const heldItem = heldItemsMap.get(playerId);
      if (heldItem) {
        setHeldItemsMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(playerId, {
            ...heldItem,
            // foodModelId: prev?.foodModelId,
            offset: position,
          });
          return newMap;
        });
      }
    },
    [heldItemsMap],
  );

  return useMemo(
    () => ({
      // 多玩家持有的物品 Map
      heldItemsMap,
      // 获取指定玩家的持有物品
      getHeldItem: (playerId: TPLayerId) => heldItemsMap.get(playerId) || null,
      // 兼容旧代码：获取第一个玩家的持有物品
      // heldItem: heldItemsMap.get("firstPlayer") || null,
      grabItem,
      releaseItem,
      updateGrabPosition,
      holdStatus: (playerId?: TPLayerId) =>
        playerId ? !!heldItemsMap.get(playerId) : heldItemsMap.size > 0,
      isHolding: heldItemsMap.size > 0,
      // 获取指定玩家是否持有物品
      isPlayerHolding: (playerId: TPLayerId) => !!heldItemsMap.get(playerId),
    }),
    [heldItemsMap, grabItem, releaseItem, updateGrabPosition],
  );
}
