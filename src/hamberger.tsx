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
  handleIngredient?: IHandleIngredientDetail | undefined;
  onSpawn?: (
    g: RapierRigidBody | null,
    id: string,
    type: EGrabType | EFoodType,
    position?: [number, number, number],
  ) => void;
  rotateDirection?: EDirection;
};
type HambergerContainerProps = {
  rbProps: RigidBodyProps & React.RefAttributes<RapierRigidBody>;
  id: string;
  model: THREE.Group;
  modelReady: boolean;
  isHolding?: boolean;
  collisionGroups?: number;
  baseFoodModel?: THREE.Group;
  foodModel?: FoodModelType | undefined;
  imageVisible?: boolean;
  sensorCb?: (
    child: THREE.Object3D<THREE.Object3DEventMap>,
    type: EGrabType | EFoodType,
  ) => boolean;
  meshHandler?: (
    mesh: THREE.Mesh,
    type: EGrabType | EFoodType,
  ) => boolean | void;
  type: EGrabType | EFoodType;
  visible: boolean;
  baseFoodPos?: [number, number, number];
  area?: "floor" | "table" | "hand";
};

const HambergerContainer = React.memo(
  React.forwardRef<RapierRigidBody | null, HambergerContainerProps>(
    function HambergerContainer(
      {
        rbProps,
        id,
        model,
        modelReady,
        isHolding,
        area,
        collisionGroups,
        visible,
        baseFoodModel,
        baseFoodPos,
        foodModel,
        imageVisible = true,
        sensorCb,
        meshHandler,
        type,
      },
      ref,
    ) {
      return (
        <RigidBody {...rbProps} key={id} ref={ref}>
          <GrabColliders
            model={model}
            area={area}
            selfHolding={isHolding}
            modelReady={modelReady}
            sensorCb={sensorCb}
            meshHandler={meshHandler}
            type={type}
            collisionGroups={collisionGroups}
          />
          <MultiFood
            id={id}
            foodModel={foodModel}
            model={model}
            position={[0, 0, 0]}
            baseFoodModel={baseFoodModel}
            visible={visible}
            baseFoodPos={baseFoodPos}
            imageVisible={imageVisible}
          />
        </RigidBody>
      );
    },
  ),
);
HambergerContainer.displayName = "HambergerContainer";
const Hamberger = ({
  id,
  rotateDirection = EDirection.normal,
  handleIngredient,
  isHolding,
  type,
  size,
  foodModelId,
  baseFoodModel,
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
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          if (child.visible === false) return;
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
      !isHolding &&
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

  // hoist pan sensor callback so hooks order stays stable
  const sensorCbPan = React.useCallback(
    (child: THREE.Object3D, t: EGrabType | EFoodType) =>
      t === EGrabType.pan && child.name === "handle",
    [],
  );
  const baseFoodPos = useMemo(() => {
    if (type === EGrabType.cuttingBoard || type === EGrabType.plate) {
      if (foodModel && foodModel.type === EFoodType.cheese) {
        return [0, 0.04, 0] as [number, number, number];
      }
    }
  }, [type, foodModel]);

  // Memoize props passed to HambergerContainer to keep reference stable
  const containerPropsDefault = useMemo(() => {
    return {
      rbProps,
      id,
      model,
      baseFoodPos,
      visible,
      modelReady,
      isHolding,
      collisionGroups,
      baseFoodModel,
      area,
      foodModel,
      // no sensorCb by default
      type,
      imageVisible: true,
    } as const;
  }, [
    rbProps,
    area,
    id,
    model,
    baseFoodPos,
    visible,
    modelReady,
    isHolding,
    collisionGroups,
    baseFoodModel,
    foodModel,
    type,
  ]);

  const containerPropsPan = useMemo(() => {
    return {
      ...containerPropsDefault,
      sensorCb: sensorCbPan,
    } as const;
  }, [containerPropsDefault, sensorCbPan]);

  const containerPropsCuttingBoard = useMemo(() => {
    return {
      ...containerPropsDefault,
      imageVisible: false,
    } as const;
  }, [containerPropsDefault]);

  const renderPan = () => {
    return (
      <>
        {needProcessBar()}
        <HambergerContainer ref={rigidBodyRef} {...containerPropsPan} />
      </>
    );
  };
  const renderCuttingBoard = () => {
    // if (foodModel) {
    //   realModel = model.clone();
    //   realModel.traverse((child) => {
    //     if (child instanceof THREE.Mesh && child.name === "knife") {
    //       child.visible = false;
    //     }
    //   });
    // }
    return (
      <>
        {needProcessBar()}
        <HambergerContainer
          ref={rigidBodyRef}
          {...containerPropsCuttingBoard}
        />
      </>
    );
  };
  const groupRef = useRef<THREE.Group | null>(null);

  const renderContent = () => {
    switch (type) {
      case EGrabType.cuttingBoard:
        return renderCuttingBoard();

      case EGrabType.pan:
        return renderPan();
      default:
        return (
          <>
            <HambergerContainer ref={rigidBodyRef} {...containerPropsDefault} />
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
