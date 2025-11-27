import { useObstacleStore } from "@/stores/useObstacle";
import { GrabbedItem } from "@/types/level";
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
  const [heldItem, setHeldItem] = useState<GrabbedItem | null>(null);
  const grabPositionRef = useRef(new THREE.Vector3(0.3, 0.8, 0.5));
  const grabbedCollidersRef = useRef<GrabbedColliderState[] | null>(null);
  const rigidBody = (heldItem?.ref.current as { rigidBody?: RapierRigidBody })
    ?.rigidBody;
  const { updateObstaclePosition } = useObstacleStore();
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

  const releaseItem = () => {
    if (heldItem) {
      console.log("Released item:", heldItem.ref.current);

      restoreColliders(grabbedCollidersRef.current);
      grabbedCollidersRef.current = null;
      setHeldItem(null);
      setTimeout(() => {
        if (rigidBody) {
          // rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
          // rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
          const currentTranslation = rigidBody.translation();
          updateObstaclePosition(rigidBody.handle, [
            currentTranslation.x,
            0,
            currentTranslation.z,
          ]);
          //     y: 0,
          //     z: currentTranslation.z,])
          // rigidBody.setTranslation(
          //   {
          //     x: currentTranslation.x,
          //     y: 0,
          //     z: currentTranslation.z,
          //   },
          //   true
          // );
        }
      }, 0);
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

  return {
    heldItem,
    grabItem,
    releaseItem,
    updateGrabPosition,
    isHolding: !!heldItem,
  };
}
