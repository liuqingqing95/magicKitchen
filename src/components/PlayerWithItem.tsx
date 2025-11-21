// components/PlayerWithItem.jsx
import { GrabbableItem } from "@/components/GrabbableItem";
import { useGrabSystem } from "@/hooks/useGrabSystem";
import usePlayerTransform from "@/hooks/usePlayerTransform";
import type { IFoodWithRef } from "@/types/level";
import { Float, Text, useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Player from "../Player";

interface PlayerGrabbableItemProps {
  hamburgerModelUrl?: string;
  isGrabbable?: boolean;
  foodPositions: IFoodWithRef[];
}

export default function PlayerWithItem({
  hamburgerModelUrl = "/hamburger.glb",
  foodPositions,
  isGrabbable = true,
}: PlayerGrabbableItemProps) {
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const PLAYER_START_POSITION: [number, number, number] = [0, 1, 0];
  const initialPosition: [number, number, number] = [2, 1, 0];
  const [isSprinting, setIsSprinting] = useState(false); // 标记是否加速
  // ========== 抓取系统 ==========
  const { heldItem, grabItem, releaseItem, isHolding } = useGrabSystem();
  // const [playerPosition, setPlayerPosition] = useState(PLAYER_START_POSITION);
  // Integrate usePlayerTransform for movement logic
  // ========== 加载模型 ==========
  // const plateModel = useGLTF(plateModelUrl);
  const hamburgerModel = useGLTF(hamburgerModelUrl);
  const [isGrab, setIsGrabbing] = useState(false);
  const itemRef = useRef<THREE.Group>(null);

  const [nearestFoodDistance, setNearestFoodDistance] = useState<number | null>(
    null
  );
  // player transform hook (controlled movement & rotation logic)
  const {
    position: controlledPosition,
    rotationY: controlledRotationY,
    move,
    walkWeight,
    sprintWeight,
    onObstacleEnter,
    onObstacleExit,
  } = usePlayerTransform({
    initialPosition: PLAYER_START_POSITION,
    initialRotationY: Math.PI,
    step: 4,
  });
  // Calculate nearest hamburger based on the world position read from each food's ref.
  // This reads refs only when the player's position updates (not every frame).
  const calculateNearestHamburger = useCallback(
    (playerPos: [number, number, number]) => {
      let minDistance = Infinity;

      const playerVec = new THREE.Vector3(
        playerPos[0],
        playerPos[1],
        playerPos[2]
      );

      for (const food of foodPositions) {
        const ref = food.ref;
        if (!ref || !ref.current) {
          // fallback to static position if available
          if (food.position) {
            const dx = playerPos[0] - food.position[0];
            const dz = playerPos[2] - food.position[2];
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < minDistance) {
              minDistance = d;
            }
          }
          continue;
        }

        const current = ref.current as unknown as THREE.Object3D & {
          getWorldPosition?: (v: THREE.Vector3) => void;
          position?:
            | { x?: number; y?: number; z?: number }
            | [number, number, number];
        };

        const worldPos = new THREE.Vector3();
        // prefer getWorldPosition if the hamburger is nested in a group
        if (typeof current.getWorldPosition === "function") {
          current.getWorldPosition(worldPos);
        } else if (current.position) {
          const posVal = current.position as
            | { x?: number; y?: number; z?: number }
            | [number, number, number];
          if (Array.isArray(posVal)) {
            worldPos.set(posVal[0] ?? 0, posVal[1] ?? 0, posVal[2] ?? 0);
          } else {
            const obj = posVal as { x?: number; y?: number; z?: number };
            const x = obj.x ?? 0;
            const y = obj.y ?? 0;
            const z = obj.z ?? 0;
            worldPos.set(x, y, z);
          }
        }

        // measure horizontal (XZ) distance
        const dx = playerVec.x - worldPos.x;
        const dz = playerVec.z - worldPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }

      return minDistance === Infinity ? null : minDistance;
    },
    [foodPositions]
  );

  // update nearest distance whenever controlled position changes
  useEffect(() => {
    const nearest = calculateNearestHamburger(controlledPosition);
    setNearestFoodDistance(nearest);
  }, [controlledPosition, calculateNearestHamburger]);
  // ========== 事件处理 ==========
  // const handleGrab = (itemRef: any, position: [number, number, number]) => {
  //   console.log("盘子汉堡被抓取:", position);
  //   onGrab?.(itemRef, position);
  // };

  // 在PlayerWithItem中添加抓取检测
  const checkAndGrab = useCallback(() => {
    if (isHolding) {
      return;
    }
    const grabDistance = 1.5; // 抓取范围
    if ((nearestFoodDistance || 0) < grabDistance && itemRef.current) {
      const customPosition = new THREE.Vector3(0.3, 0.8, 0.5);
      grabItem(itemRef, customPosition);
    }
  }, [isHolding, nearestFoodDistance, grabItem]);
  // ========== 抓取/释放监听 ==========
  useEffect(() => {
    const unsubscribeGrab = subscribeKeys(
      (state) => state.grab,
      (pressed) => {
        console.log("grab", pressed);
        if (pressed) {
          if (isHolding) {
            setIsGrabbing(false);
            releaseItem();
          } else {
            setIsGrabbing(true);
            checkAndGrab();
          }
        }
      }
    );

    return unsubscribeGrab;
  }, [subscribeKeys, isHolding, releaseItem, checkAndGrab]);

  useEffect(() => {
    // 监听 sprint 状态
    const unsubscribeSprint = subscribeKeys(
      (state) => state.sprint,
      (value) => {
        console.log("Sprint:", value);
        setIsSprinting(value);
      }
    );

    return unsubscribeSprint;
  }, [subscribeKeys]);
  // release handled via grab key listener; keep onRelease prop for external hooks

  // const handlePlayerPositionUpdate = (position: [number, number, number]) => {
  //   setPlayerPosition(position);
  //   const nearest = calculateNearestHamburger(position);
  //   setNearestFoodDistance(nearest);
  // };

  // per-frame move call driven by keyboard state
  useFrame((_, delta) => {
    const keys = getKeys();
    move(
      {
        forward: keys.forward,
        backward: keys.backward,
        leftward: keys.leftward,
        rightward: keys.rightward,
        isSprinting: isSprinting,
      },
      delta
    );
    // update UI display position from the controlled hook
    // setPlayerPosition(controlledPosition);
  });

  return (
    <>
      {/* ========== 玩家组件 ========== */}
      <Player
        heldItem={heldItem}
        position={controlledPosition}
        rotationY={controlledRotationY}
        walkWeight={walkWeight}
        sprintWeight={sprintWeight}
        onObstacleEnter={onObstacleEnter}
        onObstacleExit={onObstacleExit}
      />
      {/* ========== 可抓取物品组件 ========== */}
      // nearbyObstacles removed to match actual exports
      <GrabbableItem
        ref={itemRef}
        initialPosition={initialPosition}
        isGrabbable={isGrabbable}
        isGrab={isGrab}
      >
        <group>
          {/* <primitive object={plateModel.scene} /> */}
          <primitive
            object={hamburgerModel.scene}
            position={[0, 0.15, 0]}
            scale={0.8}
          />
        </group>
      </GrabbableItem>
      <group position={[0, 2.5, 1]}>
        <Float floatIntensity={0.25} rotationIntensity={0.25}>
          <Text
            font="/bebas-neue-v9-latin-regular.woff"
            scale={0.5}
            maxWidth={2.25}
            lineHeight={0.75}
            textAlign="right"
            position={[2.75, 0.65, 0]}
            rotation-y={-0.25}
          >
            玩家位置:{" "}
            {controlledPosition.map((p: number) => p.toFixed(2)).join(", ")}
            抓取状态: {isGrab ? "抓着物品" : "空手"}
            {/* <div>操作提示: {isHolding ? "按 G 释放物品" : "点击物品抓取"}</div> */}
            <meshBasicMaterial toneMapped={false} />
          </Text>
        </Float>
      </group>
    </>
  );
}
