import store from "@/stores/index";
import {
  clearObstacles,
  registerObstacle,
  removeCleanPlate,
  removeDirtyPlate,
  removeGrabOnFurniture,
  removePendingGrabId,
  setDirtyPlates,
  setGrabOnFurniture,
  setHeldItem,
  setHighlightedGrab,
  setPendingGrabId,
  setRealHighlight,
  unregisterObstacle,
  updateObstacleInfo,
} from "@/stores/useGrabObstacle";

describe("useGrabObstacleStore (direct store) API", () => {
  beforeEach(() => {
    clearObstacles();
    removeGrabOnFurniture("table_1");
  });

  it("registers and retrieves obstacle info", () => {
    const id = "T_1";
    registerObstacle(id, { id, type: "cheese" } as any);

    const info = store.getState().grab.obstacles[id];
    expect(info).toBeDefined();
    expect(info?.id).toBe(id);
    expect(Object.keys(store.getState().grab.obstacles).length).toBe(1);
  });

  it("clears obstacles and unregisters properly", () => {
    const id = "T_2";
    registerObstacle(id, { id, type: "meatPatty" } as any);

    unregisterObstacle(id);
    expect(store.getState().grab.obstacles[id]).toBeUndefined();
    registerObstacle(id, { id, type: "meatPatty" } as any);
    clearObstacles();
    expect(Object.values(store.getState().grab.obstacles).length).toBe(0);
  });

  it("sets and gets grabOnFurniture mapping", () => {
    const id = "T_table_item";
    registerObstacle(id, { id, type: "cheese" } as any);

    setGrabOnFurniture("table_1", id);
    expect(store.getState().grab.grabOnFurniture["table_1"]).toBe(id);
    removeGrabOnFurniture("table_1");
    expect(store.getState().grab.grabOnFurniture["table_1"]).toBeUndefined();
  });

  it("handles dirty/clean plates operations", () => {
    setDirtyPlates(["plate1", "plate2"]);
    removeDirtyPlate();
    // only check that arrays exist and functions ran
    expect(Array.isArray(store.getState().grab.cleanPlates)).toBe(true);
    removeCleanPlate();
  });

  it("handles pending and held items", () => {
    setPendingGrabId("firstPlayer", "p1");
    expect(store.getState().grab.pendingGrabId.firstPlayer).toContain("p1");
    removePendingGrabId("firstPlayer", "p1");
    setHeldItem("firstPlayer", "held_1");
    expect(store.getState().grab.heldItem.firstPlayer).toBe("held_1");
  });

  it("updates obstacle info and filters by type", () => {
    const id = "T_filter";
    registerObstacle(id, { id, type: "cheese" } as any);

    updateObstacleInfo(id, { isCook: true });
    const byType = Object.values(store.getState().grab.obstacles).filter(
      (o) => o.type === "cheese",
    );
    expect(byType.find((o) => o.id === id)).toBeDefined();
  });

  it("manages highlights and real highlight", () => {
    const id = "T_high";
    registerObstacle(id, { id, type: "cheese" } as any);

    setHighlightedGrab("firstPlayer", id, true);
    expect(
      store
        .getState()
        .grab.highlightedGrab.firstPlayer.find((i) => i.id === id),
    ).toBeDefined();
    setRealHighlight("firstPlayer", id);
    setHighlightedGrab("firstPlayer", id, false);
    expect(
      store
        .getState()
        .grab.highlightedGrab.firstPlayer.find((i) => i.id === id),
    ).toBeUndefined();
  });
});
