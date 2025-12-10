import { KeyboardControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Physics, useRapier } from "@react-three/rapier";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Level } from "./Level";
import Lights from "./Lights";
import { Player } from "./Player";
import GrabbableWrapper from "./components/GrabbableWrapper";
import { IFurniturePosition, useObstacleStore } from "./stores/useObstacle";
import { EDirection } from "./types/public";
function Test() {
  const { registryFurniture, getAllObstacles } = useObstacleStore();
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
  const [playerPosition, setPlayerPosition] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const [highlightFurniture, setHighlightFurniture] = useState<
    false | IFurniturePosition
  >(false);
  const [playerHandle, setPlayerHandle] = useState<number | undefined>(
    undefined
  );
  const [furnitureHandles, setFurnitureHandles] = useState<
    number[] | undefined
  >(undefined);
  const handlePositionUpdate = (position: [number, number, number]) => {
    setPlayerPosition(position);
  };
  const updateFurnitureHighLight = useCallback(
    (highlight: false | IFurniturePosition) => {
      setHighlightFurniture(highlight);
    },
    []
  );
  const updateFurnitureHandle = (handle: number[] | undefined) => {
    console.log("Level received furniture handle:", handle);
    setFurnitureHandles(handle);
  };
  const updatePlayerHandle = (handle: number | undefined) => {
    setPlayerHandle(handle);
  };
  const { rapier, world } = useRapier();
  const playerRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (playerHandle !== undefined && (furnitureHandles?.length || 0) > 0) {
      console.log(
        "Experience  handle:",
        playerHandle,
        furnitureHandles,
        world.colliders
      );
      console.log(world.getCollider(0), "地板");
      // const arr = [2e-323, 3e-323];
      furnitureHandles?.forEach((furnitureHandle) => {
        const overlapping = world.intersectionPair(
          world.getCollider(playerHandle),
          world.getCollider(furnitureHandle)
        );
        console.log(`玩家与家具 ${furnitureHandle} 初始重叠:`, overlapping);

        if (overlapping) {
          console.warn(
            "⚠️ 检测到初始重叠！这是导致onCollisionEnter不触发的原因。"
          );
        }
      });
    }
  }, [playerHandle, furnitureHandles]);
  return (
    <>
      <Lights />
      <Level
        isHighlightFurniture={highlightFurniture}
        updateFurnitureHandle={updateFurnitureHandle}
      />
      <GrabbableWrapper
        updateFurnitureHighLight={updateFurnitureHighLight}
        playerPosition={playerPosition}
        playerRef={playerRef}
      />
      <Player
        direction={EDirection.normal}
        initialPosition={[-2, 0, 1]}
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

        <Physics debug={true}>{<Test></Test>}</Physics>
      </KeyboardControls>
    </>
  );
}
