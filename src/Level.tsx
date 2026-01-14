import { FURNITURE_ARR } from "@/constant/data";
import { EFoodType, EFurnitureType, IFurnitureItem } from "@/types/level";
import { EDirection } from "@/types/public";
import { CuboidCollider, RapierRigidBody } from "@react-three/rapier";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { COLLISION_PRESETS } from "./constant/collisionGroups";
import ModelResourceContext from "./context/ModelResourceContext";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "./stores/useFurnitureObstacle";
// import { DebugText } from "./Text";
import FurnitureEntity from "./components/FurnitureEntity";
import { getRotation } from "./utils/util";
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const floor1Material = new THREE.MeshStandardMaterial({ color: "limegreen" });
const floor2Material = new THREE.MeshStandardMaterial({ color: "greenyellow" });
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" });
const STATIC_CLIPPING_PLANES = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), 7), // 切掉 x > 18
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), 19), // 切掉 x < -6
  new THREE.Plane(new THREE.Vector3(0, 0, 1), 11), // 切掉 z > 4
  new THREE.Plane(new THREE.Vector3(0, 0, -1), 5), // 切掉 z < -10
];
interface ILevel {
  updateFurnitureHandle?: (handle: number[] | undefined) => void;
}
const FURNITURE_TYPES = Object.values(EFurnitureType);

function Level({ updateFurnitureHandle }: ILevel) {
  // const baseTable = useGLTF(MODEL_PATHS.overcooked.baseTable);
  // const gasStove = useGLTF(MODEL_PATHS.overcooked.gasStove);
  // const foodTable = useGLTF(MODEL_PATHS.overcooked.foodTable);
  // const drawerTable = useGLTF(MODEL_PATHS.overcooked.drawerTable);
  // const trash = useGLTF(MODEL_PATHS.overcooked.trash);

  // const cuttingBoard = useGLTF(MODEL_PATHS.overcooked.cuttingBoard);

  // const serveDishes = useGLTF(MODEL_PATHS.overcooked.serveDishes);
  // const stockpot = useGLTF(MODEL_PATHS.overcooked.stockpot);
  // const washSink = useGLTF(MODEL_PATHS.overcooked.washSink);
  //   const brickWall = useGLTF(MODEL_PATHS.graveyard.brickWall);
  // const brickWallCurveSmall = useGLTF(MODEL_PATHS.graveyard.wallCurve);
  //  const stallFood = useGLTF(MODEL_PATHS.coaster.stallFood);
  //  const floor = useGLTF(MODEL_PATHS.overcooked.floor);
  // Load all furniture GLTFs as hooks so suspense/loading is handled by drei.
  // Calling `useGLTF` for each type in a stable order is fine because
  // `FURNITURE_TYPES` is a fixed array.

  const { grabModels } = useContext(ModelResourceContext);

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
    >()
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
    >()
  );
  const furnitureRigidRefs = useRef(
    new Map<string, React.RefObject<RapierRigidBody | null>>()
  );

  // console.log(d, "dfff");
  // const fenceGate = useGLTF("/fence-gate.glb");
  // const wall = useGLTF("/wall.glb");
  // const fenceBorderCurve = useGLTF("/iron-fence-border-curve.glb");

  // const stallTexture = useTexture("/kenney_coaster-kit/textures/colormap.png");
  // const wallTexture = useTexture("/Previews/wall.png");
  const furnitureRefs = useRef<RapierRigidBody[]>([]);
  const { registerObstacle, setRegistry, highlightId, obstacles } =
    useFurnitureObstacleStore((s) => ({
      registerObstacle: s.registerObstacle,
      highlightId: s.highlightId,
      setRegistry: s.setRegistry,
      obstacles: s.obstacles,
    }));
  // const floorTexture = useTexture(
  //   "/kenney_graveyard-kit_5.0/Textures/colormap.png",
  //   true,

  // );
  // console.log(isHighlightFurniture, "isHighlightFurniture");
  // Update highlight only when `isHighlightFurniture` changes.
  // Avoid running this every frame because that forces renderer updates
  // for the whole scene (including the floor). A single effect is sufficient
  // to toggle highlight material properties when selection changes.

  const floorModel = useRef<THREE.Group | null>(null);
  useEffect(() => {
    if (!furnitureModels || !furnitureModels.floor) {
      return;
    }
    const model = furnitureModels.floor.clone();
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          ...child.material,
          clippingPlanes: STATIC_CLIPPING_PLANES,
          clipIntersection: false,
          side: THREE.DoubleSide,
        });
      }
    });
    floorModel.current = model;
  }, [furnitureModels.floor]);

  // // 计算模型的边界框
  // const washSinkBox = new THREE.Box3().setFromObject(washSink.scene);
  // const drawerTableBox = new THREE.Box3().setFromObject(drawerTable.scene);

  // console.log("washSink size:", washSinkBox.getSize(new THREE.Vector3()));
  // console.log("drawerTable size:", drawerTableBox.getSize(new THREE.Vector3()));

  const getPosition = ({
    position,
    rotateDirection,
    name,
  }: IFurnitureItem): [number, number, number] => {
    if (
      name === EFurnitureType.gasStove &&
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
  // const getArgs = (
  //   scale: number[],
  //   rotateDirection: EDirection,
  //   name: EFurnitureType
  // ) => {
  //   if (name === EFurnitureType.baseTable) {
  //     return [scale[0], 0.25, scale[2]];
  //   }
  //   switch (rotate) {
  //     case EDirection.left:
  //       return [scale[0], 0.25, scale[2] * 1.4];
  //     case EDirection.right:
  //       return [scale[0], 0.25, scale[2] * 1.15];
  //     // case EDirection.normal:
  //     //   return [scale[0], 0.25, scale[2] * 1.15];
  //     // case EDirection.back:
  //     //   return [scale[0], 0.5, scale[2]];

  //     // case EDirection.right:
  //     //   return [scale[0] - 0.06, position[1], position[2] + 0.1];
  //     // case EDirection.normal:
  //     //   return scale;
  //     // case EDirection.back:
  //     //   return scale;
  //     default:
  //       return [scale[0], 0.25, scale[2]];
  //   }
  // };

  // useEffect(() => {

  // }, [isHighlightFurniture]);
  const startTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (startTimeRef.current === null)
      startTimeRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();

    if (!furnitureModels) return;

    // 检查是否有新的model可以注册
    FURNITURE_ARR.forEach((item) => {
      const instanceKey = `Furniture_${item.name}_${item.position[0]}_${item.position[2]}`;

      // 如果已经注册过，跳过
      if (furnitureInstanceModels.current.has(instanceKey)) return;

      let model;
      if (item.name === EFurnitureType.foodTable && item.foodType) {
        if (!furnitureModels[item.foodType + "Table"]) return;
        model = furnitureModels[item.foodType + "Table"].clone();
      } else {
        if (!furnitureModels[item.name]) return;
        model = furnitureModels[item.name].clone();
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
          type: item.name,
          model,
          position: getPosition(item),
          rotation: getRotation(item.rotateDirection),
        },
      };
      furnitureItemRefs.current.set(instanceKey, itemRef);
      // create and store a stable rigid ref for forwarding to entity
      furnitureRigidRefs.current.set(
        instanceKey,
        React.createRef<RapierRigidBody | null>()
      );

      const basePosition: IFurniturePosition = {
        id: instanceKey,
        type: item.name,
        position: item.position,
        rotateDirection: item.rotateDirection,
        size: [2.3, 1.3, 2.3],
        isFurniture: true,
        isMovable: false,
      };
      if (item.name === EFurnitureType.foodTable && item.foodType) {
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
          "ms"
        );
      }
    });

    // return () => {
    //   clearObstacles();
    //   furnitureInstanceModels.current.clear();
    //   furnitureItemRefs.current.clear();
    //   furnitureRigidRefs.current.clear();
    // };
  }, [furnitureModels]);

  useEffect(() => {
    console.log("obstacles changed: ", obstacles.size);
  }, [obstacles.size]);

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
      const instanceKey = `Furniture_${item.name}_${item.position[0]}_${item.position[2]}`;
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
        const instanceKey = `Furniture_${item.name}_${item.position[0]}_${item.position[2]}`;
        const val = furnitureItemRefs.current.get(instanceKey);
        const rigidRef = furnitureRigidRefs.current.get(instanceKey);
        if (!val || !rigidRef) return null;

        return (
          <FurnitureEntity
            type={item.name}
            key={instanceKey}
            highlighted={highlighted[instanceKey]}
            ref={rigidRef}
            val={val}
            instanceKey={instanceKey}
          />
        );
      })}
      {/* <primitive
          object={drawerTable.scene.clone()}
          position={[19.5, 0.2, 0]}
          scale={[0.5, 1, 1]}
          rotation={[0, 0, 0]}
        /> */}
      {floorModel.current && (
        <mesh
          geometry={boxGeometry}
          material={floor1Material}
          position={[0, -0.2, 0]}
          scale={[38, 0.2, 22]}
          receiveShadow
        />
        // <primitive object={floorModel.current} position={[0, 0, 0]} />
      )}

      {/* <primitive object={floor.scene.clone()}>
          <meshStandardMaterial
            clippingPlanes={clippingPlanes}
            clipIntersection={false} // false: 裁剪掉平面外侧; true: 只保留相交部分
            clipShadows={true} // 阴影也被裁剪
            color="hotpink"
          />
        </primitive> */}

      {/* <RigidBody type="fixed" userData="floor" restitution={0.2} friction={0}> */}
      <CuboidCollider
        args={[19, 0.1, 11]}
        position={[0, -0.1, 0]}
        restitution={0.2}
        friction={1}
        collisionGroups={COLLISION_PRESETS.FLOOR}
      ></CuboidCollider>
      {/* </RigidBody> */}
    </group>
  );
}

export const MemoizedLevel = React.memo(Level);

export default MemoizedLevel;
