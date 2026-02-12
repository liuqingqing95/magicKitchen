import { useThree } from "@react-three/fiber";
import { Physics, useRapier } from "@react-three/rapier";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import GrabbableWrapper from "./components/GrabbableWrapper";
import { ModelResourceProvider } from "./context/ModelResourceContext";
import Level from "./Level";
import Lights from "./Lights";
import Player from "./Player";
import { useRealHighlight } from "./stores/useGrabObstacle";
import { EFoodType, EGrabType, TPLayerId } from "./types/level";
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
  // const [foodType, setFoodType] = useState<EGrabType | EFoodType | null>(null);
  // const [highlightFurnitureId, setHighlightFurnitureId] = useState<
  //   string | false
  // >(false);
  const highlightHandlerRef = useRef<((id: string | false) => void) | null>(
    null,
  );
  const [playerHandle, setPlayerHandle] = useState<number | undefined>(
    undefined,
  );
  // 两个玩家的初始位置
  const firstPlayerInitialPos = useRef<[number, number, number]>([6, 1.22, 5]);
  const secondPlayerInitialPos = useRef<[number, number, number]>([-6, 1.22, 9]);

  // 两个玩家的配置 - 使用 useMemo
  const playersConfig = useMemo(
    () => [
      { key: "firstPlayer" as const, initialPosition: firstPlayerInitialPos },
      { key: "secondPlayer" as const, initialPosition: secondPlayerInitialPos },
    ],
    [],
  );

  const [furnitureHandles, setFurnitureHandles] = useState<
    number[] | undefined
  >(undefined);
  // 多玩家位置和引用
  const playerPositionRefs = useRef<
    Record<TPLayerId, [number, number, number]>
  >({
    firstPlayer: [0, 0, 0],
    secondPlayer: [0, 0, 0],
  });
  const playerRefs = useRef<Record<TPLayerId, THREE.Group | null>>({
    firstPlayer: null,
    secondPlayer: null,
  });

  const handlePositionUpdate = useCallback(
    (playerId: TPLayerId) => (position: [number, number, number]) => {
      // setPosChange((s) => s + 1);  // 移除状态更新，避免每帧触发渲染
      playerPositionRefs.current[playerId] = position;
    },
    [],
  );
  // const updateFurnitureHighLight = useCallback(
  //   (highlight: false | IFurniturePosition) => {
  //     setHighlightFurnitureId(highlight ? highlight.id : false);
  //   },
  //   []
  // );
  // const updateFoodType = useCallback((type: EGrabType | EFoodType | null) => {
  //   // console.log("Level received furniture handle:", handle);
  // }, []);
  const updateFurnitureHandle = useCallback((handle: number[] | undefined) => {
    // console.log("Level received furniture handle:", handle);
    setFurnitureHandles(handle);
  }, []);
  const updateGrabHandle = useCallback(
    (handle: Map<string, number> | undefined) => {
      // console.log("Level received furniture handle:", handle);
      setGrabHandles(handle);
    },
    [],
  );
  // const updatePlayerHandle = useCallback((handle: number | undefined) => {
  //   setPlayerHandle(handle);
  // }, []);
  const updateIsCutting = useCallback(
    (playerId: TPLayerId, isCutting: boolean) => {
      console.log(
        "Experience received isCutting:",
        isCutting,
        "for player:",
        playerId,
      );
      setIsCutting(isCutting);
    },
    [],
  );
  const GRAB_TYPES = [...Object.values(EGrabType), ...Object.values(EFoodType)];
  const { rapier, world } = useRapier();

  const realHighLight = useRealHighlight("firstPlayer");
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
        collider,
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
  }, [realHighLight]);

  return (
    <>
      <Lights />

      <ModelResourceProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <GrabbableWrapper
            updateIsCutting={updateIsCutting}
            // updateFoodType={updateFoodType}
            playerPositionRefs={playerPositionRefs}
            playerRefs={playerRefs}
            updateGrabHandle={updateGrabHandle}
          />
        </ErrorBoundary>

        <Level updateFurnitureHandle={updateFurnitureHandle} />
        {playersConfig.map((config) => (
          <Player
            key={config.key}
            playerId={config.key}
            direction={EDirection.normal}
            isCutting={isCutting}
            initialPositionRef={config.initialPosition}
            onPositionUpdate={handlePositionUpdate(config.key)}
            ref={(ref) => {
              if (ref) playerRefs.current[config.key] = ref;
            }}
          />
        ))}
      </ModelResourceProvider>
    </>
  );
}

export default function Experience() {
  const { gl } = useThree();
  gl.localClippingEnabled = true;

  return <Physics debug={true}>{<PhysicsScene />}</Physics>;
}
