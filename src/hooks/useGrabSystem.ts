import { EFoodType, EGrabType, GrabbedItem, IFoodWithRef } from "@/types/level";

import { Collider as RapierCollider } from "@dimforge/rapier3d-compat";
import { RapierRigidBody } from "@react-three/rapier";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type GrabbedColliderState = {
  collider: RapierCollider;
  prevSensor: boolean;
};

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
  return new THREE.Vector3(0, posY || 0, offsetZ);
};
export function useGrabSystem() {
  const [isReleasing, setIsReleasing] = useState(false);
  const [heldItem, setHeldItem] = useState<GrabbedItem | null>(null);
  const grabPositionRef = useRef(new THREE.Vector3(0.3, 0.8, 0.5));
  const grabbedCollidersRef = useRef<GrabbedColliderState[] | null>(null);
  const rigidBody = heldItem?.ref.current?.rigidBody;

  const unsubscribeRef = useRef<(() => void) | null>(null);

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
      food: IFoodWithRef,
      // customPosition: THREE.Vector3,
      customRotation?: THREE.Euler
    ) => {
      if (heldItem) {
        console.warn("Already holding an item");
        return;
      }
      const itemRef = food.ref;
      const rb = itemRef.current?.rigidBody;
      console.log(rb, "ddd");
      if (rb) {
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
        grabbedCollidersRef.current = disableColliders(rb);
      }
      console.log("grabItem ref:", itemRef, "current:", itemRef?.current);
      console.log("heldItem before:", heldItem);

      setHeldItem({
        ref: itemRef,
        offset: getOffset(food.type, food.grabbingPosition?.inHand || 0),
        rotation: customRotation,
      });
    },
    [heldItem]
  );

  const releaseItem = useCallback(() => {
    if (heldItem) {
      console.log("Released item:", heldItem.ref.current);
      setIsReleasing(true); // 设置释放状态
      restoreColliders(grabbedCollidersRef.current);
      grabbedCollidersRef.current = null;
      setHeldItem(null);
    }
  }, [heldItem]);

  const updateGrabPosition = useCallback(
    (position: THREE.Vector3) => {
      if (heldItem) {
        setHeldItem((prev) => ({
          ...prev!,
          offset: position.clone(),
        }));
      }
    },
    [heldItem]
  );

  /**
   * 检查给定位置是否在家具上
   * @param position - THREE.Vector3 类型的三维坐标位置
   * @returns 返回布尔值，表示位置是否在家具上
   */
  // const isPositionOnFurniture = (position: THREE.Vector3): boolean | ObstacleInfo => {
  //   const isOnFurniture = Array.from(obstacles.values()).find(obstacle => { // 遍历所有家具，检查位置是否在任何家具上
  //     if (!obstacle.isFurniture) {return false;}
  //     const [fx, fy, fz] = obstacle.position; // 解构家具的x、y、z坐标
  //     const furnitureSize = obstacle.size; // 标准家具尺寸

  //     // 检查是否在家具范围内
  //     // 通过比较目标位置与家具位置在各轴上的距离是否小于家具尺寸的一半
  //     return Math.abs(position.x - fx) <= furnitureSize[0] *0.7 &&
  //          Math.abs(position.y - fy) <= furnitureSize[1] *0.7 &&
  //          Math.abs(position.z - fz) <= furnitureSize[2] *0.7;

  //   });
  //   return isOnFurniture || false;
  // };

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
    [heldItem, grabItem, releaseItem, updateGrabPosition, isReleasing]
  );
}
