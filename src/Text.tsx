import { Float, Text } from "@react-three/drei";
interface IDebugTextProps {
  id?: string;
  position?: number | [number, number, number];
  color?: string;
  maxWidth?: number;
  rotation?: [number, number, number];
  text: string;
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
        <meshBasicMaterial toneMapped={false} />
      </Text>
    </Float>
  );
};
