/**
 * assembleBurgerHelper 测试文件
 * 验证testHelper中创建的汉堡和食物是否正确
 *
 * @author Bamzc
 */

import { EFoodType, EGrabType } from "@/types/level";
import { EMultiFoodType, foodType } from "@/utils/canAssembleBurger";
import {
  BurgerPresets,
  createBread,
  createBreadWithPlate,
  createBurger,
  createBurgerWithPlate,
  createDirtyPlate,
  createMultiNormalWidthPlate,
  createNormalFood,
  createNormalWidthPlate,
  createPlate,
  createPresetBurger,
  createPresetMultiNormalWidthPlate,
  NormalFoodPresets,
  TestFoodHelpers,
} from "@/utils/testHelper";
import { describe, expect, it } from "vitest";

describe("assembleBurgerHelper 汉堡组装辅助函数", () => {
  describe("基础物品创建函数", () => {
    it("createNormalFood - 应该创建已处理好的普通食物", () => {
      const tomato = createNormalFood(EFoodType.tomato);
      console.log("🍅 createNormalFood 创建的番茄:", tomato);

      expect(tomato.type).toBe(EFoodType.tomato);
      expect(tomato.isCut).toBe(true);
      expect(tomato.foodModel).toBeUndefined();

      const type = foodType(tomato);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.normalFood);
    });

    it("createNormalFood - 创建肉饼", () => {
      const meat = createNormalFood(EFoodType.meatPatty);
      console.log("🥩 createNormalFood 创建的肉饼:", meat);

      expect(meat.type).toBe(EFoodType.meatPatty);
      expect(meat.isCook).toBe(true);

      const type = foodType(meat);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.normalFood);
    });

    it("createNormalFood - 创建芝士", () => {
      const cheese = createNormalFood(EFoodType.cheese);
      console.log("🧀 createNormalFood 创建的芝士:", cheese);

      expect(cheese.type).toBe(EFoodType.cheese);
      expect(cheese.isCut).toBe(true);

      const type = foodType(cheese);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.normalFood);
    });

    it("createBread - 应该创建单独的面包片", () => {
      const bread = createBread();
      console.log("🍞 createBread 创建的面包:", bread);

      expect(bread.type).toBe(EFoodType.bread);
      expect(bread.foodModel).toBeUndefined();

      const type = foodType(bread);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.bread);
    });

    it("createPlate - 应该创建空盘子", () => {
      const plate = createPlate();
      console.log("🍽️ createPlate 创建的空盘子:", plate);

      expect(plate.type).toBe(EGrabType.plate);
      expect(plate.foodModel).toBeUndefined();

      const type = foodType(plate);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.plate);
    });

    it("createDirtyPlate - 应该创建脏盘子", () => {
      const dirtyPlate = createDirtyPlate();
      console.log("🟫 createDirtyPlate 创建的脏盘子:", dirtyPlate);

      expect(dirtyPlate.type).toBe(EGrabType.dirtyPlate);
      expect(dirtyPlate.foodModel).toBeUndefined();

      const type = foodType(dirtyPlate);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.dirtyPlate);
    });
  });

  describe("复合物品创建函数 - BaseFoodModelType", () => {
    it("createNormalWidthPlate - 盘子+单种食物（番茄）", () => {
      const plateTomato = createNormalWidthPlate(EFoodType.tomato);
      console.log("🍽️🍅 createNormalWidthPlate 创建的盘子+番茄:", plateTomato);

      expect(plateTomato.type).toBe(EGrabType.plate);
      expect(plateTomato.foodModel).toBeDefined();
      if (plateTomato.foodModel) {
        expect(plateTomato.foodModel.type).toBe(EFoodType.tomato);
      }

      const type = foodType(plateTomato);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.normalWidthPlate);
    });

    it("createBreadWithPlate - 盘子+面包", () => {
      const plateBread = createBreadWithPlate();
      console.log("🍽️🍞 createBreadWithPlate 创建的盘子+面包:", plateBread);

      expect(plateBread.type).toBe(EGrabType.plate);
      expect(plateBread.foodModel).toBeDefined();
      if (plateBread.foodModel) {
        expect(plateBread.foodModel.type).toBe(EFoodType.bread);
      }

      const type = foodType(plateBread);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.breadWithPlate);
    });
  });

  describe("复合物品创建函数 - MultiFoodModelType", () => {
    it("createBurger - 创建汉堡（包含面包）", () => {
      const burger = createBurger([
        { type: EFoodType.bread },
        { type: EFoodType.tomato },
        { type: EFoodType.meatPatty },
      ]);
      console.log("🍔 createBurger 创建的汉堡:", burger);

      expect(burger.type).toBe(EFoodType.burger);
      expect(burger.foodModel).toBeDefined();
      if (burger.foodModel) {
        expect(Array.isArray(burger.foodModel.type)).toBe(true);
        expect(burger.foodModel.type).toHaveLength(3);
      }

      const type = foodType(burger);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.burger);
    });

    it("createMultiNormalWidthPlate - 盘子+多种普通食物（无面包）", () => {
      const plateMulti = createMultiNormalWidthPlate([
        { type: EFoodType.tomato },
        { type: EFoodType.meatPatty },
      ]);
      console.log(
        "🍽️🥗 createMultiNormalWidthPlate 创建的盘子+多种食物:",
        plateMulti,
      );

      expect(plateMulti.type).toBe(EGrabType.plate);
      expect(plateMulti.foodModel).toBeDefined();
      if (plateMulti.foodModel) {
        expect(Array.isArray(plateMulti.foodModel.type)).toBe(true);
        expect(plateMulti.foodModel.type).toHaveLength(2);
      }

      const type = foodType(plateMulti);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.multiNormalWidthPlate);
    });

    it("createBurgerWithPlate - 盘子+汉堡（包含面包）", () => {
      const plateBurger = createBurgerWithPlate([
        { type: EFoodType.bread },
        { type: EFoodType.tomato },
      ]);
      console.log("🍽️🍔 createBurgerWithPlate 创建的盘子+汉堡:", plateBurger);

      expect(plateBurger.type).toBe(EGrabType.plate);
      expect(plateBurger.foodModel).toBeDefined();
      if (plateBurger.foodModel) {
        expect(Array.isArray(plateBurger.foodModel.type)).toBe(true);
        expect(plateBurger.foodModel.type).toHaveLength(2);
      }

      const type = foodType(plateBurger);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.burgerWithPlate);
    });
  });

  describe("预设组合测试", () => {
    it("BurgerPresets.simple - 简单汉堡（面包+肉饼）", () => {
      console.log("📋 BurgerPresets.simple:", BurgerPresets.simple);
      expect(BurgerPresets.simple).toHaveLength(2);
      expect(BurgerPresets.simple[0].type).toBe(EFoodType.bread);
      expect(BurgerPresets.simple[1].type).toBe(EFoodType.meatPatty);
    });

    it("BurgerPresets.classic - 经典汉堡（面包+番茄+肉饼）", () => {
      console.log("📋 BurgerPresets.classic:", BurgerPresets.classic);
      expect(BurgerPresets.classic).toHaveLength(3);
      expect(BurgerPresets.classic[0].type).toBe(EFoodType.bread);
      expect(BurgerPresets.classic[1].type).toBe(EFoodType.tomato);
      expect(BurgerPresets.classic[2].type).toBe(EFoodType.meatPatty);
    });

    it("BurgerPresets.full - 完整汉堡（面包+番茄+肉饼+芝士）", () => {
      console.log("📋 BurgerPresets.full:", BurgerPresets.full);
      expect(BurgerPresets.full).toHaveLength(4);
    });

    it("NormalFoodPresets.tomatoMeat - 番茄+肉饼", () => {
      console.log(
        "📋 NormalFoodPresets.tomatoMeat:",
        NormalFoodPresets.tomatoMeat,
      );
      expect(NormalFoodPresets.tomatoMeat).toHaveLength(2);
      expect(NormalFoodPresets.tomatoMeat[0].type).toBe(EFoodType.tomato);
      expect(NormalFoodPresets.tomatoMeat[1].type).toBe(EFoodType.meatPatty);
    });

    it("NormalFoodPresets.all - 番茄+肉饼+芝士", () => {
      console.log("📋 NormalFoodPresets.all:", NormalFoodPresets.all);
      expect(NormalFoodPresets.all).toHaveLength(3);
    });

    it("createPresetBurger - 快速创建预设汉堡", () => {
      const classicBurger = createPresetBurger("classic");
      console.log("🍔 createPresetBurger('classic'):", classicBurger);

      expect(classicBurger.type).toBe(EFoodType.burger);
      if (classicBurger.foodModel) {
        expect(Array.isArray(classicBurger.foodModel.type)).toBe(true);
        expect(classicBurger.foodModel.type).toHaveLength(3);
      }

      const type = foodType(classicBurger);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.burger);
    });

    it("createPresetMultiNormalWidthPlate - 快速创建预设盘子+普通食物", () => {
      const plateTomatoMeat = createPresetMultiNormalWidthPlate("tomatoMeat");
      console.log(
        "🍽️🥗 createPresetMultiNormalWidthPlate('tomatoMeat'):",
        plateTomatoMeat,
      );

      expect(plateTomatoMeat.type).toBe(EGrabType.plate);
      if (plateTomatoMeat.foodModel) {
        expect(Array.isArray(plateTomatoMeat.foodModel.type)).toBe(true);
        expect(plateTomatoMeat.foodModel.type).toHaveLength(2);
      }

      const type = foodType(plateTomatoMeat);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.multiNormalWidthPlate);
    });
  });

  describe("TestFoodHelpers 统一导出对象", () => {
    it("TestFoodHelpers - 应该包含所有创建函数", () => {
      console.log("🧪 TestFoodHelpers 对象:", TestFoodHelpers);

      expect(TestFoodHelpers.normalFood).toBe(createNormalFood);
      expect(TestFoodHelpers.bread).toBe(createBread);
      expect(TestFoodHelpers.plate).toBe(createPlate);
      expect(TestFoodHelpers.dirtyPlate).toBe(createDirtyPlate);
      expect(TestFoodHelpers.burger).toBe(createBurger);
      expect(TestFoodHelpers.normalWidthPlate).toBe(createNormalWidthPlate);
      expect(TestFoodHelpers.multiNormalWidthPlate).toBe(
        createMultiNormalWidthPlate,
      );
      expect(TestFoodHelpers.breadWithPlate).toBe(createBreadWithPlate);
      expect(TestFoodHelpers.burgerWithPlate).toBe(createBurgerWithPlate);
      expect(TestFoodHelpers.presetBurger).toBe(createPresetBurger);
      expect(TestFoodHelpers.presetMultiNormalWidthPlate).toBe(
        createPresetMultiNormalWidthPlate,
      );
    });

    it("TestFoodHelpers - 应该包含预设数据", () => {
      expect(TestFoodHelpers.BurgerPresets).toBe(BurgerPresets);
      expect(TestFoodHelpers.NormalFoodPresets).toBe(NormalFoodPresets);
    });

    it("TestFoodHelpers.normalFood - 通过对象调用", () => {
      const tomato = TestFoodHelpers.normalFood(EFoodType.tomato);
      console.log("🍅 TestFoodHelpers.normalFood:", tomato);

      const type = foodType(tomato);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.normalFood);
    });

    it("TestFoodHelpers.presetBurger - 通过对象调用", () => {
      const burger = TestFoodHelpers.presetBurger("simple");
      console.log("🍔 TestFoodHelpers.presetBurger('simple'):", burger);

      const type = foodType(burger);
      console.log("   foodType 结果:", type);
      expect(type).toBe(EMultiFoodType.burger);
    });
  });

  describe("自定义覆盖参数测试", () => {
    it("应该支持自定义 ID", () => {
      const customId = "my_custom_tomato";
      const tomato = createNormalFood(EFoodType.tomato, {
        id: customId,
      });
      console.log("🍅 自定义 ID 的番茄:", tomato);

      expect(tomato.id).toBe(customId);
    });

    it("应该支持自定义位置", () => {
      const customPosition: [number, number, number] = [10, 20, 30];
      const plate = createPlate({
        position: customPosition,
      });
      console.log("🍽️ 自定义位置的盘子:", plate);

      expect(plate.position).toEqual(customPosition);
    });

    it("应该支持多个自定义属性", () => {
      const customId = "special_burger";
      const customPosition: [number, number, number] = [5, 10, 15];
      const burger = createPresetBurger("full", {
        id: customId,
        position: customPosition,
        visible: false,
      });
      console.log("🍔 多个自定义属性的汉堡:", burger);

      expect(burger.id).toBe(customId);
      expect(burger.position).toEqual(customPosition);
      expect(burger.visible).toBe(false);
    });
  });
});

describe("EMultiFoodType 类型验证总结", () => {
  it("打印所有 EMultiFoodType 类型值", () => {
    console.log("\n========== EMultiFoodType 类型值 ==========");
    console.log("normalFood:", EMultiFoodType.normalFood);
    console.log("bread:", EMultiFoodType.bread);
    console.log("plate:", EMultiFoodType.plate);
    console.log("dirtyPlate:", EMultiFoodType.dirtyPlate);
    console.log("notValid:", EMultiFoodType.notValid);
    console.log("burger:", EMultiFoodType.burger);
    console.log("multiDirtyPlate:", EMultiFoodType.multiDirtyPlate);
    console.log("normalWidthPlate:", EMultiFoodType.normalWidthPlate);
    console.log("multiNormalWidthPlate:", EMultiFoodType.multiNormalWidthPlate);
    console.log("breadWithPlate:", EMultiFoodType.breadWithPlate);
    console.log("burgerWithPlate:", EMultiFoodType.burgerWithPlate);
    console.log("==========================================\n");
  });
});
