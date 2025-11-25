// components/PlayerWithItem.jsx
import { GrabbableItem } from "@/components/GrabbableItem";
import { Hamberger } from "@/hamberger";
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import { useGrabbableDistance } from "@/hooks/useGrabbableDistance";
import { useGrabSystem } from "@/hooks/useGrabSystem";
import { IFoodType, type IFoodWithRef } from "@/types/level";
import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { useGLTF, useKeyboardControls } from "@react-three/drei";
import { RapierRigidBody } from "@react-three/rapier";
// import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// import Player from "../Player";

interface PlayerGrabbableItemProps {
  hamburgerModelUrl?: string;
  playerPosition: [number, number, number];
  foodPositions: {
    type: IFoodType;
    position: [number, number, number];
  }[];
  onHeldItemChange?: (item: any) => void;
}

export default function PlayerWithItem({
  hamburgerModelUrl = "/hamburger.glb",
  foodPositions,
  playerPosition,
  onHeldItemChange,
}: PlayerGrabbableItemProps) {
  const hamburgerModel = useGLTF(hamburgerModelUrl);
  const [isGrab, setIsGrabbing] = useState(false);
  const itemRef = useRef<THREE.Group>(null);
  const initialPosition: [number, number, number] = [0, 0, 0];
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { heldItem, grabItem, releaseItem, isHolding } = useGrabSystem();
  const { nearbyObstacles, isNearby } = useGrabbableDistance(playerPosition);
  const [foods] = useState<IFoodWithRef[]>(() => {
    return foodPositions.map((item, index) => {
      return {
        id: `${index}`,
        position: item.position,
        type: item.type,
        ref: { current: null } as MutableRefObject<
          THREE.Group & { rigidBody?: RapierRigidBody }
        >,
      };
    });
  });

  useEffect(() => {
    onHeldItemChange?.(heldItem);
  }, [heldItem, onHeldItemChange]);

  useEffect(() => {
    const unsubscribeGrab = subscribeKeys(
      (state) => state.grab,
      (pressed) => {
        console.log("grab", pressed);
        if (pressed) {
          if (isHolding) {
            setIsGrabbing(false);
            releaseItem();
          } else {
            setIsGrabbing(true);
            if (nearbyObstacles.length > 0) {
              const ref = foods.find(
                (item) => nearbyObstacles[0].id === item.id
              )?.ref;
              if (ref) {
                grabItem(ref, new THREE.Vector3(0.3, 0.2, 0.5));
              }
            }
          }
        }
      }
    );

    return unsubscribeGrab;
  }, [subscribeKeys, isHolding, releaseItem]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      foods.forEach((food) => {
        if (food.ref.current?.rigidBody) {
          unregisterObstacle(food.ref.current.rigidBody.handle);
        }
      });
    };
  }, []);

  // 处理汉堡挂载
  const handleHamburgerMount =
    (food: IFoodWithRef) => (rigidBody: RapierRigidBody) => {
      if (food.ref.current) {
        food.ref.current.rigidBody = rigidBody;
      }

      registerObstacle(rigidBody.handle, {
        id: food.id,
        type: food.type,
        position: food.position,
      });
    };

  // 处理汉堡卸载
  const handleHamburgerUnmount = (food: IFoodWithRef) => () => {
    if (food.ref.current?.rigidBody) {
      unregisterObstacle(food.ref.current.rigidBody.handle);
    }
  };

  const handleHeighlight = (id: string) => {
    console.log(
      "Checking highlight for id:",
      isHolding,
      isNearby(id),
      playerPosition
    );
    if (!isHolding && isNearby(id)) {
      return true;
    }
    return false;
  };
  return (
    <>
      <GrabbableItem
        ref={itemRef}
        initialPosition={initialPosition}
        isGrabbable={nearbyObstacles.length > 0}
        isGrab={isGrab}
      >
        <group>
          {foods.map((food) => (
            <Hamberger
              key={food.id}
              id={food.id}
              position={food.position}
              ref={food.ref}
              isHighlighted={handleHeighlight(food.id)}
              onMount={handleHamburgerMount(food)}
              onUnmount={handleHamburgerUnmount(food)}
            />
          ))}
        </group>
      </GrabbableItem>
      {/* <Float floatIntensity={0.25} rotationIntensity={0.25}>
        <Text
          font="/bebas-neue-v9-latin-regular.woff"
          scale={0.5}
          maxWidth={0.65}
          lineHeight={0.75}
          textAlign="right"
          position={[0.75, 0.65, 0]}
          rotation-y={-0.25}
        >
          isHolding: {isHolding}
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </Float> */}
    </>
  );
}
