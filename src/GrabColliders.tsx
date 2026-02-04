// src/components/Colliders.tsx
import { TrimeshCollider } from "@react-three/rapier";
import React, { useMemo } from "react";
import * as THREE from "three";
import { EFoodType, EGrabType } from "./types/level";

interface CollidersProps {
  model: THREE.Group;
  modelReady: boolean;
  type: EGrabType | EFoodType;
  collisionGroups?: number;
  rotation?: [number, number, number];
  selfHolding?: boolean;
  sensorCb?: (
    child: THREE.Object3D<THREE.Object3DEventMap>,
    type: EGrabType | EFoodType,
  ) => boolean;
  /**
   * Optional handler called for each mesh during traverse.
   * If it returns `true`, the mesh will be skipped (no collider created).
   */
  meshHandler?: (
    mesh: THREE.Mesh,
    type: EGrabType | EFoodType,
  ) => boolean | void;
}

const GrabColliders = ({
  model,
  modelReady,
  type,
  collisionGroups,
  rotation,
  selfHolding,
  sensorCb,
  meshHandler,
}: CollidersProps) => {
  const colliders = useMemo<JSX.Element[]>(() => {
    if (!modelReady) return [];
    const items: JSX.Element[] = [];

    model.updateWorldMatrix(true, true);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.visible === false) return;
        // allow external handler to decide whether to skip or modify the mesh
        if (meshHandler) {
          const shouldSkip = meshHandler(child, type);
          if (shouldSkip) return;
        }

        const { vertices, indices } = meshToTrimesh(child);
        const sensor = sensorCb ? sensorCb(child, type) : false;
        items.push(
          <TrimeshCollider
            key={child.uuid}
            args={[vertices, indices]}
            sensor={sensor}
            collisionGroups={collisionGroups}
          />,
        );
      }
    });

    return items;
  }, [model, modelReady]);

  return <> {selfHolding ? [] : colliders}</>;
};
export const MemoizedGrabColliders = React.memo(GrabColliders);

export default MemoizedGrabColliders;

function meshToTrimesh(mesh: THREE.Mesh) {
  const geom = mesh.geometry as THREE.BufferGeometry;
  const posAttr = geom.getAttribute("position");
  const indexAttr = geom.index;
  const vertexCount = posAttr.count;
  const vertices = new Float32Array(vertexCount * 3);

  const v = new THREE.Vector3();
  for (let i = 0; i < vertexCount; i++) {
    v.fromBufferAttribute(posAttr, i).applyMatrix4(mesh.matrixWorld);

    vertices[i * 3 + 0] = v.x;
    vertices[i * 3 + 1] = v.y;
    vertices[i * 3 + 2] = v.z;
  }

  let indices: Uint32Array;
  if (indexAttr) {
    indices = new Uint32Array(indexAttr.array as ArrayLike<number>);
  } else {
    const count = vertexCount;
    indices = new Uint32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
  }
  return { vertices, indices };
}
