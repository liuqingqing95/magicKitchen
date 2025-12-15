// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import {
  RapierRigidBody,
  RigidBody,
  TrimeshCollider,
} from "@react-three/rapier";
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
        // if (type === EGrabType.pan) {
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
            // if (type === EGrabType.pan && child.name.includes("handle")) {
            //   console.log("pan mesh:", child);

            // }
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
    const renderPan = () => {
      const pan = model.getObjectByName("pingdiguo") as THREE.Mesh;
      const handle = model.getObjectByName("handle") as THREE.Mesh;
      const panVertices = pan.geometry.attributes.position.array;
      const panIndices = pan.geometry.index
        ? pan.geometry.index.array
        : new Uint32Array(panVertices.length / 3).map((_, i) => i);

      const handleVertices = handle.geometry.attributes.position.array;
      const handleIndices = handle.geometry.index
        ? handle.geometry.index.array
        : new Uint32Array(handleVertices.length / 3).map((_, i) => i);

      return (
        <RigidBody
          ref={rigidBodyRef}
          colliders={false} // 禁用自动创建
          key={id}
          type={isHolding ? "kinematicPosition" : "dynamic"}
          sensor={isHolding}
          friction={0.8}
          position={position}
          userData={id}
        >
          {/* Mesh 1：动态碰撞体（参与物理） */}
          <TrimeshCollider
            rotation={[-Math.PI / 2, 0, 0]}
            // type="trimesh"
            args={[panVertices, panIndices]}
            collisionGroups={COLLISION_PRESETS.FOOD}
          />

          {/* Mesh 2：固定效果（只检测，不影响物理） */}
          <TrimeshCollider
            rotation={[-Math.PI / 2, 0, 0]}
            // type="trimesh"
            args={[handleVertices, handleIndices]}
            sensor={true} // 设置为传感器
          />

          {/* 渲染模型 */}
          <primitive object={model} scale={1} />
        </RigidBody>
      );
    };

    return (
      modelReady &&
      (type === EGrabType.pan ? (
        renderPan()
      ) : (
        <RigidBody
          ref={(g) => {
            rigidBodyRef.current = g;
            console.log("Hamberger RigidBody ref:", g);
          }}
          type={isHolding ? "kinematicPosition" : "dynamic"}
          colliders="trimesh"
          sensor={isHolding}
          key={id}
          friction={0.8}
          collisionGroups={COLLISION_PRESETS.FOOD}
          position={position}
          userData={id}
        >
          <primitive object={model} scale={1} />
        </RigidBody>
      ))
    );
  }
);

Hamberger.displayName = "Hamberger";
