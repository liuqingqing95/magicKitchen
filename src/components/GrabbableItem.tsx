import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";

interface GrabbableItemProps {
  children?: React.ReactNode;
  initialPosition?: [number, number, number];
  isGrabbable: boolean;
  isGrab: boolean;
}

export const GrabbableItem = forwardRef<THREE.Group, GrabbableItemProps>(
  (
    { children, initialPosition = [0, 0, 0], isGrabbable = true, isGrab },
    ref,
  ) => {
    const itemRef = useRef<THREE.Group>(null);

    useImperativeHandle(ref, () => {
      return itemRef.current!;
    });

    return (
      <group ref={itemRef} position={isGrab ? [0, 0, 0] : initialPosition}>
        {children}

        {/* {!isGrab && isGrabbable && (
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshBasicMaterial color="yellow" transparent opacity={0.6} />
          </mesh>
        )} */}
      </group>
    );
  },
);
