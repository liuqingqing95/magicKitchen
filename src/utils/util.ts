import { EDirection } from '@/types/public';

export const getRotation = (rotate: EDirection): [number, number, number] => {
  switch (rotate) {
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