import { foodData } from "@/constant/data";
import { EFoodType } from "@/types/level";
import { EDirection } from "@/types/public";

export const getRotation = (
  rotateDirection: EDirection
): [number, number, number] => {
  switch (rotateDirection) {
    case EDirection.left:
      return [0, Math.PI / 2, 0];
    case EDirection.right:
      return [0, -Math.PI / 2, 0];
    case EDirection.normal:
      return [0, 0, 0];
    case EDirection.back:
      return [0, Math.PI, 0];
  }
};

export const foodTableData = (
  type: EFoodType,
  position: [number, number, number]
) => {
  const foodInfo = foodData.find((food) => food.name === type);
  if (!foodInfo) {
    throw new Error(`Food type ${type} not found in foodData`);
  }
  return {
    name: type,
    position: [position[0], foodInfo.position[1], position[2]] as [
      number,
      number,
      number,
    ],
    size: foodInfo.size as [number, number, number],
    grabbingPosition: foodInfo.grabbingPosition,
  };
};
