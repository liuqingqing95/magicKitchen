import { foodData } from "@/constant/data";
import { EFoodType, EGrabType } from "@/types/level";

export function assembleBurger(
  current: Array<{ id: string; type?: any }> | undefined,
  info: { type: any }
) {
  const arr = current || [];
  const partIds = arr.map((i) => i.id);
  if (arr.length > 2 || arr.length === 0) {
    return { ok: false, partIds };
  }

  if (
    arr.length === 1

    // Object.values(foodData).findIndex((i) => i.name === arr[0].type) == 0
  ) {
    if (arr[0].type !== EFoodType.burger) {
      if (
        info.type !== EFoodType.cuttingBoardRound &&
        info.type !== EFoodType.burger
      ) {
        return { ok: false, partIds };
      }
      return { ok: false, partIds };
    } else if (
      info.type === EFoodType.cuttingBoardRound ||
      info.type === EFoodType.burger
    ) {
      return { ok: false, partIds };
    }
  }

  if (arr.length === 2) {
    if (arr.findIndex((i) => i.type === EGrabType.plate) === -1) {
      return { ok: false, partIds };
    } else if (
      arr
        .filter((item) => item.type !== EGrabType.plate)
        .some(
          (i) =>
            Object.values(foodData).findIndex((f) => f.name === i.type) === -1
        )
    ) {
      return { ok: false, partIds };
    }
  }

  const hasBread = arr.some(
    (i) => i.type === EFoodType.cuttingBoardRound || i.type === EFoodType.burger
  );
  if (!hasBread) {
    return {
      ok:
        info.type === EFoodType.cuttingBoardRound ||
        info.type === EFoodType.burger,
      partIds,
    };
  }
  return { ok: hasBread, partIds };
}
