import { useObstacleStore } from "@/stores/useObstacle";
import { EFoodType, EGrabType, IGrabPosition } from "@/types/level";

type Vec3 = [number, number, number];

// Simple id generator for new assembled items
// const genId = (prefix = "Grab_burger_") =>
//   `${prefix}${Math.random().toString(36).slice(2, 9)}`;

/**
 * Place an existing item onto a furniture: updates obstacle position and append the furniture index.
 * Returns true when the operation succeeded.
 */
export function placeItemOnFurniture(
  furnId: string,
  itemId: string,
  pos?: Vec3
) {
  const store = useObstacleStore.getState();
  const info = store.getObstacleInfo(itemId);
  if (!info) return false;

  const position = pos ?? info.position;
  // conservative update: update obstacle position first
  store.updateObstaclePosition(itemId, position);

  const arr = store.getGrabOnFurniture(furnId) || [];
  // avoid dupes
  if (arr.find((i) => i.id === itemId)) return true;
  store.setGrabOnFurniture(furnId, [...arr, { id: itemId, type: info.type }]);

  return true;
}

/**
 * Remove an item from a furniture list (does not unregister obstacle).
 */
export function removeItemFromFurniture(furnId: string, itemId: string) {
  const store = useObstacleStore.getState();
  const arr = store.getGrabOnFurniture(furnId) || [];
  store.setGrabOnFurniture(
    furnId,
    arr.filter((i) => i.id !== itemId)
  );
}

/**
 * Replace multiple items on a furniture with a single new obstacle (e.g. assembled burger).
 * - oldIds: items to remove (their obstacles will be unregistered)
 * - newEntry: object with id/type/position/foodModel etc. If id omitted a new id will be generated.
 * Returns the new id.
 */
export function replaceItemsWithNewObstacle(
  furnId: string,
  oldIds: string[],
  newEntry: Partial<IGrabPosition> & {
    id: string;
    type: EFoodType | EGrabType;
  }
) {
  const store = useObstacleStore.getState();
  // compute position: prefer provided, otherwise take first old item's position
  let position: Vec3 | undefined = newEntry.position;
  if (!position && oldIds.length) {
    const first = store.getObstacleInfo(oldIds[0]);
    if (first) position = first.position;
  }

  const newId = newEntry.id;

  const obstacle = {
    id: newId,
    type: newEntry.type,
    position: position ?? [0, 0, 0],
    isCut: newEntry.isCut ?? false,
    isCook: newEntry.isCook ?? false,
    size: newEntry.size ?? ([1, 1, 1] as Vec3),
    grabbingPosition: newEntry.grabbingPosition,
    isFurniture: false,
  } as IGrabPosition;

  // unregister old obstacles and remove from foods/furniture lists
  oldIds.forEach((id) => {
    try {
      store.unregisterObstacle(id);
    } catch (e) {
      // ignore
    }
  });

  // register new obstacle
  store.registerObstacle(newId, obstacle);

  // replace furniture list entries to reference the new id
  const current = store.getGrabOnFurniture(furnId) || [];
  const filtered = current.filter((i) => oldIds.indexOf(i.id) === -1);
  filtered.unshift({ id: newId, type: newEntry.type });
  store.setGrabOnFurniture(furnId, filtered);

  return newId;
}

/**
 * Start a cooking timer / mark cooking-in-progress. We simply toggle flags on obstacle.
 */
export function startCooking(itemId: string) {
  const store = useObstacleStore.getState();
  // optional: set a transient state (not modeled here). For now leave to caller to manage timers.
  store.updateObstacleInfo(itemId, { isCook: false });
}

export function finishCooking(itemId: string) {
  const store = useObstacleStore.getState();
  store.updateObstacleInfo(itemId, { isCook: true });
}

export function markCutDone(itemId: string) {
  const store = useObstacleStore.getState();
  store.updateObstacleInfo(itemId, { isCut: true });
}

export default {
  placeItemOnFurniture,
  removeItemFromFurniture,
  replaceItemsWithNewObstacle,
  startCooking,
  finishCooking,
  markCutDone,
};
