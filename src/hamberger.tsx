// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
  RigidBodyTypeString,
  TrimeshCollider,
} from "@react-three/rapier";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import MultiFood from "./MultiFood";
import ProgressBar from "./ProgressBar";
import { EFoodType, EGrabType, FoodModelType } from "./types/level";
import { EDirection, IHandleIngredientDetail } from "./types/public";
import { getRotation } from "./utils/util";

type HambergerProps = {
  model: THREE.Group;
  baseFoodModel?: THREE.Group;
  type: EGrabType | EFoodType;
  id: string;
  size: [number, number, number];
  initPos?: [number, number, number];
  onMount?: (g: RapierRigidBody | null) => void;
  onUnmount?: (g: RapierRigidBody | null) => void;
  area?: "floor" | "table" | "hand";
  isHolding?: boolean;
  foodModel?: FoodModelType | undefined;
  foodModelId?: string | null;
  visible?: boolean;
  isHighlighted?: boolean;
  // burgerContainer: []
  ingredientStatus?: number | boolean;
  handleIngredient?: IHandleIngredientDetail | undefined;
  onSpawn?: (g: RapierRigidBody | null, id: string) => void;
  rotateDirection?: EDirection;
};

const Hamberger = ({
  id,
  rotateDirection = EDirection.normal,
  handleIngredient,
  isHolding,
  type,
  size,
  foodModelId,
  baseFoodModel,
  ingredientStatus,
  isHighlighted,
  visible = true,
  foodModel,
  area,
  model,
  initPos = [0, 0, 0],
  onMount,
  onSpawn,
  onUnmount,
}: HambergerProps) => {
  if (!model) return;
  if (ingredientStatus) {
    console.log("Hamberger ingredientStatus:", area, ingredientStatus);
  }
  const [modelReady, setModelReady] = useState(false);
  const notColliderPlayer = useRef(true);
  const [collisionGroups, setCollisionGroups] = useState<number | undefined>();

  const rigidBodyRef = useRef<RapierRigidBody | null>(null); // 添加 RigidBody 的引用
  const waitForGrab = useRef<boolean>(true);
  const [bodyArgs, setBodyArgs] = useState({
    type: "dynamic" as RigidBodyTypeString,
    sensor: false,
  });

  const rbProps = useMemo<
    RigidBodyProps & React.RefAttributes<RapierRigidBody>
  >(() => {
    const base: RigidBodyProps & React.RefAttributes<RapierRigidBody> = {
      colliders: "trimesh",
      type: bodyArgs.type,
      sensor: bodyArgs.sensor,
      rotation: rotateDirection ? getRotation(rotateDirection) : undefined,
      friction: 0.8,
      collisionGroups: collisionGroups,
      position: initPos,
      userData: id,
      // onSpawn: (rb: RapierRigidBody) => {
      //   onSpawn?.(rb);
      // },
    };
    if (type === EGrabType.pan) {
      base.colliders = false;
    }
    return base;
  }, [
    collisionGroups,
    id,
    initPos,
    bodyArgs.type,
    bodyArgs.sensor,
    rotateDirection,
    type,
  ]);
  // useImperativeHandle(
  //   ref,
  //   () =>
  //     ({
  //       rigidBody: rigidBodyRef.current,
  //       id,
  //     }) as any,
  //   []
  // );

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
      waitForGrab.current = false;
    }
  }, [onMount, modelReady]);
  // 组件卸载时通知父组件
  useEffect(() => {
    return () => {
      onUnmount?.(rigidBodyRef.current);
    };
  }, [onUnmount]);

  useEffect(() => {
    const val = COLLISION_PRESETS.FOOD;
    // notColliderPlayer.current && visible === false
    //   ? COLLISION_PRESETS.FOODHIDE
    //   : isHolding
    //     ? COLLISION_PRESETS.FOODHIDE
    //     : COLLISION_PRESETS.FOOD;

    setCollisionGroups(val);
    if (!isHolding) {
      notColliderPlayer.current = false;
      // if (visible === true) {
      onSpawn?.(rigidBodyRef.current, id);
    }

    // }
  }, [isHolding]);

  useEffect(() => {
    // let type: RigidBodyTypeString = "dynamic";
    const obj: {
      type: RigidBodyTypeString;
      sensor: boolean;
    } = {
      type: "kinematicPosition",
      sensor: false,
    };
    if (area === "table") {
      obj.type = "kinematicPosition";
      obj.sensor = false;
    } else {
      obj.type = isHolding ? "kinematicPosition" : "dynamic";
      obj.sensor = false;
    }

    setBodyArgs((prev) => {
      return {
        // ...prev,
        type: obj.type,
        sensor: obj.sensor,
      };
    });
    // const time = setTimeout(() => {
    //   setBodyArgs((prev) => {
    //     return {
    //       ...prev,
    //       type: obj.type,
    //     };
    //   });
    // }, 10);
    // return () => {
    //   clearTimeout(time);
    // };
    // console.log(id, "Hamberger bodyArgs:", obj, area);
  }, [area, isHolding]);

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
        <RigidBody {...rbProps} key={id} ref={rigidBodyRef}>
          {/* Mesh 1：动态碰撞体（参与物理） */}
          <TrimeshCollider
            rotation={[-Math.PI / 2, 0, 0]}
            // type="trimesh"
            args={[panVertices, panIndices]}
            collisionGroups={collisionGroups}
          />

          {/* Mesh 2：固定效果（只检测，不影响物理） */}
          <TrimeshCollider
            rotation={[-Math.PI / 2, 0, 0]}
            // type="trimesh"
            args={[handleVertices, handleIndices]}
            sensor={true} // 设置为传感器
            collisionGroups={collisionGroups}
          />

          {/* 渲染模型 */}
          <primitive object={model} scale={1} />
        </RigidBody>
        {needProcessBar()}
      </>
    );
  };

  const renderPlate = (isFood?: boolean) => {
    return (
      <>
        <RigidBody {...rbProps} key={id} ref={rigidBodyRef}>
          <MultiFood
            id={id}
            foodModel={foodModel}
            model={model}
            baseFoodModel={baseFoodModel}
          ></MultiFood>
          {/* <DebugText
            color={isFood ? "#000" : "white"}
            text={id!.slice(-6)}
          ></DebugText> */}
        </RigidBody>
      </>
    );
  };
  const groupRef = useRef<THREE.Group | null>(null);

  // console.log("hamberger render", id, type);
  const renderContent = () => {
    switch (type) {
      case EGrabType.pan:
        return renderPan();
      case EGrabType.plate:
        return renderPlate(false);
      default:
        return (
          <>
            <CuboidCollider
              position={rbProps.position}
              // type="trimesh"
              args={[1, 0.5, 1]}
              sensor={true} // 设置为传感器
              collisionGroups={collisionGroups}
            />
            <RigidBody {...rbProps} key={id} ref={rigidBodyRef}>
              <MultiFood
                id={id}
                foodModel={foodModel}
                model={model}
                ref={groupRef}
                baseFoodModel={baseFoodModel}
              ></MultiFood>
            </RigidBody>
            {needProcessBar()}
          </>
        );
    }
  };
  if (!modelReady || isHolding) return null;
  return renderContent();
};
export default React.memo(Hamberger);
Hamberger.displayName = "Hamberger";
