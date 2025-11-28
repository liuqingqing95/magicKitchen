import { foodLoader, MODEL_PATHS } from "@/utils/loaderManager";
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
    const hamburger = useGLTF(MODEL_PATHS.food.burger, true, foodLoader);
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
        hamburger.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;

            // 确保使用独立的材质
            if (!child.userData.originalMaterial) {
              child.userData.originalMaterial = child.material;
            }

            // 创建新材质
            const material = child.userData.originalMaterial.clone();

            // 修改高亮效果
            if (isHighlighted) {
              material.emissive = new THREE.Color("#ff9800");
              material.emissiveIntensity = 0.3;
              // 增加环境光反射
              material.roughness = 0.4;
              material.metalness = 0.3;
            } else {
              material.emissive = new THREE.Color(0x000000);
              material.emissiveIntensity = 0;
              material.roughness = 0.8;
              material.metalness = 0.2;
            }

            child.material = material;
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
            <primitive object={hamburger.scene} scale={1} />
          </group>
        </RigidBody>
      )
    );
  }
);

Hamberger.displayName = "Hamberger";
