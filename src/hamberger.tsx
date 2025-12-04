
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { EGrabType } from './types/level';


type HambergerProps = {
  model: THREE.Group;
  type: EGrabType;
  position?: [number, number, number];
  onMount?: (g: RapierRigidBody | null) => void;
  onUnmount?: (g: RapierRigidBody | null) => void;
  isHighlighted?: boolean;
};

export const Hamberger = forwardRef<THREE.Group, HambergerProps>(
  ({type,  model, position = [0, 0, 0], onMount, onUnmount, isHighlighted }, ref) => {

    const [modelReady, setModelReady] = useState(false);
    const rigidBodyRef = useRef<RapierRigidBody | null>(null); // 添加 RigidBody 的引用
    // expose the inner group via the forwarded ref
    // if (type ===  EGrabType.hamburger)
    // {console.log("Hamberger render", position, isHighlighted);}
    useImperativeHandle(
      ref,
      () =>
        ({
          rigidBody: rigidBodyRef.current,
        } as any),
      []
    );

    useEffect(() => {
      if (model) {
        model.traverse((child) => {
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
    }, [model, isHighlighted]);

    useEffect(() => {
      if (modelReady && rigidBodyRef.current) {
        onMount?.(rigidBodyRef.current);
      }
    }, [onMount, modelReady]);
    // 组件卸载时通知父组件
    useEffect(() => {
      return () => {
        onUnmount?.(rigidBodyRef.current);
      }
    }, [onUnmount]);
    return (
      modelReady && (
       
        <RigidBody
          ref={(g) => (rigidBodyRef.current = g)}
          type={isHighlighted ? "kinematicPosition" : "fixed"}
          colliders="trimesh"
          restitution={0.2}
          friction={0}
          position={position}
        >
          {/* forward the ref to an inner group so consumers can call getWorldPosition */}
          
        
          <primitive object={model} scale={1} />
        </RigidBody>

      )
    );
  }
);

Hamberger.displayName = "Hamberger";
