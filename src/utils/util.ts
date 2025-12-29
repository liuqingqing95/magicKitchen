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

export const getSensorParams = (
  rotateDirection: EDirection
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
export const transPosition = (id: string): [number, number, number] => {
  const arr = id.split("_");
  return [parseFloat(arr[2]), parseFloat(arr[3]), parseFloat(arr[4])];
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
export function resolveGrabTarget(evt: any, world: any) {
  // evt 可能包含 collider, collider.handle, rigidBody, rigidBody.handle
  let collider = evt.collider ?? null;
  let rigidBody = evt.rigidBody ?? null;

  // 如果只拿到 handle（某些绑定会传 handle），用 world 查回对象
  try {
    if (!collider && evt.colliderHandle != null) {
      collider = world.getCollider(evt.colliderHandle);
    }
    if (!rigidBody && evt.rigidBodyHandle != null) {
      rigidBody = world.getRigidBody(evt.rigidBodyHandle);
    }
  } catch (e) {
    // ignore lookup errors
  }

  // 如果只有 collider，尝试通过 collider.parent() 找到刚体
  try {
    if (!rigidBody && collider && typeof collider.parent === "function") {
      const parentHandle = collider.parent(); // rapier 返回 parent rigid body handle
      if (parentHandle != null) rigidBody = world.getRigidBody(parentHandle);
    }
  } catch (e) {}

  // 优先使用 rigidBody.userData（通常我们把 id 放在刚体上）
  const idFromRB = rigidBody?.userData ?? null;
  // 再查 collider.userData
  const idFromCollider = collider?.userData?.id ?? collider?.userData ?? null;

  const id = idFromRB ?? idFromCollider ?? null;

  return { id, collider, rigidBody };
}
