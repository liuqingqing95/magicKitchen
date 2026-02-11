// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import {
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
  RigidBodyTypeString,
} from "@react-three/rapier";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import GrabColliders from "./GrabColliders";
import useHighlighted from "./hooks/useHighlighted";
import MultiFood from "./MultiFood";
import ProgressBar from "./ProgressBar";
import { EFoodType, EGrabType, FoodModelType } from "./types/level";
import { EDirection } from "./types/public";
import { deepCompare, isMultiFoodModelType } from "./utils/util";

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
      type: type === EGrabType.cuttingBoard ? "fixed" : bodyArgs.type,
      sensor: bodyArgs.sensor,
      // 添加 restitution - 减少弹性碰撞
      restitution: 0,
      rotation: rotation ? new THREE.Euler(...rotation) : undefined,
      // 增加摩擦力
      friction: 2,
      // 增加线性阻尼 - 减少滑动距离
      linearDamping: 1,
      // 增加角阻尼 - 减少旋转
      angularDamping: 0.5,

      mass: 0.8,
      canSleep: true,
      collisionGroups: collisionGroups,
      position: initPos,
      userData: { id },
    };
    if (type === EGrabType.fireExtinguisher) {
      base.enabledRotations = [false, false, false];
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
  // use hook to attach glow meshes and toggle visibility
  useHighlighted(model, Boolean(isHighlighted));
  // useEffect(() => {
  //   if (rigidBodyRef.current) {
  //     const rb = rigidBodyRef.current;
  //     const enabledRotations =
  //       type === EGrabType.fireExtinguisher
  //         ? [true, true, true]
  //         : ([false, false, false] as [boolean, boolean, boolean]);

  //     // 使用 Rapier 的 API 动态设置
  //     rb.setEnabledRotations(
  //       enabledRotations[0],
  //       enabledRotations[1],
  //       enabledRotations[2],
  //       true,
  //     );
  //   }
  // }, [type]);
  // Toggle highlight material lazily when `isHighlighted` changes.
  useEffect(() => {
    if (type === EGrabType.dirtyPlate) {
      let count = 1;
      if (foodModel) {
        if (isMultiFoodModelType(foodModel)) {
          count = count + foodModel.type.length;
        } else {
          count = 2;
        }
      }
      const visible: string[] = [];
      for (let i = 0; i < 6; i++) {
        if (i < count) {
          visible.push(`dirtyPlate${i + 1}`);
          visible.push(`dirtyPlate${i + 1}_1`);
        }
      }
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log("child name:", child.name, "count:", count);
          if (visible.includes(child.name)) {
            child.visible = true;
          } else {
            child.visible = false;
          }
        }
      });
    }
  }, [model, type, foodModel?.type]);

  useEffect(() => {
    if (model) setModelReady(true);
  }, [model]);

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
        <ProgressBar
          visible={!isHolding}
          position={initPos}
          id={id}
        ></ProgressBar>
        <HambergerContainer ref={rigidBodyRef} {...containerPropsPan} />
      </>
    );
  };
  const renderCuttingBoard = () => {
    return (
      <>
        <ProgressBar
          visible={!isHolding}
          position={initPos}
          offsetZ={-1}
          id={id}
        ></ProgressBar>
        <HambergerContainer
          ref={rigidBodyRef}
          {...containerPropsCuttingBoard}
        />
      </>
    );
  };

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
  return deepCompare<HambergerProps>(
    prevProps,
    nextProps,
    (changedKeys, nextProps) => {
      if (changedKeys.findIndex((item) => item === "visible") > -1) {
        console.log(
          `hamberger changed keys visible:${nextProps.id} `,
          changedKeys,
          nextProps.visible,
        );
      }
    },
  );
});
Hamberger.displayName = "Hamberger";
