// src/logic/placement.ts
import type { EFoodType, EGrabType } from "@/types/level";
import * as THREE from "three";

export type ItemMeta = {
  id: string;
  type: EGrabType | EFoodType;
  size?: [number, number, number];
  // optional metadata (collisionGroups, locked flag, ...)
  collisionGroups?: number;
};

export type FurnitureMeta = {
  id: string;
  type: string;
  position: [number, number, number];
  size?: [number, number, number];
  slots?: Array<{ x: number; y: number; z: number }>;
};

export type PlaceContext = {
  playerPos: [number, number, number];
  playerQuat?: THREE.Quaternion; // prefer this for rotation-based logic
  playerRef?: React.MutableRefObject<any>; // optional, for callers that have playerRef
  obstacles?: { get: (id: string) => any; list?: () => any[] }; // minimal interface to check occupancy
  world?: any; // optional Rapier world for precise overlap queries
  debug?: boolean;
};

export type PlaceResult = {
  ok: boolean;
  reason?: string;
  suggested?: { position?: [number, number, number]; rotation?: THREE.Euler };
};

// per-model yaw offsets so you can fine-tune model axes without changing caller code
export const modelYawOffsets: Partial<Record<string, number>> = {
  // string keys can be EGrabType values
  fireExtinguisher: -Math.PI / 2,
  pan: 0,
  // add more if necessary
};

function getPlayerForwardFromQuat(q: THREE.Quaternion) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  forward.y = 0;
  forward.normalize();
  return forward;
}

/**
 * computeGrabRotation - compute world-space Euler yaw for a grabbed item so
 * item +X aligns with player forward (adjust by modelYawOffsets if needed).
 * @param item
 * @param ctx
 */
export function computeGrabRotation(
  item: ItemMeta,
  ctx: PlaceContext
): THREE.Euler {
  try {
    const q =
      ctx.playerQuat ??
      (ctx.playerRef && ctx.playerRef.current
        ? ctx.playerRef.current.getWorldQuaternion(new THREE.Quaternion())
        : new THREE.Quaternion());
    const forward = getPlayerForwardFromQuat(q as THREE.Quaternion);
    const baseYaw = Math.atan2(forward.z, forward.x);
    const offset = modelYawOffsets[item.type as string] ?? 0;
    return new THREE.Euler(0, baseYaw + offset, 0);
  } catch (e) {
    return new THREE.Euler(0, 0, 0);
  }
}

/**
 * canGrab - simple rules for whether the player may grab the item.
 * Keep this small: distance, locked flag, furniture occupancy.
 * For complex physics overlap use ctx.world in callers.
 */
export function canGrab(item: ItemMeta, ctx: PlaceContext): PlaceResult {
  // example: require player within 2 meters
  const player = new THREE.Vector3(...ctx.playerPos);
  const dummyItemPos = [0, 0, 0]; // caller can extend to pass actual world pos
  const dist = player.distanceTo(
    new THREE.Vector3(dummyItemPos[0], dummyItemPos[1], dummyItemPos[2])
  );
  if (dist > 3) return { ok: false, reason: "too_far" };
  // TODO: check locked flag / occupancy via ctx.obstacles
  return { ok: true };
}

/**
 * canPlaceAt - decides if an item can be placed onto a furniture target.
 * Uses coarse checks here; delegate precise overlapped colliders to ctx.world.
 */
export function canPlaceAt(
  item: ItemMeta,
  furniture: FurnitureMeta,
  ctx: PlaceContext
): PlaceResult {
  // check furniture type rules (example)
  // if furniture.type === 'trash' and item.type === 'someFood' -> allowed
  // check slots occupancy via ctx.obstacles
  if (!ctx.obstacles) return { ok: true }; // optimistic
  // example occupancy check:
  const existing = ctx.obstacles.list
    ? ctx.obstacles.list().find((o: any) => o.id === item.id)
    : null;
  // coarse success
  return { ok: true };
}

/**
 * helper: run a Rapier overlap test (optional)
 * Caller must pass ctx.world and a prepared collider shape if they need physics-accurate tests.
 */
export async function rapierOverlapCheck(
  world: any /* shape params */
): Promise<boolean> {
  if (!world) return false;
  // placeholder: real Rapier JS api usage depends on version; caller integrates as needed.
  return false;
}
