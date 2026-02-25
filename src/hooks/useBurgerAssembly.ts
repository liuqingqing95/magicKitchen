import * as THREE from "three";

import { foodData } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
// import { useGrabSystemContext } from "@/context/GrabSystemContext";
import ModelResourceContext from "@/context/ModelResourceContext";
import {
  IFurniturePosition,
  unregisterObstacle as unregisterFurnitureObstacle,
} from "@/stores/useFurnitureObstacle";
import {
  ObstacleInfo,
  registerObstacle,
  setGrabOnFurniture,
  setPendingGrabId,
  unregisterObstacle,
  updateObstacleInfo,
} from "@/stores/useGrabObstacle";
import {
  BaseFoodModelType,
  EFoodType,
  EGrabType,
  ERigidBodyType,
  FoodModelType,
  IAreaType,
  IFoodWithRef,
  INormalFoodProps,
  MultiFoodModelType,
  TPLayerId,
} from "@/types/level";
import {
  assembleType,
  foodType,
  IAssembleMultiFoodEnable,
  IBurgerDetail,
} from "@/utils/canAssembleBurger";
import { ICanCookFoodEnable } from "@/utils/canCook";
import { ICanCutFoodEnable } from "@/utils/canCut";
import {
  createFoodData,
  createFoodItem,
  foodTableData,
  getId,
  isInclude,
  isMultiFoodModelType,
} from "@/utils/util";
import { intersection } from "lodash";
import { useCallback, useContext } from "react";

export interface AssembleResult {
  newId: string;
  deleteIds: string[];
  dePositId: string;
}
interface IBaseUIProps {
  realHighLight: IFoodWithRef | false;
  hand: ObstacleInfo | null;
  highlightedFurniture: IFurniturePosition | false;
  playerId: TPLayerId;
  updateHand: (obj: IFoodWithRef) => void;
}
type IAssembleRes =
  | {
      putOnTable: string;
      leaveGrab: boolean;
    }
  | undefined;
interface ICreateNewFoodParams {
  foodType: EFoodType;
  model: THREE.Group;
  belong: "foodTable" | "newFood";
  area?: IAreaType;
  modelMapRef: React.MutableRefObject<Map<
    string,
    THREE.Group<THREE.Object3DEventMap>
  > | null>;
}
export const createNewFood = ({
  foodType,
  model,
  belong,
  area,
  modelMapRef,
}: ICreateNewFoodParams) => {
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

  const newFoodId = belong === "foodTable" ? newFood.id : null;
  if (newFoodId) {
  }

  newFood.area = area;
  newFood.visible = true;
  return newFood;
};

/**
 * 基础汉堡组装逻辑钩子
 * 包含所有与玩家无关的公共方法
 */
export function useBurgerAssembly() {
  const { grabModels } = useContext(ModelResourceContext);

  const { modelMapRef } = useContext(GrabContext);
  // const { releaseItem } = useGrabSystemContext();

  /**
   * 根据食物属性数组获取对应的模型
   * @param arr 食物属性数组，包含食物类型、是否切割、是否烹饪、是否有盘子等信息
   * @returns 返回对应的食物模型或false
   */
  const getNormalFoodModel = useCallback(
    (arr: INormalFoodProps[]) => {
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
          intersection(types, [EFoodType.tomato, EFoodType.meatPatty])
            .length === 2
        ) {
          return grabModels.tomatoMeat.clone();
        } else if (
          intersection(types, [EFoodType.tomato, EFoodType.cheese]).length === 2
        ) {
          return grabModels.cheeseTomato.clone();
        } else if (
          intersection(types, [EFoodType.cheese, EFoodType.meatPatty])
            .length === 2
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
    },
    [grabModels],
  );

  const getModel = useCallback(
    (target: IFoodWithRef) => {
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
    },
    [getNormalFoodModel],
  );

  const singleFoodOnPlate = useCallback(
    (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      leaveGrab: boolean,
      container: EGrabType.plate | EGrabType.pan = EGrabType.plate,
      highlightedFurniture: IFurniturePosition | false,
      playerId: TPLayerId,
    ) => {
      if (target.type === container) {
        const id = getModel(otherTarget);

        // 2,4
        const foodModel: BaseFoodModelType = {
          id,
          type: otherTarget.type as EFoodType,
        };

        const info: Partial<ObstacleInfo> = {
          foodModel,
          position: target.position,
        };
        updateObstacleInfo(target.id || "", info);

        unregisterObstacle(otherTarget.id, playerId);
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
        unregisterObstacle(target.id, playerId);
        return {
          putOnTable: highlightedFurniture ? otherTarget.id : "",
          leaveGrab,
        };
      }
    },
    [getModel, updateObstacleInfo, unregisterObstacle],
  );
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
    },
    [updateObstacleInfo],
  );
  const panAddIngredientToNormal = useCallback(
    (
      target: IFoodWithRef,
      other: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
    ) => {
      let id: string = "";
      let model: false | THREE.Group<THREE.Object3DEventMap> = false;
      let plate;
      if (isInclude(target.type, "pan")) {
        plate = other;
      } else {
        plate = target;
      }
      if (plate.foodModel?.type === EFoodType.bread) {
        model = grabModels.burger.clone();
        id = getId(ERigidBodyType.grab, EFoodType.burger, model.uuid);
      } else {
        model = getNormalFoodModel([
          {
            type: (other.foodModel as BaseFoodModelType).type,
            isCut: other.isCut,
            isCook: other.isCook,
            havePlate: true,
          },
          {
            type: (target.foodModel as BaseFoodModelType).type,
            isCut: target.isCut,
            isCook: target.isCook,
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
      if (isInclude(target.type, "pan")) {
        updateObstacleInfo(target.id || "", { foodModel: undefined });
        updateObstacleInfo(other.id || "", info);
        updateHand({
          ...other,
          ...info,
        });
      } else {
        updateObstacleInfo(other.id || "", { foodModel: undefined });
        updateObstacleInfo(target.id || "", info);
        updateHand({
          ...other,
          foodModel: undefined,
        });
      }

      modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
      modelMapRef.current?.delete((other.foodModel as BaseFoodModelType).id);
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab,
      };
    },
    [getNormalFoodModel, grabModels, updateObstacleInfo],
  );

  const baseFoodModelCreateBurger = useCallback(
    (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      playerId: TPLayerId,
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

          unregisterObstacle(otherTarget.id, playerId);
          modelMapRef.current?.delete(
            (target.foodModel as BaseFoodModelType).id,
          );
          modelMapRef.current?.delete(otherTarget.id);
        }
        return {
          putOnTable: highlightedFurniture ? target.id : "",
          leaveGrab,
        };
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
          unregisterObstacle(target.id, playerId);
          modelMapRef.current?.delete(
            (otherTarget.foodModel as BaseFoodModelType).id,
          );
          modelMapRef.current?.delete(target.id);
        }
        return {
          putOnTable: highlightedFurniture ? otherTarget.id : "",
          leaveGrab,
        };
      }
    },
    [grabModels, modelMapRef, unregisterObstacle, updateObstacleInfo],
  );

  const plateBurgerAddIngredient = useCallback(
    (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
      playerId: TPLayerId,
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
            const id = getId(
              ERigidBodyType.grab,
              EFoodType.burger,
              burger.uuid,
            );

            foodModel = {
              id,
              type: target.foodModel.type,
            };
            const info: Partial<ObstacleInfo> = {
              foodModel,
              position: target.position,
            };

            unregisterObstacle(target.id, playerId);
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
          unregisterObstacle(otherTarget.id, playerId);
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
          unregisterObstacle(target.id, playerId);
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
          unregisterObstacle(otherTarget.id, playerId);
          return {
            putOnTable: highlightedFurniture ? target.id : "",
            leaveGrab: true,
          };
        }
      }
    },
    [grabModels, modelMapRef, unregisterObstacle, updateObstacleInfo],
  );

  const createNewBurger = useCallback(
    (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
      playerId: TPLayerId,
    ) => {
      const newFood = createNewFood({
        foodType: EFoodType.burger,
        model: grabModels.burger,
        belong: "newFood",
        area: target.area,
        modelMapRef,
      })!;
      setPendingGrabId(playerId, newFood.id);
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
      unregisterObstacle(target.id, playerId);
      unregisterObstacle(otherTarget.id, playerId);
      modelMapRef.current?.delete(target.id);
      modelMapRef.current?.delete(otherTarget.id);
      return {
        putOnTable: highlightedFurniture ? newFood.id : "",
        leaveGrab,
      };
    },
    [grabModels.burger, registerObstacle, unregisterObstacle],
  );

  const bothPlateCreateBurger = useCallback(
    (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
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
    },
    [grabModels, modelMapRef, updateObstacleInfo],
  );

  const bothPlateChange = useCallback(
    (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
    ) => {
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
    },
    [updateObstacleInfo],
  );

  const plateAddMultiNormalFood = useCallback(
    (
      highlight: IFoodWithRef,
      grab: IFoodWithRef,
      highlightedFurniture: IFurniturePosition | false,
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
          isCut: target.isCut,
          isCook: target.isCook,
          havePlate: true,
        },
        {
          type: other.type as EFoodType,
          isCut: other.isCut,
          isCook: other.isCook,
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

      modelMapRef.current?.delete(other.id);
      modelMapRef.current?.delete((target.foodModel as BaseFoodModelType).id);
      return {
        putOnTable: highlightedFurniture ? target.id : "",
        leaveGrab: true,
      };
    },
    [getNormalFoodModel, unregisterFurnitureObstacle, updateObstacleInfo],
  );

  const burgerAddIngredient = useCallback(
    (
      target: IFoodWithRef,
      otherTarget: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
      playerId: TPLayerId,
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
            unregisterObstacle(otherTarget.id, playerId);
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
        unregisterObstacle(target.id, playerId);
        putOnTable = otherTarget.id;
        modelMapRef.current?.delete(target.id);
      }

      return {
        putOnTable: highlightedFurniture ? putOnTable : "",
        leaveGrab,
      };
    },
    [modelMapRef, unregisterObstacle, updateObstacleInfo],
  );

  const multiNormalCreateBurger = useCallback(
    (
      highlight: IFoodWithRef,
      grab: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
      playerId: TPLayerId,
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
        unregisterObstacle(otherTarget.id, playerId);
        modelMapRef.current?.set(id, burger);
        modelMapRef.current?.delete(otherTarget.id);
      }
      return {
        putOnTable: highlightedFurniture ? putOnTable : "",
        leaveGrab,
      };
    },
    [grabModels, modelMapRef, unregisterObstacle, updateObstacleInfo],
  );

  const plateBurgerAddMultiNormalFood = useCallback(
    (
      highlight: IFoodWithRef,
      grab: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
      playerId: TPLayerId,
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
        unregisterObstacle(otherTarget.id, playerId);
        modelMapRef.current?.delete(
          (target.foodModel as MultiFoodModelType).id,
        );
        updateObstacleInfo(target.id, {
          foodModel,
          position: highlight.position,
        });
      }

      return {
        putOnTable: highlightedFurniture ? putOnTable : "",
        leaveGrab,
      };
    },
    [modelMapRef, unregisterObstacle, updateObstacleInfo],
  );

  const multiNormalFoodAddIngredient = useCallback(
    (
      highlight: IFoodWithRef,
      grab: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      playerId: TPLayerId,
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
        putOnTable = grab.id;
        target = grab;
        otherTarget = highlight;
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
      unregisterObstacle(otherTarget.id, playerId);
      unregisterObstacle((target.foodModel as MultiFoodModelType).id, playerId);
      modelMapRef.current?.delete((target.foodModel as MultiFoodModelType).id);
      modelMapRef.current?.delete(otherTarget.id);
      return {
        putOnTable: highlightedFurniture ? putOnTable : "",
        leaveGrab,
      };
    },
    [getNormalFoodModel, modelMapRef, unregisterObstacle, updateObstacleInfo],
  );

  const overLapDirtyPlate = useCallback(
    (
      highlight: IFoodWithRef,
      grab: IFoodWithRef,
      highlightedFurniture: IFurniturePosition | false,
      playerId: TPLayerId,
    ) => {
      // Transfer existing plate ids from `grab` into `highlight` without cloning.
      // This avoids leaving duplicate models in the scene.
      const append: { id: string; type: EGrabType | EFoodType }[] = [];

      if (grab.foodModel && isMultiFoodModelType(grab.foodModel)) {
        // grab contains multiple items — use their existing ids
        (grab.foodModel.type as { id: string; type: any }[]).forEach((it) => {
          append.push({ id: it.id, type: it.type });
        });
      } else if (grab.foodModel) {
        // grab has a single foodModel entry
        append.push({
          id: (grab.foodModel as any).id,
          type: (grab.foodModel as any).type,
        });
      } else {
        // grab is a single plate represented by its obstacle id
        append.push({ id: grab.id, type: EGrabType.dirtyPlate });
      }

      // Also include the grabbed obstacle itself (id + its type), because
      // after placing the hand may become empty and we still need the
      // obstacle id to represent the plate that was in hand.
      if (!append.find((a) => a.id === grab.id)) {
        append.push({ id: grab.id, type: grab.type as any });
      }

      // Merge into highlighted.foodModel
      let info: FoodModelType | undefined;
      if (highlight.foodModel) {
        if (isMultiFoodModelType(highlight.foodModel)) {
          info = {
            id: (highlight.foodModel as any).id,
            type: (highlight.foodModel as any).type.concat(append),
          };
        } else {
          info = {
            id: highlight.id,
            type: [
              {
                id: (highlight.foodModel as any).id,
                type: (highlight.foodModel as any).type,
              },
            ].concat(append),
          };
        }
      } else {
        info =
          append.length === 1 ? append[0] : { id: highlight.id, type: append };
      }

      // Debug: log transfer details
      console.log(
        "overLapDirtyPlate - highlight.foodModel before:",
        highlight.foodModel,
      );
      console.log("overLapDirtyPlate - grab.foodModel:", grab.foodModel);
      console.log("overLapDirtyPlate - append:", append);

      // Update the highlighted obstacle with the transferred plates
      updateObstacleInfo(highlight.id || "", {
        foodModel: info,
        position: highlight.position,
      });
      console.log("overLapDirtyPlate - highlight.foodModel after:", info);

      modelMapRef.current?.delete(grab.id);
      unregisterObstacle(grab.id, playerId);

      return {
        putOnTable: highlightedFurniture ? highlight.id : "",
        leaveGrab: true,
      };
    },
    [modelMapRef, unregisterObstacle, updateObstacleInfo],
  );

  const panAddIngredientToBurger = useCallback(
    (
      target: IFoodWithRef,
      ohterTarget: IFoodWithRef,
      leaveGrab: boolean,
      highlightedFurniture: IFurniturePosition | false,
      updateHand: (obj: IFoodWithRef) => void,
    ) => {
      if (target.foodModel && isMultiFoodModelType(target.foodModel)) {
        //2
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
          ...ohterTarget,
          foodModel: undefined,
        });

        updateObstacleInfo(target.id || "", info);
        return {
          putOnTable: highlightedFurniture ? target.id : "",
          leaveGrab,
        };
      } else {
        //1
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
        return {
          putOnTable: highlightedFurniture ? target.id : "",
          leaveGrab,
        };
      }
    },
    [modelMapRef, updateObstacleInfo],
  );

  // Helper: 使用 assembly（优先 store）合成汉堡并更新本地 foods
  const assembleAndUpdateUI = useCallback(
    (
      possible: IAssembleMultiFoodEnable,
      {
        realHighLight,
        hand,
        highlightedFurniture,
        playerId,
        updateHand,
      }: IBaseUIProps,
    ) => {
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
          singleFoodOnPlate(
            realHighLight,
            hand,
            true,
            EGrabType.plate,
            highlightedFurniture,
            playerId,
          ),
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
              highlightedFurniture,
              playerId,
            ),
        );
      } else if (possible.type === "multiNormalCreateBurger") {
        return callWithDebug(
          "multiNormalCreateBurger",
          "1,2,3,4",
          possible,
          () =>
            multiNormalCreateBurger(
              realHighLight,
              hand,
              possible.leaveGrab,
              highlightedFurniture,
              updateHand,
              playerId,
            ),
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
              highlightedFurniture,
              updateHand,
              playerId,
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
              () =>
                bothPlateCreateBurger(
                  realHighLight,
                  hand,
                  highlightedFurniture,
                  updateHand,
                ),
            );
          } else {
            if (detail.burger) {
              // 17,18

              return callWithDebug(
                "burgerAddIngredient",
                "17,18",
                possible,
                () =>
                  burgerAddIngredient(
                    realHighLight,
                    hand,
                    false,
                    highlightedFurniture,
                    updateHand,
                    playerId,
                  ),
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
              createNewBurger(
                realHighLight,
                hand,
                true,
                highlightedFurniture,
                updateHand,
                playerId,
              ),
            );
          } else {
            if (detail.burger) {
              // 13, 14
              return callWithDebug("burgerAddIngredient", "13,14", detail, () =>
                burgerAddIngredient(
                  realHighLight,
                  hand,
                  true,
                  highlightedFurniture,
                  updateHand,
                  playerId,
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
              () =>
                baseFoodModelCreateBurger(
                  realHighLight,
                  hand,
                  true,
                  highlightedFurniture,
                  playerId,
                ),
            );
          } else {
            // 7,9,15
            return callWithDebug(
              "plateBurgerAddIngredient",
              "7,9,15",
              detail,
              () =>
                plateBurgerAddIngredient(
                  realHighLight,
                  hand,
                  true,
                  highlightedFurniture,
                  updateHand,
                  playerId,
                ),
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
              () =>
                plateBurgerAddIngredient(
                  realHighLight,
                  hand,
                  true,
                  highlightedFurniture,
                  updateHand,
                  playerId,
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
                  highlightedFurniture,
                  playerId,
                ),
            );
          } else if (detail.burger === "highlighted") {
            // 16
            return callWithDebug("burgerAddIngredient", "16", detail, () =>
              burgerAddIngredient(
                realHighLight,
                hand,
                true,
                highlightedFurniture,
                updateHand,
                playerId,
              ),
            );
          }
        }
      } else if (possible.type === "plateAddMultiNormalFood") {
        return callWithDebug("plateAddMultiNormalFood", "19,20", possible, () =>
          plateAddMultiNormalFood(realHighLight, hand, highlightedFurniture),
        );
      } else if (possible.type === "overLapDirtyPlate") {
        return callWithDebug("overLapDirtyPlate", "1,2,3", possible, () =>
          overLapDirtyPlate(
            realHighLight,
            hand,
            highlightedFurniture,
            playerId,
          ),
        );
      } else {
        // 1,2,3,4,5,6,7,8
        return callWithDebug(
          "bothPlateChange",
          "1,2,3,4,5,6,7,8",
          possible,
          () =>
            bothPlateChange(
              realHighLight,
              hand,
              highlightedFurniture,
              updateHand,
            ),
        );
      }
      // return true;
    },
    [
      baseFoodModelCreateBurger,
      burgerAddIngredient,
      createNewBurger,
      multiNormalCreateBurger,
      multiNormalFoodAddIngredient,
      bothPlateCreateBurger,
      bothPlateChange,
      overLapDirtyPlate,
      plateAddMultiNormalFood,
      plateBurgerAddIngredient,
      plateBurgerAddMultiNormalFood,
      singleFoodOnPlate,
    ],
  );

  const cookAndUpdateUI = useCallback(
    (
      possible: ICanCookFoodEnable,
      {
        realHighLight,
        hand,
        highlightedFurniture,
        playerId,
        updateHand,
      }: IBaseUIProps,
    ) => {
      if (!realHighLight || !hand) return false;
      if (possible.type === "plateChange") {
        console.log("[cook]", possible);
        return bothPlateChange(
          realHighLight,
          hand,
          highlightedFurniture,
          updateHand,
        );
      } else if (possible.type === "singleFoodOnPlate") {
        return singleFoodOnPlate(
          realHighLight,
          hand,
          true,
          EGrabType.pan,
          highlightedFurniture,
          playerId,
        );
      } else if (possible.type === "panAddIngredientToNormal") {
        return panAddIngredientToNormal(
          realHighLight,
          hand,
          false,
          highlightedFurniture,
          updateHand,
        );
      } else if (possible.type === "panAddIngredientToBurger") {
        return panAddIngredientToBurger(
          realHighLight,
          hand,
          false,
          highlightedFurniture,
          updateHand,
        );
      }
    },
    [
      bothPlateChange,
      singleFoodOnPlate,
      panAddIngredientToNormal,
      panAddIngredientToBurger,
    ],
  );

  const cutAndUpdateUI = useCallback(
    (
      possible: ICanCutFoodEnable,
      {
        realHighLight,
        hand,
        highlightedFurniture,
        playerId,
        updateHand,
      }: IBaseUIProps,
    ) => {
      if (!realHighLight || !hand) return false;
      if (possible === "assembleWithCuttingBoard") {
        updateObstacleInfo(realHighLight.id, {
          foodModel: {
            id: hand.id,
            type: hand.type as EFoodType,
          },
        });
        unregisterObstacle(hand.id, playerId);

        return {
          putOnTable: realHighLight.id,
          leaveGrab: true,
          visibleProcessBar: true,
        };
      } else {
        let id = "";
        if (possible === "putOnTable") {
          updateObstacleInfo(hand.id, {
            position: [
              realHighLight.position[0],
              realHighLight.position[1] + 0.15,
              realHighLight.position[2],
            ],
          });
          id = hand.id;
        } else {
          const baseFoodModel = realHighLight.foodModel as BaseFoodModelType;
          const item = foodTableData(baseFoodModel.type);
          const normalFood = createFoodItem(
            item,
            grabModels[baseFoodModel.type],
            false,
          );
          normalFood.position = [
            realHighLight.position[0],
            realHighLight.position[1] + 0.15,
            realHighLight.position[2],
          ];
          normalFood.isCut = true;
          updateObstacleInfo(realHighLight.id, {
            foodModel: undefined,
            isCut: false,
          });

          if (possible === "singleFoodOnPlate") {
            id = singleFoodOnPlate(
              normalFood,
              hand,
              true,
              EGrabType.plate,
              highlightedFurniture,
              playerId,
            ).putOnTable;
          } else if (possible === "plateAddMultiNormalFood") {
            id =
              plateAddMultiNormalFood(normalFood, hand, highlightedFurniture)
                ?.putOnTable || "";
          } else if (possible === "createNewBurger") {
            id = createNewBurger(
              normalFood,
              hand,
              true,
              highlightedFurniture,
              updateHand,
              playerId,
            ).putOnTable;
          } else if (possible === "baseFoodModelCreateBurger") {
            id = baseFoodModelCreateBurger(
              normalFood,
              hand,
              true,
              highlightedFurniture,
              playerId,
            ).putOnTable;
          } else if (possible === "burgerAddIngredient") {
            id = burgerAddIngredient(
              normalFood,
              hand,
              true,
              highlightedFurniture,
              updateHand,
              playerId,
            ).putOnTable;
          } else if (possible === "plateBurgerAddIngredient") {
            id = plateBurgerAddIngredient(
              normalFood,
              hand,
              true,
              highlightedFurniture,
              updateHand,
              playerId,
            ).putOnTable;
          } else if (possible.type === "multiNormalFoodAddIngredient") {
            id =
              multiNormalFoodAddIngredient(
                normalFood,
                hand,
                possible.leaveGrab,
                highlightedFurniture,
                playerId,
              )?.putOnTable || "";
          }
        }
        // 物品占用了切菜板位置，切菜板位置存放在temp
        setGrabOnFurniture(
          (highlightedFurniture as IFurniturePosition).id,
          realHighLight.id,
          true,
        );
        return {
          putOnTable: id,
          leaveGrab: true,
          visibleProcessBar: false,
        };
      }
    },
    [
      baseFoodModelCreateBurger,
      burgerAddIngredient,
      createNewBurger,
      modelMapRef,
      multiNormalFoodAddIngredient,
      plateAddMultiNormalFood,
      plateBurgerAddIngredient,
      singleFoodOnPlate,
      unregisterObstacle,
      updateObstacleInfo,
      setGrabOnFurniture,
      grabModels,
    ],
  );

  return {
    getNormalFoodModel,
    getModel,
    singleFoodOnPlate,
    panAddIngredientToNormal,
    baseFoodModelCreateBurger,
    plateBurgerAddIngredient,
    createNewBurger,
    bothPlateCreateBurger,
    bothPlateChange,
    plateAddMultiNormalFood,
    burgerAddIngredient,
    multiNormalCreateBurger,
    plateBurgerAddMultiNormalFood,
    multiNormalFoodAddIngredient,
    overLapDirtyPlate,
    panAddIngredientToBurger,
    assembleAndUpdateUI,
    cookAndUpdateUI,
    cutAndUpdateUI,
    createNewFood,
    dropHeld,
  };
}
