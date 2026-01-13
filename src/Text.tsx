import { Float, Image, Text } from "@react-three/drei";
import * as THREE from "three";
interface IDebugTextProps {
  id?: string;
  position?: number | [number, number, number];
  color?: string;
  maxWidth?: number;
  rotation?: [number, number, number];
  text: string;
}

interface IImageProps {
  scale?: number;
  position?: number | [number, number, number];
  url: string;
  rotation?: [number, number, number];
}
export const DebugText = ({
  id,
  color,
  position = 1.3,

  maxWidth = 1,
  text,
  rotation = [-Math.PI / 2, 0, 0],
}: IDebugTextProps) => {
  return (
    <Float floatIntensity={0.25} rotationIntensity={0.25}>
      <Text
        font="/bebas-neue-v9-latin-regular.woff"
        scale={0.5}
        // maxWidth={width}
        lineHeight={0.75}
        color={color}
        textAlign="right"
        position={typeof position === "number" ? [0, position, 0] : position}
        rotation={rotation}
      >
        {text}
        <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
      </Text>
    </Float>
  );
};

export const CookedImage = ({
  scale = 1,
  position = 1.3,
  url,
  rotation = [-Math.PI / 2, 0, 0],
}: IImageProps) => {
  return (
    // <Float floatIntensity={0.25} rotationIntensity={0.25}>
    <group
      rotation={rotation}
      position={typeof position === "number" ? [0, position, 0] : position}
    >
      {/* <mesh >
        <ringGeometry args={[radius, 64]} />
        <meshBasicMaterial color={"#ffffff"} side={THREE.DoubleSide} />
      </mesh> */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[0.5, 64]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <Image url={url} scale={scale} transparent></Image>
    </group>
    // </Float>
  );
};
