import { EFoodType, IFoodWithRef } from "@/types/level";

type assembleWithCuttingBoard = {
  type: "assembleWithCuttingBoard";
};
type putOnTable = {
  type: "putOnTable";
};
export type ICanCutFoodEnable = putOnTable | assembleWithCuttingBoard;
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
export const canCutFood = (hand: IFoodWithRef): ICanCutResult => {
  return {
    type: "canCutFood",
    result: canCutFoodInner(hand),
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

export const canCutFoodInner = (hand: IFoodWithRef): ICanCutFoodType => {
  if (!hand) return false;
  const type = foodType(hand);
  switch (type) {
    case ECutType.assemble:
      return {
        type: "assembleWithCuttingBoard",
      };
    case ECutType.putOnTable:
      return {
        type: "putOnTable",
      };
    case ECutType.notValid:
      return false;
    default:
      return false;
  }
};
