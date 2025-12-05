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

// export interface BlockStartProps {
//   position?: [number, number, number];
// }
export enum EGrabType {
  hamburger = "hamburger",
  plate = "plate",
  fireExtinguisher = "fireExtinguisher",
  pan = "pan",
}
export interface IGrabPosition {
  id: string;
  position: [number, number, number];
  type: EGrabType;
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

export interface IFoodWithRef extends IGrabPosition {
  model: THREE.Group;
  ref: MutableRefObject<(THREE.Group & { rigidBody?: RapierRigidBody }) | null>;
}

export interface GrabbedItem {
  ref: React.RefObject<THREE.Group>;
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

export interface IFurnitureItem {
  name: EFurnitureType;
  position: [number, number, number];
  rotate: EDirection;
}

export interface IGrabItem {
  name: EGrabType;
  position: [number, number, number];
  size: [number, number, number];
  grabbingPosition: {
    inFloor: number;
    inHand: number;
    inTable: number;
  };
}
