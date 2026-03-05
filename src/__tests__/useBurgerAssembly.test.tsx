/**
 * useBurgerAssembly 集成测试
 * 使用 testHelper 创建测试数据，验证 assembleAndUpdateUI 的组装逻辑
 *
 * @author Bamzc
 */

import { ModelResourceContext } from "@/context/ModelResourceContext";
import { useBurgerAssembly } from "@/hooks/useBurgerAssembly";
import { IFurniturePosition } from "@/stores/useFurnitureObstacle";
import store from "@/stores";
import * as useGrabObstacle from "@/stores/useGrabObstacle";
import { EFoodType, EGrabType } from "@/types/level";
import { assembleDetail } from "@/utils/canAssembleBurger";
import {
  createBread,
  createBurger,
  createNormalFood,
  createNormalWidthPlate,
  createPlate,
  createPresetBurger,
  createPresetMultiNormalWidthPlate,
} from "@/utils/testHelper";
import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 创建测试用的 Three.js Group mock
 */
function createMockGroup(uuid?: string): any {
  return {
    uuid: uuid || `mock_group_${Date.now()}`,
    name: "MockGroup",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    copy: vi.fn(),
    clone: vi.fn(function (this: any) {
      return { ...this, uuid: `clone_${this.uuid}` };
    }),
  };
}

/**
 * 创建测试用的 grabModels
 */
function createMockGrabModels() {
  return {
    // 基础模型
    [EFoodType.burger]: createMockGroup("burger_model"),
    [EFoodType.bread]: createMockGroup("bread_model"),
    [EFoodType.tomato]: createMockGroup("tomato_model"),
    [EFoodType.meatPatty]: createMockGroup("meatPatty_model"),
    [EFoodType.cheese]: createMockGroup("cheese_model"),
    [EGrabType.plate]: createMockGroup("plate_model"),
    [EGrabType.dirtyPlate]: createMockGroup("dirtyPlate_model"),
    // 组合模型
    tomatoCut: createMockGroup("tomatoCut_model"),
    meatPie: createMockGroup("meatPie_model"),
    rawMeatPie: createMockGroup("rawMeatPie_model"),
    cheeseCut: createMockGroup("cheeseCut_model"),
    tomatoMeat: createMockGroup("tomatoMeat_model"),
    cheeseTomato: createMockGroup("cheeseTomato_model"),
    cheeseMeat: createMockGroup("cheeseMeat_model"),
    cheeseTomatoMeat: createMockGroup("cheeseTomatoMeat_model"),
  };
}

/**
 * Mock ModelResourceContext Provider
 */
function MockModelResourceProvider({ children }: { children: ReactNode }) {
  const mockGrabModels = createMockGrabModels();

  const contextValue = {
    grabModels: mockGrabModels,
    loading: false,
    loadedCount: Object.keys(mockGrabModels),
    totalCount: Object.keys(mockGrabModels),
    progress: 100,
    textures: {},
    modelAnimations: {},
    notifyReady: vi.fn(),
  };

  return (
    <ModelResourceContext.Provider value={contextValue}>
      {children}
    </ModelResourceContext.Provider>
  );
}

// 自定义 renderHook 函数，包装 mock Provider
function renderHookWithProvider<T>(callback: () => T) {
  return renderHook(callback, {
    wrapper: MockModelResourceProvider,
  });
}

/**
 * 创建测试用的家具位置对象
 */
function createMockFurniture(
  overrides?: Partial<IFurniturePosition>,
): IFurniturePosition {
  return {
    id: "test_table_1",
    position: [0, 0, 0],
    type: "table" as any,
    size: [2, 1, 2],
    isMovable: true,
    ...overrides,
  };
}

describe("useBurgerAssembly - assembleAndUpdateUI 集成测试", () => {
  beforeEach(() => {
    // 清除所有 mock
    vi.clearAllMocks();
    // 清理 store 中的 obstacles
    useGrabObstacle.clearObstacles();
  });

  describe("基础组装场景", () => {
    it("面包 + 番茄 → 应该正确更新 foodModel", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const bread = createBread();
      const tomato = createNormalFood(EFoodType.tomato);
      const mockFurniture = createMockFurniture();

      // 先注册两个 obstacle 到 store
      useGrabObstacle.registerObstacle(bread.id, bread);
      useGrabObstacle.registerObstacle(tomato.id, tomato);

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "multiBurger",
            plate: false,
            burger: false,
            bread: "highlighted",
          },
          {
            realHighLight: bread,
            hand: tomato,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 验证返回结果
        expect(assemblyResult).not.toBe(false);
        if (!assemblyResult) {return;}

        // 验证 foodModel 是否正确更新到 store
        // createNewBurger 会创建新的汉堡，bread 和 tomato 的 obstacle 被注销
        // 返回的 putOnTable 是新汉堡的 id
        const newBurgerId = assemblyResult.putOnTable;
        expect(newBurgerId).toBeTruthy();

        const newBurger = useGrabObstacle.getObstacleInfo(newBurgerId);
        expect(newBurger).toBeDefined();
        expect(newBurger?.foodModel).toBeDefined();
        expect(newBurger?.foodModel?.type).toBeInstanceOf(Array);
        expect(newBurger?.foodModel?.type).toHaveLength(2);
        // 验证 type 数组包含面包和番茄
        expect(newBurger?.foodModel?.type[0]).toMatchObject({
          id: bread.id,
          type: EFoodType.bread,
        });
        expect(newBurger?.foodModel?.type[1]).toMatchObject({
          id: tomato.id,
          type: EFoodType.tomato,
        });
      });
    });

    it("普通食物 + 空盘子 → 应该正确更新 foodModel", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const tomato = createNormalFood(EFoodType.tomato);
      const plate = createPlate();
      const mockFurniture = createMockFurniture();

      // 注册到 store
      useGrabObstacle.registerObstacle(tomato.id, tomato);
      useGrabObstacle.registerObstacle(plate.id, plate);

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "singleFoodOnPlate",
          },
          {
            realHighLight: tomato,
            hand: plate,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 验证返回结果
        expect(assemblyResult).not.toBe(false);

        // 验证 foodModel 是否正确更新到 store
        // singleFoodOnPlate 会把食物放到盘子上
        const updatedPlate = useGrabObstacle.getObstacleInfo(plate.id);
        expect(updatedPlate).toBeDefined();
        expect(updatedPlate?.foodModel).toBeDefined();
        expect(updatedPlate?.foodModel?.type).toBe(EFoodType.tomato);
      });
    });

    it("面包 + 空盘子 → 应该正确更新 foodModel", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const bread = createBread();
      const plate = createPlate();
      const mockFurniture = createMockFurniture();

      // 注册到 store
      useGrabObstacle.registerObstacle(bread.id, bread);
      useGrabObstacle.registerObstacle(plate.id, plate);

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "singleFoodOnPlate",
          },
          {
            realHighLight: bread,
            hand: plate,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 验证返回结果
        expect(assemblyResult).not.toBe(false);

        // 验证 foodModel 是否正确更新到 store
        const updatedPlate = useGrabObstacle.getObstacleInfo(plate.id);
        expect(updatedPlate).toBeDefined();
        expect(updatedPlate?.foodModel).toBeDefined();
        expect(updatedPlate?.foodModel?.type).toBe(EFoodType.bread);
      });
    });
  });

  describe("汉堡添加配料场景", () => {
    it("汉堡 + 番茄 → 应该正确更新 foodModel", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const burger = createPresetBurger("simple"); // 面包+肉饼
      const tomato = createNormalFood(EFoodType.tomato);
      const mockFurniture = createMockFurniture();

      // 注册到 store
      useGrabObstacle.registerObstacle(burger.id, burger);
      useGrabObstacle.registerObstacle(tomato.id, tomato);

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "multiBurger",
            plate: false,
            burger: "highlighted",
            bread: false,
          },
          {
            realHighLight: burger,
            hand: tomato,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 验证返回结果
        expect(assemblyResult).not.toBe(false);

        // 验证 foodModel 是否正确更新到 store
        const updatedBurger = useGrabObstacle.getObstacleInfo(burger.id);
        expect(updatedBurger).toBeDefined();
        expect(updatedBurger?.foodModel).toBeDefined();
        // 汉堡应该有3层：面包、肉饼、番茄
        expect(updatedBurger?.foodModel?.type).toHaveLength(3);
      });
    });
  });

  describe("盘子相关组装场景", () => {
    it("盘子+单种食物 + 普通食物 → 应该正确更新 foodModel", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const plateTomato = createNormalWidthPlate(EFoodType.tomato);
      const meat = createNormalFood(EFoodType.meatPatty);
      const mockFurniture = createMockFurniture();

      // 注册到 store
      useGrabObstacle.registerObstacle(plateTomato.id, plateTomato);
      useGrabObstacle.registerObstacle(meat.id, meat);

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "plateAddMultiNormalFood",
          },
          {
            realHighLight: plateTomato,
            hand: meat,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 验证返回结果
        expect(assemblyResult).not.toBe(false);

        // 验证 foodModel 是否正确更新到 store
        const updatedPlate = useGrabObstacle.getObstacleInfo(plateTomato.id);
        expect(updatedPlate).toBeDefined();
        expect(updatedPlate?.foodModel).toBeDefined();
        // 应该有两种食物：番茄和肉饼
        expect(updatedPlate?.foodModel?.type).toBeInstanceOf(Array);
        expect(updatedPlate?.foodModel?.type).toHaveLength(2);
      });
    });

    it("面包 + 盘子+多种食物 → 应该正确更新 foodModel", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const bread = createBread();
      const plateMulti = createPresetMultiNormalWidthPlate("tomatoMeat");
      const mockFurniture = createMockFurniture();

      // 注册到 store
      useGrabObstacle.registerObstacle(bread.id, bread);
      useGrabObstacle.registerObstacle(plateMulti.id, plateMulti);

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "multiNormalCreateBurger",
            leaveGrab: true,
          },
          {
            realHighLight: bread,
            hand: plateMulti,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 验证返回结果
        expect(assemblyResult).not.toBe(false);

        // 验证 foodModel 是否正确更新到 store
        const updatedPlate = useGrabObstacle.getObstacleInfo(plateMulti.id);
        expect(updatedPlate).toBeDefined();
        expect(updatedPlate?.foodModel).toBeDefined();
        // 盘子上的食物应该变成汉堡
        expect(updatedPlate?.foodModel?.id).toMatch(/^Grab_burger_clone_/);
      });
    });
  });

  describe("禁止组装场景", () => {
    it("面包 + 面包 → 应该禁止组装", () => {
      const bread1 = createBread();
      const bread2 = createBread();

      // 验证 assembleDetail 返回 forbidAssemble
      const detailResult = assembleDetail(bread1, bread2);
      expect(detailResult).toBe("forbidAssemble");

      // forbidAssemble 意味着实际代码不会触发 assembleAndUpdateUI
      // 所以这里不需要验证 obstacle 更新
    });

    it("空盘子 + 空盘子 → 应该禁止组装", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const plate1 = createPlate();
      const plate2 = createPlate();
      const mockFurniture = createMockFurniture();

      const updateHand = vi.fn();

      // 先验证 assembleDetail 返回 forbidAssemble
      const detailResult = assembleDetail(plate1, plate2);
      expect(detailResult).toBe("forbidAssemble");
    });

    it("汉堡 + 汉堡 → 应该禁止组装", () => {
      const burger1 = createPresetBurger("classic");
      const burger2 = createPresetBurger("full");

      const detailResult = assembleDetail(burger1, burger2);
      expect(detailResult).toBe("forbidAssemble");
    });
  });

  describe("无家具场景（地板上操作）", () => {
    it("面包 + 番茄（无家具）→ 应该正确更新 foodModel", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const bread = createBread();
      const tomato = createNormalFood(EFoodType.tomato);

      // 注册到 store
      useGrabObstacle.registerObstacle(bread.id, bread);
      useGrabObstacle.registerObstacle(tomato.id, tomato);

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "multiBurger",
            plate: false,
            burger: false,
            bread: "highlighted",
          },
          {
            realHighLight: bread,
            hand: tomato,
            highlightedFurniture: false, // 无家具
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 验证返回结果
        expect(assemblyResult).not.toBe(false);
        if (!assemblyResult) {return;}

        // 验证 bread 和 tomato 被注销
        const deletedBread = useGrabObstacle.getObstacleInfo(bread.id);
        const deletedTomato = useGrabObstacle.getObstacleInfo(tomato.id);
        expect(deletedBread).toBeUndefined();
        expect(deletedTomato).toBeUndefined();

        // 验证是否生成了汉堡类型
        // 通过遍历 store 中的所有 obstacles 来查找新汉堡
        const allObstacles = store.getState().grab.obstacles;

        // 查找 type 为 burger 的 obstacle
        let newBurger: any = null;
        let newBurgerId = "";
        Object.entries(allObstacles).forEach(([id, obstacle]) => {
          if (obstacle.type === EFoodType.burger) {
            newBurger = obstacle;
            newBurgerId = id;
          }
        });

        // 验证生成了汉堡类型
        expect(newBurger).toBeDefined();
        expect(newBurgerId).toBeTruthy();
        expect(newBurger.type).toBe(EFoodType.burger);
        expect(newBurger.foodModel).toBeDefined();
        expect(newBurger.foodModel?.type).toBeInstanceOf(Array);
        expect(newBurger.foodModel?.type).toHaveLength(2);
        // 验证 type 数组包含面包和番茄
        expect(newBurger.foodModel?.type[0]).toMatchObject({
          id: bread.id,
          type: EFoodType.bread,
        });
        expect(newBurger.foodModel?.type[1]).toMatchObject({
          id: tomato.id,
          type: EFoodType.tomato,
        });
      });
    });
  });

  describe("边界情况", () => {
    it("realHighLight 为 false → 应该返回 false", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const tomato = createNormalFood(EFoodType.tomato);
      const mockFurniture = createMockFurniture();

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "singleFoodOnPlate",
          },
          {
            realHighLight: false, // ❌ 没有高亮对象
            hand: tomato,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 应该返回 false
        expect(assemblyResult).toBe(false);
      });
    });

    it("hand 为 null → 应该返回 false", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const bread = createBread();
      const mockFurniture = createMockFurniture();

      const updateHand = vi.fn();

      act(() => {
        const assemblyResult = result.current.assembleAndUpdateUI(
          {
            type: "multiBurger",
            plate: false,
            burger: false,
            bread: "highlighted",
          },
          {
            realHighLight: bread,
            hand: null, // ❌ 手中没有物品
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        // 应该返回 false
        expect(assemblyResult).toBe(false);
      });
    });
  });

  describe("完整组装流程验证", () => {
    it("应该支持完整的汉堡组装流程", () => {
      const { result } = renderHookWithProvider(() => useBurgerAssembly());

      const mockFurniture = createMockFurniture();
      const updateHand = vi.fn();

      // 第一步：面包 + 番茄
      const bread = createBread();
      const tomato = createNormalFood(EFoodType.tomato);

      act(() => {
        const step1 = result.current.assembleAndUpdateUI(
          {
            type: "multiBurger",
            plate: false,
            burger: false,
            bread: "highlighted",
          },
          {
            realHighLight: bread,
            hand: tomato,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        expect(step1).not.toBe(false);
      });

      // 第二步：假设已有汉堡，添加肉饼
      const burgerWithTomato = createBurger([
        { type: EFoodType.bread },
        { type: EFoodType.tomato },
      ]);
      const meat = createNormalFood(EFoodType.meatPatty);

      act(() => {
        const step2 = result.current.assembleAndUpdateUI(
          {
            type: "multiBurger",
            plate: false,
            burger: "highlighted",
            bread: false,
          },
          {
            realHighLight: burgerWithTomato,
            hand: meat,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        expect(step2).not.toBe(false);
      });

      // 第三步：假设已有面包+番茄+肉饼，添加芝士
      const burgerWithTomatoMeat = createBurger([
        { type: EFoodType.bread },
        { type: EFoodType.tomato },
        { type: EFoodType.meatPatty },
      ]);
      const cheese = createNormalFood(EFoodType.cheese);

      act(() => {
        const step3 = result.current.assembleAndUpdateUI(
          {
            type: "multiBurger",
            plate: false,
            burger: "highlighted",
            bread: false,
          },
          {
            realHighLight: burgerWithTomatoMeat,
            hand: cheese,
            highlightedFurniture: mockFurniture,
            playerId: "firstPlayer",
            updateHand,
          },
        );

        expect(step3).not.toBe(false);
      });
    });
  });
});
