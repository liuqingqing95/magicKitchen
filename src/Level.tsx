import { FURNITURE_ARR } from "@/constant/data";
import { EFoodType, EFurnitureType, IFurnitureItem } from "@/types/level";
import { EDirection } from "@/types/public";
import { MODEL_PATHS } from "@/utils/loaderManager";
import { Float, Text, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { COLLISION_PRESETS } from "./constant/collisionGroups";
import { IFurniturePosition, useObstacleStore } from "./stores/useObstacle";
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
  isHighlightFurniture: false | IFurniturePosition;
  updateFurnitureHandle?: (handle: number[] | undefined) => void;
}
const FURNITURE_TYPES = Object.values(EFurnitureType);

export function Level({ isHighlightFurniture, updateFurnitureHandle }: ILevel) {
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
  const floorGltf = useGLTF(MODEL_PATHS.overcooked.floor);
  const furnitureGltfs = FURNITURE_TYPES.map((type) =>
    useGLTF(MODEL_PATHS.overcooked[type])
  );

  const furnitureModels = useMemo(() => {
    const models: Record<string, THREE.Group> = {};
    if (floorGltf && floorGltf.scene) models.floor = floorGltf.scene.clone();
    FURNITURE_TYPES.forEach((type, i) => {
      const g = furnitureGltfs[i];
      if (g && g.scene) {
        models[type] = g.scene.clone();
      }
    });
    return models;
  }, [floorGltf, ...furnitureGltfs]);
  const furnitureRegisteredRef = useRef(false);

  const previousHighlightRef = useRef<string | null>(null);
  const furnitureInstanceModels = useRef(new Map<string, THREE.Object3D>());
  // console.log(d, "dfff");
  // const fenceGate = useGLTF("/fence-gate.glb");
  // const wall = useGLTF("/wall.glb");
  // const fenceBorderCurve = useGLTF("/iron-fence-border-curve.glb");

  // const stallTexture = useTexture("/kenney_coaster-kit/textures/colormap.png");
  // const wallTexture = useTexture("/Previews/wall.png");
  const furnitureRefs = useRef<RapierRigidBody[]>([]);
  const {
    registerObstacle,
    clearObstacles,
    setRegistryFurniture,
    getObstacleInfo,
  } = useObstacleStore();
  const [modelReady, setModelReady] = useState(false);
  // const floorTexture = useTexture(
  //   "/kenney_graveyard-kit_5.0/Textures/colormap.png",
  //   true,

  // );
  // console.log(isHighlightFurniture, "isHighlightFurniture");
  useFrame((_, delta) => {
    // 取消之前的高亮
    if (previousHighlightRef.current) {
      const previousModel = furnitureInstanceModels.current.get(
        previousHighlightRef.current
      );
      if (previousModel) {
        previousModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.emissive = new THREE.Color(0x000000);
            material.emissiveIntensity = 0;
            material.roughness = 0.8;
            material.metalness = 0.2;
          }
        });
      }
    }

    // 设置新的高亮
    if (isHighlightFurniture) {
      const model = furnitureInstanceModels.current.get(
        isHighlightFurniture.id
      );

      if (model) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.emissive = new THREE.Color("#ff9800");
            material.emissiveIntensity = 0.3;
            material.roughness = 0.4;
            material.metalness = 0.3;
          }
        });
        previousHighlightRef.current = isHighlightFurniture.id;
      }
    } else {
      previousHighlightRef.current = null;
    }
  });
  const floorModel = useRef<THREE.Group | null>(null);
  useEffect(() => {
    if (!furnitureModels.floor) {
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
    switch (rotateDirection) {
      case EDirection.left:
        return [position[0] + 0.06, position[1], position[2] + 0.1];
      case EDirection.right:
        return [position[0] - 0.06, position[1], position[2] + 0.1];
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
  const renderFurniture = (item: (typeof FURNITURE_ARR)[0], index: any) => {
    const instanceKey = `Furniture_${item.name}_${item.position.join("_")}`;
    const model = furnitureInstanceModels.current.get(instanceKey)!;
    const scale = [0.99, 0.8, 0.99];
    let realColliderY = scale[1];
    const foodText = () => {
      if (item.name !== EFurnitureType.foodTable) return;
      const instanceKey = `TEXT_${item.position.join("_")}`;
      let text = "";
      realColliderY = 0.4;
      switch (item.foodType) {
        case EFoodType.cheese:
          text = "奶酪";
          break;
        case EFoodType.eggCooked:
          text = "煎蛋";
          break;
        case EFoodType.meatPatty:
          text = "肉饼";
          break;
        case EFoodType.cuttingBoardRound:
          text = "圆面包";
          break;
        default:
          text = "";
      }
      return (
        <Float key={instanceKey} floatIntensity={0.25} rotationIntensity={0.25}>
          <Text
            font="/bebas-neue-v9-latin-regular.woff"
            scale={0.5}
            maxWidth={2}
            lineHeight={0.75}
            color={"black"}
            textAlign="right"
            position={[0, 1.3, 0]}
            rotation-y={-Math.PI / 6}
          >
            {text}
            <meshBasicMaterial toneMapped={false} />
          </Text>
        </Float>
      );
    };
    if (model) {
      // const userData = JSON.stringify({
      //   id: instanceKey,
      // });
      return (
        <RigidBody
          type="fixed"
          restitution={0.2}
          friction={0}
          position={getPosition(item)}
          rotation={getRotation(item.rotateDirection)}
          key={instanceKey}
          colliders={false}
          // colliders="cuboid"
          collisionGroups={COLLISION_PRESETS.FURNITURE}
          //
          userData={instanceKey}
          ref={(g) => {
            // console.log("ssss", g?.collider());
            furnitureRefs.current.push(g);
            // console.log("FURN collider:", g?.handle, instanceKey);
          }}
          // onCollisionEnter={(e) =>
          //   console.log("FURN sensor enter", e.other?.rigidBody?.userData)
          // }
          // onCollisionExit={(e) =>
          //   console.log("FURN sensor exit", e.other?.rigidBody?.userData)
          // }
        >
          <primitive object={model} position={[0, 0, 0]} />
          {foodText()}
          {/* 阻挡碰撞体：下移并稍微减小高度，避免与桌面上物体重叠 */}
          <CuboidCollider
            args={[scale[0], 0.5, scale[2]]}
            position={[0, 0, 0]}
            restitution={0.2}
            // collisionGroups={2}
            friction={1}
          />
          {/* 放置物品的传感器：薄而靠近桌面，用于检测放置/高亮，不影响物理支撑 */}
          {/* <CuboidCollider
            ref={(g) => {
              furnitureRefs.current.push(g);
            }}
            args={[scale[0] * 1.3, 0.3, scale[2] * 1.3]}
            position={[0, 1, 0]}
            sensor={true}
            collisionGroups={2}
            // onIntersectionEnter={(e) =>
            //   console.log("FURN sensor enter", e.other?.rigidBody?.userData)
            // }
            // onIntersectionExit={(e) =>
            //   console.log("FURN sensor exit", e.other?.rigidBody?.userData)
            // }
          /> */}
        </RigidBody>
      );
    }
  };

  // useEffect(() => {

  // }, [isHighlightFurniture]);

  useEffect(() => {
    // Only run once when all furniture models are available
    if (furnitureRegisteredRef.current) return;

    const allLoaded = FURNITURE_TYPES.every((type) => !!furnitureModels[type]);
    if (!allLoaded) return;
    setModelReady(true);
    // mark registered to avoid re-running
    furnitureRegisteredRef.current = true;

    FURNITURE_ARR.forEach((item) => {
      const instanceKey = `Furniture_${item.name}_${item.position.join("_")}`;

      const model = furnitureModels[item.name].clone();

      // 为每个实例创建独立的材质
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = (
            child.material as THREE.MeshStandardMaterial
          ).clone();
        }
      });
      furnitureInstanceModels.current.set(instanceKey, model);
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
    });
    setRegistryFurniture(true);

    return () => {
      clearObstacles();
      furnitureRegisteredRef.current = false;
    };
  }, [furnitureModels]);

  useEffect(() => {
    if (furnitureRefs.current.length === FURNITURE_ARR.length) {
      const arr = furnitureRefs.current.map((ref) => {
        return ref.handle;
      });
      updateFurnitureHandle?.(arr);
    }
  }, [furnitureRefs.current.length]);
  return (
    <>
      {modelReady && FURNITURE_ARR.map(renderFurniture)}
      {/* <primitive
          object={drawerTable.scene.clone()}
          position={[19.5, 0.2, 0]}
          scale={[0.5, 1, 1]}
          rotation={[0, 0, 0]}
        /> */}
      {/* {floorModel.current && (
        <primitive object={floorModel.current} position={[0, 0, 0]} />
      )} */}

      {/* <primitive object={floor.scene.clone()}>
          <meshStandardMaterial
            clippingPlanes={clippingPlanes}
            clipIntersection={false} // false: 裁剪掉平面外侧; true: 只保留相交部分
            clipShadows={true} // 阴影也被裁剪
            color="hotpink"
          />
        </primitive> */}
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position={[0, -0.2, 0]}
        scale={[38, 0.2, 22]}
        receiveShadow
      />
      {/* <RigidBody type="fixed" userData="floor" restitution={0.2} friction={0}> */}
      <CuboidCollider
        args={[19, 0.1, 11]}
        position={[0, -0.1, 0]}
        restitution={0.2}
        friction={1}
        collisionGroups={COLLISION_PRESETS.FLOOR}
      ></CuboidCollider>
      {/* </RigidBody> */}
    </>
  );
}
