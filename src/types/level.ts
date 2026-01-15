import type { RapierRigidBody } from "@react-three/rapier";
import type { ComponentType, MutableRefObject } from "react";
import * as THREE from "three";
import { EDirection, IHandleIngredientDetail } from "./public";
export interface BlockProps {
  position?: [number, number, number];
}

export interface BoundsProps {
  length?: number;
}

export interface LevelProps {
  count?: number;
  types?: ComponentType<BlockProps>[];
  seed?: number;
  onFoodPositionUpdate?: (positions: IFoodWithRef[]) => void;
}
export enum ERigidBodyType {
  grab = "grab",
  furniture = "furniture",
}
// export interface BlockStartProps {
//   position?: [number, number, number];
// }

export interface IGrabPosition {
  id: string;
  position: [number, number, number];
  type: EGrabType | EFoodType;
  size: [number, number, number];
  isFurniture: false;
  grabbingPosition?: {
    inFloor: number;
    inHand: number;
    inTable: number;
  };
  visible?: boolean;
  isCook?: boolean;
  isCut?: boolean;
  rotation?: [number, number, number, number];
}
// export interface BlockStartProps extends BlockProps {
//   foods: IFoodWithRef[];
// }
export type IGrabTargetRef = MutableRefObject<
  THREE.Group & { rigidBody?: RapierRigidBody; id: string }
>;
export type BaseFoodModelType = {
  id: string;
  model: THREE.Group;
  type: EFoodType;
};
export type MultiFoodModelType = {
  id: string;
  // 子组件用不上model
  // model: THREE.Group;
  type: {
    id: string;
    type: EFoodType;
  }[];
};
export type FoodModelType = MultiFoodModelType | BaseFoodModelType;
export interface IFoodWithRef extends IGrabPosition {
  // model: THREE.Group;
  // ref: IGrabTargetRef;
  area?: "floor" | "table" | "hand";
  rotateDirection?: EDirection;
  handleIngredient?: IHandleIngredientDetail;
  foodModel?: FoodModelType;
  visible?: boolean;
}

export interface GrabbedItem {
  id: string;
  rigidBody: RapierRigidBody | null;
  offset: THREE.Vector3;
  rotation?: THREE.Euler;
}

// export interface IStablePropsRef {
//   initPosRef: React.MutableRefObject<[number, number, number]>;
//   sizeRef: React.MutableRefObject<[number, number, number]>;
//   modelRef: React.MutableRefObject<THREE.Group>;
//   foodModelRef: React.MutableRefObject<FoodModelType | undefined>;
//   handleIngredientRef: React.MutableRefObject<
//     IHandleIngredientDetail | undefined
//   >;
//   ref: IGrabTargetRef;
// }

export enum EFurnitureType {
  baseTable = "baseTable",
  drawerTable = "drawerTable",
  washSink = "washSink",
  trash = "trash",
  foodTable = "foodTable",
  // cuttingBoardTable = "cuttingBoardTable",
  // tomatoTable = "tomatoTable",
  // meatPattyTable = "meatPattyTable",
  // cheeseTable = "cheeseTable",
  gasStove = "gasStove",
  serveDishes = "serveDishes",
}
export enum EFoodType {
  cheese = "cheese",
  tomato = "tomato",
  meatPatty = "meatPatty",
  cuttingBoardRound = "cuttingBoardRound",
  burger = "burger",
}

export enum EGrabType {
  // hamburger = "hamburger",
  plate = "plate",
  fireExtinguisher = "fireExtinguisher",
  pan = "pan",
  cuttingBoard = "cuttingBoard",
  cuttingBoardNoKnife = "cuttingBoardNoKnife",
}

type FoodTableItem = {
  name: EFurnitureType.foodTable;
  position: [number, number, number];
  rotateDirection: EDirection;
  foodType: EFoodType; // 对于 foodTable，foodType 是必需的
};

type OtherFurnitureItem = {
  name: Exclude<EFurnitureType, EFurnitureType.foodTable>;
  position: [number, number, number];
  rotateDirection: EDirection;
};

export type IFurnitureItem = FoodTableItem | OtherFurnitureItem;

export interface IGrabItem {
  name: EGrabType | EFoodType;
  position: [number, number, number];
  size: [number, number, number];
  grabbingPosition?: {
    inFloor: number;
    inHand: number;
    inTable: number;
  };
  rotateDirection?: EDirection;
}

export interface ITABLEWARE {
  name: EGrabType | EFoodType;
  position: [number, number, number];
  size: [number, number, number];
  rotateDirection: EDirection;
}
export interface ITablewareItem {
  id: string;
  type: EGrabType | EFoodType;
  position: [number, number, number];
  size: [number, number, number];
}
export interface ITablewareWithRef extends ITablewareItem {
  // model: THREE.Group;
  // ref: IGrabTargetRef;
}
