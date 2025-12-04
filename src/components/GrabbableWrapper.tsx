// components/PlayerWithItem.jsx
import { GrabbableItem } from "@/components/GrabbableItem";
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import { useGrabbableDistance } from "@/hooks/useGrabbableDistance";
import { useGrabSystem } from "@/hooks/useGrabSystem";
import { useObstacleStore } from "@/stores/useObstacle";
import { IGrabItem, type IFoodWithRef } from "@/types/level";
// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { useKeyboardControls } from "@react-three/drei";
import { RapierRigidBody } from "@react-three/rapier";
// import { useFrame } from "@react-three/fiber";
import { Hamberger } from "@/hamberger";
import { EGrabType } from '@/types/level';
import { MODEL_PATHS } from "@/utils/loaderManager";
import { useGLTF } from "@react-three/drei";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
// import Player from "../Player";

interface PlayerGrabbableItemProps {
  playerPosition: [number, number, number];
  grabPositions: IGrabItem[];
  onHeldItemChange?: (item: any) => void;
  isReleasingChange?: (isHolding: boolean) => void;
}

export default function PlayerWithItem({
  grabPositions,
  playerPosition,
  isReleasingChange,
  onHeldItemChange,
}: PlayerGrabbableItemProps) {
  const [isGrab, setIsGrabbing] = useState(false);
  const itemRef = useRef<THREE.Group>(null);
  const [highlightStates, setHighlightStates] = useState<
    Record<string, boolean>
  >({});
  const initialPosition: [number, number, number] = [0, 0, 0];
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { registerObstacle, unregisterObstacle } = useObstacleStore();
  const { heldItem, grabItem, releaseItem, isHolding, isReleasing } = useGrabSystem();
  const { nearbyObstacles, isNearby } = useGrabbableDistance(playerPosition);

  const fireExtinguisher = useGLTF(MODEL_PATHS.overcooked.fireExtinguisher);
  const pan = useGLTF(MODEL_PATHS.overcooked.pan);
  const plate = useGLTF(MODEL_PATHS.overcooked.plate);
  const hamburger = useGLTF(MODEL_PATHS.food.burger);
  const grabModels = {
    [EGrabType.plate]: plate.scene.clone(),
    [EGrabType.pan]: pan.scene.clone(),
    [EGrabType.fireExtinguisher]: fireExtinguisher.scene.clone(),
    [EGrabType.hamburger]: hamburger.scene.clone(),
   
  }
  const [foods] = useState<IFoodWithRef[]>(() => {
    return grabPositions.map((item) => {
      const clonedModel = grabModels[item.name].clone();
      return {
        id: clonedModel.uuid,
        position: item.position,
        type: item.name,
        model: clonedModel,
        size: item.size,
        grabbingPosition: item.grabbingPosition,
        ref: { 
          current: {
            rigidBody: undefined
          }} as MutableRefObject<
          THREE.Group & { rigidBody?: RapierRigidBody }
        >,
      };
    });
  });
  useEffect(() => {
    onHeldItemChange?.(heldItem);
  }, [heldItem, onHeldItemChange]);

  useEffect(() => {
    isReleasingChange?.(isReleasing);
  }, [isReleasingChange, isReleasing]);

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
              const grab = foods.find(
                (item) => nearbyObstacles[0].id === item.id
              );
              if (grab) {
                grabItem(grab.ref, new THREE.Vector3(0, grab.grabbingPosition.inHand, 1.4));
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
  const mountHandlers = useRef(
    new Map<string, (rigidBody: RapierRigidBody | null) => void>()
  );
  const unmountHandlers = useRef(new Map<string, () => void>());

  useEffect(() => {
    foods.forEach((food) => {
      if (!mountHandlers.current.has(food.id)) {
        mountHandlers.current.set(food.id, (rigidBody) => {
          if (!rigidBody) {
            return;
          }
          if (food.ref.current) {
            food.ref.current.rigidBody = rigidBody;
          }
          registerObstacle(rigidBody.handle, {
            id: food.id,
            type: food.type,
            position: food.position,
            size: food.size,
            grabbingPosition: food.grabbingPosition
          });
        });
      }
      if (!unmountHandlers.current.has(food.id)) {
        unmountHandlers.current.set(food.id, () => {
          if (food.ref.current?.rigidBody) {
            unregisterObstacle(food.ref.current.rigidBody.handle);
          }
        });
      }
    });
  }, [foods, registerObstacle, unregisterObstacle]);

  const handleHamburgerMount = useCallback(
    (id: string) => mountHandlers.current.get(id),
    []
  );
  const handleHamburgerUnmount = useCallback(
    (id: string) => unmountHandlers.current.get(id),
    []
  );
  useEffect(() => {
    foods.forEach((food) => {
      const isHighlighted = !isHolding && isNearby(food.id);
      setHighlightStates((prev) => ({
        ...prev,
        [food.id]: isHighlighted,
      }));
    });
  }, [isHolding, isNearby, foods]);
 
  return (
    <>
      <GrabbableItem
        ref={itemRef}
        initialPosition={initialPosition}
        isGrabbable={nearbyObstacles.length > 0}
        isGrab={isGrab}
      >
       
        {foods.map((food) => 
         
          <Hamberger
            key={food.id}
            type={food.type}
            model={food.model}
            position={food.position}
            ref={food.ref}
            isHighlighted={highlightStates[food.id]}
            onMount={handleHamburgerMount(food.id)}
            onUnmount={handleHamburgerUnmount(food.id)}
          />
       
        )}
      </GrabbableItem>
      {/* <Float floatIntensity={0.25} rotationIntensity={0.25}>
        <Text
          font="/bebas-neue-v9-latin-regular.woff"
          scale={0.5}
          maxWidth={5}
          lineHeight={0.75}
          textAlign="right"
          position={[0.75, 0.65, 0]}
          rotation-y={-0.25}
        >
          isHighlighted: {highlightStates[foods[0]?.id] ? "true" : "false"}
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </Float> */}
    </>
  );
}
