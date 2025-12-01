import { BlockProps } from "@/types/level";
import {
  MODEL_PATHS,
  coasterLoader,
  graveyardLoader,
} from "@/utils/loaderManager";
import { Float, Text, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const floor1Material = new THREE.MeshStandardMaterial({ color: "limegreen" });
const floor2Material = new THREE.MeshStandardMaterial({ color: "greenyellow" });
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" });
const wallMaterial = new THREE.MeshStandardMaterial({ color: "slategrey" });

export function BlockStart({ position = [0, 0, 0] }: BlockProps) {
  return (
    <group position={position}>
      <Float floatIntensity={0.25} rotationIntensity={0.25}>
        <Text
          font="/bebas-neue-v9-latin-regular.woff"
          scale={0.5}
          maxWidth={0.25}
          lineHeight={0.75}
          textAlign="right"
          position={[0.75, 0.65, 0]}
          rotation-y={-0.25}
        >
          Marble Race
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </Float>
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position={[0, -0.1, 0]}
        scale={[8.3, 0.2, 24]}
        receiveShadow
      />
    </group>
  );
}

export function BlockEnd({ position = [0, 0, 0] }: BlockProps) {
  const hamburger = useGLTF("/hamburger.glb");

  hamburger.scene.children.forEach((mesh) => {
    mesh.castShadow = true;
  });

  return (
    <group position={position}>
      <Text
        font="/bebas-neue-v9-latin-regular.woff"
        scale={1}
        position={[0, 2.25, 2]}
      >
        FINISH
        <meshBasicMaterial toneMapped={false} />
      </Text>
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position={[0, 0, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="fixed"
        colliders="hull"
        position={[0, 0.25, 0]}
        restitution={0.2}
        friction={0}
      >
        <primitive object={hamburger.scene} scale={0.2} />
      </RigidBody>
    </group>
  );
}

export function BlockSpinner({ position = [0, 0, 0] }: BlockProps) {
  const obstacle = useRef<RapierRigidBody>(null);
  const [speed] = useState(
    () => (Math.random() + 0.2) * (Math.random() < 0.5 ? -1 : 1)
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    const rotation = new THREE.Quaternion();
    rotation.setFromEuler(new THREE.Euler(0, time * speed, 0));
    obstacle.current?.setNextKinematicRotation(rotation);
  });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2Material}
        position={[0, -0.1, 0]}
        scale={[8.3, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        ref={obstacle}
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[3.5, 0.3, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

export function BlockLimbo({ position = [0, 0, 0] }: BlockProps) {
  const obstacle = useRef<RapierRigidBody>(null);
  const [timeOffset] = useState(() => Math.random() * Math.PI * 2);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    const y = Math.sin(time + timeOffset) + 1.15;
    obstacle.current?.setNextKinematicTranslation({
      x: position[0],
      y: position[1] + y,
      z: position[2],
    });
  });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2Material}
        position={[0, -0.1, 0]}
        scale={[8.3, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        ref={obstacle}
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[3.5, 0.3, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

export function BlockAxe({ position = [0, 0, 0] }: BlockProps) {
  const obstacle = useRef<RapierRigidBody>(null);
  const [timeOffset] = useState(() => Math.random() * Math.PI * 2);

  // useFrame((state) =>
  // {
  //     const time = state.clock.getElapsedTime()

  //     const x = Math.sin(time + timeOffset) * 1.25
  //     obstacle.current.setNextKinematicTranslation({ x: position[0] + x, y: position[1] + 0.75, z: position[2] })
  // })

  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floor2Material}
        position={[0, -0.1, -9]}
        scale={[8.3, 0.2, 4]}
        receiveShadow
      /> */}
      <RigidBody
        ref={obstacle}
        type="kinematicPosition"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
      >
        <mesh
          geometry={boxGeometry}
          material={obstacleMaterial}
          scale={[3, 0.5, 0.5]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}
function isMesh(node: THREE.Object3D): node is THREE.Mesh {
  return (node as any).isMesh === true;
}
function Bounds({ length = 1 }) {
  // const fence = useGLTF("/iron-fence-border.glb");
  // const texture = useTexture("/Previews/iron-fence-border.png");
  // texture.colorSpace = THREE.SRGBColorSpace;
  // texture.flipY = false;

  // const pine = useGLTF("/pine.glb");
  // const pineTexture = useTexture("/Previews/pine.png");
  // pineTexture.colorSpace = THREE.SRGBColorSpace;
  // pineTexture.flipY = false;

  // const brickWallEnd = useGLTF("/brick-wall-end.glb");

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
  return (
    <>
      <RigidBody type="fixed" restitution={0.2} friction={0}>
        {/* <mesh
          geometry={boxGeometry}
          material={floor2Material}
          position={[-0.5, 0, -0.5]}
          scale={[14, 0.2, 9]}
          receiveShadow
        /> */}
        <primitive
          object={gasStove.scene.clone()}
          position={[0, 3, 3]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={baseTable.scene.clone()}
          position={[0, 3, 3]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={foodTable.scene.clone()}
          position={[0, 3, 1]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={drawerTable.scene.clone()}
          position={[0, 2, 3]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={trash.scene.clone()}
          position={[0, 1, 4]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />

        <primitive
          object={cuttingBoard.scene.clone()}
          position={[0, 3, 3]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={fireExtinguisher.scene.clone()}
          position={[1, 3, 3]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={pan.scene.clone()}
          position={[1, 0, -2]} // x从-6到6，z从-4到4
          scale={0.5}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={plate.scene.clone()}
          position={[3, 1, 3]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={serveDishes.scene.clone()}
          position={[2, 1, 1]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={stockpot.scene.clone()}
          position={[1, 1, 1]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        <primitive
          object={washSink.scene.clone()}
          position={[0, 0, 0]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[0, 0, 0]}
        />
        {/*   <primitive
          object={test.scene.children[0].children[0].children[3].clone()}
          position={[0, 3, 6]} // x从-6到6，z从-4到4
          scale={0.2}
          rotation={[-Math.PI / 2, 0, 0]}
        /> */}
        {/* {Array.from({ length: 14 }, (_, i) =>
          Array.from({ length: 9 }, (_, j) => (
            <primitive
              key={`floor${i}-${j}`}
              object={floor.scene.clone()}
              position={[i - 7, 0, j - 4.7]} // x从-6到6，z从-4到4
              scale={1}
            />
          ))
        )} */}
        {/* {Array.from({ length: 14 }, (_, i) =>
          Array.from({ length: 9 }, (_, j) => (
            <primitive
              key={`floor${i}-${j}`}
              object={floor.scene.clone()}
              position={[i - 7, 0, j - 4.7]} // x从-6到6，z从-4到4
              scale={0.2}
            />
          ))
        )} */}
        {/* <primitive
          object={brickWallEnd.scene.clone()}
          position={[5, 0.75, 4.9]}
          scale={[1, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
        /> */}
        <primitive
          object={stallFood.scene.clone()}
          position={[3, 0.75, -2.9]}
          scale={[2, 2, 2]}
          rotation={[0, Math.PI, 0]}
        />
        <primitive
          object={brickWallCurveSmall.scene.clone()}
          position={[5.8, 0.75, 4.5]}
          scale={[1, 1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {Array.from({ length: 8 }, (_, i) => (
          <primitive
            key={`rightWall${i}`}
            object={brickWall.scene.clone()}
            position={[6.5, 0.75, -(i - 4)]} // 从-4到4，间隔1个单位
            scale={[1, 1, 1]}
            rotation={[0, Math.PI / 2, 0]}
          />
        ))}
        <primitive
          object={brickWallCurveSmall.scene.clone()}
          position={[-6.5, 0.75, -3.8]}
          scale={[1, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
        />
        {Array.from({ length: 8 }, (_, i) => (
          <primitive
            key={`leftWall${i}`}
            object={brickWall.scene.clone()}
            position={[-6.5, 0.75, -(i - 4)]} // 从-4到4，间隔1个单位
            scale={[1, 1, 1]}
            rotation={[0, Math.PI / 2, 0]}
          />
        ))}
        <primitive
          object={brickWallCurveSmall.scene.clone()}
          position={[-6.5, 0.75, 4.5]}
          scale={[1, 1, 1]}
          rotation={[0, Math.PI, 0]}
        />
        {Array.from({ length: 12 }, (_, i) => (
          <primitive
            key={`frontWall${i}`}
            object={brickWall.scene.clone()}
            position={[i - 6, 0.75, 4.5]} // 从-6到6，间隔1个单位
            scale={[1, 1, 1]}
            rotation={[0, Math.PI, 0]}
          />
        ))}
        <primitive
          object={brickWallCurveSmall.scene.clone()}
          position={[5.8, 0.75, -3.8]}
          scale={[1, 1, 1]}
          rotation={[0, 0, 0]}
        />
        {Array.from({ length: 12 }, (_, i) => (
          <primitive
            key={`backWall${i}`}
            object={brickWall.scene.clone()}
            position={[i - 6, 0.75, -4.5]} // 从-6到6，间隔1个单位
            scale={[1, 1, 1]}
            rotation={[0, Math.PI, 0]}
          />
        ))}
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

export function Level({
  count = 5,
  types = [BlockAxe],
  // BlockSpinner, BlockLimbo
  seed = 0,
}) {
  const blocks = useMemo(() => {
    const blocks: {
      type: ({ position }: BlockProps) => JSX.Element;
      position: [number, number, number];
    }[] = [
      {
        type: BlockAxe,
        position: [0, 0, 0],
      },
      {
        type: BlockAxe,
        position: [0, 0, 2],
      },
    ];

    // for (let i = 0; i < count; i++) {
    //   const type = types[Math.floor(Math.random() * types.length)];
    //   blocks.push(type);
    // }

    return blocks;
  }, [count, types, seed]);

  return (
    <>
      {/* <BlockStart position={[0, 0, -10]} /> */}

      {/* {blocks.map((Block, index) => (
        <Block.type key={index} position={Block.position} />
      ))} */}

      {/* <BlockEnd position={ [ 0, 0, - (count + 1) * 4 ] } /> */}

      {/* 将关卡长度变为原来的 4 倍 */}
      {/* (count + 2) * 2 */}
      <Bounds length={4} />
    </>
  );
}
