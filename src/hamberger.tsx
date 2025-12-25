// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import { Float, Text } from "@react-three/drei";
import {
  RapierRigidBody,
  RigidBody,
  RigidBodyTypeString,
  TrimeshCollider,
} from "@react-three/rapier";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import ProgressBar from "./ProgressBar";
import { EFoodType, EGrabType } from "./types/level";
import { EDirection, IHandleIngredientDetail } from "./types/public";
import { getRotation } from "./utils/util";

type HambergerProps = {
  model: THREE.Group;
  type: EGrabType | EFoodType;
  id: string;
  size: [number, number, number];
  initPos?: [number, number, number];
  onMount?: (g: RapierRigidBody | null) => void;
  onUnmount?: (g: RapierRigidBody | null) => void;
  isHighlighted?: boolean;
  area?: "floor" | "table" | "hand";
  isHolding?: boolean;
  foodModels?: {
    id: string;
    model: THREE.Group;
  }[];
  handleIngredient?: IHandleIngredientDetail;
  rotateDirection?: EDirection;
};

export const Hamberger = forwardRef<THREE.Group, HambergerProps>(
  (
    {
      id,
      rotateDirection,
      handleIngredient,
      isHolding,
      type,
      size,
      foodModels = [],
      area,
      model,
      initPos = [0, 0, 0],
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

    const bodyArgs = useMemo(() => {
      // let type: RigidBodyTypeString = "dynamic";
      const obj: {
        type: RigidBodyTypeString;
        sensor?: boolean;
      } = {
        type: "kinematicPosition",
        sensor: false,
      };
      if (area === "table") {
        obj.type = "kinematicPosition";
        obj.sensor = false;
        return obj;
      }
      obj.type = isHolding ? "kinematicPosition" : "dynamic";
      obj.sensor = isHolding;
      console.log(id, "Hamberger bodyArgs:", obj, area);
      return obj;
    }, [isHolding, area]);
    const needProcessBar = () => {
      return (
        handleIngredient &&
        handleIngredient.status && (
          <ProgressBar
            position={initPos}
            offsetZ={type === EGrabType.cuttingBoard ? -1 : undefined}
            progress={handleIngredient.status / 5}
          ></ProgressBar>
        )
      );
    };
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
        <>
          <RigidBody
            ref={rigidBodyRef}
            colliders={false} // 禁用自动创建
            key={id}
            type={bodyArgs.type}
            sensor={bodyArgs.sensor}
            rotation={getRotation(rotateDirection)}
            friction={0.8}
            position={initPos}
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
          {needProcessBar()}
        </>
      );
    };

    const renderPlate = () => {
      return (
        <>
          <RigidBody
            ref={(g) => {
              rigidBodyRef.current = g;
              console.log("Hamberger RigidBody ref:", g);
            }}
            colliders="trimesh"
            type={bodyArgs.type}
            sensor={bodyArgs.sensor}
            key={id}
            friction={0.8}
            collisionGroups={COLLISION_PRESETS.FOOD}
            position={initPos}
            rotation={getRotation(rotateDirection)}
            userData={id}
          >
            {foodModels.map((foodModel) => {
              return (
                <primitive
                  position={[0, 0, 0]}
                  key={foodModel.id}
                  object={foodModel.model}
                  scale={1}
                />
              );
            })}
            <primitive key={id} object={model} scale={1} />
            <Float floatIntensity={0.25} rotationIntensity={0.25}>
              <Text
                font="/bebas-neue-v9-latin-regular.woff"
                scale={0.5}
                maxWidth={3}
                lineHeight={0.75}
                color={"white"}
                textAlign="right"
                position={[0, 1.3, 0]}
                rotation-y={-Math.PI / 2}
              >
                {id!.slice(-6)}
                <meshBasicMaterial toneMapped={false} />
              </Text>
            </Float>
          </RigidBody>
        </>
      );
    };
    return (
      modelReady &&
      (() => {
        switch (type) {
          case EGrabType.pan:
            return renderPan();
          case EGrabType.plate:
            // case EFoodType.eggCooked:
            return renderPlate();
          default:
            return (
              <>
                <RigidBody
                  ref={(g) => {
                    rigidBodyRef.current = g;
                    console.log("Hamberger RigidBody ref:", g);
                  }}
                  colliders="trimesh"
                  type={bodyArgs.type}
                  sensor={bodyArgs.sensor}
                  key={id}
                  rotation={
                    rotateDirection ? getRotation(rotateDirection) : undefined
                  }
                  friction={0.8}
                  collisionGroups={COLLISION_PRESETS.FOOD}
                  position={initPos}
                  userData={id}
                >
                  <primitive key={id} object={model} scale={1} />
                </RigidBody>
                {needProcessBar()}
              </>
            );
        }
      })()
    );
  }
);

Hamberger.displayName = "Hamberger";
