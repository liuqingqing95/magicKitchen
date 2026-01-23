import { useGrabObstacleStore } from "@/stores/useGrabObstacle";
import { round } from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { GrabContext } from "./context/GrabContext";
import useBurgerAssembly from "./hooks/useBurgerAssembly";
import MultiFood from "./MultiFood";
import { IFurniturePosition } from "./stores/useFurnitureObstacle";
import { EFoodType, EFurnitureType } from "./types/level";
import { assembleMultiFood } from "./utils/canAssembleBurger";

export const GrabItem = React.memo(
  ({
    playerRef,
    isHolding,
    playerPositionRef,
  }: {
    playerPositionRef: React.MutableRefObject<[number, number, number]>;
    playerRef: React.RefObject<THREE.Group>;
    isHolding: boolean;
  }) => {
    const {
      modelMapRef,
      grabSystemApi,
      pendingGrabIdRef,
      grabRef,
      clickGrab: { isGrab },
    } = useContext(GrabContext);

    const { heldItem, releaseItem, grabItem } = grabSystemApi;
    const {
      registerObstacle,
      obstacles,
      realHighLight,
      grabOnFurniture,
      updateObstacleInfo,
      unregisterObstacle,
      setGrabOnFurniture,
      removeGrabOnFurniture,
      getGrabOnFurniture,
      getObstacleInfo,
    } = useGrabObstacleStore((s) => {
      return {
        obstacles: s.obstacles,
        grabOnFurniture: s.grabOnFurniture,
        realHighLight: s.realHighLight,
        removeGrabOnFurniture: s.removeGrabOnFurniture,
        updateObstacleInfo: s.updateObstacleInfo,
        getObstacleInfo: s.getObstacleInfo,
        unregisterObstacle: s.unregisterObstacle,
        registerObstacle: s.registerObstacle,
        getGrabOnFurniture: s.getGrabOnFurniture,
        setGrabOnFurniture: s.setGrabOnFurniture,
      };
    });
    const handPositionRef = useRef(new THREE.Vector3());
    const groupRef = useRef<THREE.Group | null>(null);
    const {
      hand,
      dropHeld,
      highlightedFurniture,
      setHand,
      assembleAndUpdateUI,
    } = useBurgerAssembly();
    // const prevObstacleRef = useRef<ObstacleInfo | null>(null);
    useEffect(() => {
      if (grabRef.current?.id) {
        const obj = getObstacleInfo(grabRef.current?.id || "") || null;
        setHand(obj);
      } else {
        setHand(null);
      }
    }, [grabRef.current?.id]);
    // Helper: 检查家具上是否可以合成汉堡并返回 partIds
    const canAssembleBurger = useCallback(() => {
      if (!realHighLight || !hand) return false;

      return assembleMultiFood(realHighLight, hand);
    }, [realHighLight, hand, highlightedFurniture]);

    const putDownFloor = useMemo(() => {
      // const model = modelMapRef.current?.get(grabRef.current?.id || "");
      // // const rigidBody = rigidBodyMapRef.current.get(grabRef.current?.id || "");
      if (!groupRef.current || !playerRef.current) return;

      const t = groupRef.current?.position;
      const handPos = handPositionRef.current;
      handPos.set(t.x, t.y, t.z);
      handPos.applyMatrix4(playerRef.current.matrixWorld);
      const currentPosition: [number, number, number] = [
        round(handPos.x, 3),
        0,
        round(handPos.z, 3),
      ];
      return currentPosition;
    }, [
      highlightedFurniture,
      handPositionRef,
      groupRef.current,
      // modelMapRef,
      // grabRef,
      playerPositionRef.current.join(","),
    ]);
    const putDownTable = useMemo(() => {
      if (typeof highlightedFurniture !== "boolean") {
        let pos = [0, 0, 0] as [number, number, number];
        pos[0] = highlightedFurniture.position[0];
        pos[1] = 1;
        pos[2] = highlightedFurniture.position[2];

        return pos;
      }
    }, [
      highlightedFurniture,
      handPositionRef,
      groupRef.current,
      // modelMapRef,
      // grabRef,
      playerPositionRef.current.join(","),
    ]);
    // Helper: 放置手中物体到家具（原子操作，使用 assembly helper）
    // const placeHeldToFurniture = useCallback(
    //   (furnId: string, pos: [number, number, number]) => {
    //     return burgerAssembly.placeHeldItemOnFurniture(
    //       furnId,
    //       highlightedFurniture,
    //       pos
    //     );
    //   },
    //   [burgerAssembly]
    // );
    const models = useMemo(() => {
      if (!hand) return [];
      const arr: THREE.Group<THREE.Object3DEventMap>[] = [];

      const model1 = modelMapRef.current?.get(hand.id);
      const model2 = modelMapRef.current?.get(hand.foodModel?.id || "");
      if (model1) {
        arr.push(model1.clone());
      }
      if (model2) {
        arr.push(model2.clone());
      }

      return arr;
    }, [hand]);

    useEffect(() => {
      if (isHolding) {
        if (!hand) return;

        if (
          typeof highlightedFurniture !== "boolean" &&
          highlightedFurniture.type === EFurnitureType.trash
        ) {
          if (Object.values(EFoodType).includes(hand.type as EFoodType)) {
            // 食品才可丢弃
            unregisterObstacle(hand.id);
            // takeOutFood((prev) => prev.filter((item) => item.id !== info.id));
            // unregisterFurnitureObstacle(hand.id);
            modelMapRef.current?.delete(hand.id);
            modelMapRef.current?.delete(hand.foodModel?.id || "");

            releaseItem();
            // unregisterObstacle(info.id);
            grabRef.current = null;
            return;
          }
        }

        // 1) Try assembly
        const possible = canAssembleBurger();
        console.log(possible, "canAssembleBurger");
        if (possible) {
          if (possible == "forbidAssemble") return;
          const did = assembleAndUpdateUI(possible);
          if (did) {
            if (did.putOnTable) {
              const before = Object.entries(grabOnFurniture).find(
                ([key, value]) => value === did.takeOffTable,
              );
              if (before) {
                removeGrabOnFurniture(before[0] || "");
              }

              setGrabOnFurniture(
                (highlightedFurniture as IFurniturePosition).id,
                did.putOnTable,
              );
            }
            if (did.leaveGrab) {
              releaseItem();
              grabRef.current = null;
              return;
            }

            return;
          }
        }
        const rotation: THREE.Euler | undefined = heldItem?.rotation;

        if (typeof highlightedFurniture !== "boolean") {
          if (!getGrabOnFurniture(highlightedFurniture.id)) {
            dropHeld(hand.id, "table", putDownTable, rotation);
            setGrabOnFurniture(highlightedFurniture.id, hand.id);
          }
          return;
        } else {
          dropHeld(hand.id, "floor", putDownFloor, rotation);
        }
        grabRef.current = null;

        return;

        // no furniture highlighted: drop to floor
        // dropHeldToFloor(info.id, currentPosition);
        // grabRef.current = null;
        // return;
      }
    }, [isGrab]);

    if (!models.length) return null;
    console.log("GrabItem render", isHolding);

    // const props = useMemo(() => {
    //   return {
    //     ref: groupRef,
    //     position: heldItem?.offset,
    //     foodModel: hand?.foodModel,
    //     model: models[0],
    //     baseFoodModel: models[1],
    //   };
    // }, [groupRef, heldItem?.offset, hand, models]);

    return (
      isHolding && (
        <MultiFood
          ref={groupRef}
          id={hand?.id || ""}
          position={heldItem?.offset}
          foodModel={hand?.foodModel}
          model={models[0]}
          rotation={heldItem?.rotation}
          baseFoodModel={models[1]}
        ></MultiFood>
      )
      // renderFoodModel(hand?.foodModel, models[0], models[1], )
      // <group ref={groupRef} position={heldItem?.offset}>
      //   {models.map((model) => (
      //     <primitive key={model.uuid} object={model} scale={1} />
      //   ))}
      // </group>
    );
  },
);
export default React.memo(GrabItem);
GrabItem.displayName = "GrabItem";
