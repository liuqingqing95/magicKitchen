import type { RapierRigidBody } from "@react-three/rapier";
import type { ComponentType, MutableRefObject } from "react";
import * as THREE from "three";
import { EDirection } from "./public";
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
  isMovable?: boolean;
  grabbingPosition: {
    inFloor: number;
    inHand: number;
    inTable: number;
  };
  rotation?: [number, number, number, number];
}
// export interface BlockStartProps extends BlockProps {
//   foods: IFoodWithRef[];
// }
export type IGrabTargetRef = MutableRefObject<
  (THREE.Group & { rigidBody?: RapierRigidBody; id: string }) | null
>;
export interface IFoodWithRef extends IGrabPosition {
  model: THREE.Group;
  ref: IGrabTargetRef;
}

export interface GrabbedItem {
  ref: IGrabTargetRef;
  offset: THREE.Vector3;
}

export enum EFurnitureType {
  baseTable = "baseTable",
  drawerTable = "drawerTable",
  washSink = "washSink",
  trash = "trash",
  foodTable = "foodTable",
  gasStove = "gasStove",
  serveDishes = "serveDishes",
}
export enum EFoodType {
  cheese = "cheese",
  eggCooked = "eggCooked",
  meatPatty = "meatPatty",
  cuttingBoardRound = "cuttingBoardRound",
  burger = "burger",
}

export enum EGrabType {
  // hamburger = "hamburger",
  plate = "plate",
  fireExtinguisher = "fireExtinguisher",
  pan = "pan",
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
  grabbingPosition: {
    inFloor: number;
    inHand: number;
    inTable: number;
  };
}
