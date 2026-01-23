import { CuboidCollider } from "@react-three/rapier";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
interface FloorProps {
  model: THREE.Group<THREE.Object3DEventMap> | null;
}
const STATIC_CLIPPING_PLANES = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), 7), // 切掉 x > 18
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), 19), // 切掉 x < -6
  new THREE.Plane(new THREE.Vector3(0, 0, 1), 11), // 切掉 z > 4
  new THREE.Plane(new THREE.Vector3(0, 0, -1), 5), // 切掉 z < -10
];

export const Floor = ({ model }: FloorProps) => {
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const floor1Material = new THREE.MeshStandardMaterial({ color: "#b9d0e4" });
  // const floorModel = useRef<THREE.Group | null>(null);
  const [floorModel, setFloorModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (!model) {
      return;
    }
    const TILE_X = 45;
    const TILE_Z = 45;
    const modelClone = model.clone();
    // desired floor tiling size (match the fallback plane scale below)
    // how many times to repeat texture across Z

    modelClone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // prefer cloning the original material so we preserve maps
        const orig =
          (child.userData && child.userData.originalMaterial) || child.material;
        const mat =
          (orig && (orig as any).clone && (orig as any).clone()) ||
          new THREE.MeshStandardMaterial();
        // enable clipping and double sided as before
        // mat.clippingPlanes = STATIC_CLIPPING_PLANES;
        mat.clipIntersection = false;
        mat.side = THREE.DoubleSide;

        // If the material has a color/texture map, enable repeating so the
        // small source texture tiles across the large floor area.
        const tryTile = (map: THREE.Texture | null | undefined) => {
          if (!map) return;
          map.wrapS = THREE.RepeatWrapping;
          map.wrapT = THREE.RepeatWrapping;
          map.repeat.set(TILE_X, TILE_Z);
          map.needsUpdate = true;
        };

        tryTile((mat as any).map);
        tryTile((mat as any).roughnessMap);
        tryTile((mat as any).metalnessMap);
        tryTile((mat as any).normalMap);

        child.material = mat;
      }
    });
    setFloorModel(modelClone);
  }, [model]);

  return (
    <>
      {
        floorModel && <primitive object={floorModel} position={[0, 0.2, 0]} />

        // : (
        //   <mesh
        //     geometry={boxGeometry}
        //     material={floor1Material}
        //     position={[0, 0, 0]}
        //     scale={[45, 0, 45]}
        //     receiveShadow
        //   />
        // )
      }
      <CuboidCollider
        args={[19, 0.1, 11]}
        position={[0, -0.1, 0]}
        restitution={0.2}
        friction={1}
        collisionGroups={COLLISION_PRESETS.FLOOR}
      ></CuboidCollider>
    </>
  );
};

export const MemoizedFloor = Floor;

export default MemoizedFloor;
