import { Hamberger } from "@/hamberger";
import {
  registerObstacle,
  unregisterObstacle,
  type ObstacleInfo,
} from "@/obstacleRegistry";
import {
  BlockProps,
  BlockStartProps,
  IFoodType,
  IFoodWithRef,
  LevelProps,
} from "@/types/level";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

const floor1Material = new THREE.MeshStandardMaterial({ color: "limegreen" });
const floor2Material = new THREE.MeshStandardMaterial({ color: "greenyellow" });
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" });
const wallMaterial = new THREE.MeshStandardMaterial({ color: "slategrey" });

type ObstacleRegistrationParams = {
  bodyRef: MutableRefObject<RapierRigidBody | null>;
  type: "spinner" | "limbo" | "axe";
  idPrefix: string;
};

function useObstacleRegistration({
  bodyRef,
  type,
  idPrefix,
}: ObstacleRegistrationParams) {
  const handleInfosRef = useRef<Array<{ handle: number; info: ObstacleInfo }>>(
    []
  );

  useEffect(() => {
    let handles: number[] = [];
    let frameId: number | undefined;
    let cancelled = false;
    let registered = false;

    const registerHandles = () => {
      const body = bodyRef.current;
      if (!body || body.numColliders() === 0) {
        return;
      }
      handles = [];
      handleInfosRef.current = [];
      const translation = body.translation();

      for (let i = 0; i < body.numColliders(); i++) {
        const collider = body.collider(i);
        if (!collider) {
          continue;
        }
        const handle = collider.handle;
        handles.push(handle);

        // 确保使用世界坐标
        const info: ObstacleInfo = {
          id: `${idPrefix}-${handle}`,
          type,
          position: [translation.x, translation.y, translation.z], // 世界坐标
        };

        handleInfosRef.current.push({ handle, info });
        registerObstacle(handle, info);
      }
    };

    const tryRegister = () => {
      if (cancelled || registered) {
        return;
      }
      const body = bodyRef.current;
      if (!body || body.numColliders() === 0) {
        frameId = requestAnimationFrame(tryRegister);
        return;
      }
      registered = true;
      registerHandles();
    };

    tryRegister();

    return () => {
      cancelled = true;
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      handles.forEach((handle) => unregisterObstacle(handle));
    };
  }, [bodyRef, type, idPrefix]);

  // 实时更新障碍物位置
  useFrame(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    const translation = body.translation();
    handleInfosRef.current.forEach(({ handle, info }) => {
      const updatedInfo: ObstacleInfo = {
        ...info,
        position: [translation.x, translation.y, translation.z],
      };
      registerObstacle(handle, updatedInfo);
    });
  });
}

export function BlockStart(
  props: BlockStartProps & {
    onFoodMounted?: (id: string, g: THREE.Group | null) => void;
  }
) {
  const { position = [0, 0, 0], foods, onFoodMounted } = props;
  return (
    <group position={position}>
      {/* <Float floatIntensity={0.25} rotationIntensity={0.25}>
        <Text
          font="/bebas-neue-v9-latin-regular.woff"
          scale={0.5}
          maxWidth={0.25}
          lineHeight={0.75}
          textAlign="right"
          position={[2.75, 0.65, 0]}
          rotation-y={-0.25}
        >
          Marble Race
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </Float> */}
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position={[0, -0.1, 0]}
        scale={[8.3, 0.2, 4]}
        receiveShadow
      />
      {foods.map((food) => (
        <Hamberger
          key={food.id}
          id={food.id}
          position={food.position}
          ref={food.ref}
          onMount={(g) => onFoodMounted?.(food.id, g)}
        />
      ))}
      {/* <Hamberger /> */}
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
      {/* <Text
        font="/bebas-neue-v9-latin-regular.woff"
        scale={1}
        position={[0, 2.25, 2]}
      >
        FINISH
        <meshBasicMaterial toneMapped={false} />
      </Text> */}
      {/* <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position={[0, 0, 0]}
        scale={[8, 0.2, 4]}
        receiveShadow
      /> */}
      <RigidBody
        type="fixed"
        colliders="hull"
        position={[0, 1.5, 0]}
        restitution={0.2}
        friction={0}
      >
        <primitive object={hamburger.scene} scale={0.02} />
      </RigidBody>
    </group>
  );
}

export function BlockSpinner({ position = [0, 0, 0] }: BlockProps) {
  const obstacle = useRef<RapierRigidBody>(null);
  const [speed] = useState(
    () => (Math.random() + 0.2) * (Math.random() < 0.5 ? -1 : 1)
  );

  useObstacleRegistration({
    bodyRef: obstacle,
    type: "spinner",
    idPrefix: "spinner",
  });

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
        scale={[8, 0.2, 4]}
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
          scale={[7, 0.3, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

export function BlockLimbo({ position = [0, 0, 0] }: BlockProps) {
  const obstacle = useRef<RapierRigidBody>(null);

  useObstacleRegistration({
    bodyRef: obstacle,
    type: "limbo",
    idPrefix: "limbo",
  });

  // useFrame((state) => {
  //   const time = state.clock.getElapsedTime();

  //   const y = Math.sin(time + timeOffset) + 1.15;
  //   obstacle.current?.setNextKinematicTranslation({
  //     x: position[0],
  //     y: position[1] + y,
  //     z: position[2],
  //   });
  // });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2Material}
        position={[0, -0.1, 0]}
        scale={[8, 0.2, 4]}
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

  useObstacleRegistration({
    bodyRef: obstacle,
    type: "axe",
    idPrefix: "axe",
  });

  useFrame((state) => {
    if (obstacle.current) {
      const worldPos = obstacle.current.translation();
      console.log(
        `Axe world position: [${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(
          3
        )}, ${worldPos.z.toFixed(3)}]`
      );
    }
    // const time = state.clock.getElapsedTime();
    // const x = Math.sin(time + timeOffset) * 1.25;
    // obstacle.current?.setNextKinematicTranslation({
    //   x: position[0] + x,
    //   y: position[1] + 0.75,
    //   z: position[2],
    // });
  });

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor2Material}
        position={[0, -0.1, -4]}
        scale={[8.3, 0.2, 12]}
        receiveShadow
      />
      <mesh
        position={[0, 0.3, 0]}
        geometry={new THREE.BoxGeometry(1.5, 1.2, 0.7)}
        material={
          new THREE.MeshBasicMaterial({
            color: "yellow",
            wireframe: true,
            transparent: true,
            opacity: 0.3,
          })
        }
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
          scale={[3, 1.5, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}

function Bounds({ length = 1 }) {
  return (
    <>
      <RigidBody type="fixed" restitution={0.2} friction={0}>
        <mesh
          position={[4.3, 0.75, -(length * 2) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[0.3, 1.5, 4 * length]}
          castShadow
        />
        <mesh
          position={[-4.3, 0.75, -(length * 2) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[0.3, 1.5, 4 * length]}
          receiveShadow
        />
        <mesh
          position={[0, 0.75, -(length * 4) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[8.3, 1.5, 0.3]}
          receiveShadow
        />
        <CuboidCollider
          args={[4, 0.1, 2 * length]}
          position={[0, -0.1, -(length * 2) + 2]}
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
  // BlockSpinner, BlockAxe,
  seed = 0,
  onFoodPositionUpdate,
}: LevelProps) {
  // when a Hamberger mounts in the scene, Level gets notified via this handler
  const handleFoodMounted = (id: string, g: THREE.Group | null) => {
    const item = foodPositions.find((f) => f.id === id);
    if (item) {
      item.ref.current = g;
    }

    const allRefsBound = foodPositions.every((f) => f.ref.current != null);
    if (allRefsBound && onFoodPositionUpdate) {
      onFoodPositionUpdate(foodPositions);
    }
  };
  // Prepare hamburgers with refs so parent can read their world positions.
  // We keep the simple static list for now; each item contains an id, position and a ref.
  const [foodPositions] = useState<IFoodWithRef[]>(() => {
    return [
      {
        id: "1",
        position: [1, 0.1, 0] as [number, number, number],
        type: IFoodType.Hamburger,
        ref: { current: null } as MutableRefObject<THREE.Group | null>,
      },
    ];
  });

  useEffect(() => {
    const allRefsBound = foodPositions.every(
      (food) => food.ref.current !== null
    );
    if (allRefsBound && onFoodPositionUpdate) {
      onFoodPositionUpdate(foodPositions);
    }
  }, [foodPositions, onFoodPositionUpdate]);

  const blocks = useMemo(() => {
    const list: (typeof types)[number][] = [];
    const len = types.length;
    if (len === 0) {
      return list;
    }
    for (let i = 0; i < 1; i++) {
      const randomValue = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453);
      const index = Math.floor(randomValue) % len;
      list.push(types[index]);
    }
    return list;
  }, [count, seed, types]);

  return (
    <>
      <BlockStart
        foods={foodPositions}
        position={[0, 0, 0]}
        onFoodMounted={handleFoodMounted}
      />

      {blocks.map((Block, index) => (
        <Block key={index} position={[0, 0, -(index + 1) * 4]} />
      ))}

      <BlockEnd position={[0, 1.5, 0]} />

      {/* 将关卡长度变为原来的 4 倍 */}
      {/* (count + 2) * 2 */}
      <Bounds length={3} />
    </>
  );
}
