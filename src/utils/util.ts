import { foodData, FURNITURE_ARR, GRAB_ARR } from "@/constant/data";
import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  ERigidBodyType,
  FoodModelType,
  IFoodData,
  IFoodWithRef,
  IGrabItem,
} from "@/types/level";
import { EDirection } from "@/types/public";
import { capitalize, isEqual, random } from "lodash";
import * as THREE from "three";

export const isInclude = (str: string, target: string) => {
  return str.includes(target) || str.includes(capitalize(target));
};
export const foodPosYInTable = (food: EGrabType | EFoodType) => {
  if (Object.values(EFoodType).includes(food)) {
    const obj = foodData.find((item) => item.type === food);
    if (obj) {
      return obj.grabbingPosition?.inTable || 0 + 1;
    }
  } else {
    return (
      GRAB_ARR.find((item) => item.type === food)?.grabbingPosition?.inHand || 0
    );
  }

  return 0;
};
export const computeGrabRotationFromPlayer = (type: EGrabType | EFoodType) => {
  let yaw: number = 0; //+GRAB_YAW_OFFSET;
  switch (type) {
    case EGrabType.fireExtinguisher:
      // EDirection right
      yaw = -Math.PI / 2;
      break;
    case EGrabType.pan:
      // EDirection normal
      yaw = Math.PI;
      break;
    case EFoodType.bread:
      // EDirection normal
      yaw = Math.PI / 2;
      break;
    case EFoodType.meatPatty:
      // EDirection normal
      yaw = -Math.PI * 0.7;
      break;
    default:
      break;
  }
  console.log("computeGrabRotationFromPlayer", type, yaw);
  return yaw;
};

export const getRotation = (
  rotateDirection: EDirection,
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
export const isMultiFoodModelType = (val?: FoodModelType) => {
  return Array.isArray(val?.type);
};
export const foodContainerTypes = [EGrabType.plate, EGrabType.pan];

export const findObstacleByPosition = <T>(
  obstacles: Map<string, T> | { [key: string]: T },
  x: number,
  z: number,
) => {
  const isMap = obstacles instanceof Map;
  const entries = isMap ? obstacles.entries() : Object.entries(obstacles);
  for (const [key, val] of entries) {
    if (pathInclude(key, x, z)) {
      return { key, val };
    }
  }
  return null;
};

export const getSensorParams = (
  rotateDirection: EDirection,
): { pos: [number, number, number]; args: [number, number, number] } => {
  // const obj:  = {
  //   pos: [],
  //   args: []
  // }
  //
  // [scale[0] * 1.3, 0.3, scale[2] * 1.3]
  switch (rotateDirection) {
    case EDirection.left:
      return {
        pos: [0, 0.3, 0.65],
        args: [1, 0.3, 1.3],
      };
    case EDirection.right:
      return {
        pos: [0, 0.3, 0.65],
        args: [1, 0.3, 1.3],
      };
    case EDirection.normal:
      return {
        pos: [0, 0.3, 0.65],
        args: [1, 0.3, 1.3],
      };
    case EDirection.back:
      return {
        pos: [0, 0.3, 0.65],
        args: [1, 0.3, 1.3],
      };
  }
};
export const transPosition = (id: string): [number, number] => {
  const arr = id.split("_");
  return [parseFloat(arr[2]), parseFloat(arr[3])];
};
export const pathInclude = (path: string, x: number, z: number) => {
  const targetX = transPosition(path)[0];
  const targetZ = transPosition(path)[1];
  return targetX === x && targetZ === z;
};
export const getId = (
  idType: ERigidBodyType,
  type: EFoodType | EGrabType | EFurnitureType,
  uuid: string,
) => {
  return `${capitalize(idType)}_${type}_${uuid}`;
};

export const deepCompare = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  cb?: (keys: Array<keyof T & string>, nextProps: T) => void,
): boolean => {
  const isSame = isEqual(nextProps, prevProps);
  if (!isSame && cb) {
    const changedKeys = Object.keys(nextProps).filter(
      (key) =>
        // use loose any indexing to avoid TS index errors while using deep equality
        !isEqual((nextProps as any)[key], (prevProps as any)[key]),
    ) as Array<keyof T & string>;

    cb(changedKeys, nextProps);
  }
  return isSame;
};
export const createFoodItem = (
  item: IGrabItem,
  model: THREE.Group,
  visible: boolean = true,
  modelMapRef?: React.MutableRefObject<Map<
    string,
    THREE.Group<THREE.Object3DEventMap>
  > | null>,
): IFoodWithRef => {
  const clonedModel = model.clone();
  const id = getId(ERigidBodyType.grab, item.type, clonedModel.uuid);
  modelMapRef?.current?.set(id, clonedModel);

  const obj: IFoodWithRef = {
    id,
    position: item.position,
    type: item.type,
    size: item.size,
    grabbingPosition: item.grabbingPosition,
    foodModel: undefined,
    rotation: item.rotateDirection
      ? getRotation(item.rotateDirection)
      : undefined,
    area: item.position[1] >= 1 ? "table" : "floor",
    visible: visible,
    isCook: undefined,
    isCut: undefined,
  };
  if (item.type === EFoodType.meatPatty) {
    // obj.isCook = true;
    obj.isCut = true;
  }
  if (item.type === EFoodType.tomato) {
    // obj.isCook = true;
    obj.isCut = true;
  }
  if (item.type === EFoodType.cheese) {
    // obj.isCook = true;
    obj.isCut = true;
  }
  return obj;
};
export function generateUUID() {
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";

  return template.replace(/[xy]/g, function (c) {
    const r = random(0, 15);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export const haveTarget = (
  highlighted: string,
  hand: string,
  target: "plate" | "burger" | "pan" | "bread",
) => {
  return isInclude(highlighted, target)
    ? "highlighted"
    : isInclude(hand, target)
      ? "hand"
      : false;
};

export const foodTableData = (type: EFoodType) => {
  const foodTable = FURNITURE_ARR.find((item) => {
    return item.type === EFurnitureType.foodTable && item.foodType === type;
  });
  if (!foodTable) {
    throw new Error(`Food table for type ${type} not found`);
  }
  const foodInfo = foodData.find((food) => food.type === type);
  if (!foodInfo) {
    throw new Error(`Food type ${type} not found in foodData`);
  }
  return createFoodData(type, foodInfo, foodTable.position);
};

export const createFoodData = (
  type: EFoodType,
  foodInfo: IFoodData,
  position: [number, number, number],
): IFoodData => {
  return {
    type: type,
    // position: foodInfo.position,
    position: [position[0], foodInfo.grabbingPosition?.inHand, position[2]] as [
      number,
      number,
      number,
    ],
    // visible: false,
    size: foodInfo.size as [number, number, number],
    grabbingPosition: foodInfo.grabbingPosition,
  };
};
