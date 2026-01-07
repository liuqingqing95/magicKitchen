import { useObstacleStore } from "@/stores/useObstacle";
import assembly from "@/utils/assembly";

// 单元测试使用 Vitest 风格
describe("assembly utils", () => {
  beforeEach(() => {
    // 重置 store 为干净状态：直接替换 maps
    const s = useObstacleStore.getState();
    s.clearObstacles?.();
    s.setGrabOnFurniture?.("test_furn", []);
  });

  it("placeItemOnFurniture 应该把 item 加入到 grabOnFurniture", () => {
    const s = useObstacleStore.getState();
    const id = "Grab_test_1";
    s.registerObstacle(id, {
      id,
      type: "cheese",
      position: [1, 0, 2],
      isCut: false,
      isCook: false,
      size: [1, 1, 1],
      grabbingPosition: [0, 0, 0],
      isFurniture: false,
    } as any);

    const ok = assembly.placeItemOnFurniture("test_furn", id);
    expect(ok).toBe(true);
    const arr = s.getGrabOnFurniture("test_furn");
    expect(arr.find((i) => i.id === id)).toBeDefined();
  });

  it("replaceItemsWithNewObstacle 应该 unregister 旧条目并注册新条目", () => {
    const s = useObstacleStore.getState();
    const a = "Grab_a";
    const b = "Grab_b";
    s.registerObstacle(a, {
      id: a,
      type: "cheese",
      position: [0, 0, 0],
      isCut: false,
      isCook: false,
      size: [1, 1, 1],
      grabbingPosition: [0, 0, 0],
      isFurniture: false,
    } as any);
    s.registerObstacle(b, {
      id: b,
      type: "meatPatty",
      position: [0, 0, 0],
      isCut: false,
      isCook: false,
      size: [1, 1, 1],
      grabbingPosition: [0, 0, 0],
      isFurniture: false,
    } as any);

    s.setGrabOnFurniture("table_1", [
      { id: a, type: "cheese" as any },
      { id: b, type: "meatPatty" as any },
    ]);

    const newId = assembly.replaceItemsWithNewObstacle("table_1", [a, b], {
      type: "burger" as any,
    });
    expect(newId).toBeDefined();
    // 旧条目应被注销
    expect(s.getObstacleInfo(a)).toBeUndefined();
    expect(s.getObstacleInfo(b)).toBeUndefined();
    // 新条目应在家具列表中
    const arr = s.getGrabOnFurniture("table_1");
    expect(arr[0].id).toBe(newId);
  });

  it("start/finish cooking 与 markCutDone 应该切换标志位", () => {
    const s = useObstacleStore.getState();
    const id = "Grab_cook";
    s.registerObstacle(id, {
      id,
      type: "meatPatty",
      position: [0, 0, 0],
      isCut: false,
      isCook: false,
      size: [1, 1, 1],
      grabbingPosition: [0, 0, 0],
      isFurniture: false,
    } as any);

    assembly.startCooking(id);
    // startCooking 当前实现仅设置为 false（占位），继续 finish 改为 true
    assembly.finishCooking(id);
    let info: any = s.getObstacleInfo(id);
    expect(info?.isCook).toBe(true);

    assembly.markCutDone(id);
    info = s.getObstacleInfo(id);
    expect(info?.isCut).toBe(true);
  });
});
