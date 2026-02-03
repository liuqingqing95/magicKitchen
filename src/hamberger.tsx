// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import {
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
  RigidBodyTypeString,
} from "@react-three/rapier";
import { isEqual } from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import GrabColliders from "./GrabColliders";
import MultiFood from "./MultiFood";
import ProgressBar from "./ProgressBar";
import { EFoodType, EGrabType, FoodModelType } from "./types/level";
import { EDirection, IHandleIngredientDetail } from "./types/public";

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
  rotation?: [number, number, number];
  visible?: boolean;
  isHighlighted?: boolean;
  // burgerContainer: []
  ingredientStatus?: number | boolean;
  handleIngredient?: IHandleIngredientDetail | undefined;
  onSpawn?: (
    g: RapierRigidBody | null,
    id: string,
    type: EGrabType | EFoodType,
    position?: [number, number, number],
  ) => void;
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
  rotation,
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
  const [collisionGroups] = useState<number | undefined>(
    COLLISION_PRESETS.FOOD,
  );

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
      colliders: false,
      type: bodyArgs.type,
      sensor: bodyArgs.sensor,
      restitution: 0.1,
      rotation: rotation ? new THREE.Euler(...rotation) : undefined,
      friction: 0.8,
      linearDamping: 0.3,
      angularDamping: 0.5,
      enabledRotations:
        type === EGrabType.fireExtinguisher
          ? [true, true, true]
          : [false, false, false],
      mass: 0.8,
      canSleep: true,
      collisionGroups: collisionGroups,
      position: initPos,
      userData: { id },
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
            material.emissive = new THREE.Color("#ff2600");
            material.emissiveIntensity = 0.8;
            // 增加环境光反射
            material.roughness = 0.8;
            material.metalness = 0.8;
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
    if (!isHolding && rigidBodyRef.current) {
      onSpawn?.(rigidBodyRef.current, id, type, initPos);
    }
  }, [isHolding, rigidBodyRef.current]);

  useEffect(() => {
    if (!isHolding) {
      onSpawn?.(rigidBodyRef.current, id, type);
    }
  }, [isHolding]);
  // useEffect(() => {
  //   // let type: RigidBodyTypeString = "dynamic";
  //   const obj: {
  //     type: RigidBodyTypeString;
  //     sensor: boolean;
  //   } = {
  //     type: "kinematicPosition",
  //     sensor: false,
  //   };

  //   obj.type = "dynamic";
  //   obj.sensor = false;

  //   setBodyArgs((prev) => {
  //     return {
  //       // ...prev,
  //       type: obj.type,
  //       sensor: obj.sensor,
  //     };
  //   });

  //   // const time = setTimeout(() => {
  //   //   setBodyArgs((prev) => {
  //   //     return {
  //   //       ...prev,
  //   //       type: obj.type,
  //   //     };
  //   //   });
  //   // }, 10);
  //   // return () => {
  //   //   clearTimeout(time);
  //   // };
  //   // console.log(id, "Hamberger bodyArgs:", obj, area);
  // }, [area, isHolding]);

  const needProcessBar = () => {
    return (
      isHolding === false &&
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

  const renderContainer = () => {
    return (
      <>
        <RigidBody {...rbProps} key={id} ref={rigidBodyRef}>
          <GrabColliders
            model={model}
            selfHolding={isHolding}
            modelReady={modelReady}
            type={type}
            collisionGroups={collisionGroups}
          />
          <MultiFood
            id={id}
            foodModel={foodModel}
            model={model}
            position={[0, 0, 0]}
            baseFoodModel={baseFoodModel}
            visible={!isHolding}
          ></MultiFood>
        </RigidBody>
      </>
    );
  };

  const renderPan = () => {
    return (
      <>
        {needProcessBar()}
        {renderContainer()}
      </>
    );
  };
  const groupRef = useRef<THREE.Group | null>(null);

  const renderContent = () => {
    switch (type) {
      // case EGrabType.pan:
      //   return renderPan();
      case EGrabType.plate:
        return renderContainer();
      case EGrabType.pan:
        return renderPan();
      default:
        return (
          <>
            <RigidBody {...rbProps} key={id} ref={rigidBodyRef}>
              <GrabColliders
                model={model}
                modelReady={modelReady}
                type={type}
                selfHolding={isHolding}
                collisionGroups={collisionGroups}
              />
              <MultiFood
                id={id}
                foodModel={foodModel}
                model={model}
                position={[0, 0, 0]}
                ref={groupRef}
                baseFoodModel={baseFoodModel}
                // baseFoodModelId={baseFoodModelId || undefined}
                visible={visible}
              ></MultiFood>
            </RigidBody>
          </>
        );
    }
  };
  if (!modelReady) return null;
  return renderContent();
};
export default React.memo(Hamberger, (prevProps, nextProps) => {
  const isSame = isEqual(nextProps, prevProps);
  if (!isSame) {
    const changedKeys = Object.keys(nextProps).filter(
      (key) => !isEqual(nextProps[key], prevProps[key]),
    );
    // if (changedKeys.findIndex((item) => item === "initPos") > -1) {
    //   console.log(
    //     `hamberger changed keys:${nextProps.id} `,
    //     changedKeys,
    //     nextProps.initPos,
    //     prevProps.initPos,
    //   );
    // }
    if (changedKeys.findIndex((item) => item === "visible") > -1) {
      console.log(
        `hamberger changed keys visible:${nextProps.id} `,
        changedKeys,
        nextProps.visible,
      );
    }
    console.log(`hamberger changed keys:${nextProps.id} `, changedKeys);
  }
  return isSame;
});
Hamberger.displayName = "Hamberger";
