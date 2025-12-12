import { KeyboardControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Physics, useRapier } from "@react-three/rapier";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import GrabbableWrapper from "./components/GrabbableWrapper";
import { Level } from "./Level";
import Lights from "./Lights";
import { Player } from "./Player";
import { IFurniturePosition } from "./stores/useObstacle";
import { EDirection } from "./types/public";
function PhysicsScene() {
  const mountCount = useRef(0);

  useEffect(() => {
    mountCount.current++;
    console.log(`🔄 Physics 第 ${mountCount.current} 次挂载`);

    return () => {
      console.log(`🗑️ Physics 卸载`);
    };
  }, []);
  // const blocksCount = useGame((state) => state.blocksCount);
  // const blocksSeed = useGame((state) => state.blocksSeed);

  const [highlightFurniture, setHighlightFurniture] = useState<
    false | IFurniturePosition
  >(false);
  const [playerHandle, setPlayerHandle] = useState<number | undefined>(
    undefined
  );
  const [furnitureHandles, setFurnitureHandles] = useState<
    number[] | undefined
  >(undefined);
  const playerPositionRef = useRef<[number, number, number]>([0, 0, 0]);
  const handlePositionUpdate = useCallback(
    (position: [number, number, number]) => {
      playerPositionRef.current = position;
    },
    []
  );
  const [grabHandles, setGrabHandles] = useState<number[] | undefined>(
    undefined
  );

  const updateFurnitureHighLight = useCallback(
    (highlight: false | IFurniturePosition) => {
      setHighlightFurniture(highlight);
    },
    []
  );
  const updateFurnitureHandle = (handle: number[] | undefined) => {
    // console.log("Level received furniture handle:", handle);
    setFurnitureHandles(handle);
  };
  const updateGrabHandle = (handle: number[] | undefined) => {
    // console.log("Level received furniture handle:", handle);
    setGrabHandles(handle);
  };
  const updatePlayerHandle = (handle: number | undefined) => {
    setPlayerHandle(handle);
  };
  const { rapier, world } = useRapier();
  const playerRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (playerHandle !== undefined && (grabHandles?.length || 0) > 0) {
      console.log("Experience  handle:", playerHandle, grabHandles);

      // console.log(world.getCollider(0), "地板");
      // const arr = [2e-323, 3e-323];
      grabHandles?.forEach((handle) => {
        const rigidBody = world.getRigidBody(handle);
        const count = rigidBody.numColliders();
        // console.log(count, "抓取物 collider 数量", );
        if (count === 1) {
          const collider = rigidBody.collider(0);
          console.log(
            "抓取物 collider 详情",
            collider.isSensor(),

            handle,
            rigidBody.userData
          );
        }
        // if (count > 0) {
        //   console.log(
        //     "设置玩家与抓取物碰撞监听:",
        //     handle,
        //     collider.isSensor(),
        //     collider
        //   );
        //   const overlapping = world.intersectionPair(
        //     world.getCollider(playerHandle),
        //     collider
        //   );
        //   console.log(`玩家与抓取物 ${handle} 初始重叠:`, overlapping);

        //   if (overlapping) {
        //     console.warn(
        //       "⚠️ 检测到初始重叠！这是导致onCollisionEnter不触发的原因。"
        //     );
        //   }
        //   return;
        // }
      });
    }
  }, [playerHandle, grabHandles?.length, furnitureHandles?.length]);
  return (
    <>
      <Lights />
      <Level
        isHighlightFurniture={highlightFurniture}
        updateFurnitureHandle={updateFurnitureHandle}
      />
      <GrabbableWrapper
        updateFurnitureHighLight={updateFurnitureHighLight}
        playerPositionRef={playerPositionRef}
        playerRef={playerRef}
        updateGrabHandle={updateGrabHandle}
      />
      <Player
        direction={EDirection.normal}
        initialPosition={[-2, 0, -4]}
        updatePlayerHandle={updatePlayerHandle}
        // blocksCount={blocksCount}
        // blocksSeed={blocksSeed}
        onPositionUpdate={handlePositionUpdate}
        ref={playerRef}
      />
    </>
  );
}
export default function Experience() {
  const { gl } = useThree();
  gl.localClippingEnabled = true;
  return (
    <>
      <KeyboardControls
        // 在这里定义键盘映射
        map={[
          { name: "forward", keys: ["ArrowUp", "KeyW"] },
          { name: "backward", keys: ["ArrowDown", "KeyS"] },
          { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
          { name: "rightward", keys: ["ArrowRight", "KeyD"] },
          { name: "jump", keys: ["Space"] },
          { name: "grab", keys: ["ShiftLeft", "ShiftRight"] },
          { name: "sprint", keys: ["ControlLeft", "ControlRight"] }, // Ctrl 键映射
        ]}
      >
        <color args={["#bdedfc"]} attach="background" />

        <Physics debug={false}>{<PhysicsScene />}</Physics>
      </KeyboardControls>
    </>
  );
}
