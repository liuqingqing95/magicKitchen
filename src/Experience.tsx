import { KeyboardControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Physics, useRapier } from "@react-three/rapier";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import GrabbableWrapper from "./components/GrabbableWrapper";
import { ModelResourceProvider } from "./context/ModelResourceContext";
import Level from "./Level";
import Lights from "./Lights";
import Player from "./Player";
import useGrabObstacleStore from "./stores/useGrabObstacle";
import { EFoodType, EGrabType } from "./types/level";
import { EDirection } from "./types/public";

function ErrorFallback({ error }: { error: Error }) {
  console.log("ErrorBoundary caught an error:", error);
  return null;
  // return (
  //   <div role="alert">
  //     <h2>Something went wrong:</h2>
  //     <p>{error.message}</p>
  //     <pre>{error.stack}</pre>
  //   </div>
  // );
}
function PhysicsScene() {
  const [isCutting, setIsCutting] = useState<boolean>(false);
  const [grabHandles, setGrabHandles] = useState<
    Map<string, number> | undefined
  >(undefined);
  const [foodType, setFoodType] = useState<EGrabType | EFoodType | null>(null);
  // const [highlightFurnitureId, setHighlightFurnitureId] = useState<
  //   string | false
  // >(false);
  const highlightHandlerRef = useRef<((id: string | false) => void) | null>(
    null
  );
  const [playerHandle, setPlayerHandle] = useState<number | undefined>(
    undefined
  );
  const initialPosition = useRef<[number, number, number]>([2, 0, 2]);
  const [furnitureHandles, setFurnitureHandles] = useState<
    number[] | undefined
  >(undefined);
  const playerPositionRef = useRef<[number, number, number]>([0, 0, 0]);
  const handlePositionUpdate = useCallback(
    (position: [number, number, number]) => {
      setPosChange((s) => s + 1);
      playerPositionRef.current = position;
    },
    []
  );
  // const updateFurnitureHighLight = useCallback(
  //   (highlight: false | IFurniturePosition) => {
  //     setHighlightFurnitureId(highlight ? highlight.id : false);
  //   },
  //   []
  // );
  const updateFoodType = useCallback((type: EGrabType | EFoodType | null) => {
    // console.log("Level received furniture handle:", handle);
  }, []);
  const updateFurnitureHandle = useCallback((handle: number[] | undefined) => {
    // console.log("Level received furniture handle:", handle);
    setFurnitureHandles(handle);
  }, []);
  const updateGrabHandle = useCallback(
    (handle: Map<string, number> | undefined) => {
      // console.log("Level received furniture handle:", handle);
      setGrabHandles(handle);
    },
    []
  );
  const updatePlayerHandle = useCallback((handle: number | undefined) => {
    setPlayerHandle(handle);
  }, []);
  const updateIsCutting = useCallback((isCutting: boolean) => {
    console.log("Experience received isCutting:", isCutting);
    setIsCutting(isCutting);
  }, []);
  const GRAB_TYPES = [...Object.values(EGrabType), ...Object.values(EFoodType)];
  const [posChange, setPosChange] = useState<number>(0);
  const { rapier, world } = useRapier();
  const playerRef = useRef<THREE.Group | null>(null);
  const { realHighLight } = useGrabObstacleStore((s) => {
    return {
      realHighLight: s.realHighLight,
    };
  });
  useEffect(() => {
    // console.log("Experience  handle:", playerHandle, grabHandles);
    if (
      typeof playerHandle !== "number" ||
      !grabHandles ||
      grabHandles.size === 0
    )
      return;
    // console.log(world.getCollider(0), "地板");
    // const arr = [2e-323, 3e-323];
    // grabHandles?.forEach((handle) => {

    const handle = grabHandles.get((realHighLight && realHighLight.id) || "");
    if (typeof handle !== "number") return;
    const rigidBody = world.getRigidBody(handle);
    const count = rigidBody?.numColliders();
    // console.log(count, "抓取物 collider 数量", rigidBody.userData);
    for (let i = 0; i < count; i += 1) {
      const collider = rigidBody?.collider(i);

      const overlapping = world.intersectionPair(
        world.getCollider(playerHandle),
        collider
      );
      if (overlapping) console.warn(overlapping, "⚠️ 检测到初始重叠！");
      // console.log(
      //   "抓取物 collider 详情",
      //   collider.isSensor(),

      //   handle,
      //   rigidBody.userData
      // );
    }
    // });
  }, [realHighLight, posChange]);

  return (
    <>
      <Lights />

      <ModelResourceProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <GrabbableWrapper
            updateIsCutting={updateIsCutting}
            updateFoodType={updateFoodType}
            playerPositionRef={playerPositionRef}
            playerRef={playerRef}
            updateGrabHandle={updateGrabHandle}
          />
        </ErrorBoundary>

        <Level updateFurnitureHandle={updateFurnitureHandle} />
        <Player
          foodType={foodType}
          direction={EDirection.normal}
          isCutting={isCutting}
          // initialPosition={[-2, 0, -3]}
          initialPosition={initialPosition}
          // initialPosition={[12, 0, -7]}
          updatePlayerHandle={updatePlayerHandle}
          // blocksCount={blocksCount}
          // blocksSeed={blocksSeed}
          onPositionUpdate={handlePositionUpdate}
          ref={playerRef}
        />
      </ModelResourceProvider>
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
          { name: "handleIngredient", keys: ["Enter"] },
          { name: "grab", keys: ["ShiftLeft", "ShiftRight"] },
          { name: "sprint", keys: ["ControlLeft", "ControlRight"] }, // Ctrl 键映射
        ]}
      >
        <color args={["#bdedfc"]} attach="background" />

        <Physics debug={true}>{<PhysicsScene />}</Physics>
      </KeyboardControls>
    </>
  );
}
