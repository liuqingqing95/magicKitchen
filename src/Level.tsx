import { EDirection, EFurnitureType, IFurnitureItem } from "@/types/level";
import {
  MODEL_PATHS,
  coasterLoader,
  graveyardLoader,
} from "@/utils/loaderManager";
import { useGLTF } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const floor1Material = new THREE.MeshStandardMaterial({ color: "limegreen" });
const floor2Material = new THREE.MeshStandardMaterial({ color: "greenyellow" });
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" });
const STATIC_CLIPPING_PLANES = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), -18),   // 切掉 x > 18
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), -6),   // 切掉 x < -6
  new THREE.Plane(new THREE.Vector3(0, 0, 1), -4),    // 切掉 z > 4
  new THREE.Plane(new THREE.Vector3(0, 0, -1), -10),  // 切掉 z < -10
];
export function Level() {
  const baseTable = useGLTF(MODEL_PATHS.overcooked.baseTable);
  const gasStove = useGLTF(MODEL_PATHS.overcooked.gasStove);
  const foodTable = useGLTF(MODEL_PATHS.overcooked.foodTable);
  const drawerTable = useGLTF(MODEL_PATHS.overcooked.drawerTable);
  const trash = useGLTF(MODEL_PATHS.overcooked.trash);

  const cuttingBoard = useGLTF(MODEL_PATHS.overcooked.cuttingBoard);
  const fireExtinguisher = useGLTF(MODEL_PATHS.overcooked.fireExtinguisher);
  const pan = useGLTF(MODEL_PATHS.overcooked.pan);
  const plate = useGLTF(MODEL_PATHS.overcooked.plate);
  const serveDishes = useGLTF(MODEL_PATHS.overcooked.serveDishes);
  const stockpot = useGLTF(MODEL_PATHS.overcooked.stockpot);
  const washSink = useGLTF(MODEL_PATHS.overcooked.washSink);

  const brickWall = useGLTF(
    MODEL_PATHS.graveyard.brickWall,
    true,
    graveyardLoader
  );
  const brickWallCurveSmall = useGLTF(
    MODEL_PATHS.graveyard.wallCurve,
    true,
    graveyardLoader
  );
  // console.log(d, "dfff");
  // const fenceGate = useGLTF("/fence-gate.glb");
  // const wall = useGLTF("/wall.glb");
  // const fenceBorderCurve = useGLTF("/iron-fence-border-curve.glb");
  const stallFood = useGLTF(MODEL_PATHS.coaster.stallFood, true, coasterLoader);
  // const stallTexture = useTexture("/kenney_coaster-kit/textures/colormap.png");
  // const wallTexture = useTexture("/Previews/wall.png");
  const floor = useGLTF(MODEL_PATHS.overcooked.floor);
  // const floorTexture = useTexture(
  //   "/kenney_graveyard-kit_5.0/Textures/colormap.png",
  //   true,

  // );
  // const floor = useGLTF(MODEL_PATHS.coaster.floor);
  console.log(floor, "floor");
  // const floorTexture = useTexture("/Previews/floor.png");
  // floorTexture.colorSpace = THREE.SRGBColorSpace;
  // floorTexture.flipY = false;
  // useEffect(() => {
  //   if (floor && floorTexture) {
  //     console.log(floor, "floor models");
  //     floor.materials.colormap = floorTexture;
  //     // floor.scene.traverse((node: THREE.Object3D) => {
  //     //   node.material.map = floorTexture;
  //     //   node.material.needsUpdate = true;
  //     // });

  //     // 找到对应的材质并替换纹理
  //     // if (floor.Floor) { // 假设材质名是 "Floor"
  //     //   floor.Floor.map = floorTexture;
  //     //   floor.Floor.needsUpdate = true;
  //     // }

  //     // // 或者遍历所有材质
  //     // Object.values(materials).forEach(material => {
  //     //   if (material.name.includes('floor')) {
  //     //     material.map = texture;
  //     //     material.needsUpdate = true;
  //     //   }
  //     // });
  //   }
  // }, [floor, floorTexture]);
  // const floorMaterial = new THREE.MeshStandardMaterial({
  //   map: floorTexture,
  //   color: 0xffffff,
  // });
  // const tmp = floor.scene.clone(true);

  // tmp.scale.set(1, 1, 1);
  // tmp.rotation.set(0, Math.PI, 0);
  // tmp.updateMatrixWorld(true);

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
  const washSinkBox = new THREE.Box3().setFromObject(washSink.scene);
  const drawerTableBox = new THREE.Box3().setFromObject(drawerTable.scene);

  console.log("washSink size:", washSinkBox.getSize(new THREE.Vector3()));
  console.log("drawerTable size:", drawerTableBox.getSize(new THREE.Vector3()));
  const arr: IFurnitureItem[] = [
    {
      name: EFurnitureType.baseTable,
      position: [-6, 0.2, 4],
      rotate: EDirection.left,
    },
    {
      name: EFurnitureType.drawerTable,
      position: [-4, 0.2, 4],
      rotate: EDirection.back,
    },
    // {
    //   name: EFurnitureType.pan,
    //   rotate: EDirection.normal,
    //   position: [-2, 0.8, 4],
    // },
    {
      name: EFurnitureType.plate,
      rotate: EDirection.normal,
      position: [-2, 0.8, 4],
    },
    {
      name: EFurnitureType.drawerTable,
      position: [-2, 0.2, 4],
      rotate: EDirection.back,
    },
    {
      name: EFurnitureType.drawerTable,
      position: [0, 0.2, 4],
      rotate: EDirection.back,
    },
    {
      name: EFurnitureType.drawerTable,
      position: [2, 0.2, 4],
      rotate: EDirection.back,
    },
    {
      name: EFurnitureType.baseTable,
      position: [4, 0.2, 4],
      rotate: EDirection.left,
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [4, 0.2, 2],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [4, 0.2, 0],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.back,
      position: [4, 0.2, -2],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.normal,
      position: [4, 0.2, -6],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [4, 0.2, -8],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [4, 0.2, -10],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.normal,
      position: [6, 0.2, -6],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.normal,
      position: [8, 0.2, -6],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.normal,
      position: [8, 0.2, -8],
    },
    {
      name: EFurnitureType.baseTable,
      rotate: EDirection.normal,
      position: [8, 0.2, -10],
    },
    {
      name: EFurnitureType.fireExtinguisher,
      rotate: EDirection.normal,
      position: [-6, 0.7, -8],
    },
    {
      name: EFurnitureType.gasStove,
      rotate: EDirection.normal,
      position: [10, 0.2, -10],
    },
    {
      name: EFurnitureType.gasStove,
      rotate: EDirection.normal,
      position: [12, 0.2, -10],
    },
    {
      name: EFurnitureType.pan,
      rotate: EDirection.normal,
      position: [12, 0.8, -10],
    },

    {
      name: EFurnitureType.gasStove,
      rotate: EDirection.normal,
      position: [14, 0.2, -10],
    },
    {
      name: EFurnitureType.gasStove,
      rotate: EDirection.normal,
      position: [16, 0.2, -10],
    },
    {
      name: EFurnitureType.baseTable,
      rotate: EDirection.right,
      position: [18, 0.2, -10],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [18, 0.2, -8],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [18, 0.2, -6],
    },
    {
      name: EFurnitureType.serveDishes,
      rotate: EDirection.right,
      position: [18.5, 0.2, -3],
    },
    // {
    //   name: EFurnitureType.drawerTable,
    //   rotate: EDirection.right,
    //   position: [18.5, 1.8, -3],
    // },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [18, 0.2, 0],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.right,
      position: [18, 0.2, 2],
    },
    {
      name: EFurnitureType.baseTable,
      rotate: EDirection.right,
      position: [18, 0.2, 4],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.back,
      position: [16, 0.2, 4],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.back,
      position: [14, 0.2, 4],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.back,
      position: [12, 0.2, 4],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.back,
      position: [10, 0.2, 4],
    },
    {
      name: EFurnitureType.baseTable,
      rotate: EDirection.back,
      position: [8, 0.2, 4],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.left,
      position: [8, 0.2, 2],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.left,
      position: [8, 0.2, 0],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.back,
      position: [8, 0.2, -2],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.back,
      position: [6, 0.2, -2],
    },
    // {
    //   name: EFurnitureType.drawerTable,
    //   rotate: EDirection.back,
    //   position: [6, 0.2, 4],
    // },

    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.normal,
      position: [-6, 0.2, -10],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.normal,
      position: [-4, 0.2, -10],
    },
    {
      name: EFurnitureType.washSink,
      rotate: EDirection.normal,
      position: [-1, 0.2, -10],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.normal,
      position: [2, 0.2, -10],
    },
    {
      name: EFurnitureType.baseTable,
      rotate: EDirection.normal,
      position: [4, 0.2, -10],
    },
    {
      name: EFurnitureType.trash,
      rotate: EDirection.left,
      position: [-6, 0.2, 2],
    },
    {
      name: EFurnitureType.drawerTable,
      rotate: EDirection.left,
      position: [-6, 0.2, 0],
    },
    {
      name: EFurnitureType.foodTable,
      rotate: EDirection.left,
      position: [-6, 0.2, -2],
    },
    {
      name: EFurnitureType.foodTable,
      rotate: EDirection.left,
      position: [-6, 0.2, -4],
    },
    {
      name: EFurnitureType.foodTable,
      rotate: EDirection.left,
      position: [-6, 0.2, -6],
    },
    {
      name: EFurnitureType.foodTable,
      rotate: EDirection.left,
      position: [-6, 0.2, -8],
    },
    // {
    //
    //   position: [6, 0.2, -12],
    // },
  ];
  const getPosition = ({ position, rotate, name }: IFurnitureItem) => {
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
  const getRotation = (rotate: EDirection) => {
    switch (rotate) {
    case EDirection.left:
      return [0, Math.PI / 2, 0];
    case EDirection.right:
      return [0, -Math.PI / 2, 0];
    case EDirection.normal:
      return [0, 0, 0];
    case EDirection.back:
      return [0, Math.PI, 0];
    }
  };
  const furnitureModels = {
    [EFurnitureType.baseTable]: baseTable.scene.clone(),
    [EFurnitureType.drawerTable]: drawerTable.scene.clone(),
    [EFurnitureType.washSink]: washSink.scene.clone(),
    [EFurnitureType.trash]: trash.scene.clone(),
    [EFurnitureType.foodTable]: foodTable.scene.clone(),
    [EFurnitureType.fireExtinguisher]: fireExtinguisher.scene.clone(),
    [EFurnitureType.gasStove]: gasStove.scene.clone(),
    [EFurnitureType.serveDishes]: serveDishes.scene.clone(),
    [EFurnitureType.pan]: pan.scene.clone(),
    [EFurnitureType.plate]: plate.scene.clone(),
  };
  const renderFurniture = (item: (typeof arr)[0]) => {
    const clonedModel = furnitureModels[item.name].clone();
    return (
      <primitive
        key={clonedModel.uuid}
        object={clonedModel}
        position={getPosition(item)}
        scale={1}
        rotation={getRotation(item.rotate)}
      />
    );
  };
  const floorModel = floor.scene.clone();
  floorModel.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshStandardMaterial({
        ...child.material,
        clippingPlanes: STATIC_CLIPPING_PLANES,
        clipIntersection: false,
        side: THREE.DoubleSide
      });
    }
  });

  return (
    <>
      <RigidBody type="fixed" restitution={0.2} friction={0}>
        {arr.map(renderFurniture)}
        <primitive
          object={drawerTable.scene.clone()}
          position={[19.5, 0.2, 0]}
          scale={[0.5, 1, 1]}
          rotation={[0, 0, 0]}
        />
       
        <primitive object={floorModel} position={[0, 0, 0]}>
          <meshStandardMaterial 
            clippingPlanes={STATIC_CLIPPING_PLANES}
            clipIntersection={false} // false: 裁剪掉平面外侧
            side={2} // THREE.DoubleSide，让裁切面可见
          />
        </primitive>
      
         
        {/* <primitive object={floor.scene.clone()}>
          <meshStandardMaterial
            clippingPlanes={clippingPlanes}
            clipIntersection={false} // false: 裁剪掉平面外侧; true: 只保留相交部分
            clipShadows={true} // 阴影也被裁剪
            color="hotpink"
          />
        </primitive> */}

        {/* 地面碰撞器 - 调整为13x9 */}
        <CuboidCollider
          args={[6.5, 0.1, 4.5]}
          position={[0, -0.1, 0]}
          restitution={0.2}
          friction={1}
        />
      </RigidBody>
    </>
  );
}
