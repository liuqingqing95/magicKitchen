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
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "./stores/useFurnitureObstacle";
import {
  BaseFoodModelType,
  EFoodType,
  EFurnitureType,
  EGrabType,
  ERigidBodyType,
  IAreaType,
  IFoodWithRef,
  IMultiType,
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
} from "./utils/canAssembleBurger";
import { getId, isMultiFoodModelType } from "./utils/util";
type IAssembleRes =
  | {
      putOnTable: string;
      leaveGrab: boolean;
      takeOffTable?: string;
    }
  | undefined;

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
    }, [grabRef.current]);

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
      leaveGrab: boolean,
      position?: [number, number, number],
    ) => {
      const foodModel: BaseFoodModelType = {
        id: deleteTarget.id,
        // model: modelMapRef.current?.get(deleteTarget.id)?.clone(),
        type: deleteTarget.type as EFoodType,
      };
      const info: Partial<ObstacleInfo> = {
        foodModel,
      };
      if (position) {
        info.position = position;
      }
      if (!leaveGrab) {
        updateHand({
          ...target,
          ...info,
        });
      }
      updateObstacleInfo(target.id || "", info);
      unregisterObstacle(deleteTarget.id);
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab,
      };
    };

    const baseFoodModelCreateBurger = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef,
      leaveGrab: boolean,
      position?: [number, number, number],
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
        const info: Partial<ObstacleInfo> = {
          foodModel,
        };
        if (position) {
          info.position = position;
        }
        updateObstacleInfo(target.id || "", info);
        if (!leaveGrab) {
          updateHand({
            ...target,
            ...info,
          });
        }
        unregisterObstacle(deleteTarget.id);
        modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
        modelMapRef.current?.delete(deleteTarget.id);
        return {
          putOnTable: highlightedFurniture ? target.id : "",
          leaveGrab,
        };
      }
    };
    const plateBurgerAddIngredient = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef,
      leaveGrab: boolean,
      position?: [number, number, number],
    ) => {
      let foodModel: MultiFoodModelType;
      if (target.foodModel) {
        if (isMultiFoodModelType(target.foodModel)) {
          foodModel = {
            id: target.foodModel.id,
            type: [
              ...target.foodModel.type,
              {
                id: deleteTarget.id,
                type: deleteTarget.type,
              } as IMultiType,
            ],
          };
          modelMapRef.current?.delete(deleteTarget.id);
        } else {
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
      const info: Partial<ObstacleInfo> = {
        foodModel,
      };
      if (position) {
        info.position = position;
      }
      if (!leaveGrab) {
        updateHand({
          ...target,
          ...info,
        });
      }
      updateObstacleInfo(target.id || "", info);
      unregisterObstacle(deleteTarget.id);
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab,
      };
    };
    const createNewBurger = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef,
      leaveGrab: boolean,
      position?: [number, number, number],
    ) => {
      const newFood = burgerAssembly.createNewFood(
        EFoodType.burger,
        grabModels.burger,
        "newFood",
        target.area,
      )!;
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

      if (position) {
        newFood.position = position;
      }

      registerObstacle(newFood.id, newFood);
      if (!leaveGrab) {
        updateHand(newFood);
      }
      unregisterObstacle(target.id);
      unregisterObstacle(deleteTarget.id);
      modelMapRef.current?.delete(target.id);
      modelMapRef.current?.delete(deleteTarget.id);
      return {
        putOnTable: highlightedFurniture ? newFood.id : "",
        leaveGrab,
      };
    };
    const updateHand = (obj: IFoodWithRef) => {
      grabRef.current = obj;
      grabItem(obj, null);
      setHand(obj);
    };
    const bothPlateCreateBurger = (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      position?: [number, number, number],
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
          position,
        });
        updateObstacleInfo(otherTarget.id || "", {
          foodModel: undefined,
        });
        updateHand({
          ...otherTarget,
          foodModel: undefined,
        });
        modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
        modelMapRef.current?.delete(
          (otherTarget.foodModel as BaseFoodModelType).id,
        );

        return {
          putOnTable: highlightedFurniture ? target.id : "",
          leaveGrab: false,
        };
      }
    };
    const bothPlateChange = (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      leaveGrab: boolean,
      position?: [number, number, number],
    ) => {
      updateObstacleInfo(target.id || "", {
        foodModel: otherTarget.foodModel,
      });
      const obj: Partial<ObstacleInfo> = {
        foodModel: target.foodModel,
      };
      if (position) {
        obj.position = position;
      }
      updateObstacleInfo(otherTarget.id || "", obj);
      updateHand({
        ...hand!,
        ...obj,
      });
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab,
      };
    };

    const plateChangeSingleFood = (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      leaveGrab: boolean,
      position?: [number, number, number],
    ) => {
      if (target.foodModel) {
        if (isMultiFoodModelType(target.foodModel)) {
          const info: Partial<ObstacleInfo> = {
            foodModel: otherTarget.foodModel,
          };
          if (position) {
            info.position = position;
          }
          updateObstacleInfo(target.id || "", info);
          if (!leaveGrab) {
            updateHand({
              ...target,
              ...info,
            });
          }
          updateObstacleInfo(otherTarget.id || "", {
            foodModel: target.foodModel,
          });
          return {
            putOnTable: highlightedFurniture ? target.id : "",
            leaveGrab,
          };
        } else {
          if (!otherTarget.foodModel) {
            updateObstacleInfo(target.id || "", {
              foodModel: {
                id: otherTarget.id,
                // model: modelMapRef.current?.get(otherTarget.id)!,
                type: otherTarget.type as EFoodType,
              },
              position,
            });
            const newFood = burgerAssembly.createNewFood(
              EFoodType[target.foodModel.type],
              grabModels[target.foodModel.type],
              "newFood",
              otherTarget.area,
            )!;
            newFood.position = otherTarget.position;
            if (!leaveGrab) {
              updateHand(newFood);
            }
            registerObstacle(newFood.id, {
              ...newFood,
            });
            unregisterObstacle(otherTarget.id);
            // modelMapRef.current?.delete(otherTarget.id);
            modelMapRef.current?.delete(target.foodModel.id);
            return {
              putOnTable: highlightedFurniture ? newFood.id : "",
              leaveGrab,
            };
          }
        }
      }
    };
    const burgerAddIngredient = (
      target: IFoodWithRef,
      deleteTarget: IFoodWithRef,
      leaveGrab: boolean,
      position?: [number, number, number],
    ) => {
      let foodModel;
      let putOnTable = target.id;
      let takeOffTable = deleteTarget.id;
      if (target.foodModel && isMultiFoodModelType(target.foodModel)) {
        if (deleteTarget.foodModel) {
          if (!isMultiFoodModelType(deleteTarget.foodModel)) {
            foodModel = {
              id: target.foodModel.id,
              type: target.foodModel.type.concat({
                id: deleteTarget.foodModel.id,
                type: deleteTarget.foodModel.type,
              }),
            };
            putOnTable = deleteTarget.id;
            takeOffTable = target.id;
            updateObstacleInfo(deleteTarget.id || "", {
              foodModel: undefined,
              position: target.position,
            });
            // unregisterObstacle(deleteTarget.foodModel.id);
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
          putOnTable = target.id;
          unregisterObstacle(deleteTarget.id);
          modelMapRef.current?.delete(deleteTarget.id);
        }
      }
      const info: Partial<ObstacleInfo> = {
        foodModel,
      };
      if (position) {
        info.position = position;
      }
      updateObstacleInfo(target.id || "", info);

      if (!leaveGrab) {
        updateHand({
          ...target,
          ...info,
        });
      }

      return {
        putOnTable: highlightedFurniture ? putOnTable : "",
        takeOffTable: takeOffTable,
        leaveGrab,
      };
    };

    // Helper: 使用 assembly（优先 store）合成汉堡并更新本地 foods
    const assembleAndUpdateUI = useCallback(
      (possible: IAssembleMultiFoodEnable) => {
        if (!realHighLight || !hand) return false;
        const callWithDebug = (
          name: string,
          notes: string,
          possible: IAssembleMultiFoodEnable,
          fn: () => IAssembleRes,
        ) => {
          const info = fn();
          console.log(
            "[assemble]",
            assembleType(realHighLight, hand),
            name,
            notes,
            possible,
            info,
          );

          // if (putDownPos?.area === "table") {}
          return info;
        };
        if (possible.type === "singleFoodOnPlate") {
          if (realHighLight.type === EGrabType.plate) {
            // 2,4
            return callWithDebug("singleFoodOnPlate", "2,4", possible, () =>
              singleFoodOnPlate(
                realHighLight,
                hand,
                true,
                realHighLight.position,
              ),
            );
          } else {
            // 1,3
            return callWithDebug("singleFoodOnPlate", "1,3", possible, () =>
              singleFoodOnPlate(hand, realHighLight, false),
            );
          }
        } else if (possible.type === "multiBurger") {
          const detail = possible as IBurgerDetail;
          if (
            detail.plate === "highlighted" &&
            isInclude(foodType(hand), "plate")
          ) {
            if (detail.burger === false) {
              // 11,12
              return callWithDebug(
                "bothPlateCreateBurger",
                "11,12",
                possible,
                () =>
                  bothPlateCreateBurger(
                    realHighLight,
                    hand,
                    realHighLight.position,
                  ),
              );
            } else {
              if (detail.burger === "hand") {
                // 18

                return callWithDebug(
                  "burgerAddIngredient",
                  "18",
                  possible,
                  () => burgerAddIngredient(hand, realHighLight, false),
                );
              } else {
                // 17
                return callWithDebug(
                  "burgerAddIngredient",
                  "17",
                  possible,
                  () =>
                    burgerAddIngredient(
                      realHighLight,
                      hand,
                      false,
                      realHighLight.position,
                    ),
                );
              }
            }
          }
          if (detail.plate === false) {
            // 1,2,13,14

            // 1,2 共 12
            // 只有普通食物和汉堡片
            if (detail.bread === "hand") {
              return callWithDebug("createNewBurger", "1", detail, () =>
                createNewBurger(hand, realHighLight, false),
              );
            } else if (detail.bread === "highlighted") {
              return callWithDebug("createNewBurger", "2", detail, () =>
                createNewBurger(
                  realHighLight,
                  hand,
                  true,
                  realHighLight.position,
                ),
              );
            } else {
              if (detail.burger === "hand") {
                // 14
                return callWithDebug("burgerAddIngredient", "14", detail, () =>
                  burgerAddIngredient(hand, realHighLight, false),
                );
              } else {
                // 13
                return callWithDebug("burgerAddIngredient", "13", detail, () =>
                  burgerAddIngredient(
                    realHighLight,
                    hand,
                    true,
                    realHighLight.position,
                  ),
                );
              }
            }
          } else if (detail.plate === "hand") {
            // 3,5,7,9,15,

            if (detail.burger === false) {
              // 3,5
              return callWithDebug(
                "baseFoodModelCreateBurger",
                "3,5",
                detail,
                () => baseFoodModelCreateBurger(hand, realHighLight, false),
              );
            } else {
              // 7,9,15
              return callWithDebug(
                "plateBurgerAddIngredient",
                "7,9,15",
                detail,
                () => plateBurgerAddIngredient(hand, realHighLight, false),
              );
            }
          } else {
            // 4,6,8,10,16

            if (detail.burger === "hand") {
              //8,10
              return callWithDebug(
                "plateBurgerAddIngredient",
                "8,10",
                detail,
                () =>
                  plateBurgerAddIngredient(
                    realHighLight,
                    hand,
                    true,
                    realHighLight.position,
                  ),
              );
            } else if (detail.burger === false) {
              // 4,6
              return callWithDebug(
                "baseFoodModelCreateBurger",
                "4,6",
                detail,
                () =>
                  baseFoodModelCreateBurger(
                    realHighLight,
                    hand,
                    true,
                    realHighLight.position,
                  ),
              );
            } else if (detail.burger === "highlighted") {
              // 16
              return callWithDebug("burgerAddIngredient", "16", detail, () =>
                burgerAddIngredient(
                  realHighLight,
                  hand,
                  true,
                  realHighLight.position,
                ),
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
              () =>
                bothPlateChange(
                  realHighLight,
                  hand,
                  false,
                  realHighLight.position,
                ),
            );
          }
          // 1,2,3,4
          if (detail.plate === "hand") {
            //2,4
            return callWithDebug("plateChangeSingleFood", "2,4", detail, () =>
              plateChangeSingleFood(hand, realHighLight, false),
            );
          } else if (detail.plate === "highlighted") {
            //1,3
            return callWithDebug("plateChangeSingleFood", "1,3", detail, () =>
              plateChangeSingleFood(
                realHighLight,
                hand,
                true,
                realHighLight.position,
              ),
            );
          }
        }
        // return true;
      },
      [burgerAssembly, grabModels.burger, hand, realHighLight],
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
      (infoId: string, area: IAreaType, pos?: [number, number, number]) => {
        // updateObstaclePosition(infoId, pos, undefined);
        const info: Partial<ObstacleInfo> = {
          area,
        };
        if (pos) {
          info.position = pos;
        }
        updateObstacleInfo(infoId, info);
        try {
          releaseItem();
        } catch (e) {}
      },
      [updateObstacleInfo, releaseItem],
    );
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
      if (highlightedFurniture) {
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

    useEffect(() => {
      if (isHolding) {
        // Simplified release flow using helpers. Preserve trash handling.

        if (!hand) return;

        // If furniture highlighted handle trash / assembly / place / drop

        if (
          highlightedFurniture &&
          highlightedFurniture.type === EFurnitureType.trash
        ) {
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

        if (highlightedFurniture) {
          if (!getGrabOnFurniture(highlightedFurniture.id)) {
            dropHeld(hand.id, "table", putDownTable);
            setGrabOnFurniture(highlightedFurniture.id, hand.id);
          }
          return;
        } else {
          dropHeld(hand.id, "floor", putDownFloor);
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
