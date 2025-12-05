import { FURNITURE_ARR } from "@/constant/data";
import { EFurnitureType, IFurnitureItem } from "@/types/level";
import { EDirection } from "@/types/public";
import { MODEL_PATHS } from "@/utils/loaderManager";
import { getRotation } from "@/utils/util";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { IFurniturePosition, useObstacleStore } from "./stores/useObstacle";
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
}
export function Level({ isHighlightFurniture }: ILevel) {
  const baseTable = useGLTF(MODEL_PATHS.overcooked.baseTable);
  const gasStove = useGLTF(MODEL_PATHS.overcooked.gasStove);
  const foodTable = useGLTF(MODEL_PATHS.overcooked.foodTable);
  const drawerTable = useGLTF(MODEL_PATHS.overcooked.drawerTable);
  const trash = useGLTF(MODEL_PATHS.overcooked.trash);
  const furnitureInstanceModels = useRef(new Map<string, THREE.Object3D>());
  const cuttingBoard = useGLTF(MODEL_PATHS.overcooked.cuttingBoard);

  const serveDishes = useGLTF(MODEL_PATHS.overcooked.serveDishes);
  const stockpot = useGLTF(MODEL_PATHS.overcooked.stockpot);
  const washSink = useGLTF(MODEL_PATHS.overcooked.washSink);
  const previousHighlightRef = useRef<string | null>(null);
  const brickWall = useGLTF(MODEL_PATHS.graveyard.brickWall);
  const brickWallCurveSmall = useGLTF(MODEL_PATHS.graveyard.wallCurve);
  // console.log(d, "dfff");
  // const fenceGate = useGLTF("/fence-gate.glb");
  // const wall = useGLTF("/wall.glb");
  // const fenceBorderCurve = useGLTF("/iron-fence-border-curve.glb");
  const stallFood = useGLTF(MODEL_PATHS.coaster.stallFood);
  // const stallTexture = useTexture("/kenney_coaster-kit/textures/colormap.png");
  // const wallTexture = useTexture("/Previews/wall.png");
  const floor = useGLTF(MODEL_PATHS.overcooked.floor);
  const { registerObstacle, clearObstacles, setRegistryFurniture } =
    useObstacleStore();
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
    if (!floor) {
      return;
    }
    const model = floor.scene.clone();
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
  }, [floor]);

  // // 计算模型的边界框
  // const washSinkBox = new THREE.Box3().setFromObject(washSink.scene);
  // const drawerTableBox = new THREE.Box3().setFromObject(drawerTable.scene);

  // console.log("washSink size:", washSinkBox.getSize(new THREE.Vector3()));
  // console.log("drawerTable size:", drawerTableBox.getSize(new THREE.Vector3()));

  const getPosition = ({
    position,
    rotate,
    name,
  }: IFurnitureItem): [number, number, number] => {
    if (name === EFurnitureType.foodTable) {
      return [position[0], position[1] + 0.1, position[2]];
    }
    switch (rotate) {
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

  const furnitureModels = {
    [EFurnitureType.baseTable]: baseTable.scene.clone(),
    [EFurnitureType.drawerTable]: drawerTable.scene.clone(),
    [EFurnitureType.washSink]: washSink.scene.clone(),
    [EFurnitureType.trash]: trash.scene.clone(),
    [EFurnitureType.foodTable]: foodTable.scene.clone(),
    [EFurnitureType.gasStove]: gasStove.scene.clone(),
    [EFurnitureType.serveDishes]: serveDishes.scene.clone(),
  };
  const renderFurniture = (item: (typeof FURNITURE_ARR)[0]) => {
    const instanceKey = `${item.name}_${item.position.join("_")}`;
    const model = furnitureInstanceModels.current.get(instanceKey)!;
    const scale = [0.99, 0.8, 0.99];
    if (model) {
      return (
        <group key={instanceKey}>
          <primitive
            object={model}
            position={getPosition(item)}
            scale={scale}
            rotation={getRotation(item.rotate)}
          />
          <CuboidCollider
            args={[scale[0], scale[1], scale[2]]}
            position={getPosition(item)}
            rotation={getRotation(item.rotate)}
          />
        </group>
      );
    }
  };

  // useEffect(() => {

  // }, [isHighlightFurniture]);

  useEffect(() => {
    // const grabArr = getAllObstacles().filter(item => item.isFurniture === false);
    // console.log(grabArr, "场景中的可抓取物品");
    FURNITURE_ARR.forEach((item) => {
      const instanceKey = `${item.name}_${item.position.join("_")}`;

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

      registerObstacle(instanceKey, {
        id: instanceKey,
        type: item.name,
        position: item.position,
        rotate: item.rotate,
        size: [2.3, 1.3, 2.3],
        isFurniture: true,
        isMovable: false,
      } as IFurniturePosition);
    });
    setRegistryFurniture(true);
    return () => {
      clearObstacles();
    };
  }, []);

  return (
    <>
      {FURNITURE_ARR.map(renderFurniture)}
      {/* <primitive
          object={drawerTable.scene.clone()}
          position={[19.5, 0.2, 0]}
          scale={[0.5, 1, 1]}
          rotation={[0, 0, 0]}
        /> */}
      {floorModel.current && (
        <primitive object={floorModel.current} position={[0, 0, 0]} />
      )}

      {/* <primitive object={floor.scene.clone()}>
          <meshStandardMaterial
            clippingPlanes={clippingPlanes}
            clipIntersection={false} // false: 裁剪掉平面外侧; true: 只保留相交部分
            clipShadows={true} // 阴影也被裁剪
            color="hotpink"
          />
        </primitive> */}

      <RigidBody type="fixed" restitution={0.2} friction={0}>
        <CuboidCollider
          args={[18, 0.1, 10]}
          position={[0, -0.1, 0]}
          restitution={0.2}
          friction={1}
        ></CuboidCollider>
      </RigidBody>
    </>
  );
}
