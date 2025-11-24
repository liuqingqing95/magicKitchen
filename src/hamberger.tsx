import { useGLTF } from "@react-three/drei";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
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
  isHighlighted?: boolean;
};

export const Hamberger = forwardRef<THREE.Group, HambergerProps>(
  ({ id = "", position = [0, 0, 0], onMount, isHighlighted }, ref) => {
    const hamburger = useGLTF("/hamburger.glb");
    const [modelReady, setModelReady] = useState(false);
    const rigidBodyRef = useRef<RapierRigidBody | null>(null); // 添加 RigidBody 的引用
    // expose the inner group via the forwarded ref

    useImperativeHandle(
      ref,
      () =>
        ({
          rigidBody: rigidBodyRef.current,
        } as any),
      []
    );

    useEffect(() => {
      if (hamburger.scene) {
        hamburger.scene.children.forEach((mesh: THREE.Object3D) => {
          const maybeMesh = mesh as THREE.Mesh;
          if (maybeMesh instanceof THREE.Mesh) {
            maybeMesh.castShadow = true;

            // 修改高亮效果
            const material = maybeMesh.material as THREE.MeshStandardMaterial;
            // 使用更亮的颜色和更高的强度
            material.emissive = new THREE.Color("#e9610a"); // 使用黄色作为发光颜色
            material.emissiveIntensity = isHighlighted ? 0.6 : 0; // 增加发光强度到1
            console.log;
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
    }, [hamburger, isHighlighted]);

    // 当 RigidBody 准备就绪时通知父组件
    useEffect(() => {
      if (modelReady && rigidBodyRef.current) {
        onMount?.(rigidBodyRef.current);
      }
    }, [modelReady, onMount]);
    return (
      modelReady && (
        <RigidBody
          ref={(g) => (rigidBodyRef.current = g)}
          key={id}
          type={isHighlighted ? "kinematicPosition" : "fixed"}
          colliders="trimesh"
          position={position}
          restitution={0.2}
          friction={0}
        >
          {/* forward the ref to an inner group so consumers can call getWorldPosition */}
          <group>
            <primitive object={hamburger.scene} scale={0.05} />
          </group>
        </RigidBody>
      )
    );
  }
);

Hamberger.displayName = "Hamberger";
