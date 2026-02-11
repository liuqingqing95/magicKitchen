import {
  ObstacleInfo,
  useGrabObstacleStore,
  useRealHighlight,
} from "@/stores/useGrabObstacle";
import { round } from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { GrabContext } from "./context/GrabContext";
import { useBurgerAssembly } from "./hooks/useBurgerAssembly";
import MultiFood from "./MultiFood";
import ProgressBar from "./ProgressBar";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
  useHighlightId,
} from "./stores/useFurnitureObstacle";
import useGame from "./stores/useGame";
import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  IFoodWithRef,
  TPLayerId,
} from "./types/level";
import {
  assembleMultiFood,
  IAssembleMultiFoodType,
} from "./utils/canAssembleBurger";
import { canCookFood, ICanCookFoodType } from "./utils/canCook";
import { canCutFood } from "./utils/canCut";
import {
  foodContainerTypes,
  haveTarget,
  isInclude,
  isMultiFoodModelType,
} from "./utils/util";

export const GrabItem = ({
  playerRef,
  playerPositionRef,
  playerId,
}: {
  playerPositionRef: React.MutableRefObject<[number, number, number]>;
  playerRef: React.RefObject<THREE.Group>;
  playerId: TPLayerId;
}) => {
  const {
    modelMapRef,
    grabSystemApi,
    handleIngredientsApi,
    pendingGrabIdRef,
    grabRef,
    clickGrab: { isGrab },
  } = useContext(GrabContext);
  const { stopTimer, setIngredientStatus, handleIngredients } =
    handleIngredientsApi;
  const { heldItemsMap, releaseItem, grabItem } = grabSystemApi;
  const {
    updateObstacleInfo,
    unregisterObstacle,
    setGrabOnFurniture,
    getGrabOnFurniture,
    getObstacleInfo,
    setDirtyPlates,
  } = useGrabObstacleStore((s) => {
    return {
      removeGrabOnFurniture: s.removeGrabOnFurniture,
      updateObstacleInfo: s.updateObstacleInfo,
      getObstacleInfo: s.getObstacleInfo,
      unregisterObstacle: s.unregisterObstacle,
      registerObstacle: s.registerObstacle,
      getGrabOnFurniture: s.getGrabOnFurniture,
      setGrabOnFurniture: s.setGrabOnFurniture,
      setDirtyPlates: s.setDirtyPlates,
    };
  });
  const realHighLight = useRealHighlight(playerId);
  const setScore = useGame((s) => s.setScore);
  const handPositionRef = useRef(new THREE.Vector3());
  const groupRef = useRef<THREE.Group | null>(null);

  const heldItem = useMemo(() => {
    return heldItemsMap.get(playerId) || null;
  }, [heldItemsMap, playerId]);

  const { cutAndUpdateUI, cookAndUpdateUI, assembleAndUpdateUI, dropHeld } =
    useBurgerAssembly();
  // const prevObstacleRef = useRef<ObstacleInfo | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [hand, setHand] = useState<ObstacleInfo | null>(null);

  // const { hand } = heldItem || { hand: null };

  const furniturelightIds = useHighlightId();
  const { getFurnitureObstacleInfo } = useFurnitureObstacleStore((s) => {
    return {
      getFurnitureObstacleInfo: s.getObstacleInfo,
      unregisterFurnitureObstacle: s.unregisterObstacle,
    };
  });

  const highlightedFurniture = useMemo(() => {
    // 获取指定玩家的高亮家具ID
    const highlightId = furniturelightIds[playerId];
    if (highlightId) {
      return getFurnitureObstacleInfo(highlightId) || false;
    }
    return false;
  }, [playerId, furniturelightIds]);

  const updateHand = (obj: IFoodWithRef) => {
    // grabRef.current = obj;
    setHand(obj);
    // TODO: 需要根据当前玩家判断，暂时使用 firstPlayer
    grabItem(playerId, {
      food: obj,
      customRotation: heldItem?.rotation,
      model: modelMapRef.current?.get(obj.id) || null,
      baseFoodModel: modelMapRef.current?.get(obj.foodModel?.id || "") || null,
    });
  };
  useEffect(() => {
    if (heldItem?.id) {
      const obj = getObstacleInfo(heldItem.id) || null;
      setHand(obj);
      updateObstacleInfo(heldItem.id, {
        visible: false,
      });
      // if (!groupRef.current?.rotation.y) {
      setRotation(heldItem.rotation || [0, 0, 0]);
      // }
    } else {
      setRotation([0, 0, 0]);
      setHand(null);
    }
  }, [heldItem?.id, heldItem?.baseFoodModel, heldItem?.model]);

  // Helper: 检查家具上是否可以合成汉堡并返回 partIds
  const canAssembleBurger = useCallback(() => {
    if (!realHighLight || !hand) return false;
    if (haveTarget(realHighLight.type, hand.type, "pan")) {
      return canCookFood(realHighLight, hand);
    } else if (isInclude(realHighLight.type, "cuttingBoard")) {
      return canCutFood(realHighLight, hand);
    }
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
  // const models = useMemo(() => {
  //   if (!hand) return [];
  //   const arr: THREE.Group<THREE.Object3DEventMap>[] = [];

  //   const model1 = modelMapRef.current?.get(hand.id);
  //   const model2 = modelMapRef.current?.get(hand.foodModel?.id || "");
  //   if (model1) {
  //     arr.push(model1.clone());
  //   }
  //   if (model2) {
  //     arr.push(model2.clone());
  //   }

  //   return arr;
  // }, [hand]);
  const UIProps = useMemo(() => {
    return {
      realHighLight,
      hand,
      highlightedFurniture: highlightedFurniture as IFurniturePosition | false,
      playerId,
      updateHand,
    };
  }, [realHighLight, hand, highlightedFurniture, playerId, updateHand]);
  useEffect(() => {
    if (heldItem?.id) {
      if (!hand) return;

      if (typeof highlightedFurniture !== "boolean") {
        if (highlightedFurniture.type === EFurnitureType.trash) {
          if (Object.values(EFoodType).includes(hand.type as EFoodType)) {
            // 食品才可丢弃
            unregisterObstacle(hand.id, playerId);
            // takeOutFood((prev) => prev.filter((item) => item.id !== info.id));
            // unregisterFurnitureObstacle(hand.id);
            modelMapRef.current?.delete(hand.id);
            modelMapRef.current?.delete(hand.foodModel?.id || "");
            releaseItem(playerId);
          } else if (
            Object.values(foodContainerTypes).includes(
              hand.type as EGrabType,
            ) &&
            hand.foodModel
          ) {
            const info = {
              foodModel: undefined,
            };
            updateObstacleInfo(hand.id, info);
            modelMapRef.current?.delete(hand.foodModel.id);
            setHand({
              ...hand,
              ...info,
            });
            // TODO: 需要根据当前玩家判断，暂时使用 firstPlayer
            grabItem("firstPlayer", {
              food: {
                ...hand,
                ...info,
              },
              baseFoodModel: null,
              model: modelMapRef.current?.get(hand.id) || null,
            });
          }

          return;
        } else if (highlightedFurniture.type === EFurnitureType.serveDishes) {
          if (
            hand.type === EGrabType.plate &&
            hand.foodModel &&
            isMultiFoodModelType(hand.foodModel)
          ) {
            unregisterObstacle(hand.id, playerId);
            modelMapRef.current?.delete(hand.id || "");
            modelMapRef.current?.delete(hand.foodModel?.id || "");
            const arr = hand.foodModel.type.map((item) => item.type);
            setScore(arr);
            setHand(null);
            releaseItem(playerId);
          } else {
            return;
          }
        } else if (highlightedFurniture.type === EFurnitureType.washSink) {
          if (hand.type === EGrabType.dirtyPlate) {
            if (hand.foodModel) {
              const arr = [hand.id, hand.foodModel.id];
              if (isMultiFoodModelType(hand.foodModel)) {
                arr.concat(hand.foodModel.type.map((item) => item.id));
              }
              setDirtyPlates(arr);
            } else {
              setDirtyPlates([hand.id]);
            }
            unregisterObstacle(hand.id, playerId);
            modelMapRef.current?.delete(hand.id || "");
            setHand(null);
            releaseItem(playerId);
          } else {
            return;
          }
        }
      }

      // 1) Try assembly
      const possible = canAssembleBurger();
      console.log(possible, "canAssembleBurger");
      if (possible) {
        if (possible.type === "assembleMultiFood") {
          const result = possible.result as IAssembleMultiFoodType;
          if (result == "forbidAssemble") return;
          const did = assembleAndUpdateUI(result, UIProps);
          if (did) {
            if (did.putOnTable) {
              setGrabOnFurniture(
                (highlightedFurniture as IFurniturePosition).id,
                did.putOnTable,
              );
            }
            if (did.leaveGrab) {
              releaseItem(playerId);
              // grabRef.current = null;
              return;
            }

            return;
          }
        } else if (possible.type === "canCookFood") {
          // if (result == "notValid") return;
          const result = possible.result as ICanCookFoodType;
          if (result) {
            const did = cookAndUpdateUI(result, UIProps);
            if (did) {
              if (did.putOnTable) {
                setGrabOnFurniture(
                  (highlightedFurniture as IFurniturePosition).id,
                  did.putOnTable,
                );
              }
              if (realHighLight) {
                if (
                  haveTarget(realHighLight.type, hand.type, "pan") ===
                  "highlighted"
                ) {
                  setIngredientStatus(realHighLight.id, false);
                } else {
                  setIngredientStatus(hand.id, false);
                }
              }

              if (did.leaveGrab) {
                releaseItem(playerId);
              }

              return;
            }
          }
          return;
        } else if (possible.type === "canCutFood") {
          if (!possible.result) return;
          const did = cutAndUpdateUI(possible.result, UIProps);
          if (did) {
            setIngredientStatus(
              (realHighLight as IFoodWithRef).id,
              hand.isCut ? 5 : false,
            );
            stopTimer((realHighLight as IFoodWithRef).id);

            if (did.putOnTable) {
              setGrabOnFurniture(
                (highlightedFurniture as IFurniturePosition).id,
                did.putOnTable,
              );
            }

            if (did.leaveGrab) {
              releaseItem(playerId);
              setHand(null);
            }
          }
          return;
        }
      }

      if (typeof highlightedFurniture !== "boolean") {
        if (!getGrabOnFurniture(highlightedFurniture.id)) {
          dropHeld(playerId, hand.id, "table", putDownTable);
          setGrabOnFurniture(highlightedFurniture.id, hand.id);
        }
        return;
      } else {
        dropHeld(playerId, hand.id, "floor", putDownFloor);
      }
      console.log(
        "Dropped item to floor",
        typeof highlightedFurniture !== "boolean",
        putDownFloor,
      );
      // grabRef.current = null;

      return;

      // no furniture highlighted: drop to floor
      // dropHeldToFloor(info.id, currentPosition);
      // grabRef.current = null;
      // return;
    }
  }, [isGrab]);

  if (!heldItem?.model) return null;
  console.log("GrabItem render", heldItem?.id);

  // const props = useMemo(() => {
  //   return {
  //     ref: groupRef,
  //     position: heldItem?.offset,
  //     foodModel: hand?.foodModel,
  //     model: models[0],
  //     baseFoodModel: models[1],
  //   };
  // }, [groupRef, heldItem?.offset, hand, models]);
  console.log("GrabItem render", hand?.id, heldItem?.rotation);

  return (
    hand &&
    hand?.id && (
      <>
        {hand.type === EGrabType.pan && (
          <ProgressBar
            id={hand.id}
            visible={true}
            position={heldItem?.offset}
            // updateFinishCook={(isFinish) => setIsFinishCook(isFinish)}
          ></ProgressBar>
        )}
        <MultiFood
          ref={groupRef}
          id={hand?.id || ""}
          position={heldItem?.offset}
          foodModel={hand?.foodModel}
          model={heldItem.model}
          rotation={rotation}
          baseFoodModel={heldItem.baseFoodModel || undefined}
        ></MultiFood>
      </>
    )

    // renderFoodModel(hand?.foodModel, models[0], models[1], )
    // <group ref={groupRef} position={heldItem?.offset}>
    //   {models.map((model) => (
    //     <primitive key={model.uuid} object={model} scale={1} />
    //   ))}
    // </group>
  );
};
export default React.memo(GrabItem);
GrabItem.displayName = "GrabItem";
