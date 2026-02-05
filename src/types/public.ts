import { RapierRigidBody } from "@react-three/rapier";
import { EFoodType } from "./level";

export enum EDirection {
  // normal: 面向z轴正方向
  normal,
  back,
  left,
  right,
}
export interface IPlayerCollisionEvent {
  rigidBody: RapierRigidBody & { userData: { id: string | number } };
}

export enum EHandleIngredient {
  cooking,
  cutting,
  none,
}
export interface ITime {
  timeLeft: number;
  isActive: boolean;
  progressPercentage: number;
}
export interface IHandleIngredientDetail {
  id: string;
  type: EHandleIngredient;
  status: number | false;
  rotateDirection?: EDirection;
}
export interface Burger extends ITime {
  label: string;
  materials: EFoodType[];
  score: number;
  expiresAt?: number;
}
