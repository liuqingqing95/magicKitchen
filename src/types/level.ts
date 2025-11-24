import type { ComponentType, MutableRefObject } from "react";
import * as THREE from "three";
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
export enum IFoodType {
  Hamburger = "hamburger",
  Plate = "plate",
}
export interface IFoodPostion {
  id: string;
  position: [number, number, number];
  type: IFoodType;
}
export interface BlockStartProps extends BlockProps {
  foods: IFoodWithRef[];
}

export interface IFoodWithRef extends IFoodPostion {
  ref: MutableRefObject<THREE.Group | null>;
}

export interface GrabbedItem {
  ref: React.RefObject<THREE.Group>;
  offset: THREE.Vector3;
}
