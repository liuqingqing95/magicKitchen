import { FURNITURE_ARR } from "@/constant/data";
import {
  EFoodType,
  EFurnitureType,
  ERigidBodyType,
  IFurnitureItem,
} from "@/types/level";
import { EDirection } from "@/types/public";
import { RapierRigidBody } from "@react-three/rapier";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import ModelResourceContext from "./context/ModelResourceContext";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "./stores/useFurnitureObstacle";
// import { DebugText } from "./Text";
import FurnitureEntity from "./components/FurnitureEntity";
import Floor from "./Floor";
import { getId, getRotation } from "./utils/util";

interface ILevel {
  updateFurnitureHandle?: (handle: number[] | undefined) => void;
}
const FURNITURE_TYPES = Object.values(EFurnitureType);

function Level({ updateFurnitureHandle }: ILevel) {
  const { grabModels, modelAnimations } = useContext(ModelResourceContext);

  const furnitureModels = useMemo(() => {
    if (!grabModels || Object.keys(grabModels).length === 0)
      return {} as Record<string, THREE.Group>;
    const models: Record<string, THREE.Group> = {};
    if (grabModels.floor) models.floor = grabModels.floor;
    FURNITURE_TYPES.forEach((type) => {
      if (type === EFurnitureType.foodTable) {
        Object.values(EFoodType).forEach((foodType) => {
          let model = grabModels[foodType + "Table"];
          if (!model) return;
          models[foodType + "Table"] = model;
        });
      } else {
        if (!grabModels[type]) return;
        models[type] = grabModels[type];
      }
    });
    console.log("Furniture models loaded:", modelAnimations);
    return models;
  }, [grabModels]);

  const furnitureInstanceModels = useRef(
    new Map<
      string,
      {
        model: THREE.Object3D;
        position: [number, number, number];
        rotation: [number, number, number];
      }
    >(),
  );
  const furnitureItemRefs = useRef(
    new Map<
      string,
      React.MutableRefObject<
        | {
            type: EFurnitureType;
            model: THREE.Object3D;
            position: [number, number, number];
            rotation: [number, number, number];
          }
        | undefined
      >
    >(),
  );
  const furnitureRigidRefs = useRef(
    new Map<string, React.RefObject<RapierRigidBody | null>>(),
  );

  const { registerObstacle, setRegistry, highlightId } =
    useFurnitureObstacleStore((s) => ({
      registerObstacle: s.registerObstacle,
      highlightId: s.highlightId,
      setRegistry: s.setRegistry,
    }));

  // // 计算模型的边界框
  // const washSinkBox = new THREE.Box3().setFromObject(washSink.scene);
  // const drawerTableBox = new THREE.Box3().setFromObject(drawerTable.scene);

  // console.log("washSink size:", washSinkBox.getSize(new THREE.Vector3()));
  // console.log("drawerTable size:", drawerTableBox.getSize(new THREE.Vector3()));

  const getPosition = ({
    position,
    rotateDirection,
    type,
  }: IFurnitureItem): [number, number, number] => {
    if (
      type === EFurnitureType.gasStove &&
      rotateDirection === EDirection.normal
    ) {
      return [position[0], position[1], position[2] + 0.16];
    }
    // return position;
    switch (rotateDirection) {
      case EDirection.left:
        return [position[0] + 0.06, position[1], position[2]];
      case EDirection.right:
        return [position[0] - 0.06, position[1], position[2]];
      case EDirection.normal:
        return position;
      case EDirection.back:
        return position;
    }
  };
  const startTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (startTimeRef.current === null)
      startTimeRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();

    if (!furnitureModels) return;

    // 检查是否有新的model可以注册
    FURNITURE_ARR.forEach((item) => {
      const instanceKey = getId(
        ERigidBodyType.furniture,
        item.type,
        `${item.position[0]}_${item.position[2]}`,
      );

      // 如果已经注册过，跳过
      if (furnitureInstanceModels.current.has(instanceKey)) return;

      let model;
      if (item.type === EFurnitureType.foodTable && item.foodType) {
        if (!furnitureModels[item.foodType + "Table"]) return;

        model = furnitureModels[item.foodType + "Table"].clone();
      } else {
        if (!furnitureModels[item.type]) return;
        model = furnitureModels[item.type].clone();
      }

      // 为每个实例创建独立的材质
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = (
            child.material as THREE.MeshStandardMaterial
          ).clone();
        }
      });

      // 立即注册可用的model
      furnitureInstanceModels.current.set(instanceKey, {
        model,
        position: getPosition(item),
        rotation: getRotation(item.rotateDirection),
      });

      // create and store a stable MutableRefObject for the item to pass into FurnitureEntity
      const itemRef = {
        current: {
          type: item.type,
          model,
          position: getPosition(item),
          rotation: getRotation(item.rotateDirection),
        },
      };
      furnitureItemRefs.current.set(instanceKey, itemRef);
      // create and store a stable rigid ref for forwarding to entity
      furnitureRigidRefs.current.set(
        instanceKey,
        React.createRef<RapierRigidBody | null>(),
      );

      const basePosition: IFurniturePosition = {
        id: instanceKey,
        type: item.type,
        position: item.position,
        rotateDirection: item.rotateDirection,
        size: [2.3, 1.3, 2.3],
        isFurniture: true,
        isMovable: false,
      };
      if (item.type === EFurnitureType.foodTable && item.foodType) {
        basePosition.foodType = item.foodType;
      }
      registerObstacle(instanceKey, basePosition);

      // 检查是否所有家具都已注册
      if (furnitureInstanceModels.current.size === FURNITURE_ARR.length) {
        setRegistry(true);
        const t =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        console.info(
          "Level fully ready in",
          Math.round(t - (startTimeRef.current || t)),
          "ms",
        );
      }
    });
  }, [furnitureModels]);

  useEffect(() => {
    if (furnitureInstanceModels.current.size === FURNITURE_ARR.length) {
      const arr = Array.from(furnitureRigidRefs.current.values())
        .map((r) => r.current?.handle)
        .filter((h): h is number => typeof h === "number");
      updateFurnitureHandle?.(arr);
    }
  }, [furnitureInstanceModels.current.size]);
  const previousHighlightRef = useRef<string | null>(null);
  const highlighted = useMemo(() => {
    const obj: { [key: string]: boolean } = {};
    FURNITURE_ARR.forEach((item) => {
      const instanceKey = getId(
        ERigidBodyType.furniture,
        item.type,
        `${item.position[0]}_${item.position[2]}`,
      );
      obj[instanceKey] =
        previousHighlightRef.current === instanceKey
          ? false
          : highlightId
            ? highlightId === instanceKey
            : false;
    });
    return obj;
  }, [highlightId]);
  console.log("level render:", highlighted);
  return (
    <group>
      {FURNITURE_ARR.map((item) => {
        const instanceKey = getId(
          ERigidBodyType.furniture,
          item.type,
          `${item.position[0]}_${item.position[2]}`,
        );
        const val = furnitureItemRefs.current.get(instanceKey);
        const rigidRef = furnitureRigidRefs.current.get(instanceKey);
        if (!val || !rigidRef) return null;
        let type = item.type;
        if (item.type === EFurnitureType.foodTable) {
          type = (item.foodType + "Table") as EFurnitureType;
        }
        return (
          <FurnitureEntity
            type={item.type}
            animations={modelAnimations[type]}
            key={instanceKey}
            highlighted={highlighted[instanceKey]}
            ref={rigidRef}
            val={val}
            instanceKey={instanceKey}
          />
        );
      })}
      <Floor model={furnitureModels.floor} />
    </group>
  );
}

export const MemoizedLevel = React.memo(Level);

export default MemoizedLevel;
