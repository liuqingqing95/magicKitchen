import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useState } from "react";
import GrabbableWrapper from "./components/GrabbableWrapper";
import { Level } from "./Level";
import Lights from "./Lights";
import Player from "./Player";
import useGame from "./stores/useGame";
import { IFoodType } from "./types/level";

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount);
  const blocksSeed = useGame((state) => state.blocksSeed);
  const [playerPosition, setPlayerPosition] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const [heldItem, setHeldItem] = useState(null); // 添加 heldItem 状态

  const handlePositionUpdate = (position: [number, number, number]) => {
    setPlayerPosition(position);
  };
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
          <Level  />
          <GrabbableWrapper
            playerPosition={playerPosition}
            foodPositions={[
              { type: IFoodType.Hamburger, position: [0, 0, -1] },
              // { type: IFoodType.Hamburger, position: [3, 1, 0] },
            ]}
            onHeldItemChange={setHeldItem}
          />
          <Player
            initialPosition={[-2, 4, -2]}
            heldItem={heldItem}
            onPositionUpdate={handlePositionUpdate}
          />
        </Physics>
      </KeyboardControls>
    </>
  );
}
