import { GrabContext } from "@/context/GrabContext";
import * as THREE from "three";

import { foodData } from "@/constant/data";
import ModelResourceContext from "@/context/ModelResourceContext";
import { useFurnitureObstacleStore } from "@/stores/useFurnitureObstacle";
import useGrabObstacleStore, { ObstacleInfo } from "@/stores/useGrabObstacle";
import {
  BaseFoodModelType,
  EFoodType,
  EGrabType,
  ERigidBodyType,
  IAreaType,
  IFoodWithRef,
  IMultiType,
  MultiFoodModelType,
} from "@/types/level";
import {
  assembleType,
  foodType,
  IAssembleMultiFoodEnable,
  IBurgerDetail,
  IPlateChangeDetail,
  isInclude,
} from "@/utils/canAssembleBurger";
import {
  createFoodData,
  createFoodItem,
  foodTableData,
  getId,
  isMultiFoodModelType,
} from "@/utils/util";
import { useCallback, useContext, useMemo, useState } from "react";

export interface AssembleResult {
  newId: string;
  deleteIds: string[];
  dePositId: string;
}
type IAssembleRes =
  | {
      putOnTable: string;
      leaveGrab: boolean;
      takeOffTable?: string;
    }
  | undefined;

export default function useBurgerAssembly() {
  const [hand, setHand] = useState<ObstacleInfo | null>(null);

  const {
    modelMapRef,
    grabSystemApi,
    pendingGrabIdRef,
    grabRef,
    clickGrab: { isGrab },
  } = useContext(GrabContext);
  const { grabModels } = useContext(ModelResourceContext);

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

  const highlightedFurniture = useMemo(() => {
    if (furniturelightId) {
      return getFurnitureObstacleInfo(furniturelightId) || false;
    }
    return false;
  }, [furniturelightId]);

  const dropHeld = useCallback(
    (
      infoId: string,
      area: IAreaType,
      pos?: [number, number, number],
      rotation?: THREE.Euler,
    ) => {
      // updateObstaclePosition(infoId, pos, undefined);
      const info: Partial<ObstacleInfo> = {
        area,
      };
      if (pos) {
        info.position = pos;
      }
      if (rotation) {
        // info.rotation = [rotation.x, rotation.y, rotation.z];
      }
      updateObstacleInfo(infoId, info);
      try {
        releaseItem();
      } catch (e) {}
    },
    [updateObstacleInfo, releaseItem],
  );

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
    const newFood = createNewFood(
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
          const newFood = createNewFood(
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

  const createNewFood = useCallback(
    (
      foodType: EFoodType,
      model: THREE.Group,
      belong: "foodTable" | "newFood",
      area?: IAreaType,
    ) => {
      let foodInfo;
      if (belong === "newFood") {
        const info = foodData.find((f) => f.type === foodType);
        if (!info) {
          return;
        }
        foodInfo = createFoodData(foodType, info, info.position);
      } else {
        foodInfo = foodTableData(foodType);
      }

      const newFood = createFoodItem(
        { ...foodInfo, visible: false },
        model,
        false,
        modelMapRef,
      );
      pendingGrabIdRef.current = newFood.id;
      newFood.area = area;
      return newFood;
    },
    [modelMapRef, pendingGrabIdRef],
  );

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

              return callWithDebug("burgerAddIngredient", "18", possible, () =>
                burgerAddIngredient(hand, realHighLight, false),
              );
            } else {
              // 17
              return callWithDebug("burgerAddIngredient", "17", possible, () =>
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
    [grabModels.burger, hand, realHighLight],
  );

  return {
    createNewFood,
    assembleAndUpdateUI,
    hand,
    setHand,
    highlightedFurniture,
    dropHeld,
  };
}
