import { KeyboardControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Level } from "./Level";
import Lights from "./Lights";
import { Player } from "./Player";
import GrabbableWrapper from "./components/GrabbableWrapper";
import useGame from "./stores/useGame";
import { IFurniturePosition } from "./stores/useObstacle";
import { EDirection } from "./types/public";

export default function Experience() {
  const { gl } = useThree();
  gl.localClippingEnabled = true;
  const blocksCount = useGame((state) => state.blocksCount);
  const blocksSeed = useGame((state) => state.blocksSeed);
  const [playerPosition, setPlayerPosition] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const [highlightFurniture, setHighlightFurniture] = useState<
    false | IFurniturePosition
  >(false);
  const handlePositionUpdate = (position: [number, number, number]) => {
    setPlayerPosition(position);
  };
  const updateFurnitureHighLight = (highlight: false | IFurniturePosition) => {
    setHighlightFurniture(highlight);
  };
  const playerRef = useRef<THREE.Group | null>(null);

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

        <Physics debug={false}>
          <Lights />
          <Level isHighlightFurniture={highlightFurniture} />
          <GrabbableWrapper
            updateFurnitureHighLight={updateFurnitureHighLight}
            playerPosition={playerPosition}
            playerRef={playerRef}
          />
          <Player
            direction={EDirection.normal}
            initialPosition={[-2, 0, -2]}
            onPositionUpdate={handlePositionUpdate}
            ref={playerRef}
          />
        </Physics>
      </KeyboardControls>
    </>
  );
}
