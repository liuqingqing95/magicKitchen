import PlayerWithItem from "@/components/PlayerWithItem";
import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Level } from "./Level";
import Lights from "./Lights";
// import Player from "./Player";
import { useState } from "react";
import useGame from "./stores/useGame";

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount);
  const blocksSeed = useGame((state) => state.blocksSeed);
  const [foodPositions, setFoodPositions] = useState([]);

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

        <Physics debug={true}>
          <Lights />
          <Level
            count={blocksCount}
            seed={blocksSeed}
            onFoodPositionUpdate={setFoodPositions}
          />
          <PlayerWithItem foodPositions={foodPositions} />
          {/* <Player /> */}
        </Physics>
      </KeyboardControls>
    </>
  );
}
