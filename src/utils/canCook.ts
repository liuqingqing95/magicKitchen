import {
  EFoodType,
  EGrabType,
  IFoodWithRef,
  MultiFoodModelType,
} from "@/types/level";

import { IPlateChangeDetail } from "./canAssembleBurger";
import { valiableCut } from "./canCut";
import { isInclude, isMultiFoodModelType } from "./util";

export const valiableCook = [EFoodType.meatPatty];

type panAddIngredientToNormal = {
  type: "panAddIngredientToNormal";
};
type panAddIngredientToBurger = {
  type: "panAddIngredientToBurger";
};
type singleFoodOnPlate = {
  type: "singleFoodOnPlate";
};
export type ICanCookFoodEnable =
  | panAddIngredientToNormal
  | singleFoodOnPlate
  | panAddIngredientToBurger
  | IPlateChangeDetail;
export type ICanCookFoodType = false | ICanCookFoodEnable;

const foodModelType = [EFoodType.bread, EFoodType.tomato, EFoodType.cheese];
export interface ICanCookResult {
  type: "canCookFood";
  result: ICanCookFoodType;
}
// const canProductBurger = (
//   type: string,
//   highlighted: IFoodWithRef,
//   hand: IFoodWithRef,
// ) => {
//   const highlightedType = type.split("&")[0];
//   const handType = type.split("&")[1];

//   if (isInclude(highlightedType, "burger")) {
//     return getInfo(highlighted, hand, handType, type);
//   } else {
//     return getInfo(hand, highlighted, highlightedType, type);
//   }
// };
// export interface IBurgerDetail {
//   type: "multiBurger";
//   plate: "highlighted" | "hand" | false;
//   burger: "highlighted" | "hand" | false;
//   bread: "highlighted" | "hand" | false;
// }

// export interface ISinglePlateDetail {
//   type: "singleFoodOnPlate";
//   haveBurger: boolean;
// }
// export interface IPlateChangeDetail {
//   type: "plateChange";
//   plate: "highlighted" | "hand" | false;
// }

// export type IForbidAssemble = "forbidAssemble";
// export type IAssembleMultiFoodResult =
//   | IAssembleMultiFoodEnable
//   | IForbidAssemble;

export enum ECookType {
  pan = "pan",
  plate = "plate",
  burgerWithPlate = "burgerWithPlate",
  normalWithPlate = "normalWithPlate",
  normalWidthPan = "normalWidthPan",
  notValid = "notValid",
  normal = "normal",
}

function isNormalFood(food: IFoodWithRef) {
  const isNormal =
    Object.values(valiableCook).includes(food.type as EFoodType) &&
    food.isCook !== true;
  if (isNormal) {
    // 判断是否需要切
    if (Object.values(valiableCut).includes(food.type as EFoodType)) {
      if (food.isCut === true) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
}

function foodType(food: IFoodWithRef): ECookType {
  if (food.foodModel) {
    if (isMultiFoodModelType(food.foodModel)) {
      if (food.type === EGrabType.plate) {
        return ECookType.burgerWithPlate;
      }
      return ECookType.notValid;
    } else {
      if (food.type === EGrabType.plate) {
        if (Object.values(foodModelType).includes(food.foodModel.type)) {
          return ECookType.normalWithPlate;
        }
        return ECookType.notValid;
      } else if (food.type === EGrabType.pan) {
        if (Object.values(valiableCook).includes(food.foodModel.type)) {
          return ECookType.normalWidthPan;
        }
        return ECookType.notValid;
      }
      return ECookType.notValid;
    }
  } else {
    if (isNormalFood(food)) {
      // 可以烹饪的食材才算正常食品
      return ECookType.normal;
    } else if (food.type === EGrabType.pan) {
      return ECookType.pan;
    } else if (food.type === EGrabType.plate) {
      return ECookType.plate;
    }
    return ECookType.notValid;
  }
}
const assembleType = (highlighted: IFoodWithRef, hand: IFoodWithRef) => {
  const highlightedType = foodType(highlighted);
  const handType = foodType(hand);

  return `${highlightedType}&${handType}`;
};
const getInfo = (target: IFoodWithRef, other: IFoodWithRef) => {
  const arr = (target.foodModel as MultiFoodModelType).type;
  if (Object.values(arr).find((item) => item.type === other.type)) {
    return false;
  } else {
    return true;
  }
};
const canProductBurger = (
  type: string,
  highlighted: IFoodWithRef,
  hand: IFoodWithRef,
) => {
  const highlightedType = type.split("&")[0];
  if (isInclude(highlightedType, "burger")) {
    return getInfo(highlighted, hand);
  } else {
    return getInfo(hand, highlighted);
  }
};
export const canCookFood = (
  highlighted: IFoodWithRef | undefined,
  hand: IFoodWithRef,
): ICanCookResult => {
  const result = canCookInner(highlighted, hand);
  return {
    type: "canCookFood",
    result: result,
  };
};
function canCookInner(
  highlighted: IFoodWithRef | undefined,
  hand: IFoodWithRef,
): ICanCookFoodType {
  if (!highlighted) return false;
  const type = assembleType(highlighted, hand);
  switch (type) {
    case `${ECookType.pan}&${ECookType.normal}`:
    case `${ECookType.normal}&${ECookType.pan}`:
      return {
        type: "singleFoodOnPlate",
      };

    case `${ECookType.normalWidthPan}&${ECookType.plate}`:
    case `${ECookType.plate}&${ECookType.normalWidthPan}`:
      return {
        type: "plateChange",
      };

    case `${ECookType.normalWidthPan}&${ECookType.normalWithPlate}`:
    case `${ECookType.normalWithPlate}&${ECookType.normalWidthPan}`:
      return {
        type: "panAddIngredientToNormal",
      };

    case `${ECookType.normalWidthPan}&${ECookType.burgerWithPlate}`:
    case `${ECookType.burgerWithPlate}&${ECookType.normalWidthPan}`:
      if (canProductBurger(type, highlighted, hand)) {
        return {
          type: "panAddIngredientToBurger",
        };
      }
      return false;

    default:
      return false;
  }
}
