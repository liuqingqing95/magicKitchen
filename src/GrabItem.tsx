import { ObstacleInfo, useGrabObstacleStore } from "@/stores/useGrabObstacle";
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
import ModelResourceContext from "./context/ModelResourceContext";
import useBurgerAssembly from "./hooks/useBurgerAssembly";
import MultiFood from "./MultiFood";
import { useFurnitureObstacleStore } from "./stores/useFurnitureObstacle";
import {
  BaseFoodModelType,
  EFoodType,
  EFurnitureType,
  EGrabType,
  ERigidBodyType,
  IAreaType,
  IFoodWithRef,
  MultiFoodModelType,
} from "./types/level";
import {
  assembleMultiFood,
  assembleType,
  foodType,
  IAssembleMultiFoodEnable,
  IBurgerDetail,
  IPlateChangeDetail,
  isInclude,
  ISinglePlateDetail,
} from "./utils/canAssembleBurger";
import { getId, isMultiFoodModelType } from "./utils/util";

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
    const { grabModels } = useContext(ModelResourceContext);
    const {
      modelMapRef,
      grabSystemApi,
      pendingGrabIdRef,
      grabRef,
      clickGrab: { isGrab },
    } = useContext(GrabContext);

    const { heldItem, releaseItem } = grabSystemApi;
    const {
      registerObstacle,
      obstacles,
      realHighLight,
      updateObstacleInfo,
      unregisterObstacle,
      setGrabOnFurniture,
      getGrabOnFurniture,
      getObstacleInfo,
    } = useGrabObstacleStore((s) => {
      return {
        obstacles: s.obstacles,
        realHighLight: s.realHighLight,
        updateObstacleInfo: s.updateObstacleInfo,
        getObstacleInfo: s.getObstacleInfo,
        unregisterObstacle: s.unregisterObstacle,
        registerObstacle: s.registerObstacle,
        getGrabOnFurniture: s.getGrabOnFurniture,
        setGrabOnFurniture: s.setGrabOnFurniture,
      };
    });
    const {
      furniturelightId,
      unregisterFurnitureObstacle,
      getFurnitureObstacleInfo,
    } = useFurnitureObstacleStore((s) => {
      return {
        furniturelightId: s.highlightId,
        getFurnitureObstacleInfo: s.getObstacleInfo,
        unregisterFurnitureObstacle: s.unregisterObstacle,
      };
    });
    const handPositionRef = useRef(new THREE.Vector3());
    const burgerAssembly = useBurgerAssembly();
    // const prevObstacleRef = useRef<ObstacleInfo | null>(null);

    const groupRef = useRef<THREE.Group | null>(null);
    const [hand, setHand] = useState<ObstacleInfo | null>(null);

    useEffect(() => {
      const obj = getObstacleInfo(grabRef.current?.id || "") || null;
      setHand(obj);
      //   const prev = prevObstacleRef.current;
      //   if (!isEqual(grabRef.current, prev)) {
      //     const current = grabRef.current;
      //     if (!current || !prev) {
      //       setHand(getObstacleInfo(grabRef.current?.id || ""));
      //       return;
      //     }

      //     const changedKeys = Object.keys(current).filter(
      //       (key) => !isEqual(current[key], prev[key])
      //     );

      //     console.log(
      //       `grabRef ${current.id} changed keys:`,
      //       changedKeys,
      //       current.position
      //     );

      //     setHand(getObstacleInfo(grabRef.current?.id || ""));
      //   }
      //   prevObstacleRef.current = grabRef.current;
    }, [grabRef.current]);

    const models = useMemo(() => {
      if (!hand) return [];
      const arr: THREE.Group<THREE.Object3DEventMap>[] = [];

      const model1 = modelMapRef.current?.get(hand.id);
      const model2 = modelMapRef.current?.get(hand.foodModel?.id || "");
      if (model1) {
        arr.push(model1);
      }
      if (model2) {
        arr.push(model2);
      }

      return arr;
    }, [hand]);

    const highlightedFurniture = useMemo(() => {
      if (furniturelightId) {
        return getFurnitureObstacleInfo(furniturelightId) || false;
      }
      return false;
    }, [furniturelightId]);

    // Helper: 检查家具上是否可以合成汉堡并返回 partIds
    const canAssembleBurger = useCallback(() => {
      if (!realHighLight || !hand) return false;

      return assembleMultiFood(realHighLight, hand);
    }, [realHighLight, hand, highlightedFurniture]);

    const singleFoodOnPlate = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef,
      haveBurger: boolean,
      position?: [number, number, number]
    ) => {
      const foodModel = haveBurger
        ? {
            id: (deleteTarget.foodModel as MultiFoodModelType).id,
            type: (deleteTarget.foodModel as MultiFoodModelType).type,
          }
        : ({
            id: deleteTarget.id,
            // model: modelMapRef.current?.get(deleteTarget.id)?.clone(),
            type: deleteTarget.type,
          } as BaseFoodModelType);

      updateObstacleInfo(target.id || "", {
        foodModel,
        position: position || target.position,
      });
      unregisterObstacle(deleteTarget.id);
      return target.id;
    };

    const baseFoodModelCreateBurger = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef
    ) => {
      const burger = grabModels.burger.clone();
      const id = getId(ERigidBodyType.grab, EFoodType.burger, burger.uuid);

      const foodModel = {
        id: id,
        type: [
          {
            id: (target.foodModel as BaseFoodModelType).id,
            type: (target.foodModel as BaseFoodModelType).type,
          },
          {
            id: deleteTarget.id,
            type: deleteTarget.type as EFoodType,
          },
        ],
      };
      if (burger) {
        modelMapRef.current?.set(id, burger);
        updateObstacleInfo(target.id || "", {
          foodModel,
        });
        unregisterObstacle(deleteTarget.id);
        modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
        modelMapRef.current?.delete(deleteTarget.id);
        return id;
      }
    };
    const plateBurgerAddIngredient = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef,
      position?: [number, number, number]
    ) => {
      let foodModel;
      if (target.foodModel) {
        if (!isMultiFoodModelType(target.foodModel)) {
          foodModel = {
            id: (deleteTarget.foodModel as MultiFoodModelType).id,
            type: (deleteTarget.foodModel as MultiFoodModelType).type.concat({
              id: target.foodModel.id,
              type: target.foodModel.type,
            }),
          };
          modelMapRef.current?.delete(target.foodModel?.id);
        }
      } else {
        foodModel = {
          id: (deleteTarget.foodModel as MultiFoodModelType).id,
          type: (deleteTarget.foodModel as MultiFoodModelType).type,
        };
      }

      updateObstacleInfo(target.id || "", {
        foodModel,
        position,
      });
      unregisterObstacle(deleteTarget.id);
      return target.id;
    };
    const createNewBurger = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef
    ) => {
      const newFood = burgerAssembly.createNewFood(
        EFoodType.burger,
        grabModels.burger,
        "newFood",
        target.area
      )!;
      newFood.position = target.position;
      newFood.foodModel = {
        id: newFood.id,
        type: [
          {
            id: target.id,
            type: target.type,
          },
          {
            id: deleteTarget.id,
            type: deleteTarget.type,
          },
        ],
      } as MultiFoodModelType;
      registerObstacle(newFood.id, {
        ...newFood,
      });
      unregisterObstacle(target.id);
      unregisterObstacle(deleteTarget.id);
      modelMapRef.current?.delete(target.id);
      modelMapRef.current?.delete(deleteTarget.id);
      return target.id;
    };
    const bothPlateCreateBurger = (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef
    ) => {
      const burger = grabModels.burger.clone();
      const id = burger.uuid;

      const foodModel = {
        id: id,
        type: [
          {
            id: (target.foodModel as BaseFoodModelType).id,
            type: (target.foodModel as BaseFoodModelType).type,
          },
          {
            id: (otherTarget.foodModel as BaseFoodModelType).id,
            type: (otherTarget.foodModel as BaseFoodModelType).type,
          },
        ],
      };
      if (burger) {
        modelMapRef.current?.set(id, burger);
        updateObstacleInfo(target.id || "", {
          foodModel,
          area: "hand",
        });
        updateObstacleInfo(otherTarget.id || "", {
          foodModel: undefined,
        });
        modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
        modelMapRef.current?.delete(
          (otherTarget.foodModel as BaseFoodModelType).id
        );
        return target.id;
      }
    };
    const bothPlateChange = (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      position?: [number, number, number]
    ) => {
      updateObstacleInfo(target.id || "", {
        foodModel: otherTarget.foodModel,
      });
      const obj: Partial<ObstacleInfo> = {
        foodModel: target.foodModel,
        area: "hand",
        position: position || otherTarget.position,
      };
      updateObstacleInfo(otherTarget.id || "", obj);
      grabRef.current = {
        ...hand!,
        ...obj,
      };
      setHand({
        ...hand!,
        ...obj,
      });
      // prevObstacleRef.current = hand!;
      return;
    };

    const plateChangeSingleFood = (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef
    ) => {
      if (target.foodModel) {
        if (isMultiFoodModelType(target.foodModel)) {
          updateObstacleInfo(target.id || "", {
            foodModel: otherTarget.foodModel,
            // area: "hand",
          });
          updateObstacleInfo(otherTarget.id || "", {
            foodModel: target.foodModel,
          });
        } else {
          if (!otherTarget.foodModel) {
            updateObstacleInfo(target.id || "", {
              foodModel: {
                id: otherTarget.id,
                // model: modelMapRef.current?.get(otherTarget.id)!,
                type: otherTarget.type as EFoodType,
              },
            });
            const newFood = burgerAssembly.createNewFood(
              EFoodType[target.foodModel.type],
              grabModels[target.foodModel.type],
              "newFood",
              otherTarget.area
            )!;
            newFood.position = otherTarget.position;
            registerObstacle(newFood.id, {
              ...newFood,
            });
            unregisterObstacle(otherTarget.id);
            // modelMapRef.current?.delete(otherTarget.id);
            modelMapRef.current?.delete(target.foodModel.id);
          }
        }
        return target.id;
      }
    };
    const burgerAddIngredient = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef
    ) => {
      let foodModel;
      if (target.foodModel && isMultiFoodModelType(target.foodModel)) {
        if (deleteTarget.foodModel) {
          if (!isMultiFoodModelType(deleteTarget.foodModel)) {
            foodModel = {
              id: target.foodModel.id,
              type: target.foodModel.type.concat({
                id: deleteTarget.id,
                type: deleteTarget.foodModel.type,
              }),
            };
            unregisterObstacle(deleteTarget.foodModel.id);
            modelMapRef.current?.delete(deleteTarget.foodModel.id);
          }
        } else {
          foodModel = {
            id: target.foodModel.id,
            type: target.foodModel.type.concat({
              id: deleteTarget.id,
              type: deleteTarget.type as EFoodType,
            }),
          };
          unregisterObstacle(deleteTarget.id);
          modelMapRef.current?.delete(deleteTarget.id);
        }
      }

      updateObstacleInfo(target.id || "", {
        foodModel,
      });

      // if (foodType(deleteTarget) === EMultiFoodType.normalFood) {
      //   unregisterObstacle(deleteTarget.id);
      //   modelMapRef.current?.delete(deleteTarget.id);
      // } else {
      //   unregisterObstacle(
      //     (deleteTarget.foodModel as MultiFoodModelType).id || ""
      //   );
      //   modelMapRef.current?.delete(
      //     (deleteTarget.foodModel as MultiFoodModelType).id
      //   );
      // }
      return target.id;
    };
    // Helper: 使用 assembly（优先 store）合成汉堡并更新本地 foods
    const assembleAndUpdateUI = useCallback(
      (possible: IAssembleMultiFoodEnable) => {
        if (!realHighLight || !hand) return false;
        const callWithDebug = (
          name: string,
          notes: string,
          possible: IAssembleMultiFoodEnable,
          fn: () => any
        ) => {
          try {
            console.log(
              "[assemble]",
              assembleType(realHighLight, hand),
              name,
              notes,
              possible
            );
          } catch (e) {}
          return fn();
        };
        if (possible.type === "singleFoodOnPlate") {
          const haveBurger = (possible as ISinglePlateDetail).haveBurger;
          if (realHighLight.type === EGrabType.plate) {
            // 2,4
            return callWithDebug("singleFoodOnPlate", "2,4", possible, () =>
              singleFoodOnPlate(realHighLight, hand, haveBurger)
            );
          } else {
            // 1,3
            return callWithDebug("singleFoodOnPlate", "1,3", possible, () =>
              singleFoodOnPlate(hand, realHighLight, haveBurger, putDownPos)
            );
          }
        } else if (possible.type === "multiBurger") {
          const detail = possible as IBurgerDetail;
          if (
            detail.plate === "highlighted" &&
            isInclude(foodType(hand), "plate")
          ) {
            // 11,12,
            return callWithDebug(
              "bothPlateCreateBurger",
              "11,12",
              possible,
              () => bothPlateCreateBurger(hand, realHighLight)
            );
          }
          if (detail.plate === false) {
            // 1,2 共 12
            // 只有普通食物和汉堡片
            if (detail.bread === "hand") {
              return callWithDebug("createNewBurger", "1", detail, () =>
                createNewBurger(hand, realHighLight)
              );
            } else if (detail.bread === "highlighted") {
              return callWithDebug("createNewBurger", "2", detail, () =>
                createNewBurger(realHighLight, hand)
              );
            } else {
              if (detail.burger === "hand") {
                // 14,15,18
                return callWithDebug(
                  "burgerAddIngredient",
                  "14,15,18",
                  detail,
                  () => burgerAddIngredient(hand, realHighLight)
                );
              } else {
                // 13,17
                return callWithDebug(
                  "burgerAddIngredient",
                  "13,17",
                  detail,
                  () => burgerAddIngredient(realHighLight, hand)
                );
              }
            }
          } else if (detail.plate === "hand") {
            if (detail.burger === false) {
              // 3,5
              return callWithDebug(
                "baseFoodModelCreateBurger",
                "3,5",
                detail,
                () => baseFoodModelCreateBurger(hand, realHighLight)
              );
            } else {
              // 7,9
              return callWithDebug(
                "plateBurgerAddIngredient",
                "7,9",
                detail,
                () => plateBurgerAddIngredient(hand, realHighLight, putDownPos)
              );
            }
          } else {
            if (detail.burger === "hand") {
              //8,10
              return callWithDebug(
                "plateBurgerAddIngredient",
                "8,10",
                detail,
                () => plateBurgerAddIngredient(realHighLight, hand, putDownPos)
              );
            } else if (detail.burger === false) {
              // 4,6
              return callWithDebug(
                "baseFoodModelCreateBurger",
                "4,6",
                detail,
                () => baseFoodModelCreateBurger(realHighLight, hand)
              );
            } else if (detail.burger === "highlighted") {
              // 16
              return callWithDebug("burgerAddIngredient", "16", detail, () =>
                burgerAddIngredient(realHighLight, hand)
              );
            }
          }
        } else {
          const detail = possible as IPlateChangeDetail;
          if (
            detail.plate === "highlighted" &&
            isInclude(foodType(hand), "plate")
          ) {
            // 5,6, 7,8,9,10,11
            return callWithDebug(
              "bothPlateChange",
              "5,6, 7,8,9,10,11",
              detail,
              () => bothPlateChange(realHighLight, hand, putDownPos)
            );
          }
          if (detail.plate === "hand") {
            //2,4
            return callWithDebug("plateChangeSingleFood", "2,4", detail, () =>
              plateChangeSingleFood(hand, realHighLight)
            );
          } else if (detail.plate === "highlighted") {
            //1,3
            return callWithDebug("plateChangeSingleFood", "1,3", detail, () =>
              plateChangeSingleFood(realHighLight, hand)
            );
          }
        }
        return true;
      },
      [burgerAssembly, grabModels.burger, hand, realHighLight]
    );

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
    const dropHeld = useCallback(
      (infoId: string, area: IAreaType, pos: [number, number, number]) => {
        // updateObstaclePosition(infoId, pos, undefined);
        updateObstacleInfo(infoId, {
          position: pos,
          area,
        });
        try {
          releaseItem();
        } catch (e) {}
      },
      [updateObstacleInfo, releaseItem]
    );

    const putDownPos = useMemo(() => {
      // const model = modelMapRef.current?.get(grabRef.current?.id || "");
      // // const rigidBody = rigidBodyMapRef.current.get(grabRef.current?.id || "");
      if (!groupRef.current || !playerRef.current) return;
      if (highlightedFurniture) {
        const obj = getGrabOnFurniture(highlightedFurniture.id);
        console.log(
          obj,
          highlightedFurniture.id,
          // pos,
          highlightedFurniture,
          "dropHeld to furniture"
        );
        if (!obj) {
          let pos = [0, 0, 0] as [number, number, number];
          pos[0] = highlightedFurniture.position[0];
          pos[1] = 1;
          pos[2] = highlightedFurniture.position[2];

          return pos;
        }
      }
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

    useEffect(() => {
      if (isHolding) {
        // Simplified release flow using helpers. Preserve trash handling.

        if (!hand || !putDownPos) return;

        // If furniture highlighted handle trash / assembly / place / drop

        if (
          highlightedFurniture &&
          highlightedFurniture.type === EFurnitureType.trash
        ) {
          unregisterObstacle(hand.id);
          // takeOutFood((prev) => prev.filter((item) => item.id !== info.id));
          unregisterFurnitureObstacle(hand.id);
          // unregisterObstacle(info.id);
          grabRef.current = null;
          return;
        }

        // 1) Try assembly
        let obstacleId = heldItem!.id;
        const possible = canAssembleBurger();
        console.log(possible, "canAssembleBurger");
        if (possible) {
          const did = assembleAndUpdateUI(possible);
          if (did) {
            if (typeof did === "string") {
              obstacleId = did;
            }
            try {
              releaseItem();
            } catch (e) {}
            grabRef.current = null;
            return;
          }
        }

        if (highlightedFurniture) {
          if (!getGrabOnFurniture(highlightedFurniture.id)) {
            dropHeld(hand.id, "table", putDownPos);
            if (obstacleId) {
              setGrabOnFurniture(highlightedFurniture.id, obstacleId);
            }
          }
          return;
        } else {
          dropHeld(hand.id, "floor", putDownPos);
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
          position={heldItem?.offset}
          foodModel={hand?.foodModel}
          model={models[0]}
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
  }
);
export default React.memo(GrabItem);
GrabItem.displayName = "GrabItem";
