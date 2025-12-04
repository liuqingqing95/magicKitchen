import { KeyboardControls } from "@react-three/drei";
import { useThree } from '@react-three/fiber';
import { Physics } from "@react-three/rapier";
import { useState } from "react";
import * as THREE from "three";
import { Level } from './Level';
import Lights from './Lights';
import Player from './Player';
import GrabbableWrapper from './components/GrabbableWrapper';
import { GRAB_ARR } from './constant/data';
import useGame from "./stores/useGame";
import { IFurniturePosition, ObstacleInfo } from './stores/useObstacle';
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
  const [obstacles, setObstacles] = useState<Map<string | number, ObstacleInfo>>(new Map());
  const handlePositionUpdate = (position: [number, number, number]) => {
    isPositionOnFurniture(position);
    setPlayerPosition(position);
  };
  const [currentFurniture, setCurrentFurniture] = useState<IFurniturePosition | false>(false);

  const isPositionOnFurniture = (pos: [number, number, number]) => {
    const position = new THREE.Vector3(...pos);
    let nearestFurniture: ObstacleInfo | null = null;
    let minDistance = Infinity;

    Array.from(obstacles.values()).forEach(obstacle => {
      if (!obstacle.isFurniture) {return;}
    
      // 获取家具的最近点
      const closestPoint = new THREE.Vector3(
        Math.max(obstacle.position[0] - obstacle.size[0]/2, 
          Math.min(position.x, 
            obstacle.position[0] + obstacle.size[0]/2)),
        Math.max(obstacle.position[1] - obstacle.size[1]/2, 
          Math.min(position.y, 
            obstacle.position[1] + obstacle.size[1]/2)),
        Math.max(obstacle.position[2] - obstacle.size[2]/2, 
          Math.min(position.z, 
            obstacle.position[2] + obstacle.size[2]/2))
      );

      // 计算到最近点的距离
      const distance = position.distanceTo(closestPoint);
    
      if (distance < minDistance) {
        minDistance = distance;
        nearestFurniture = obstacle;
      }
    });

    // 设置一个阈值来判断是否在家具附近
    const NEARBY_THRESHOLD = 1.5;
    if (minDistance <= NEARBY_THRESHOLD) {
      setCurrentFurniture(nearestFurniture! as IFurniturePosition);
    } else {
      setCurrentFurniture(false);
    }
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
      <Level isHighlightFurniture={currentFurniture} />
      <GrabbableWrapper
        furnitureHighlight={currentFurniture}
        playerPosition={playerPosition}
        grabPositions={GRAB_ARR}
        onHeldItemChange={setHeldItem}
        updateObstacles={setObstacles}
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
