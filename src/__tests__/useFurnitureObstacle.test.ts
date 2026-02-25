import store from "@/stores/index";
import {
  clearObstacles,
  getObstacleInfo,
  getOpenFoodTable,
  registerObstacle,
  setHighlightedFurniture,
  setHighlightId,
  setOpenFoodTable,
  setRegistry,
  unregisterObstacle,
} from "@/stores/useFurnitureObstacle";
import { EFurnitureType, TPLayerId } from "@/types/level";

describe("useFurnitureObstacle helpers (direct store) API", () => {
  beforeEach(() => {
    // reset furniture state
    clearObstacles();
    setRegistry(false);
    setHighlightId("firstPlayer" as TPLayerId, false);
  });

  const makeObstacle = (id: string) => ({
    id,
    position: [0, 0, 0] as [number, number, number],
    type: EFurnitureType.foodTable,
    size: [1, 1, 1] as [number, number, number],
    isMovable: false,
  });

  it("registers and retrieves obstacle info", () => {
    const id = "F_1";
    registerObstacle(id, makeObstacle(id));

    const info = getObstacleInfo(id);
    expect(info).toBeDefined();
    expect(info?.id).toBe(id);
  });

  it("toggles openFoodTable", () => {
    const tableId = "table_1";
    setOpenFoodTable(tableId);
    expect(getOpenFoodTable(tableId)).toBe(true);
    setOpenFoodTable(tableId);
    expect(getOpenFoodTable(tableId)).toBe(false);
  });

  it("manages highlights and registry flag", () => {
    const id = "F_high";
    registerObstacle(id, makeObstacle(id));

    setHighlightId("firstPlayer" as TPLayerId, id);
    expect(store.getState().furniture.highlightIds.firstPlayer).toBe(id);

    setHighlightedFurniture("firstPlayer" as TPLayerId, id, true);
    expect(
      store
        .getState()
        .furniture.highlightedFurniture.firstPlayer.find((f) => f.id === id),
    ).toBeDefined();

    setHighlightedFurniture("firstPlayer" as TPLayerId, id, false);
    expect(
      store
        .getState()
        .furniture.highlightedFurniture.firstPlayer.find((f) => f.id === id),
    ).toBeUndefined();

    setRegistry(true);
    expect(store.getState().furniture.registryFurniture).toBe(true);
  });

  it("unregisters and clears obstacles", () => {
    const id = "F_2";
    registerObstacle(id, makeObstacle(id));
    setHighlightedFurniture("firstPlayer" as TPLayerId, id, true);

    unregisterObstacle(id);
    expect(store.getState().furniture.obstacles[id]).toBeUndefined();
    expect(
      store
        .getState()
        .furniture.highlightedFurniture.firstPlayer.find((f) => f.id === id),
    ).toBeUndefined();

    registerObstacle(id, makeObstacle(id));
    clearObstacles();
    expect(Object.keys(store.getState().furniture.obstacles).length).toBe(0);
  });
});
