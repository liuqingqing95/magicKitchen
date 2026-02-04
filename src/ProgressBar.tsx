import { useMemo } from "react";
import * as THREE from "three";
interface ProgressBarProps {
  progress?: number; // 进度值，范围从 0 到 1
  position?: [number, number, number];
  offsetZ?: number;
}

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  // returns a THREE.Shape for a rounded rect whose origin is at center-left logic below
  const shape = new THREE.Shape();
  // We'll build rectangle with origin at (0,0) center to simplify positioning
  const halfW = w / 2;
  const halfH = h / 2;
  // start at top-left
  shape.moveTo(-halfW + r, halfH);
  shape.lineTo(halfW - r, halfH);
  shape.quadraticCurveTo(halfW, halfH, halfW, halfH - r);
  shape.lineTo(halfW, -halfH + r);
  shape.quadraticCurveTo(halfW, -halfH, halfW - r, -halfH);
  shape.lineTo(-halfW + r, -halfH);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW, -halfH + r);
  shape.lineTo(-halfW, halfH - r);
  shape.quadraticCurveTo(-halfW, halfH, -halfW + r, halfH);
  return shape;
}
function ProgressBar({
  progress = 0,
  position = [0, 0, 0],
  offsetZ = -0.5,
}: ProgressBarProps) {
  // 内部尺寸（去掉 border）
  const border = 0.04;
  const width = 1.58;
  const height = 0.28;
  const radius = 0.08;
  const innerWidthTotal = width - border * 2;
  const innerHeight = height - border * 2;

  // 外层 shape（白色边框背景）
  const outerShape = useMemo(() => {
    return roundedRectPath(0, 0, width, height, radius);
  }, [width, height, radius]);

  // 内层 shape：随 progress 更新宽度；保持左对齐 -> 我们通过 position.x 调整
  const innerShape = useMemo(() => {
    const curWidth = Math.max(
      0.0001,
      innerWidthTotal * Math.max(0, Math.min(1, progress)),
    );
    return roundedRectPath(
      0,
      0,
      curWidth,
      innerHeight,
      Math.max(0, radius - border),
    );
  }, [progress, innerWidthTotal, innerHeight, radius, border]);

  // 内层 x 位置：要与外层左对齐
  // 外层中心在 0，左边界为 -width/2，内层中心应在 left + curWidth/2 + border
  const innerCenterX = (() => {
    const curWidth = Math.max(
      0.0001,
      innerWidthTotal * Math.max(0, Math.min(1, progress)),
    );
    const left = -width / 2 + border;
    return left + curWidth / 2;
  })();

  return (
    <group position={[position[0], position[1] + 1, position[2] + offsetZ]}>
      {/* 外层：白色背景（同时作为 border） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[outerShape, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.7} />
      </mesh>

      {/* 内层：进度条，放在外层上方一点 z 以避免 z fighting */}
      <mesh position={[innerCenterX, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[innerShape, 32]} />
        <meshStandardMaterial color="#27942a" metalness={0.1} roughness={0.4} />
      </mesh>
    </group>
  );
}
export default ProgressBar;
