import { COLLISION_PRESETS } from "@/constant/collisionGroups";
import { useFurnitureObstacleStore } from "@/stores/useFurnitureObstacle";
import { EFurnitureType } from "@/types/level";
import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
// import { IFurniturePosition } from "@/stores/useObstacle";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import React, { forwardRef, useEffect } from "react";
import * as THREE from "three";

type ItemVal = {
  type: EFurnitureType;
  model: THREE.Object3D;
  position: [number, number, number];
  rotation: [number, number, number];
};

type Props = {
  type: EFurnitureType;
  highlighted: boolean;
  val: React.MutableRefObject<ItemVal | undefined>;
  instanceKey: string;
  animations?: THREE.AnimationClip[];
};

const FurnitureEntityImpl = forwardRef<RapierRigidBody | null, Props>(
  ({ val, instanceKey, highlighted, type, animations }, ref) => {
    const item = val.current;
    if (!item) return null;
    const { model, position, rotation } = item;
    const scale: [number, number, number] = [0.99, 0.8, 0.99];

    const modelRef = React.useRef<THREE.Group>(null);
    const { actions, mixer } = useAnimations(animations || [], modelRef);
    useEffect(() => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (highlighted) {
            material.emissive = new THREE.Color("#ff9800");
            material.emissiveIntensity = 0.3;
            material.roughness = 0.4;
            material.metalness = 0.3;
          } else {
            material.emissive = new THREE.Color(0x000000);
            material.emissiveIntensity = 0;
            material.roughness = 0.8;
            material.metalness = 0.2;
          }
        }
      });
      // apply highlight to this entity if it's selected
    }, [highlighted, model]);

    const createRender = () => {
      return (
        <>
          <primitive ref={modelRef} object={model} position={[0, 0, 0]} />
          <CuboidCollider
            args={[scale[0], 0.51, scale[2]]}
            position={[0, 0, 0]}
            restitution={0.2}
            friction={1}
          />
        </>
      );
    };
    const renderServeDishes = () => {
      const obj = model.getObjectByName("direction") as THREE.Mesh;
      if (!obj) {
        return null;
      }

      useFrame(() => {
        (obj.material as THREE.MeshStandardMaterial)!.map!.offset.x += 0.018;
      });
      return createRender();
    };

    const renderFoodTable = () => {
      const { openFoodTable } = useFurnitureObstacleStore((s) => ({
        openFoodTable: s.openFoodTable,
      }));
      useEffect(() => {
        const action = actions.coverOpen;
        if (action) {
          action.reset();
          action.clampWhenFinished = true;
          action.setLoop(THREE.LoopOnce, 1);
          action.setEffectiveWeight(0);
          action.timeScale = 1;
        }
      }, [actions]);

      useEffect(() => {
        const action = actions["coverOpen"];
        if (action && openFoodTable.get(instanceKey) !== undefined) {
          action.reset().play();
          action.setEffectiveWeight(1);
        }

        // 切割动画
        // } else {
        //   // isCuttingActionPlay.current = true;
        //   cutRotationAction.setEffectiveWeight(0);
        //   cutRotationAction.stop();
        // }
      }, [openFoodTable.get(instanceKey)]);
      return createRender();
    };
    return (
      <RigidBody
        type="fixed"
        restitution={0.2}
        friction={0}
        position={position}
        rotation={rotation}
        userData={instanceKey}
        colliders={false}
        collisionGroups={COLLISION_PRESETS.FURNITURE}
        ref={ref as any}
      >
        {type === EFurnitureType.serveDishes
          ? renderServeDishes()
          : type === EFurnitureType.foodTable
            ? renderFoodTable()
            : createRender()}
      </RigidBody>
    );
  },
);

export default React.memo(FurnitureEntityImpl);
FurnitureEntityImpl.displayName = "FurnitureEntityImpl";
