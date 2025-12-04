import { IFurniturePosition, useObstacleStore } from "@/stores/useObstacle";
import { GrabbedItem, IGrabPosition } from "@/types/level";

import { Collider as RapierCollider } from "@dimforge/rapier3d-compat";
import { RapierRigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import * as THREE from "three";

type ColliderAccessor = {
  numColliders: () => number;
  collider: (i: number) => RapierCollider | null;
};

type GrabbedColliderState = {
  collider: RapierCollider;
  prevSensor: boolean;
};

const disableColliders = (rigidBody: RapierRigidBody) => {
  const states: GrabbedColliderState[] = [];
  const accessor = rigidBody as unknown as ColliderAccessor;
  const count = accessor?.numColliders?.() ?? 0;
  for (let i = 0; i < count; i += 1) {
    const collider = accessor.collider(i);
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

export function useGrabSystem() {
  const [isReleasing, setIsReleasing] = useState(false); 
  const [heldItem, setHeldItem] = useState<GrabbedItem | null>(null);
  const grabPositionRef = useRef(new THREE.Vector3(0.3, 0.8, 0.5));
  const grabbedCollidersRef = useRef<GrabbedColliderState[] | null>(null);
  const rigidBody = (heldItem?.ref.current as { rigidBody?: RapierRigidBody })
    ?.rigidBody;
  const { updateObstaclePosition, getObstacleInfo, setFurnitureItems } = useObstacleStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  unsubscribeRef.current = useObstacleStore.subscribe(
    (state) => state.obstacles.get(rigidBody?.handle),
    (obstacle) => {
      if (rigidBody && obstacle && obstacle.position) {
        rigidBody.setTranslation(
          {
            x: obstacle.position[0],
            y: obstacle.position[1],
            z: obstacle.position[2],
          },
          true
        );

        if (obstacle.rotation) {
          rigidBody.setRotation(
            {
              x: obstacle.rotation[0],
              y: obstacle.rotation[1],
              z: obstacle.rotation[2],
              w: obstacle.rotation[3],
            },
            true
          );
        }
      }
    }
  );

  const grabItem = (
    itemRef: React.RefObject<THREE.Group>,
    customPosition?: THREE.Vector3
  ) => {
    if (heldItem) {
      console.warn("Already holding an item");
      return;
    }
    const rigidBody = (itemRef.current as { rigidBody?: RapierRigidBody })
      ?.rigidBody;
    if (rigidBody) {
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
      grabbedCollidersRef.current = disableColliders(rigidBody);
    }
    console.log("grabItem ref:", itemRef, "current:", itemRef?.current);
    console.log("heldItem before:", heldItem);

    setHeldItem({
      ref: itemRef,
      offset: customPosition || grabPositionRef.current.clone(),
    });
  };

  const releaseItem = (currentFurniture: false | IFurniturePosition) => {
    if (heldItem) {
      console.log("Released item:", heldItem.ref.current);
      setIsReleasing(true);  // 设置释放状态
      restoreColliders(grabbedCollidersRef.current);
      grabbedCollidersRef.current = null;
      setHeldItem(null);
    
      setTimeout(() => {
        if (rigidBody) {
        // rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        // rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
          
          const currentTranslation = rigidBody.translation();
           
          // const position = new THREE.Vector3(
          //   currentTranslation.x,
          //   currentTranslation.y,
          //   currentTranslation.z
          // );

          
          if (currentFurniture) {
            const info = getObstacleInfo(rigidBody.handle)! as IGrabPosition;
            const position:[number, number, number] = [(currentFurniture as IFurniturePosition).position[0], info?.grabbingPosition.inTable || 1.1, (currentFurniture as IFurniturePosition).position[2]]; // 根据家具类型调整高度
            updateObstaclePosition(rigidBody.handle, position);
            setFurnitureItems((currentFurniture as IFurniturePosition).id, [{id: info.id, type: info?.type }]);
          } else {
            updateObstaclePosition(rigidBody.handle, [
              currentTranslation.x,
              0,
              currentTranslation.z,
            ]);
          }
        
          setIsReleasing(false); 
        }

      }, 100);
    }
  };

  const updateGrabPosition = (position: THREE.Vector3) => {
    grabPositionRef.current.copy(position);
    if (heldItem) {
      setHeldItem((prev) => ({
        ...prev!,
        offset: position.clone(),
      }));
    }
  };

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

  

  return {
    heldItem,
    grabItem,
    releaseItem,
    updateGrabPosition,
    isHolding: !!heldItem,
    isReleasing
  };
}
