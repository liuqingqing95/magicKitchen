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
  INormalFoodProps,
  MultiFoodModelType,
} from "@/types/level";
import {
  assembleType,
  foodType,
  IAssembleMultiFoodEnable,
  IBurgerDetail,
} from "@/utils/canAssembleBurger";
import { ICanCookFoodEnable } from "@/utils/canCook";
import {
  createFoodData,
  createFoodItem,
  foodTableData,
  getId,
  isInclude,
  isMultiFoodModelType,
} from "@/utils/util";
import { intersection } from "lodash";
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

  const updateHand = (obj: IFoodWithRef) => {
    // grabRef.current = obj;
    setHand(obj);
    grabItem({
      food: obj,
      model: modelMapRef.current?.get(obj.id) || null,
      baseFoodModel: modelMapRef.current?.get(obj.foodModel?.id || "") || null,
    });
  };

  // ============ 公共操作提取 ============

  /** 同时更新障碍物信息和手中物品 */
  const updateObstacleAndHand = (
    obstacleId: string,
    info: Partial<ObstacleInfo>,
    handObj: IFoodWithRef,
  ) => {
    updateObstacleInfo(obstacleId, info);
    updateHand({ ...handObj, ...info });
  };

  /** 清空某个物品的 foodModel，并同步手中状态 */
  const clearFoodModel = (
    obstacleId: string,
    handObj: IFoodWithRef,
  ): IAssembleRes => {
    updateObstacleInfo(obstacleId, { foodModel: undefined });
    updateHand({ ...handObj, foodModel: undefined });
    return {
      putOnTable: highlightedFurniture ? obstacleId : "",
      leaveGrab: false,
    };
  };

  /** 从地图和障碍物系统中完全移除一个物品 */
  const removeObstacleWithModel = (obstacleId: string, modelId?: string) => {
    unregisterObstacle(obstacleId);
    if (modelId) {
      modelMapRef.current?.delete(modelId);
    }
  };

  /** 批量移除多个物品 */
  const removeMultipleObstacles = (
    items: Array<{ id: string; modelId?: string }>,
  ) => {
    items.forEach(({ id, modelId }) => removeObstacleWithModel(id, modelId));
  };

  // ============ 原有方法 ============
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
  const getModel = (target: IFoodWithRef) => {
    if (target.type !== EFoodType.bread) {
      // 1,2
      const arr = [
        {
          type: target.type as EFoodType,
          isCut: target.isCut,
          isCook: target.isCook,
          havePlate: true,
        },
      ];
      const model = getNormalFoodModel(arr);
      if (!model) return target.id;
      const id = getId(ERigidBodyType.grab, target.type, model.uuid);
      modelMapRef.current?.set(id, model);
      modelMapRef.current?.delete(target.id);
      return id || target.id;
    }
    return target.id;
  };
  const singleFoodOnPlate = (
    target: IFoodWithRef,
    otherTarget: IFoodWithRef,
    leaveGrab: boolean,
    container: EGrabType.plate | EGrabType.pan = EGrabType.plate,
  ) => {
    if (target.type === container) {
      const id = getModel(otherTarget);

      // 2,4
      const foodModel: BaseFoodModelType = {
        id,
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
      const id = getModel(target);
      //1,3
      const foodModel: BaseFoodModelType = {
        id,
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
  /**
   * 根据食物属性数组获取对应的模型
   * @param arr 食物属性数组，包含食物类型、是否切割、是否烹饪、是否有盘子等信息
   * @returns 返回对应的食物模型或false
   */
  const getNormalFoodModel = (arr: INormalFoodProps[]) => {
    // 获取所有食物类型
    const types = arr.map((item) => item.type);
    if (arr.length === 1) {
      const item = arr[0];
      switch (item.type) {
        case EFoodType.tomato:
          if (item.isCut) {
            if (item.havePlate) {
              return grabModels.tomatoCut.clone();
            } else {
              console.warn("暂无模型");
            }
          }
          return false;
        case EFoodType.meatPatty:
          if (item.isCut) {
            if (item.isCook) {
              // 放置在盘子里面的都是熟食
              return grabModels.meatPie.clone();
            } else {
              return grabModels.rawMeatPie.clone();
            }
          }
          return false;
        case EFoodType.cheese:
          if (item.isCut) {
            if (item.havePlate) {
              return grabModels.cheeseCut.clone();
            } else {
              console.warn("暂无模型");
            }
          }
          return false;
      }
    } else if (arr.length === 2) {
      if (
        intersection(types, [EFoodType.tomato, EFoodType.meatPatty]).length ===
        2
      ) {
        return grabModels.tomatoMeat.clone();
      } else if (
        intersection(types, [EFoodType.tomato, EFoodType.cheese]).length === 2
      ) {
        return grabModels.cheeseTomato.clone();
      } else if (
        intersection(types, [EFoodType.cheese, EFoodType.meatPatty]).length ===
        2
      ) {
        return grabModels.cheeseMeat.clone();
      }
    } else if (arr.length === 3) {
      if (
        intersection(types, [
          EFoodType.tomato,
          EFoodType.meatPatty,
          EFoodType.cheese,
        ]).length === 3
      ) {
        return grabModels.cheeseTomatoMeat.clone();
      }
    }
    return false;
  };
  const panAddIngredientToNormal = (
    highlight: IFoodWithRef,
    grab: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    let target = highlight;
    let other = grab;
    let id: string = "";
    let model: false | THREE.Group<THREE.Object3DEventMap> = false;
    if (isInclude(target.type, "pan") === false) {
      target = grab;
      other = highlight;
    }
    if (other.foodModel?.type === EFoodType.bread) {
      model = grabModels.burger.clone();
      id = getId(ERigidBodyType.grab, EFoodType.burger, model.uuid);
    } else {
      model = getNormalFoodModel([
        {
          type: (other.foodModel as BaseFoodModelType).type,
          isCut: true,
          isCook: false,
          havePlate: true,
        },
        {
          type: (target.foodModel as BaseFoodModelType).type,
          isCut: true,
          isCook: true,
          havePlate: true,
        },
      ]);
      if (!model) return;
      id = getId(ERigidBodyType.grab, EFoodType.multiNormal, model.uuid);
    }
    modelMapRef.current?.set(id, model);
    const foodModel = {
      id: id,
      type: [
        {
          id: (target.foodModel as BaseFoodModelType).id,
          type: (target.foodModel as BaseFoodModelType).type,
        },
        {
          id: (other.foodModel as BaseFoodModelType).id,
          type: (other.foodModel as BaseFoodModelType).type,
        },
      ],
    };
    const info: Partial<ObstacleInfo> = {
      foodModel,
    };

    updateObstacleInfo(other.id || "", info);

    updateHand({
      ...other,
      ...info,
    });

    updateObstacleInfo(target.id || "", { foodModel: undefined });
    modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
    modelMapRef.current?.delete((other.foodModel as BaseFoodModelType).id);
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
    highlight: IFoodWithRef,
    grab: IFoodWithRef,
  ) => {
    let target = highlight;
    let other = grab;
    if (isInclude(target.type, "plate") === false) {
      target = grab;
      other = highlight;
    }
    const model = getNormalFoodModel([
      {
        type: (target.foodModel as BaseFoodModelType).type,
        isCut: true,
        isCook: false,
        havePlate: true,
      },
      {
        type: other.type as EFoodType,
        isCut: true,
        isCook: true,
        havePlate: true,
      },
    ]);
    if (!model) return;
    const id = getId(ERigidBodyType.grab, EFoodType.multiNormal, model.uuid);
    modelMapRef.current?.set(id, model);
    const foodModel: MultiFoodModelType = {
      id: id,
      type: [
        {
          id: (target.foodModel as BaseFoodModelType).id,
          type: (target.foodModel as BaseFoodModelType).type,
        },
        {
          id: other.id,
          type: other.type as EFoodType,
        },
      ],
    };
    const info: Partial<ObstacleInfo> = {
      foodModel,
    };
    unregisterFurnitureObstacle(other.id);

    updateObstacleInfo(target.id || "", {
      ...info,
      position: highlight.position,
    });

    // updateObstacleInfo(target.id || "", { foodModel: undefined });
    modelMapRef.current?.delete(other.id);
    modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
    return {
      putOnTable: highlightedFurniture ? target.id : "",
      leaveGrab: true,
    };
    // const model = getNormalFoodModel([
    //     {
    //       type: (other.foodModel as BaseFoodModelType).type,
    //       isCut: true,
    //       isCook: false,
    //       havePlate: true,
    //     },
    //     {
    //       type: (target.foodModel as BaseFoodModelType).type,
    //       isCut: true,
    //       isCook: true,
    //       havePlate: true,
    //     },
    //   ]);
    //   if (!model) return;
    //   id = getId(ERigidBodyType.grab, EFoodType.multiNormal, model.uuid);
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
  const multiNormalCreateBurger = (
    highlight: IFoodWithRef,
    grab: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    let target = highlight;
    let otherTarget = grab;
    let putOnTable = highlight.id;
    const burger = grabModels.burger.clone();
    const id = getId(ERigidBodyType.grab, EFoodType.burger, burger.uuid);
    if (
      target.type === EGrabType.plate &&
      otherTarget.type === EGrabType.plate
    ) {
      if (
        target.foodModel &&
        isMultiFoodModelType(target.foodModel) === false
      ) {
        target = otherTarget;
        otherTarget = highlight;
      }
      const foodModel = {
        id,
        type: (target.foodModel as MultiFoodModelType).type.concat({
          id: (otherTarget.foodModel as BaseFoodModelType).id,
          type: (otherTarget.foodModel as BaseFoodModelType).type,
        }),
      };
      putOnTable = target.id;
      updateObstacleInfo(target.id, {
        foodModel,
        position: highlight.position,
      });
      modelMapRef.current?.set(id, burger);
      modelMapRef.current?.delete(
        (otherTarget.foodModel as BaseFoodModelType).id,
      );
      updateHand({
        ...otherTarget,
        foodModel: undefined,
      });
      updateObstacleInfo(otherTarget.id, {
        foodModel: undefined,
      });
    } else {
      // 1,2
      if ((target.type === EGrabType.plate) === false) {
        //1
        target = grab;
        otherTarget = highlight;
      }
      putOnTable = target.id;
      const foodModel = {
        id,
        type: (target.foodModel as MultiFoodModelType).type.concat({
          id: otherTarget.id,
          type: otherTarget.type as EFoodType,
        }),
      };
      updateObstacleInfo(target.id, {
        foodModel,
        position: highlight.position,
      });
      unregisterObstacle(otherTarget.id);
      modelMapRef.current?.set(id, burger);
      modelMapRef.current?.delete(otherTarget.id);
    }
    return {
      putOnTable: highlightedFurniture ? putOnTable : "",
      leaveGrab,
    };
  };
  const plateBurgerAddMultiNormalFood = (
    highlight: IFoodWithRef,
    grab: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    let target = highlight;
    let otherTarget = grab;
    let id: string = "";
    let putOnTable = highlight.id;
    if (
      target.type === EGrabType.plate &&
      otherTarget.type === EGrabType.plate
    ) {
      // 3，4
      if (foodType(target).includes("burger") === false) {
        target = grab;
        otherTarget = highlight;
      }
      putOnTable = target.id;
      id = (target.foodModel as MultiFoodModelType).id;
      const foodModel = {
        id,
        type: (target.foodModel as MultiFoodModelType).type.concat(
          (otherTarget.foodModel as MultiFoodModelType).type,
        ),
      };
      updateObstacleInfo(target.id, {
        foodModel,
        position: highlight.position,
      });
      updateHand({
        ...otherTarget,
        foodModel: undefined,
      });
      updateObstacleInfo(otherTarget.id, {
        foodModel: undefined,
      });
      modelMapRef.current?.delete(
        (otherTarget.foodModel as MultiFoodModelType).id,
      );
    } else {
      // 1,2
      if (isInclude(foodType(highlight), "burger")) {
        target = grab;
        otherTarget = highlight;
        id = (highlight.foodModel as MultiFoodModelType).id;
      } else {
        id = (otherTarget.foodModel as MultiFoodModelType).id;
      }

      putOnTable = target.id;
      const foodModel = {
        id,
        type: (target.foodModel as MultiFoodModelType).type.concat(
          (otherTarget.foodModel as MultiFoodModelType).type,
        ),
      };
      unregisterObstacle(otherTarget.id);
      modelMapRef.current?.delete((target.foodModel as MultiFoodModelType).id);
      updateObstacleInfo(target.id, {
        foodModel,
        position: highlight.position,
      });
    }

    return {
      putOnTable: highlightedFurniture ? putOnTable : "",
      leaveGrab,
    };
  };
  const multiNormalFoodAddIngredient = (
    highlight: IFoodWithRef,
    grab: IFoodWithRef,
    leaveGrab: boolean,
  ) => {
    let target = highlight;
    let otherTarget = grab;
    let putOnTable = target.id;
    const arr: INormalFoodProps[] = [];
    const createModelObj = (type: EFoodType) => {
      arr.push({
        type: type as EFoodType,
        isCut: true,
        isCook: type === EFoodType.meatPatty ? true : false,
        havePlate: true,
      });
    };
    if (!highlight.foodModel) {
      createModelObj(highlight.type as EFoodType);
      (otherTarget.foodModel as MultiFoodModelType).type.forEach((item) => {
        createModelObj(item.type as EFoodType);
      });
      target = grab;
      otherTarget = highlight;
      putOnTable = otherTarget.id;
    } else {
      (highlight.foodModel as MultiFoodModelType).type.forEach((item) => {
        createModelObj(item.type as EFoodType);
      });
      createModelObj(otherTarget.type as EFoodType);
    }

    const model = getNormalFoodModel(arr);
    if (!model) return;
    const id = getId(ERigidBodyType.grab, EFoodType.multiNormal, model.uuid);
    modelMapRef.current?.set(id, model);
    const foodModel = {
      id,
      type: (target.foodModel as MultiFoodModelType).type.concat({
        id: otherTarget.id,
        type: otherTarget.type as EFoodType,
      }),
    };
    updateObstacleInfo(target.id || "", {
      foodModel,
      position: highlight.position,
    });
    unregisterObstacle(otherTarget.id);
    unregisterObstacle((target.foodModel as MultiFoodModelType).id);
    modelMapRef.current?.delete((target.foodModel as MultiFoodModelType).id);
    modelMapRef.current?.delete(otherTarget.id);
    return {
      putOnTable: highlightedFurniture ? putOnTable : "",
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
        // 1,2,3,4
        return callWithDebug("singleFoodOnPlate", "1,2,3,4", possible, () =>
          singleFoodOnPlate(realHighLight, hand, true),
        );
      } else if (possible.type === "multiNormalFoodAddIngredient") {
        return callWithDebug(
          "multiNormalFoodAddIngredient",
          "1,2",
          possible,
          () =>
            multiNormalFoodAddIngredient(
              realHighLight,
              hand,
              possible.leaveGrab,
            ),
        );
      } else if (possible.type === "multiNormalCreateBurger") {
        return callWithDebug(
          "multiNormalCreateBurger",
          "1,2,3,4",
          possible,
          () =>
            multiNormalCreateBurger(realHighLight, hand, possible.leaveGrab),
        );
      } else if (possible.type === "plateBurgerAddMultiNormalFood") {
        return callWithDebug(
          "plateBurgerAddMultiNormalFood",
          "1,2,3,4",
          possible,
          () =>
            plateBurgerAddMultiNormalFood(
              realHighLight,
              hand,
              possible.leaveGrab,
            ),
        );
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
            // 4,6
            return callWithDebug(
              "baseFoodModelCreateBurger",
              "4,6",
              detail,
              () => baseFoodModelCreateBurger(realHighLight, hand, true),
            );
          } else if (detail.burger === "highlighted") {
            // 16
            return callWithDebug("burgerAddIngredient", "16", detail, () =>
              burgerAddIngredient(realHighLight, hand, true),
            );
          }
        }
      } else if (possible.type === "plateAddMultiNormalFood") {
        return callWithDebug("plateAddMultiNormalFood", "19,20", possible, () =>
          plateAddMultiNormalFood(realHighLight, hand),
        );
      } else {
        // 1,2,3,4,5,6,7,8
        return callWithDebug(
          "bothPlateChange",
          "1,2,3,4,5,6,7,8",
          possible,
          () => bothPlateChange(realHighLight, hand),
        );
      }
      // return true;
    },
    [grabModels.burger, hand, realHighLight],
  );
  const panAddIngredientToBurger = (
    target: IFoodWithRef,
    ohterTarget: IFoodWithRef,
  ) => {
    if (target.foodModel && isMultiFoodModelType(target.foodModel)) {
      const foodModel = {
        id: target.foodModel.id,
        type: target.foodModel.type.concat({
          id: (ohterTarget.foodModel as BaseFoodModelType).id,
          type: (ohterTarget.foodModel as BaseFoodModelType).type,
        }),
      };
      updateObstacleInfo(ohterTarget.id, {
        foodModel: undefined,
      });
      modelMapRef.current?.delete(
        (ohterTarget.foodModel as BaseFoodModelType).id,
      );
      const info: Partial<ObstacleInfo> = {
        foodModel,
      };

      updateHand({
        ...target,
        foodModel,
      });

      updateObstacleInfo(target.id || "", info);
    } else {
      const foodModel = {
        id: (ohterTarget.foodModel as MultiFoodModelType).id,
        type: (ohterTarget.foodModel as MultiFoodModelType).type.concat({
          id: (target.foodModel as BaseFoodModelType).id,
          type: (target.foodModel as BaseFoodModelType).type,
        }),
      };
      updateObstacleInfo(target.id, {
        foodModel: undefined,
      });
      modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
      const info: Partial<ObstacleInfo> = {
        foodModel,
      };

      updateHand({
        ...ohterTarget,
        foodModel,
      });

      updateObstacleInfo(ohterTarget.id || "", info);
    }
  };
  const cookAndUpdateUI = useCallback(
    (possible: ICanCookFoodEnable) => {
      if (!realHighLight || !hand) return false;
      if (possible.type === "plateChange") {
        console.log("[cook]", possible);
        return bothPlateChange(realHighLight, hand);
      } else if (possible.type === "singleFoodOnPlate") {
        return singleFoodOnPlate(realHighLight, hand, true, EGrabType.pan);
      } else if (possible.type === "panAddIngredientToNormal") {
        return panAddIngredientToNormal(realHighLight, hand, false);
      } else if (possible.type === "panAddIngredientToBurger") {
        return panAddIngredientToBurger(realHighLight, hand);
      }
    },
    [[grabModels.burger, hand, realHighLight]],
  );
  return {
    createNewFood,
    assembleAndUpdateUI,
    cookAndUpdateUI,
    hand,
    setHand,
    highlightedFurniture,
    dropHeld,
  };
}
