import { EFoodType, EGrabType, GrabbedItem, IFoodWithRef } from "@/types/level";

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
  const [isReleasing, setIsReleasing] = useState(false);
  const [heldItem, setHeldItem] = useState<GrabbedItem | null>(null);

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
    ({
      food,
      model,
      baseFoodModel,
      customRotation,
      clone = true,
    }: IGrabItemProps) => {
      // if (heldItem) {
      //   console.warn("Already holding an item");
      //   return;
      // }
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
      console.log("heldItem before:", heldItem);

      // Ensure the held item state and its cloned models are applied synchronously
      // so the hand-mounted model is available the same frame the world instance
      // is hidden. This avoids a one-frame flash where neither is visible.
      const modelTemp = clone && model ? model.clone() : model;
      const baseFoodModelTemp =
        clone && baseFoodModel ? baseFoodModel.clone() : baseFoodModel;

      setHeldItem({
        id: food.id,
        hand: food,
        // foodModelId: food.foodModel?.id,
        model: modelTemp,
        baseFoodModel: baseFoodModelTemp || null,
        offset: getOffset(food.type, food.grabbingPosition?.inHand || 0),
        rotation: customRotation,
      });
    },
    [heldItem],
  );

  const releaseItem = useCallback(() => {
    if (heldItem) {
      console.log("Released item:", heldItem);
      setIsReleasing(true); // 设置释放状态
      // restoreColliders(grabbedCollidersRef.current);
      // grabbedCollidersRef.current = null;
      setHeldItem(null);
    }
  }, [heldItem]);

  const updateGrabPosition = useCallback(
    (position: [number, number, number]) => {
      if (heldItem) {
        setHeldItem((prev) => ({
          ...prev!,
          // foodModelId: prev?.foodModelId,
          offset: position,
        }));
      }
    },
    [heldItem],
  );

  return useMemo(
    () => ({
      heldItem,
      grabItem,
      releaseItem,
      updateGrabPosition,
      holdStatus: () => !!heldItem,
      isHolding: !!heldItem,
      isReleasing,
    }),
    [heldItem, grabItem, releaseItem, updateGrabPosition, isReleasing],
  );
}
