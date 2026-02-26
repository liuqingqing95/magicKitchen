import { FURNITURE_ARR } from "@/constant/data";
import {
  EFurnitureType,
  ERigidBodyType,
  FoodTableName,
  IFurnitureItem,
} from "@/types/level";
import { RapierRigidBody } from "@react-three/rapier";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import ModelResourceContext from "./context/ModelResourceContext";
import {
  IFurniturePosition,
  registerObstacle,
  setRegistry,
  useHighlightId,
} from "./stores/useFurnitureObstacle";
// import { DebugText } from "./Text";
import { difference } from "lodash";
import FurnitureEntity from "./components/FurnitureEntity";
import Floor from "./Floor";
// useAppSelector replaced by narrow selector hooks from useFurnitureObstacle
import { GrabContext } from "./context/GrabContext";
import { EDirection } from "./types/public";
import { getId, getRotation } from "./utils/util";

interface ILevel {
  updateFurnitureHandle?: (handle: number[] | undefined) => void;
}
const FURNITURE_TYPES: string[] = Object.values(EFurnitureType)
  .filter((item) => item !== EFurnitureType.foodTable)
  .concat(Object.values(FoodTableName));

const MergedGrid = ({ model }: { model: THREE.Object3D }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const wall = model.getObjectByName("wall")?.children[0];
  useEffect(() => {
    if (!(wall instanceof THREE.Mesh) || !meshRef.current) return;

    let index = 0;
    const box = new THREE.Box3().setFromObject(wall);
    const size = box.getSize(new THREE.Vector3());
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const matrix = new THREE.Matrix4()
            .copy(wall.matrixWorld)
            .multiply(
              new THREE.Matrix4().setPosition(
                x * size.x,
                y * size.y,
                -z * size.z,
              ),
            );

          meshRef.current.setMatrixAt(index++, matrix);
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [model]);
  if (!(wall instanceof THREE.Mesh)) return null;

  return (
    <instancedMesh
      ref={meshRef}
      position={[-0.5, 0, -0.5]}
      args={[wall.geometry, wall.material, 24]}
    />
  );
};
function Level({ updateFurnitureHandle }: ILevel) {
  const { grabModels, modelAnimations, notifyReady } =
    useContext(ModelResourceContext);
  const { toolPosRef } = useContext(GrabContext);
  const [prevModelTypes, setPrevModelTypes] = React.useState<string[]>([]);
  const [preveObstacleKeys, setPreveObstacleKeys] = React.useState<string[]>(
    [],
  );
  const startTimeRef = useRef<number | null>(null);

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

  const highlightIds = useHighlightId();

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
      return [position[0], position[1], position[2] + 0.06];
    }
    if (type === EFurnitureType.drawerTable) {
      if (rotateDirection === EDirection.left) {
        return [position[0] + 0.06, position[1], position[2] + 0.02];
      } else if (rotateDirection === EDirection.right) {
        return [position[0] - 0.06, position[1], position[2] + 0.02];
      } else if (rotateDirection === EDirection.back) {
        return [position[0], position[1], position[2] - 0.06];
      } else if (rotateDirection === EDirection.normal) {
        return [position[0], position[1], position[2] + 0.06];
      }
    }
    if (type === EFurnitureType.washSink || type === EFurnitureType.trash) {
      return [position[0], position[1], position[2] + 0.06];
    }

    if (type === EFurnitureType.serveDishes) {
      return [position[0] - 0.06, position[1], position[2]];
    }
    if (type === EFurnitureType.baseTable) {
      return [position[0], position[1], position[2] + 0.06];
    }

    return position;
  };

  useEffect(() => {
    let grabArr = Object.keys(grabModels);
    if (!grabArr.length) return;
    const diff = difference(grabArr, prevModelTypes);
    if (prevModelTypes.length === 0 && grabArr.length > 0) {
      if (startTimeRef.current === null)
        startTimeRef.current =
          typeof performance !== "undefined" ? performance.now() : Date.now();
    }
    if (diff.length > 0) {
      const models: Record<string, THREE.Group> = {};

      diff.forEach((type) => {
        if (FURNITURE_TYPES.includes(type)) {
          // if (type === EFurnitureType.foodTable) {
          //   Object.values(EFoodType).forEach((foodType) => {
          //     let model = grabModels[foodType + "Table"];
          //     if (!model) {
          //       console.error("Missing model for", foodType + "Table");
          //       return;
          //     }
          //     models[foodType + "Table"] = model;
          //   });
          // } else {
          if (!grabModels[type]) return;
          models[type] = grabModels[type];
          notifyReady?.(1);
          // }
        }
      });

      if (Object.keys(models).length === 0) return;

      // 检查是否有新的model可以注册
      const arr = FURNITURE_ARR.filter((item) => {
        if (item.type === EFurnitureType.foodTable) {
          return Object.keys(FoodTableName).includes(item.foodType + "Table");
        } else {
          return diff.indexOf(item.type) > -1;
        }
      });
      arr.forEach((item) => {
        const instanceKey = getId(
          ERigidBodyType.furniture,
          item.type,
          `${item.position[0]}_${item.position[2]}`,
        );
        if (item.type === EFurnitureType.washSink) {
          toolPosRef.current?.set(instanceKey, [
            item.position[0],
            item.position[2],
          ]);
        }
        // 如果已经注册过，跳过
        if (furnitureInstanceModels.current.has(instanceKey)) return;
        let type =
          item.type === EFurnitureType.foodTable
            ? item.foodType + "Table"
            : item.type;
        if (!models[type]) {
          return;
        }
        let model = models[type].clone();

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
          isMovable: false,
        };
        if (item.type === EFurnitureType.foodTable && item.foodType) {
          basePosition.foodType = item.foodType;
        }
        registerObstacle(instanceKey, basePosition);
        // notify provider that one scene instance has been created/registered
      });
      setPrevModelTypes(Object.keys(grabModels));
    }
  }, [Object.keys(grabModels).length]);

  useEffect(() => {
    if (furnitureInstanceModels.current.size === FURNITURE_ARR.length) {
      setRegistry(true);
      const t =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      console.info(
        "Level fully ready in",
        Math.round(t - (startTimeRef.current || t)),
        "ms",
      );
      const arr = Array.from(furnitureRigidRefs.current.values())
        .map((r) => r.current?.handle)
        .filter((h): h is number => typeof h === "number");
      updateFurnitureHandle?.(arr);
    }
  }, [furnitureInstanceModels.current.size]);

  const previousHighlightRef = useRef<string | null>(null);

  const renderFurniture = useMemo(() => {
    // console.log(
    //   "Rendering furniture items:",
    //   furnitureItemRefs.current.size,
    //   highlightId,
    // );
    return FURNITURE_ARR.map((item) => {
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
      let size: [number, number, number] = [2, 1, 2];
      switch (type) {
        case EFurnitureType.washSink:
          size = [4, 1, 2.3];
          break;
        case EFurnitureType.drawerTable:
          size = [2, 1, 2.12];
          break;
        case EFurnitureType.foodTable:
          size = [2, 0.906, 2];
          break;
        case EFurnitureType.gasStove:
          size = [2, 1.1, 2.13];
          break;
        case EFurnitureType.baseTable:
          size = [2, 1, 2];
          break;
        case EFurnitureType.serveDishes:
          size = [4, 1.04, 3.04];
          break;
        case EFurnitureType.trash:
          size = [2, 0.896, 2];
          break;
      }
      return (
        <FurnitureEntity
          type={item.type}
          animations={modelAnimations[type]}
          key={instanceKey}
          // 检查是否有任一玩家高亮了此家具
          highlighted={Object.values(highlightIds).some(
            (id) => id === instanceKey,
          )}
          ref={rigidRef}
          size={size}
          val={val}
          instanceKey={instanceKey}
        />
      );
    });
  }, [furnitureItemRefs.current.size, highlightIds]);
  return (
    <group>
      {renderFurniture}
      {/* {grabModels.wall && <MergedGrid model={grabModels.wall} />} */}
      {grabModels.floor && <Floor model={grabModels.floor} />}
    </group>
  );
}

export const MemoizedLevel = React.memo(Level);

export default MemoizedLevel;
