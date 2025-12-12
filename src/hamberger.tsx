// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import { EFoodType, EGrabType } from "./types/level";

type HambergerProps = {
  model: THREE.Group;
  type: EGrabType | EFoodType;
  id?: string | number;
  size: [number, number, number];
  position?: [number, number, number];
  onMount?: (g: RapierRigidBody | null) => void;
  onUnmount?: (g: RapierRigidBody | null) => void;
  isHighlighted?: boolean;
  isHolding?: boolean;
};

export const Hamberger = forwardRef<THREE.Group, HambergerProps>(
  (
    {
      id,
      isHolding,
      type,
      size,
      model,
      position = [0, 0, 0],
      onMount,
      onUnmount,
      isHighlighted,
    },
    ref
  ) => {
    const [modelReady, setModelReady] = useState(false);
    const rigidBodyRef = useRef<RapierRigidBody | null>(null); // 添加 RigidBody 的引用
    // const argsRef = useRef<TrimeshArgs | null>(null);
    // expose the inner group via the forwarded ref
    // if (type ===  EGrabType.hamburger)
    // {console.log("Hamberger render", position, isHighlighted);}
    useImperativeHandle(
      ref,
      () =>
        ({
          rigidBody: rigidBodyRef.current,
          id,
        }) as any,
      []
    );

    useEffect(() => {
      if (model) {
        // if (type !== EFoodType.burger) {
        //   debugger;
        // }
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            // if (argsRef.current === null) {
            //   argsRef.current = [
            //     child.geometry.attributes.position.array,
            //     child.geometry.index?.array || [],
            //   ];
            // }
            // console.log(type, child, [
            //   child.geometry.attributes.position.array,
            //   child.geometry.index?.array || [],
            // ]);
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
      };
    }, [onUnmount]);
    return (
      modelReady && (
        <RigidBody
          ref={(g) => (rigidBodyRef.current = g)}
          type={isHolding ? "kinematicPosition" : "dynamic"}
          colliders="trimesh"
          sensor={isHolding}
          // colliders={false}
          key={id}
          friction={0.8}
          collisionGroups={COLLISION_PRESETS.FOOD}
          position={position}
          userData={id}
        >
          {/* forward the ref to an inner group so consumers can call getWorldPosition */}
          {/* <TrimeshCollider args={argsRef.current} sensor={isHolding} /> */}
          <primitive object={model} scale={1} />
          {/* <CuboidCollider
            name={type}
            args={[size[0] / 2, size[1] / 2, size[2] / 2]}
            restitution={0.2}
            friction={1}
          />
          <CuboidCollider
            ref={(g) => {
              sensorRef.current = g;
            }}
            args={[size[0], size[1], size[2]]}
            // position={[0, 1, 0]}
            sensor={true}
            // collisionGroups={2}
            // onIntersectionEnter={(e) =>
            //   console.log("FURN sensor enter", e.other?.rigidBody?.userData)
            // }
            // onIntersectionExit={(e) =>
            //   console.log("FURN sensor exit", e.other?.rigidBody?.userData)
            // }
          /> */}
        </RigidBody>
      )
    );
  }
);

Hamberger.displayName = "Hamberger";
