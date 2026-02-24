import { SpotLight } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

interface FlashlightProps {
  playerRef: React.RefObject<THREE.Group>;
}

const Flashlight = React.memo<FlashlightProps>(({ playerRef }) => {
  const spotlightRef = useRef<THREE.SpotLight>(null);

  // 使用 useMemo 初始化，确保首次渲染时就存在
  const spotlightTarget = useMemo(() => new THREE.Object3D(), []);
  // 动态更新 spotlight target 的世界坐标位置
  useFrame(() => {
    if (!playerRef.current) return;

    // 获取玩家世界位置和朝向
    const playerPosition = new THREE.Vector3();
    playerRef.current.getWorldPosition(playerPosition);

    // 计算玩家前方方向（在世界坐标系中）
    const forwardDirection = new THREE.Vector3(0, 0, 0);
    forwardDirection.applyQuaternion(playerRef.current.quaternion);
    // // forwardDirection.y = 0; // 保持水平方向
    // forwardDirection.normalize();

    // 将目标点设置在玩家前方一定距离处
    const targetDistance = 2;
    const targetPosition = playerPosition
      .clone()
      .add(forwardDirection.multiplyScalar(targetDistance));

    spotlightTarget.position.copy(targetPosition);
    spotlightTarget.updateMatrixWorld();
  });
  return (
    <>
      {/* SpotLight 目标对象 */}
      <primitive object={spotlightTarget} />
      {/* SpotLight 跟随玩家旋转，始终指向前方 */}
      <SpotLight
        ref={spotlightRef}
        position={[0, 0.5, 1]} // 相对 playerRef 的位置，在玩家上方
        target={spotlightTarget}
        angle={Math.PI / 4} // 比较窄的角度
        penumbra={0.2}
        intensity={5}
        distance={20}
        color="#ff9800"
        castShadow
      />
    </>
  );
});

Flashlight.displayName = "Flashlight";

export default Flashlight;
