import { BaseFoodModelType, EFoodType, IFoodWithRef } from "@/types/level";
import {
  foodType as AssembleFoodType,
  EMultiFoodType,
  IMultiNormalFoodAddIngredient,
  multiNormalValid,
} from "@/utils/canAssembleBurger";
import { valiableCook } from "./canCook";

export type ICanCutFoodEnable =
  | "plateAddMultiNormalFood"
  | IMultiNormalFoodAddIngredient
  | "createNewBurger"
  | "baseFoodModelCreateBurger"
  | "singleFoodOnPlate"
  | "putOnTable"
  | "burgerAddIngredient"
  | "plateBurgerAddIngredient"
  | "assembleWithCuttingBoard";
export const valiableCut = [
  EFoodType.tomato,
  EFoodType.cheese,
  EFoodType.meatPatty,
];
export type ICanCutFoodType = false | ICanCutFoodEnable;
export interface ICanCutResult {
  type: "canCutFood";
  result: ICanCutFoodType;
}
export enum ECutType {
  putOnTable,
  assemble,
  notValid,
}
export const canCutFood = (
  highlight: IFoodWithRef,
  hand: IFoodWithRef,
): ICanCutResult => {
  return {
    type: "canCutFood",
    result: canCutFoodInner(highlight, hand),
  };
};

function foodType(food: IFoodWithRef): ECutType {
  if (food.foodModel) {
    return ECutType.putOnTable;
  } else {
    if (Object.values(valiableCut).includes(food.type as EFoodType)) {
      // 可以烹饪的食材才算正常食品
      return ECutType.assemble;
    }
    return ECutType.putOnTable;
  }
}

export const canCutFoodInner = (
  highlighted: IFoodWithRef,
  hand: IFoodWithRef,
): ICanCutFoodType => {
  if (!hand) return false;

  const cuttingBoardhaveFood = highlighted.foodModel !== undefined;
  if (cuttingBoardhaveFood) {
    if (highlighted.isCut !== true) return false;
    if (valiableCook.includes(highlighted.type as EFoodType)) {
      return false;
    }
    const handType = AssembleFoodType(hand);
    const type = `${EMultiFoodType.normalFood}&${handType}`;
    switch (type) {
      case `${EMultiFoodType.normalFood}&${EMultiFoodType.plate}`:
        return "singleFoodOnPlate";

      case `${EMultiFoodType.normalFood}&${EMultiFoodType.multiNormalWidthPlate}`:
        const result = multiNormalValid(
          hand,
          (highlighted.foodModel as BaseFoodModelType).type,
          true,
        );
        if (result !== "forbidAssemble") {
          return result;
        } else {
          return false;
        }
      case `${EMultiFoodType.normalFood}&${EMultiFoodType.bread}`:
        return "createNewBurger";
      case `${EMultiFoodType.normalFood}&${EMultiFoodType.breadWithPlate}`:
        return "baseFoodModelCreateBurger";

      case `${EMultiFoodType.normalFood}&${EMultiFoodType.burger}`:
        return "burgerAddIngredient";

      case `${EMultiFoodType.normalFood}&${EMultiFoodType.burgerWithPlate}`:
        return "plateBurgerAddIngredient";

      case `${EMultiFoodType.normalFood}&${EMultiFoodType.normalWidthPlate}`:
        return "plateAddMultiNormalFood";

      default:
        return false;
    }
  } else {
    const type = foodType(hand);
    switch (type) {
      case ECutType.assemble:
        return "assembleWithCuttingBoard";

      case ECutType.putOnTable:
        return "putOnTable";
      case ECutType.notValid:
        return false;
      default:
        return false;
    }
  }
};
