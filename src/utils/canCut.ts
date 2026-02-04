import { EFoodType } from "@/types/level";

export enum ECutType {
  normalFood = "normalFood",
  notValid = "notValid",
  // normalWithCuttingBoard = "normalWithCuttingBoard",
  // cuttingBoard = "cuttingBoard",
}
type ICanCutFoodEnable = {
  type: "cuttingBoard";
};
export const valiableCut = [
  EFoodType.tomato,
  EFoodType.cheese,
  EFoodType.meatPatty,
];
export type ICanCutFoodType = false | ICanCutFoodEnable;
export interface ICanCutResult {
  type: "canCutFood";
  result: boolean; //ICanCutFoodType;
}
// export const canCutFood = (
//   highlighted: IFoodWithRef | undefined,
//   hand: IFoodWithRef,
// ): ICanCutResult => {
//   return {
//     type: "canCutFood",
//     result: canCutFoodInner(highlighted, hand),
//   };
// };

// function foodType(food: IFoodWithRef): ECookType {
//   if (food.foodModel) {
//     return ECutType.notValid;
//   } else {
//     if (isNormalFood(food)) {
//       // 可以烹饪的食材才算正常食品
//       return ECookType.normal;
//     } else if (food.type === EGrabType.pan) {
//       return ECookType.pan;
//     } else if (food.type === EGrabType.plate) {
//       return ECookType.plate;
//     }
//     return ECookType.notValid;
//   }
// }
// export const canCutFoodInner= (
//   highlighted: IFoodWithRef | undefined,
//   hand: IFoodWithRef,
// ): ICanCutFoodType => {
//   // if (highlighted && highlighted.type === EFoodType.cuttingBoard) {
//   //   return {
//   //     type: "cuttingBoard",
//   //   };
//   // }
// }
