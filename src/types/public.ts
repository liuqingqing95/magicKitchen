import { RapierRigidBody } from "@react-three/rapier";

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

export interface IHandleIngredientDetail {
  id: string;
  type: EHandleIngredient;
  status: number | false;
  rotateDirection: EDirection;
}
