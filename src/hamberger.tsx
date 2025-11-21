import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

type HambergerProps = {
  id?: string;
  position?: [number, number, number];
  onMount?: (g: THREE.Group | null) => void;
};

export const Hamberger = forwardRef<THREE.Group, HambergerProps>(
  ({ id = "", position = [0, 0, 0], onMount }, ref) => {
    const hamburger = useGLTF("/hamburger.glb");
    const [modelReady, setModelReady] = useState(false);
    const innerRef = useRef<THREE.Group | null>(null);

    // expose the inner group via the forwarded ref
    useImperativeHandle(
      ref,
      () => innerRef.current as unknown as THREE.Group,
      []
    );

    useEffect(() => {
      if (hamburger.scene) {
        hamburger.scene.children.forEach((mesh: THREE.Object3D) => {
          const maybeMesh = mesh as THREE.Mesh;
          if (maybeMesh instanceof THREE.Mesh) {
            maybeMesh.castShadow = true;
            if (
              maybeMesh.geometry &&
              typeof (maybeMesh.geometry as THREE.BufferGeometry)
                .computeBoundingBox === "function"
            ) {
              (maybeMesh.geometry as THREE.BufferGeometry).computeBoundingBox();
            }
          }
        });
        setModelReady(true);
      }
    }, [hamburger]);

    // notify parent when group is mounted (after model is ready)
    useEffect(() => {
      if (innerRef.current) {
        onMount?.(innerRef.current);
      }
    }, [modelReady, onMount]);

    return (
      modelReady && (
        <RigidBody
          key={id}
          type="fixed"
          colliders="trimesh"
          position={position}
          restitution={0.2}
          friction={0}
        >
          {/* forward the ref to an inner group so consumers can call getWorldPosition */}
          <group ref={(g) => (innerRef.current = g)}>
            <primitive object={hamburger.scene} scale={0.15} />
          </group>
        </RigidBody>
      )
    );
  }
);

Hamberger.displayName = "Hamberger";
