import { FURNITURE_ARR } from '@/constant/data';
import { EFurnitureType, IFurnitureItem } from "@/types/level";
import { EDirection } from "@/types/public";
import {
  MODEL_PATHS
} from "@/utils/loaderManager";
import { getRotation } from '@/utils/util';
import { useGLTF } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from 'react';
import * as THREE from "three";
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const floor1Material = new THREE.MeshStandardMaterial({ color: "limegreen" });
const floor2Material = new THREE.MeshStandardMaterial({ color: "greenyellow" });
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" });
const STATIC_CLIPPING_PLANES = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), 7),   // 切掉 x > 18
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), 19),   // 切掉 x < -6
  new THREE.Plane(new THREE.Vector3(0, 0, 1), 11),    // 切掉 z > 4
  new THREE.Plane(new THREE.Vector3(0, 0, -1), 5),  // 切掉 z < -10
];
export function Level() {
  const baseTable = useGLTF(MODEL_PATHS.overcooked.baseTable);
  const gasStove = useGLTF(MODEL_PATHS.overcooked.gasStove);
  const foodTable = useGLTF(MODEL_PATHS.overcooked.foodTable);
  const drawerTable = useGLTF(MODEL_PATHS.overcooked.drawerTable);
  const trash = useGLTF(MODEL_PATHS.overcooked.trash);

  const cuttingBoard = useGLTF(MODEL_PATHS.overcooked.cuttingBoard);

  const serveDishes = useGLTF(MODEL_PATHS.overcooked.serveDishes);
  const stockpot = useGLTF(MODEL_PATHS.overcooked.stockpot);
  const washSink = useGLTF(MODEL_PATHS.overcooked.washSink);

  const brickWall = useGLTF(
    MODEL_PATHS.graveyard.brickWall);
  const brickWallCurveSmall = useGLTF(
    MODEL_PATHS.graveyard.wallCurve );
  // console.log(d, "dfff");
  // const fenceGate = useGLTF("/fence-gate.glb");
  // const wall = useGLTF("/wall.glb");
  // const fenceBorderCurve = useGLTF("/iron-fence-border-curve.glb");
  const stallFood = useGLTF(MODEL_PATHS.coaster.stallFood);
  // const stallTexture = useTexture("/kenney_coaster-kit/textures/colormap.png");
  // const wallTexture = useTexture("/Previews/wall.png");
  const floor = useGLTF(MODEL_PATHS.overcooked.floor);
  // const floorTexture = useTexture(
  //   "/kenney_graveyard-kit_5.0/Textures/colormap.png",
  //   true,

  // );
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
          side: THREE.DoubleSide
        });
      }
    });
    floorModel.current = model;
  }, [floor])
 
  // 逐个网格计算 world-space 包围盒，兼容 SkinnedMesh
  // const totalBox = new THREE.Box3();
  // let any = false;

  // stallFood.scene.traverse((node) => {
  //   if (isMesh(node)) {
  //     (node.material as THREE.MeshStandardMaterial).map = stallTexture;
  //     (node.material as THREE.MeshStandardMaterial).needsUpdate = true;
  //   }
  // });
  // // const brickWallEndTexture = useTexture("/Previews/brick-wall-end.png");
  // brickWallEndTexture.colorSpace = THREE.SRGBColorSpace;
  // brickWallEndTexture.flipY = false;
  // const [meshes, setMeshes] = useState<THREE.Mesh[]>([]);
  // const [meshes, setMeshes] = useState([]);
  // useEffect(() => {
  //   const mesh = d.scene.children[0].children[0].children[2];
  //   if (!mesh) {
  //     return;
  //   }

  //   const separateBySpatialGap = (originalMesh) => {
  //     const geometry = originalMesh.geometry.clone();
  //     const resultMeshes = [];

  //     // 计算边界框
  //     geometry.computeBoundingBox();
  //     const bbox = geometry.boundingBox;

  //     // 如果边界框很大，可能包含多个分离的物体
  //     const size = new THREE.Vector3();
  //     bbox.getSize(size);

  //     console.log("Overall bounding box size:", size);
  //     console.log("Overall bounding box:", bbox);

  //     // 基于空间位置分离的逻辑
  //     // 这里需要根据您的具体模型来编写分离算法
  //     // separateMeshesByPosition(originalMesh, resultMeshes);

  //     return resultMeshes;
  //   };

  //   const separated = separateBySpatialGap(mesh);
  //   setMeshes(separated);
  // }, []);

  // 添加这些调试代码
  // washSink.scene.traverse((child) => {
  //   if (child.isMesh) {
  //     console.log("washSink mesh:", child.name, child.position);
  //   }
  // });

  // drawerTable.scene.traverse((child) => {
  //   if (child.isMesh) {
  //     console.log("drawerTable mesh:", child.name, child.position);
  //   }
  // });

  // // 计算模型的边界框
  // const washSinkBox = new THREE.Box3().setFromObject(washSink.scene);
  // const drawerTableBox = new THREE.Box3().setFromObject(drawerTable.scene);

  // console.log("washSink size:", washSinkBox.getSize(new THREE.Vector3()));
  // console.log("drawerTable size:", drawerTableBox.getSize(new THREE.Vector3()));

  const getPosition = ({ position, rotate, name }: IFurnitureItem): [number, number, number] => {
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
    const clonedModel = furnitureModels[item.name].clone();
    const scale = [0.99, 0.8, 0.99];
    return (
      <group key={clonedModel.uuid}>
        <primitive
          object={clonedModel}
          position={getPosition(item)}
          scale={scale}
          rotation={getRotation(item.rotate)}
        />
        <CuboidCollider
          args={[ scale[0], 0.5 * scale[1], scale[2]]} // 所有维度都乘以缩放比例
          position={getPosition(item)}
          rotation={getRotation(item.rotate)}
        />
      </group>
    );
  };



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
        <primitive object={floorModel.current} position={[0, 0, 0]}  />)}
      
         
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
        >
          
        </CuboidCollider>
      </RigidBody>
    </>
  );
}
