import { Float, Text } from "@react-three/drei";
import React, { useContext } from "react";
import * as THREE from "three";
import ModelResourceContext from "./context/ModelResourceContext";
import { EFoodType } from "./types/level";
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
  // type: EFoodType;
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

export const CookedImage = React.memo(
  ({
    scale = 1,
    position = 1.3,
    url,
    rotation = [-Math.PI / 2, 0, 0],
  }: IImageProps) => {
    const { textures } = useContext(ModelResourceContext);
    // derive key from url like './2D/meatPatty.png' => 'meatPatty'
    const key =
      typeof url === "string" ? url.replace(/^.*\/(.*)\.png$/, "$1") : "";
    const texture = textures[key as EFoodType] || null;

    const size = 0.9 * scale;
    return (
      // <Float floatIntensity={0.25} rotationIntensity={0.25}>
      <group
        rotation={rotation}
        position={typeof position === "number" ? [0, position, 0] : position}
      >
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[0.5, 64]} />
          <meshBasicMaterial color="#fff" />
        </mesh>

        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial
            map={texture}
            transparent={true}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      // </Float>
    );
  },
);
