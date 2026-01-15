import { useFurnitureObstacleStore } from "@/stores/useFurnitureObstacle";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  model: THREE.Object3D;
  position: [number, number, number];
  rotation: [number, number, number];
  instanceKey: string;
};

function FurnitureInstanceImpl({
  model,
  position,
  rotation,
  instanceKey,
}: Props) {
  const isHighlighted = useFurnitureObstacleStore((s) =>
    s.highlightedFurniture.some((f) => f.id === instanceKey)
  );
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    // ensure model transform is applied only once
    try {
      model.position.set(position[0], position[1], position[2]);
      model.rotation.set(rotation[0], rotation[1], rotation[2]);
    } catch (e) {}
    return () => {
      mounted.current = false;
    };
  }, [model, position, rotation]);

  useEffect(() => {
    // toggle emissive highlight on meshes
    try {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (isHighlighted) {
            mat.emissive = new THREE.Color("#ff9800");
            mat.emissiveIntensity = 0.3;
            mat.roughness = 0.4;
            mat.metalness = 0.3;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
            mat.roughness = 0.8;
            mat.metalness = 0.2;
          }
        }
      });
    } catch (e) {}
  }, [isHighlighted, model]);

  return <primitive object={model} position={[0, 0, 0]} />;
}

export default React.memo(FurnitureInstanceImpl);
