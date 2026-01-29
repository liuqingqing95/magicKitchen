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
    }
  | undefined;

export default function useBurgerAssembly() {
  const [hand, setHand] = useState<ObstacleInfo | null>(null);

  const { modelMapRef, grabSystemApi, pendingGrabIdRef, grabRef } =
    useContext(GrabContext);
  const { grabModels } = useContext(ModelResourceContext);

  const { heldItem, releaseItem, grabItem } = grabSystemApi;
  // const { hand } = heldItem || { hand: null };
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
    (infoId: string, area: IAreaType, pos?: [number, number, number]) => {
      // updateObstaclePosition(infoId, pos, undefined);
      const info: Partial<ObstacleInfo> = {
        area,
        visible: false,
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

  const singleFoodOnPlate = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    if (target.type === EGrabType.plate) {
      const foodModel: BaseFoodModelType = {
        id: otherTarget.id,
        // model: modelMapRef.current?.get(otherTarget.id)?.clone(),
        type: otherTarget.type as EFoodType,
      };

      const info: Partial<ObstacleInfo> = {
        foodModel,
        position: target.position,
      };
      updateObstacleInfo(target.id || "", info);

      unregisterObstacle(otherTarget.id);
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab,
      };
    } else {
      const foodModel: BaseFoodModelType = {
        id: target.id,
        type: target.type as EFoodType,
      };

      const info: Partial<ObstacleInfo> = {
        foodModel,
        position: target.position,
      };
      updateObstacleInfo(otherTarget.id || "", info);
      unregisterObstacle(target.id);
      return {
        putOnTable: highlightedFurniture ? otherTarget.id : "",
        leaveGrab,
      };
    }
  };

  const baseFoodModelCreateBurger = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    const burger = grabModels.burger.clone();
    const id = getId(ERigidBodyType.grab, EFoodType.burger, burger.uuid);
    if (target.foodModel) {
      //4,6
      const foodModel = {
        id: id,
        type: [
          {
            id: (target.foodModel as BaseFoodModelType).id,
            type: (target.foodModel as BaseFoodModelType).type,
          },
          {
            id: otherTarget.id,
            type: otherTarget.type as EFoodType,
          },
        ],
      };
      if (burger) {
        modelMapRef.current?.set(id, burger);
        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };

        updateObstacleInfo(target.id || "", info);
        if (!leaveGrab) {
          updateHand({
            ...target,
            ...info,
          });
        }
        unregisterObstacle(otherTarget.id);
        modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
        modelMapRef.current?.delete(otherTarget.id);
      }
    } else {
      //3,5
      const foodModel = {
        id: id,
        type: [
          {
            id: (otherTarget.foodModel as BaseFoodModelType).id,
            type: (otherTarget.foodModel as BaseFoodModelType).type,
          },
          {
            id: target.id,
            type: target.type as EFoodType,
          },
        ],
      };
      if (burger) {
        modelMapRef.current?.set(id, burger);
        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };

        updateObstacleInfo(otherTarget.id || "", info);
        unregisterObstacle(target.id);
        modelMapRef.current?.delete(
          (otherTarget.foodModel as BaseFoodModelType).id,
        );
        modelMapRef.current?.delete(target.id);
      }
    }

    return {
      putOnTable: highlightedFurniture ? target.id : "",
      leaveGrab,
    };
  };
  const plateBurgerAddIngredient = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    let foodModel: MultiFoodModelType;
    if (target.foodModel) {
      if (isMultiFoodModelType(target.foodModel)) {
        if (otherTarget.foodModel) {
          // 9
          foodModel = {
            id: target.foodModel.id,
            type: target.foodModel.type.concat({
              id: otherTarget.foodModel.id,
              type: (otherTarget.foodModel as BaseFoodModelType).type,
            }),
          };
          const info: Partial<ObstacleInfo> = {
            foodModel,
            position: target.position,
          };

          // unregisterObstacle(target.id);
          updateObstacleInfo(target.id || "", info);
          updateObstacleInfo(otherTarget.id || "", {
            foodModel: undefined,
          });
          updateHand({
            ...otherTarget,
            foodModel: undefined,
          });
          modelMapRef.current?.delete(otherTarget.foodModel.id);
          return {
            putOnTable: highlightedFurniture ? target.id : "",
            leaveGrab: false,
          };
        } else {
          // 7
          const burger = grabModels.burger.clone();
          const id = getId(ERigidBodyType.grab, EFoodType.burger, burger.uuid);

          foodModel = {
            id,
            type: target.foodModel.type,
          };
          const info: Partial<ObstacleInfo> = {
            foodModel,
            position: target.position,
          };

          unregisterObstacle(target.id);
          updateObstacleInfo(otherTarget.id || "", info);
          modelMapRef.current?.delete(target.id);
          modelMapRef.current?.set(id, burger);
          return {
            putOnTable: highlightedFurniture ? target.id : "",
            leaveGrab,
          };
        }
      } else {
        //10
        foodModel = {
          id: (otherTarget.foodModel as MultiFoodModelType).id,
          type: (otherTarget.foodModel as MultiFoodModelType).type.concat({
            id: target.foodModel.id,
            type: target.foodModel.type,
          }),
        };
        modelMapRef.current?.delete(target.foodModel?.id);
        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };

        updateObstacleInfo(target.id || "", info);
        unregisterObstacle(otherTarget.id);
        return {
          putOnTable: highlightedFurniture ? target.id : "",
          leaveGrab: true,
        };
      }
    } else {
      //8, 15
      if (isInclude(foodType(otherTarget), "plate")) {
        //15
        foodModel = {
          id: (otherTarget.foodModel as MultiFoodModelType).id,
          type: (otherTarget.foodModel as MultiFoodModelType).type.concat({
            id: target.id,
            type: target.type as EFoodType,
          }),
        };
        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };

        updateObstacleInfo(otherTarget.id || "", info);
        unregisterObstacle(target.id);
        return {
          putOnTable: highlightedFurniture ? otherTarget.id : "",
          leaveGrab: true,
        };
      } else {
        // 8
        foodModel = {
          id: (otherTarget.foodModel as MultiFoodModelType).id,
          type: (otherTarget.foodModel as MultiFoodModelType).type,
        };
        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };

        updateObstacleInfo(target.id || "", info);
        unregisterObstacle(otherTarget.id);
        return {
          putOnTable: highlightedFurniture ? target.id : "",
          leaveGrab: true,
        };
      }
    }
  };
  const createNewBurger = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
    leaveGrab: boolean,
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
          id: otherTarget.id,
          type: otherTarget.type,
        },
      ],
    } as MultiFoodModelType;

    newFood.position = target.position;

    registerObstacle(newFood.id, newFood);
    if (!leaveGrab) {
      updateHand(newFood);
    }
    unregisterObstacle(target.id);
    unregisterObstacle(otherTarget.id);
    modelMapRef.current?.delete(target.id);
    modelMapRef.current?.delete(otherTarget.id);
    return {
      putOnTable: highlightedFurniture ? newFood.id : "",
      leaveGrab,
    };
  };
  const updateHand = (obj: IFoodWithRef) => {
    // grabRef.current = obj;
    setHand(obj);
    grabItem({
      food: obj,
      model: null,
      baseFoodModel: null,
    });
  };
  const bothPlateCreateBurger = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
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
        position: target.position,
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
  const bothPlateChange = (target: IFoodWithRef, otherTarget: IFoodWithRef) => {
    if (target.foodModel) {
      // 1,3,5
      updateObstacleInfo(target.id || "", {
        foodModel: undefined,
      });
      let info: Partial<ObstacleInfo> = {};
      info.foodModel = target.foodModel;
      updateObstacleInfo(otherTarget.id || "", {
        foodModel: target.foodModel,
      });
      updateHand({
        ...otherTarget,
        ...info,
      });
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab: false,
      };
    } else {
      // 2,4,6
      updateObstacleInfo(target.id || "", {
        foodModel: otherTarget.foodModel,
      });

      updateHand({
        ...otherTarget,
        foodModel: undefined,
      });
      updateObstacleInfo(otherTarget.id || "", {
        foodModel: undefined,
      });
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab: false,
      };
    }

    // const obj: Partial<ObstacleInfo> = {
    //   foodModel: target.foodModel,
    // };

    // updateHand({
    //   ...hand!,
    //   ...obj,
    // });
  };

  const plateAddMultiNormalFood = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
    leaveGrab: boolean,
    position?: [number, number, number],
  ) => {
    console.warn("缺少模型待完善");
    return {
      putOnTable: highlightedFurniture ? target.id : "",
      leaveGrab: true,
    };
    // if (target.foodModel) {
    //   if (isMultiFoodModelType(target.foodModel) === false)  {
    //     if (!otherTarget.foodModel) {
    //       updateObstacleInfo(target.id || "", {
    //         foodModel: {
    //           id: otherTarget.id,
    //           // model: modelMapRef.current?.get(otherTarget.id)!,
    //           type: otherTarget.type as EFoodType,
    //         },
    //         position,
    //       });
    //       const newFood = createNewFood(
    //         EFoodType[target.foodModel.type],
    //         grabModels[target.foodModel.type],
    //         "newFood",
    //         otherTarget.area,
    //       )!;
    //       newFood.position = otherTarget.position;
    //       if (!leaveGrab) {
    //         updateHand(newFood);
    //       }
    //       registerObstacle(newFood.id, {
    //         ...newFood,
    //       });
    //       unregisterObstacle(otherTarget.id);
    //       // modelMapRef.current?.delete(otherTarget.id);
    //       modelMapRef.current?.delete(target.foodModel.id);
    //       return {
    //         putOnTable: highlightedFurniture ? newFood.id : "",
    //         leaveGrab,
    //       };
    //     }
    //   }
    // } else {

    // }
  };
  const burgerAddIngredient = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    let foodModel;
    let putOnTable = target.id;
    if (target.foodModel) {
      if (isMultiFoodModelType(target.foodModel)) {
        if (otherTarget.foodModel) {
          if (!isMultiFoodModelType(otherTarget.foodModel)) {
            //17
            foodModel = {
              id: target.foodModel.id,
              type: target.foodModel.type.concat({
                id: otherTarget.foodModel.id,
                type: otherTarget.foodModel.type,
              }),
            };
            putOnTable = target.id;
            updateObstacleInfo(otherTarget.id || "", {
              foodModel: undefined,
              position: target.position,
            });
            // unregisterObstacle(otherTarget.foodModel.id);
            modelMapRef.current?.delete(otherTarget.foodModel.id);
          }
        } else {
          //16,13
          foodModel = {
            id: target.foodModel.id,
            type: target.foodModel.type.concat({
              id: otherTarget.id,
              type: otherTarget.type as EFoodType,
            }),
          };
          // putOnTable = target.id;
          unregisterObstacle(otherTarget.id);
          modelMapRef.current?.delete(otherTarget.id);
        }
        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };

        if (!leaveGrab) {
          updateHand({
            ...otherTarget,
            foodModel: undefined,
          });
        }
        updateObstacleInfo(target.id || "", info);
      } else {
        //18
        foodModel = {
          id: (otherTarget.foodModel as MultiFoodModelType).id,
          type: (otherTarget.foodModel as MultiFoodModelType).type.concat({
            id: target.foodModel.id,
            type: target.foodModel.type,
          }),
        };
        updateObstacleInfo(otherTarget.id, {
          foodModel: undefined,
        });
        modelMapRef.current?.delete(target.foodModel.id);
        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };

        if (!leaveGrab) {
          updateHand({
            ...otherTarget,
            foodModel: undefined,
          });
        }
        updateObstacleInfo(target.id || "", info);
      }
    } else {
      // 14
      foodModel = {
        id: (otherTarget.foodModel as MultiFoodModelType).id,
        type: (otherTarget.foodModel as MultiFoodModelType).type.concat({
          id: target.id,
          type: target.type as EFoodType,
        }),
      };
      updateObstacleInfo(otherTarget.id || "", {
        foodModel,
        position: target.position,
      });
      unregisterObstacle(target.id);
      modelMapRef.current?.delete(target.id);
    }

    return {
      putOnTable: highlightedFurniture ? putOnTable : "",
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

      pendingGrabIdRef.current = belong === "foodTable" ? newFood.id : null;
      newFood.area = area;
      newFood.visible = true;
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
            singleFoodOnPlate(realHighLight, hand, true),
          );
        } else {
          // 1,3
          return callWithDebug("singleFoodOnPlate", "1,3", possible, () =>
            singleFoodOnPlate(realHighLight, hand, true),
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
              () => bothPlateCreateBurger(realHighLight, hand),
            );
          } else {
            if (detail.burger) {
              // 17,18

              return callWithDebug(
                "burgerAddIngredient",
                "17,18",
                possible,
                () => burgerAddIngredient(realHighLight, hand, false),
              );
            }
          }
        }
        if (detail.plate === false) {
          // 1,2,13,14

          // 1,2 共 12
          // 只有普通食物和汉堡片
          //  if (detail.bread) {
          //   return callWithDebug("createNewBurger", "1,2", detail, () =>
          //     createNewBurger(realHighLight, hand, false),
          //   );
          //  }
          if (detail.bread) {
            return callWithDebug("createNewBurger", "1,2", detail, () =>
              createNewBurger(realHighLight, hand, true),
            );
          } else {
            if (detail.burger) {
              // 13, 14
              return callWithDebug("burgerAddIngredient", "13,14", detail, () =>
                burgerAddIngredient(realHighLight, hand, true),
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
              () => baseFoodModelCreateBurger(realHighLight, hand, true),
            );
          } else {
            // 7,9,15
            return callWithDebug(
              "plateBurgerAddIngredient",
              "7,9,15",
              detail,
              () => plateBurgerAddIngredient(realHighLight, hand, true),
            );
          }
        } else {
          // 4,6,8,10,16,19,20

          if (detail.burger === "hand") {
            //8,10
            return callWithDebug(
              "plateBurgerAddIngredient",
              "8,10",
              detail,
              () => plateBurgerAddIngredient(realHighLight, hand, true),
            );
          } else if (detail.burger === false) {
            if (
              isInclude(foodType(realHighLight), "normal") &&
              isInclude(foodType(hand), "normal")
            ) {
              return callWithDebug(
                "plateAddMultiNormalFood",
                "19,20",
                detail,
                () => plateAddMultiNormalFood(realHighLight, hand, true),
              );
            } else {
              // 4,6
              return callWithDebug(
                "baseFoodModelCreateBurger",
                "4,6",
                detail,
                () => baseFoodModelCreateBurger(realHighLight, hand, true),
              );
            }
          } else if (detail.burger === "highlighted") {
            // 16
            return callWithDebug("burgerAddIngredient", "16", detail, () =>
              burgerAddIngredient(realHighLight, hand, true),
            );
          }
        }
      } else {
        const detail = possible as IPlateChangeDetail;
        if (
          detail.plate === "highlighted" &&
          isInclude(foodType(hand), "plate")
        ) {
          // 1,2,3,4,5,6
          return callWithDebug("bothPlateChange", "1,2,3,4,5,6", detail, () =>
            bothPlateChange(realHighLight, hand),
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
