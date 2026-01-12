import { COLLISION_PRESETS } from "@/constant/collisionGroups";
// import { IFurniturePosition } from "@/stores/useObstacle";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import React, { forwardRef, useEffect } from "react";
import * as THREE from "three";

type ItemVal = {
  model: THREE.Object3D;
  position: [number, number, number];
  rotation: [number, number, number];
};

type Props = {
  highlighted: boolean;
  val: React.MutableRefObject<ItemVal | undefined>;
  instanceKey: string;
};

const FurnitureEntityImpl = forwardRef<RapierRigidBody | null, Props>(
  ({ val, instanceKey, highlighted }, ref) => {
    const item = val.current;
    if (!item) return null;
    const { model, position, rotation } = item;
    const scale: [number, number, number] = [0.99, 0.8, 0.99];

    // useEffect(() => {
    //   try {
    //     if (!ref) return;
    //     model.position.set(position[0], position[1], position[2]);
    //     model.rotation.set(rotation[0], rotation[1], rotation[2]);
    //   } catch (e) {}
    //   return () => {};
    // }, [model, position, ref, rotation]);

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
    // useEffect(() => {
    //   try {
    //     model.traverse((child) => {
    //       if (child instanceof THREE.Mesh) {
    //         const mat = child.material as THREE.MeshStandardMaterial;
    //         if (isHighlighted) {
    //           mat.emissive = new THREE.Color("#ff9800");
    //           mat.emissiveIntensity = 0.3;
    //           mat.roughness = 0.4;
    //           mat.metalness = 0.3;
    //         } else {
    //           mat.emissive = new THREE.Color(0x000000);
    //           mat.emissiveIntensity = 0;
    //           mat.roughness = 0.8;
    //           mat.metalness = 0.2;
    //         }
    //       }
    //     });
    //   } catch (e) {}
    // }, [isHighlighted, model]);
    // console.log("FurnitureEntity render:", instanceKey, highlighted);
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
        <primitive object={model} position={[0, 0, 0]} />
        <CuboidCollider
          args={[scale[0], 0.5, scale[2]]}
          position={[0, 0, 0]}
          restitution={0.2}
          friction={1}
        />
      </RigidBody>
    );
  }
);

export default React.memo(FurnitureEntityImpl);
FurnitureEntityImpl.displayName = "FurnitureEntityImpl";
