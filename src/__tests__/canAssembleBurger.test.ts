/**
 * canAssembleBurger 类型判断测试
 * 验证汉堡组装系统的类型识别和组合判断逻辑
 *
 * @author Bamzc
 */

import { EFoodType } from "@/types/level";
import {
  assembleDetail,
  assembleType,
  EMultiFoodType,
  foodType,
} from "@/utils/canAssembleBurger";
import {
  BurgerPresets,
  createBread,
  createBreadWithPlate,
  createBurger,
  createBurgerWithPlate,
  createDirtyPlate,
  createNormalFood,
  createNormalWidthPlate,
  createPlate,
  createPresetBurger,
  createPresetMultiNormalWidthPlate,
} from "@/utils/testHelper";
import { describe, expect, it } from "vitest";

describe("canAssembleBurger - 类型判断测试", () => {
  describe("foodType() - 单个物品类型识别", () => {
    describe("基础物品类型（无 foodModel）", () => {
      it("应该识别普通食物（已处理）", () => {
        const tomato = createNormalFood(EFoodType.tomato);
        expect(foodType(tomato)).toBe(EMultiFoodType.normalFood);

        const cheese = createNormalFood(EFoodType.cheese);
        expect(foodType(cheese)).toBe(EMultiFoodType.normalFood);

        const meat = createNormalFood(EFoodType.meatPatty);
        expect(foodType(meat)).toBe(EMultiFoodType.normalFood);
      });

      it("应该识别面包", () => {
        const bread = createBread();
        expect(foodType(bread)).toBe(EMultiFoodType.bread);
      });

      it("应该识别空盘子", () => {
        const plate = createPlate();
        expect(foodType(plate)).toBe(EMultiFoodType.plate);
      });

      it("应该识别脏盘子", () => {
        const dirtyPlate = createDirtyPlate();
        expect(foodType(dirtyPlate)).toBe(EMultiFoodType.dirtyPlate);
      });

      it("未处理的食材应该返回 notValid", () => {
        const rawTomato = createNormalFood(EFoodType.tomato, { isCut: false });
        expect(foodType(rawTomato)).toBe(EMultiFoodType.notValid);

        const rawMeat = createNormalFood(EFoodType.meatPatty, {
          isCook: false,
          isCut: false,
        });
        expect(foodType(rawMeat)).toBe(EMultiFoodType.notValid);
      });
    });

    describe("复合物品类型（有 foodModel）", () => {
      it("应该识别汉堡", () => {
        const burger = createPresetBurger("classic");
        expect(foodType(burger)).toBe(EMultiFoodType.burger);
      });

      it("应该识别盘子+单种食物", () => {
        const plateTomato = createNormalWidthPlate(EFoodType.tomato);
        expect(foodType(plateTomato)).toBe(EMultiFoodType.normalWidthPlate);

        const plateMeat = createNormalWidthPlate(EFoodType.meatPatty);
        expect(foodType(plateMeat)).toBe(EMultiFoodType.normalWidthPlate);
      });

      it("应该识别盘子+面包", () => {
        const plateBread = createBreadWithPlate();
        expect(foodType(plateBread)).toBe(EMultiFoodType.breadWithPlate);
      });

      it("应该识别盘子+多种普通食物（无面包）", () => {
        const plateMulti = createPresetMultiNormalWidthPlate("tomatoMeat");
        expect(foodType(plateMulti)).toBe(EMultiFoodType.multiNormalWidthPlate);
      });

      it("应该识别盘子+汉堡（有面包）", () => {
        const plateBurger = createBurgerWithPlate([...BurgerPresets.simple]);
        expect(foodType(plateBurger)).toBe(EMultiFoodType.burgerWithPlate);
      });
    });
  });

  describe("assembleType() - 组合类型字符串生成", () => {
    it("应该正确生成基础物品组合字符串", () => {
      const bread = createBread();
      const tomato = createNormalFood(EFoodType.tomato);

      expect(assembleType(bread, tomato)).toBe(
        `${EMultiFoodType.bread}&${EMultiFoodType.normalFood}`,
      );
      expect(assembleType(tomato, bread)).toBe(
        `${EMultiFoodType.normalFood}&${EMultiFoodType.bread}`,
      );
    });

    it("应该正确生成复合物品组合字符串", () => {
      const burger = createPresetBurger("classic");
      const tomato = createNormalFood(EFoodType.tomato);

      expect(assembleType(burger, tomato)).toBe(
        `${EMultiFoodType.burger}&${EMultiFoodType.normalFood}`,
      );
    });

    it("应该正确生成盘子相关组合字符串", () => {
      const plate = createPlate();
      const tomato = createNormalFood(EFoodType.tomato);

      expect(assembleType(plate, tomato)).toBe(
        `${EMultiFoodType.plate}&${EMultiFoodType.normalFood}`,
      );
    });
  });

  describe("assembleDetail() - 组装结果判断", () => {
    describe("允许的组合", () => {
      it("面包 + 普通食物 → multiBurger", () => {
        const bread = createBread();
        const tomato = createNormalFood(EFoodType.tomato);

        const result = assembleDetail(bread, tomato);
        expect(result).not.toBe("forbidAssemble");
        if (result !== "forbidAssemble") {
          expect(result.type).toBe("multiBurger");
        }
      });

      it("普通食物 + 盘子 → singleFoodOnPlate", () => {
        const tomato = createNormalFood(EFoodType.tomato);
        const plate = createPlate();

        const result = assembleDetail(tomato, plate);
        expect(result).toEqual({
          type: "singleFoodOnPlate",
        });
      });

      it("面包 + 盘子 → singleFoodOnPlate", () => {
        const bread = createBread();
        const plate = createPlate();

        const result = assembleDetail(bread, plate);
        expect(result).toEqual({
          type: "singleFoodOnPlate",
        });
      });

      it("面包 + 盘子+多种食物 → multiNormalCreateBurger", () => {
        const bread = createBread();
        const plateMulti = createPresetMultiNormalWidthPlate("tomatoMeat");

        const result = assembleDetail(bread, plateMulti);
        expect(result).toEqual({
          type: "multiNormalCreateBurger",
          leaveGrab: true,
        });
      });

      it("盘子+单种食物 + 普通食物 → plateAddMultiNormalFood", () => {
        const plateTomato = createNormalWidthPlate(EFoodType.tomato);
        const meat = createNormalFood(EFoodType.meatPatty);

        const result = assembleDetail(plateTomato, meat);
        expect(result).toEqual({
          type: "plateAddMultiNormalFood",
        });
      });

      it("脏盘子 + 脏盘子 → overLapDirtyPlate", () => {
        const dirtyPlate1 = createDirtyPlate();
        const dirtyPlate2 = createDirtyPlate();

        const result = assembleDetail(dirtyPlate1, dirtyPlate2);
        expect(result).toEqual({
          type: "overLapDirtyPlate",
        });
      });

      it("汉堡 + 普通食物（无重复）→ multiBurger", () => {
        const burger = createPresetBurger("simple"); // 面包+肉饼
        const tomato = createNormalFood(EFoodType.tomato); // 番茄

        const result = assembleDetail(burger, tomato);
        expect(result).not.toBe("forbidAssemble");
        if (result !== "forbidAssemble") {
          expect(result.type).toBe("multiBurger");
        }
      });
    });

    describe("禁止的组合", () => {
      it("面包 + 面包 → forbidAssemble", () => {
        const bread1 = createBread();
        const bread2 = createBread();

        const result = assembleDetail(bread1, bread2);
        expect(result).toBe("forbidAssemble");
      });

      it("普通食物 + 普通食物 → forbidAssemble", () => {
        const tomato = createNormalFood(EFoodType.tomato);
        const meat = createNormalFood(EFoodType.meatPatty);

        const result = assembleDetail(tomato, meat);
        expect(result).toBe("forbidAssemble");
      });

      it("空盘子 + 空盘子 → forbidAssemble", () => {
        const plate1 = createPlate();
        const plate2 = createPlate();

        const result = assembleDetail(plate1, plate2);
        expect(result).toBe("forbidAssemble");
      });

      it("汉堡 + 汉堡 → forbidAssemble", () => {
        const burger1 = createPresetBurger("classic");
        const burger2 = createPresetBurger("full");

        const result = assembleDetail(burger1, burger2);
        expect(result).toBe("forbidAssemble");
      });

      it("包含相同食材的盘子组合 → forbidAssemble", () => {
        const plateTomato1 = createNormalWidthPlate(EFoodType.tomato);
        const plateTomato2 = createNormalWidthPlate(EFoodType.tomato);

        const result = assembleDetail(plateTomato1, plateTomato2);
        expect(result).toBe("forbidAssemble");
      });

      it("汉堡添加已有食材 → forbidAssemble", () => {
        const burger = createPresetBurger("classic"); // 面包+番茄+肉饼
        const tomato = createNormalFood(EFoodType.tomato); // 番茄（已存在）

        const result = assembleDetail(burger, tomato);
        expect(result).toBe("forbidAssemble");
      });

      it("未处理的食材不能组装 → forbidAssemble", () => {
        const rawTomato = createNormalFood(EFoodType.tomato, {
          isCut: false,
        });
        const bread = createBread();

        const result = assembleDetail(rawTomato, bread);
        expect(result).toBe("forbidAssemble");
      });

      it("undefined highlighted → forbidAssemble", () => {
        const bread = createBread();

        const result = assembleDetail(undefined, bread);
        expect(result).toBe("forbidAssemble");
      });
    });

    describe("盘子交换规则", () => {
      it("盘子+面包 + 空盘子 → plateChange", () => {
        const plateBread = createBreadWithPlate();
        const plate = createPlate();

        const result = assembleDetail(plateBread, plate);
        expect(result).toEqual({
          type: "plateChange",
        });
      });

      it("盘子+汉堡 + 空盘子 → plateChange", () => {
        const plateBurger = createBurgerWithPlate([...BurgerPresets.simple]);
        const plate = createPlate();

        const result = assembleDetail(plateBurger, plate);
        expect(result).toEqual({
          type: "plateChange",
        });
      });

      it("盘子+单种食物 + 空盘子 → plateChange", () => {
        const plateTomato = createNormalWidthPlate(EFoodType.tomato);
        const plate = createPlate();

        const result = assembleDetail(plateTomato, plate);
        expect(result).toEqual({
          type: "plateChange",
        });
      });
    });
  });

  describe("边界情况测试", () => {
    it("应该处理所有11种 EMultiFoodType 类型", () => {
      const allTypes = [
        {
          item: createNormalFood(EFoodType.tomato),
          expected: EMultiFoodType.normalFood,
        },
        { item: createBread(), expected: EMultiFoodType.bread },
        { item: createPlate(), expected: EMultiFoodType.plate },
        { item: createDirtyPlate(), expected: EMultiFoodType.dirtyPlate },
        {
          item: createPresetBurger("classic"),
          expected: EMultiFoodType.burger,
        },
        {
          item: createNormalWidthPlate(EFoodType.tomato),
          expected: EMultiFoodType.normalWidthPlate,
        },
        {
          item: createPresetMultiNormalWidthPlate("tomatoMeat"),
          expected: EMultiFoodType.multiNormalWidthPlate,
        },
        {
          item: createBreadWithPlate(),
          expected: EMultiFoodType.breadWithPlate,
        },
        {
          item: createBurgerWithPlate([...BurgerPresets.simple]),
          expected: EMultiFoodType.burgerWithPlate,
        },
      ];

      allTypes.forEach(({ item, expected }) => {
        expect(foodType(item)).toBe(expected);
      });
    });

    it("应该正确识别完整的汉堡组装流程", () => {
      const bread = createBread();
      const tomato = createNormalFood(EFoodType.tomato);
      const meat = createNormalFood(EFoodType.meatPatty);
      const cheese = createNormalFood(EFoodType.cheese);

      // 第一步：面包 + 番茄 → 可以组装
      let result = assembleDetail(bread, tomato);
      expect(result).not.toBe("forbidAssemble");

      // 第二步：假设已有面包+番茄，添加肉饼 → 可以组装
      const burgerWithTomato = createBurger([
        { type: EFoodType.bread },
        { type: EFoodType.tomato },
      ]);
      result = assembleDetail(burgerWithTomato, meat);
      expect(result).not.toBe("forbidAssemble");

      // 第三步：假设已有面包+番茄+肉饼，添加芝士 → 可以组装
      const burgerWithTomatoMeat = createBurger([
        { type: EFoodType.bread },
        { type: EFoodType.tomato },
        { type: EFoodType.meatPatty },
      ]);
      result = assembleDetail(burgerWithTomatoMeat, cheese);
      expect(result).not.toBe("forbidAssemble");
    });
  });

  describe("multiBurger 详细类型判断", () => {
    it("面包（高亮）+ 普通食物（手）→ 应该返回正确的 multiBurger", () => {
      const bread = createBread();
      const tomato = createNormalFood(EFoodType.tomato);

      const result = assembleDetail(bread, tomato);
      expect(result).not.toBe("forbidAssemble");
      if (result !== "forbidAssemble" && result.type === "multiBurger") {
        expect(result.plate).toBe(false);
        expect(result.burger).toBe(false);
        expect(result.bread).toBe("highlighted");
      }
    });

    it("普通食物（高亮）+ 面包（手）→ 应该返回正确的 multiBurger", () => {
      const tomato = createNormalFood(EFoodType.tomato);
      const bread = createBread();

      const result = assembleDetail(tomato, bread);
      expect(result).not.toBe("forbidAssemble");
      if (result !== "forbidAssemble" && result.type === "multiBurger") {
        expect(result.plate).toBe(false);
        expect(result.burger).toBe(false);
        expect(result.bread).toBe("hand");
      }
    });

    it("盘子+面包（高亮）+ 面包（手）→ forbidAssemble", () => {
      const plateBread = createBreadWithPlate();
      const bread = createBread();

      const result = assembleDetail(plateBread, bread);
      expect(result).toBe("forbidAssemble");
    });
  });
});
