import { KeyboardControls } from "@react-three/drei";
import { useThree } from '@react-three/fiber';
import { Physics } from "@react-three/rapier";
import { useState } from "react";
import { Level } from './Level';
import Lights from './Lights';
import Player from './Player';
import GrabbableWrapper from './components/GrabbableWrapper';
import { GRAB_ARR } from './constant/data';
import useGame from "./stores/useGame";
import { EDirection } from './types/public';
function Scene() {
  const { gl } = useThree();
  gl.localClippingEnabled = true;
  const blocksCount = useGame((state) => state.blocksCount);
  const blocksSeed = useGame((state) => state.blocksSeed);
  const [playerPosition, setPlayerPosition] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const [heldItem, setHeldItem] = useState(null); // 添加 heldItem 状态
  const [isReleasing, setIsReleasing] = useState(false); // 添加 isReleasing 状态
  const handlePositionUpdate = (position: [number, number, number]) => {
    setPlayerPosition(position);
  };
  // useEffect(() => {
  //   // 确保在每一帧都启用裁剪
  //   gl.localClippingEnabled = true;
  //   // 添加渲染前检查
  //   const render = () => {
  //     gl.localClippingEnabled = true;
  //   };
  //   gl.addEventListener('render', render);
  //   return () => gl.removeEventListener('render', render);
  // }, [gl]);

  return (
    <>
      <Lights />
      <Level  />
      <GrabbableWrapper
        playerPosition={playerPosition}
        grabPositions={GRAB_ARR}
        onHeldItemChange={setHeldItem}
        isReleasingChange={setIsReleasing}
      />
      <Player
        direction={EDirection.normal}
        initialPosition={[-2, 0, -2]}
        heldItem={heldItem}
        isReleasing={isReleasing}
        onPositionUpdate={handlePositionUpdate}
      />
    </>
  );
}
export default function Experience() {



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
          <Scene />
          
        </Physics>
      </KeyboardControls>
    </>
  );
}
