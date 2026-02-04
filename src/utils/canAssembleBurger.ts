import {
  BaseFoodModelType,
  EFoodType,
  EGrabType,
  IFoodWithRef,
  MultiFoodModelType,
} from "@/types/level";
import { difference, intersection } from "lodash";
import { valiableCook } from "./canCook";
import { valiableCut } from "./canCut";
import { isInclude, isMultiFoodModelType } from "./util";
const valiable = [EFoodType.cheese, EFoodType.tomato, EFoodType.meatPatty];

const getInfo = (
  target: IFoodWithRef,
  other: IFoodWithRef,
  otherType: string,
  type: string,
) => {
  const arr = (target.foodModel as MultiFoodModelType).type;
  const baseType = isInclude(otherType, "plate")
    ? (other.foodModel as BaseFoodModelType).type
    : other.type;
  if (arr.findIndex((item) => item.type === baseType) > -1) {
    return "forbidAssemble";
  } else {
    return multiInfo(type);
  }
};
const canProductBurger = (
  type: string,
  highlighted: IFoodWithRef,
  hand: IFoodWithRef,
) => {
  const highlightedType = type.split("&")[0];
  const handType = type.split("&")[1];

  if (isInclude(highlightedType, "burger")) {
    return getInfo(highlighted, hand, handType, type);
  } else {
    return getInfo(hand, highlighted, highlightedType, type);
  }
};
export interface IBurgerDetail {
  type: "multiBurger";
  plate: "highlighted" | "hand" | false;
  burger: "highlighted" | "hand" | false;
  bread: "highlighted" | "hand" | false;
}

const haveTarget = (
  highlighted: string,
  hand: string,
  target: "plate" | "burger" | "bread",
) => {
  return isInclude(highlighted, target)
    ? "highlighted"
    : isInclude(hand, target)
      ? "hand"
      : false;
};
const multiInfo = (type: string): IBurgerDetail => {
  const highlighted = type.split("&")[0];
  const hand = type.split("&")[1];
  const plate = haveTarget(highlighted, hand, "plate");

  const burger = haveTarget(highlighted, hand, "burger");
  const bread = haveTarget(highlighted, hand, "bread");
  return {
    type: "multiBurger",
    plate,
    burger,
    bread,
  };
};
type IPlateAddMultiNormalFood = {
  type: "plateAddMultiNormalFood";
};
type IMultiNormalCreateBurger = {
  type: "multiNormalCreateBurger";
  leaveGrab: boolean;
};
type IPlateBurgerAddMultiNormalFood = {
  type: "plateBurgerAddMultiNormalFood";
  leaveGrab: boolean;
};
type IMultiNormalFoodAddIngredient = {
  type: "multiNormalFoodAddIngredient";
  leaveGrab: boolean;
};
export type ISinglePlateDetail = {
  type: "singleFoodOnPlate";
};
export interface IPlateChangeDetail {
  type: "plateChange";
}
export type IAssembleMultiFoodEnable =
  | IBurgerDetail
  | ISinglePlateDetail
  | IPlateAddMultiNormalFood
  | IMultiNormalCreateBurger
  | IPlateBurgerAddMultiNormalFood
  | IMultiNormalFoodAddIngredient
  | IPlateChangeDetail;
export type IForbidAssemble = "forbidAssemble";
export type IAssembleMultiFoodType = IAssembleMultiFoodEnable | IForbidAssemble;
export interface IAssembleMultiFoodResult {
  type: "assembleMultiFood";
  result: IAssembleMultiFoodType;
}

export enum EMultiFoodType {
  normalFood = "normalFood",
  bread = "bread",
  burger = "burger",
  plate = "plate",
  normalWidthPlate = "normalWidthPlate",
  multiNormalWidthPlate = "multiNormalWidthPlate",
  breadWithPlate = "breadWithPlate",
  burgerWithPlate = "burgerWithPlate",
  notValid = "notValid",
}
function multiNormalValid(
  target: IFoodWithRef,
  other: IFoodWithRef,
  leaveGrab: boolean,
): IMultiNormalFoodAddIngredient | IForbidAssemble {
  if (target.foodModel && isMultiFoodModelType(target.foodModel)) {
    if (
      target.foodModel.type.findIndex((item) => {
        item.type === other.type;
      }) > -1
    ) {
      return "forbidAssemble";
    }
    return {
      type: "multiNormalFoodAddIngredient",
      leaveGrab,
    };
  }
  return "forbidAssemble";
}

function burgerAddMultiNormal(
  target: IFoodWithRef,
  other: IFoodWithRef,
  leaveGrab: boolean,
): IPlateBurgerAddMultiNormalFood | IForbidAssemble {
  if (
    target.foodModel &&
    isMultiFoodModelType(target.foodModel) &&
    other.foodModel &&
    isMultiFoodModelType(other.foodModel)
  ) {
    if (
      intersection(
        target.foodModel.type.map((i) => i.type),
        other.foodModel.type.map((i) => i.type),
      ).length > 0
    ) {
      return "forbidAssemble";
    }
    return {
      type: "plateBurgerAddMultiNormalFood",
      leaveGrab,
    };
  }
  return "forbidAssemble";
}
function isNormalFood(food: IFoodWithRef) {
  const cutOnlyArr = difference(valiableCut, valiableCook);
  const cutAndCook = intersection(valiableCook, valiableCut);
  const cookOnlyArr = difference(valiableCook, valiableCut);
  if (
    Object.values(cutOnlyArr).includes(food.type as EFoodType) &&
    food.isCut
  ) {
    return EMultiFoodType.normalFood;
  }
  if (
    cutAndCook.includes(food.type as EFoodType) &&
    food.isCut &&
    food.isCook
  ) {
    return EMultiFoodType.normalFood;
  }
  if (cookOnlyArr.includes(food.type as EFoodType) && food.isCook) {
    return EMultiFoodType.normalFood;
  }
  return false;
}

export function foodType(food: IFoodWithRef): EMultiFoodType {
  if (food.foodModel) {
    if (isMultiFoodModelType(food.foodModel)) {
      if (food.type === EFoodType.burger) {
        return EMultiFoodType.burger;
      } else if (food.type === EGrabType.plate) {
        if (food.foodModel.type.find((i) => i.type === EFoodType.bread)) {
          return EMultiFoodType.burgerWithPlate;
        }
        return EMultiFoodType.multiNormalWidthPlate;
      }
      return EMultiFoodType.notValid;
    } else {
      if (food.type === EGrabType.plate) {
        if (Object.values(valiable).includes(food.foodModel.type)) {
          return EMultiFoodType.normalWidthPlate;
        } else if (food.foodModel.type === EFoodType.bread) {
          return EMultiFoodType.breadWithPlate;
        }
      }
      return EMultiFoodType.notValid;
    }
  } else {
    if (Object.values(valiable).includes(food.type as EFoodType)) {
      if (isNormalFood(food)) {
        return EMultiFoodType.normalFood;
      }
      return EMultiFoodType.notValid;
    } else if (food.type === EFoodType.bread) {
      return EMultiFoodType.bread;
    } else if (food.type === EGrabType.plate) {
      return EMultiFoodType.plate;
    }
    return EMultiFoodType.notValid;
  }
}
export const assembleType = (highlighted: IFoodWithRef, hand: IFoodWithRef) => {
  const highlightedType = foodType(highlighted);
  const handType = foodType(hand);

  return `${highlightedType}&${handType}`;
};
export function assembleMultiFood(
  highlighted: IFoodWithRef | undefined,
  hand: IFoodWithRef,
): IAssembleMultiFoodResult {
  return {
    type: "assembleMultiFood",
    result: assembleDetail(highlighted, hand),
  };
}
// 制作复合物品：汉堡，含碟子的食物
function assembleDetail(
  highlighted: IFoodWithRef | undefined,
  hand: IFoodWithRef,
): IAssembleMultiFoodEnable | IForbidAssemble {
  if (!highlighted) return "forbidAssemble";
  const type = assembleType(highlighted, hand);
  switch (type) {
    case `${EMultiFoodType.normalFood}&${EMultiFoodType.normalFood}`:
    case `${EMultiFoodType.bread}&${EMultiFoodType.bread}`:

    case `${EMultiFoodType.bread}&${EMultiFoodType.burger}`:
    case `${EMultiFoodType.burger}&${EMultiFoodType.bread}`:

    case `${EMultiFoodType.burger}&${EMultiFoodType.burger}`:

    case `${EMultiFoodType.burger}&${EMultiFoodType.breadWithPlate}`:
    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.burger}`:

    case `${EMultiFoodType.plate}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.normalWidthPlate}`:

    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.bread}`:
    case `${EMultiFoodType.bread}&${EMultiFoodType.breadWithPlate}`:

    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.breadWithPlate}`:

    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.burgerWithPlate}`:
    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.breadWithPlate}`:

    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.bread}`:
    case `${EMultiFoodType.bread}&${EMultiFoodType.burgerWithPlate}`:

    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.burger}`:
    case `${EMultiFoodType.burger}&${EMultiFoodType.burgerWithPlate}`:

    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.burgerWithPlate}`:

    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.normalWidthPlate}`:
      return "forbidAssemble";

    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.plate}&${EMultiFoodType.normalWidthPlate}`:

    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.plate}&${EMultiFoodType.breadWithPlate}`:

    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.plate}&${EMultiFoodType.burgerWithPlate}`:

    case `${EMultiFoodType.multiNormalWidthPlate}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.plate}&${EMultiFoodType.multiNormalWidthPlate}`:
      return {
        type: "plateChange",
      };

    case `${EMultiFoodType.normalFood}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.plate}&${EMultiFoodType.normalFood}`:
    case `${EMultiFoodType.bread}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.plate}&${EMultiFoodType.bread}`:
      return {
        type: "singleFoodOnPlate",
      };

    case `${EMultiFoodType.bread}&${EMultiFoodType.multiNormalWidthPlate}`:
    case `${EMultiFoodType.multiNormalWidthPlate}&${EMultiFoodType.bread}`:
      return {
        type: "multiNormalCreateBurger",
        leaveGrab: true,
      };

    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.multiNormalWidthPlate}`:
    case `${EMultiFoodType.multiNormalWidthPlate}&${EMultiFoodType.breadWithPlate}`:
      return {
        type: "multiNormalCreateBurger",
        leaveGrab: false,
      };

    case `${EMultiFoodType.burger}&${EMultiFoodType.multiNormalWidthPlate}`:
    case `${EMultiFoodType.multiNormalWidthPlate}&${EMultiFoodType.burger}`:
      return burgerAddMultiNormal(highlighted, hand, true);
    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.multiNormalWidthPlate}`:
    case `${EMultiFoodType.multiNormalWidthPlate}&${EMultiFoodType.burgerWithPlate}`:
      return burgerAddMultiNormal(highlighted, hand, false);

    case `${EMultiFoodType.multiNormalWidthPlate}&${EMultiFoodType.normalFood}`:
      return multiNormalValid(highlighted, hand, true);
    case `${EMultiFoodType.normalFood}&${EMultiFoodType.multiNormalWidthPlate}`:
      return multiNormalValid(hand, highlighted, true);

    case `${EMultiFoodType.normalFood}&${EMultiFoodType.bread}`:
    case `${EMultiFoodType.bread}&${EMultiFoodType.normalFood}`:

    case `${EMultiFoodType.normalFood}&${EMultiFoodType.breadWithPlate}`:
    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.normalFood}`:

    case `${EMultiFoodType.bread}&${EMultiFoodType.normalWidthPlate}`:
    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.bread}`:

    case `${EMultiFoodType.burger}&${EMultiFoodType.plate}`:
    case `${EMultiFoodType.plate}&${EMultiFoodType.burger}`:

    case `${EMultiFoodType.burger}&${EMultiFoodType.normalWidthPlate}`:
    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.burger}`:

    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.breadWithPlate}`:
    case `${EMultiFoodType.breadWithPlate}&${EMultiFoodType.normalWidthPlate}`:
      return multiInfo(type);

    case `${EMultiFoodType.burger}&${EMultiFoodType.normalFood}`:
    case `${EMultiFoodType.normalFood}&${EMultiFoodType.burger}`:

    case `${EMultiFoodType.normalFood}&${EMultiFoodType.burgerWithPlate}`:
    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.normalFood}`:

    case `${EMultiFoodType.burgerWithPlate}&${EMultiFoodType.normalWidthPlate}`:
    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.burgerWithPlate}`:
      return canProductBurger(type, highlighted, hand);

    case `${EMultiFoodType.normalWidthPlate}&${EMultiFoodType.normalFood}`:
    case `${EMultiFoodType.normalFood}&${EMultiFoodType.normalWidthPlate}`:
      return {
        type: "plateAddMultiNormalFood",
      };

    default:
      console.error("Unhandled assembleMultiFood case:", type);
      return "forbidAssemble";
  }
  // if (highlighted.foodModel) {
  //   if (isMultiFoodModelType(highlighted.foodModel)) {
  //     const arr = highlighted.foodModel.type as {
  //       id: string;
  //       type: EFoodType;
  //     }[];
  //     if (hand.type === EFoodType.bread || hand.type === EFoodType.burger) {
  //       return false;
  //     } else if (arr.findIndex((i) => i.type === hand.type) !== -1) {
  //       //每种食材只能放一个
  //       return false;
  //     } else if (excapePlateArr.includes(hand.type as any)) {
  //       // 不能放除盘子以外的抓取物品
  //       return false;
  //     } else if (
  //       highlighted.type === EGrabType.plate &&
  //       hand.type === EGrabType.plate
  //     ) {
  //       return false;
  //     }
  //     return havePlate(highlighted, hand);
  //   } else {
  //     if (Object.values(EFoodType).includes(hand.type as any)) {
  //       if (hand.type === EFoodType.burger) {
  //         if (highlighted.foodModel.type === EFoodType.bread) {
  //           return false;
  //         } else if (
  //           isMultiFoodModelType(hand.foodModel) &&
  //           hand.foodModel?.type.findIndex(
  //             (i) => i.type === highlighted.type
  //           ) === -1
  //         ) {
  //           return {
  //             plate: "highlighted",
  //             burger: "hand",
  //           };
  //         } else {
  //           return false;
  //         }
  //       } else if (highlighted.foodModel.type === hand.type) {
  //         return false;
  //       } else if (
  //         highlighted.foodModel.type === EFoodType.bread ||
  //         hand.type === EFoodType.bread
  //       ) {
  //         return {
  //           plate: "highlighted",
  //           burger: false,
  //         };
  //       } else {
  //         return false;
  //       }
  //     } else if (Object.values(EGrabType).includes(hand.type as any)) {
  //       return false;
  //     }
  //     return false;
  //   }
  // } else {
  //   // 目标模型为单一模型
  //   if (Object.values(EFoodType).includes(highlighted.type as EFoodType)) {
  //     if (hand.type === EGrabType.plate) {
  //       if (highlighted.type === EFoodType.burger) {
  //         return {
  //           plate: "hand",
  //           burger: "highlighted",
  //         };
  //       }
  //       return EGrabType.plate;
  //     } else if (hand.type === EFoodType.burger) {
  //       // 目标模型和手上的汉堡材料不能重复
  //       if (
  //         isMultiFoodModelType(hand.foodModel) &&
  //         hand.foodModel.type.findIndex((i) => i.type === highlighted.type) ===
  //           -1
  //       ) {
  //         return {
  //           plate: false,
  //           burger: "hand",
  //         };
  //       }
  //       return false;
  //     } else if (
  //       canProductBread(highlighted, hand) ||
  //       canProductBread(hand, highlighted)
  //     ) {
  //       return {
  //         plate: false,
  //         burger: false,
  //       };
  //     }
  //   } else if (excapePlateArr.includes(highlighted.type as any)) {
  //     // 不能放除盘子以外的抓取物品
  //     return false;
  //   } else if (highlighted.type === EGrabType.plate) {
  //     if (Object.values(EFoodType).includes(hand.type as any)) {
  //       if (hand.type === EFoodType.burger) {
  //         return {
  //           plate: "highlighted",
  //           burger: "hand",
  //         };
  //       }
  //       return EGrabType.plate;
  //     }
  //     return false;
  //   }
  //   return false;
  // }
}
