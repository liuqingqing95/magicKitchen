// components/PlayerWithItem.jsx
import { GrabbableItem } from "@/components/GrabbableItem";
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import { useGrabbableDistance } from "@/hooks/useGrabbableDistance";
import { useGrabSystem } from "@/hooks/useGrabSystem";
import {
  IFurniturePosition,
  ObstacleInfo,
  useObstacleStore,
} from "@/stores/useObstacle";
import { IGrabPosition, type IFoodWithRef } from "@/types/level";
// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { GRAB_ARR } from "@/constant/data";
import { Hamberger } from "@/hamberger";
import { EGrabType } from "@/types/level";
import { MODEL_PATHS } from "@/utils/loaderManager";
import { useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
// import Player from "../Player";

interface PlayerGrabbableItemProps {
  playerPosition: [number, number, number];
  updateFurnitureHighLight: (highlight: false | IFurniturePosition) => void;
  playerRef: React.MutableRefObject<THREE.Group<THREE.Object3DEventMap> | null>;
}

export default function PlayerWithItem({
  playerPosition,
  updateFurnitureHighLight,
  // furnitureHighlight,
  playerRef,
}: PlayerGrabbableItemProps) {
  // const [grabPositions, setGrabPositions] = useState<IGrabItem[]>([]);
  const [isGrab, setIsGrabbing] = useState(false);
  const itemRef = useRef<THREE.Group>(null);
  const [highlightStates, setHighlightStates] = useState<
    Record<string, boolean>
  >({});
  // const releaseItemPosition = useRef<[number, number, number]>([0, 0, 0]);
  const handPositionRef = useRef(new THREE.Vector3());
  const handQuaternionRef = useRef(new THREE.Quaternion());
  // 处理汉堡挂载
  const mountHandlers = useRef(
    new Map<string, (rigidBody: RapierRigidBody | null) => void>()
  );
  const grabRef = useRef<IFoodWithRef | null>(null);
  const unmountHandlers = useRef(new Map<string, () => void>());
  const initialPosition: [number, number, number] = [0, 0, 0];
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const {
    registerObstacle,
    unregisterObstacle,
    getObstacleInfo,
    obstacles,
    registryFurniture,
    updateObstaclePosition,
    getGrabOnFurniture,
    setGrabOnFurniture,
    removeGrabOnFurniture,
    grabOnFurniture,
  } = useObstacleStore();
  const { heldItem, grabItem, releaseItem, isHolding, isReleasing } =
    useGrabSystem();
  const { nearbyGrabObstacles, isNearby, furnitureHighlight } =
    useGrabbableDistance(playerPosition);
  const [isFoodReady, setIsFoodReady] = useState(false);

  const fireExtinguisher = useGLTF(MODEL_PATHS.overcooked.fireExtinguisher);
  const pan = useGLTF(MODEL_PATHS.overcooked.pan);
  const plate = useGLTF(MODEL_PATHS.overcooked.plate);
  const hamburger = useGLTF(MODEL_PATHS.food.burger);
  const grabModels = {
    [EGrabType.plate]: plate.scene.clone(),
    [EGrabType.pan]: pan.scene.clone(),
    [EGrabType.fireExtinguisher]: fireExtinguisher.scene.clone(),
    [EGrabType.hamburger]: hamburger.scene.clone(),
  };
  const [foods] = useState<IFoodWithRef[]>(() => {
    return GRAB_ARR.map((item) => {
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
            rigidBody: undefined,
          },
        } as MutableRefObject<THREE.Group & { rigidBody?: RapierRigidBody }>,
      };
    });
  });

  useEffect(() => {
    if (!isHolding && !heldItem) {
      const rigidBody = (grabRef.current?.ref.current as any)?.rigidBody;
      if (rigidBody) {
        const currentTranslation = rigidBody.translation();
        console.log("释放物品，更新位置", furnitureHighlight);
        if (furnitureHighlight) {
          const info = getObstacleInfo(rigidBody.handle)! as IGrabPosition;
          const position: [number, number, number] = [
            (furnitureHighlight as IFurniturePosition).position[0],
            info?.grabbingPosition.inTable || 1.1,
            (furnitureHighlight as IFurniturePosition).position[2],
          ];
          updateObstaclePosition(rigidBody.handle, position);
          setGrabOnFurniture(furnitureHighlight.id, [
            { id: info.id, type: info.type },
          ]);
        } else {
          updateObstaclePosition(rigidBody.handle, [
            currentTranslation.x,
            0,
            currentTranslation.z,
          ]);

          // removeGrabOnFurniture(furnitureHighlight.id, info.id);
        }
      }
    }
  }, [isHolding, heldItem]);

  useEffect(() => {
    updateFurnitureHighLight(furnitureHighlight);
  }, [furnitureHighlight]);

  useEffect(() => {
    const unsubscribeGrab = subscribeKeys(
      (state) => state.grab,
      (pressed) => {
        console.log("grab", pressed);
        if (pressed) {
          if (isHolding) {
            // 放下物品
            setIsGrabbing(false);
            releaseItem(furnitureHighlight);
          } else {
            setIsGrabbing(true);
            if (furnitureHighlight) {
              console.log("furnitureHighlight", furnitureHighlight.id);
              // 如果桌子高亮，直接取桌子上物品
              const arr = getGrabOnFurniture(furnitureHighlight.id);
              if (arr.length === 1) {
                const foodId = arr[0].id;
                const grab = foods.find((item) => foodId === item.id)!;
                grabRef.current = grab;
                grabItem(
                  grab.ref,
                  new THREE.Vector3(0, grab.grabbingPosition.inHand, 1.4)
                );

                // removeGrabOnFurniture(furnitureHighlight.id, grab.id);
              } else if (arr.length > 1) {
                console.log("多个物品在桌子上", arr);
              }

              // grabItem(grab.ref, new THREE.Vector3(0, grab.grabbingPosition.inHand, 1.4));
            } else {
              if (nearbyGrabObstacles.length > 0) {
                const grab = foods.find(
                  (item) => nearbyGrabObstacles[0].id === item.id
                );
                if (grab) {
                  grabRef.current = grab;
                  grabItem(
                    grab.ref,
                    new THREE.Vector3(0, grab.grabbingPosition.inHand, 1.4)
                  );
                }
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
    // setGrabPositions(GRAB_ARR);
    setIsFoodReady(true);
    return () => {
      foods.forEach((food) => {
        if (food.ref.current?.rigidBody) {
          unregisterObstacle(food.ref.current.rigidBody.handle);
        }
      });
    };
  }, []);

  const findFurnitureByPosition = (
    obstacles: Map<string | number, ObstacleInfo>,
    x: number,
    z: number
  ) => {
    for (const [key, model] of obstacles) {
      if (typeof key === "number") {
        continue;
      }
      const furnitureX = key.split(`_`)[1];
      const furnitureZ = key.split(`_`)[3];
      if (furnitureX === x.toString() && furnitureZ === z.toString()) {
        return { key, model };
      }
    }
    return null;
  };
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
            grabbingPosition: food.grabbingPosition,
            isFurniture: false,
            isMovable: true,
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
    if (registryFurniture && isFoodReady) {
      foods.forEach((food) => {
        const furniture = findFurnitureByPosition(
          obstacles,
          food.position[0],
          food.position[2]
        );
        if (furniture) {
          setGrabOnFurniture(furniture.key, [{ id: food.id, type: food.type }]);
        }
      });
    }
  }, [registryFurniture, isFoodReady]);

  useEffect(() => {
    foods.forEach((food) => {
      const isHighlighted = !isHolding && isNearby(food.id);
      setHighlightStates((prev) => ({
        ...prev,
        [food.id]: isHighlighted,
      }));
    });
  }, [isHolding, isNearby, foods]);

  useEffect(() => {
    console.log(
      "grabOnFurniture changed:",
      Array.from(grabOnFurniture.values())
    );
  }, [grabOnFurniture]);

  useFrame(() => {
    if (!playerRef.current) {
      return;
    }
    // if (isReleasing) {
    //   return;
    // }
    if (heldItem) {
      const handPos = handPositionRef.current;
      handPos.set(heldItem.offset.x, heldItem.offset.y, heldItem.offset.z);
      handPos.applyMatrix4(playerRef.current.matrixWorld);

      if (heldItem.ref.current) {
        // 更新位置
        // heldItem.ref.current.position.copy(handPos);

        // // 更新旋转，使其与玩家保持一致
        const playerQuaternion = handQuaternionRef.current;
        playerRef.current.getWorldQuaternion(playerQuaternion);

        // 如果是汉堡，更新其物理状态
        const rigidBody = (heldItem.ref.current as any).rigidBody;
        if (rigidBody) {
          updateObstaclePosition(
            rigidBody.handle,
            [handPos.x, handPos.y, handPos.z],
            [
              playerQuaternion.x,
              playerQuaternion.y,
              playerQuaternion.z,
              playerQuaternion.w,
            ]
          );
        }
      }
    }
  });

  return (
    <>
      <GrabbableItem
        ref={itemRef}
        initialPosition={initialPosition}
        isGrabbable={nearbyGrabObstacles.length > 0}
        isGrab={isGrab}
      >
        {foods.map((food) => (
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
        ))}
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
