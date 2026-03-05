/**
 * 测试辅助函数 - 用于创建各种类型的物品数据
 * 方便单元测试时快速构建 IFoodWithRef 对象
 *
 * @author Bamzc
 */

import {
  BaseFoodModelType,
  EFoodType,
  EGrabType,
  IFoodWithRef,
  MultiFoodModelType,
} from "@/types/level";

/**
 * 创建基础物品的辅助函数
 */
function createBaseFood<T extends EFoodType | EGrabType>(
  type: T,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef {
  return {
    id: `test_${type}_${Date.now()}`,
    type,
    position: [0, 0, 0],
    size: [1, 1, 1],
    ...overrides,
  };
}

/**
 * 创建复合物品的辅助函数
 */
function createCompositeFood<T extends EFoodType | EGrabType>(
  type: T,
  foodModel: BaseFoodModelType | MultiFoodModelType,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef {
  return {
    id: `test_${type}_${Date.now()}`,
    type,
    position: [0, 0, 0],
    size: [1, 1, 1],
    foodModel,
    ...overrides,
  };
}

/**
 * 创建普通食物（已处理好的食材）
 */
export const createNormalFood = (
  foodType: EFoodType.cheese | EFoodType.tomato | EFoodType.meatPatty,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  const processedFlags: Record<
    EFoodType.cheese | EFoodType.tomato | EFoodType.meatPatty,
    { isCut?: boolean; isCook?: boolean }
  > = {
    [EFoodType.cheese]: { isCut: true },
    [EFoodType.tomato]: { isCut: true },
    [EFoodType.meatPatty]: { isCook: true, isCut: true },
  };

  return createBaseFood(foodType, {
    ...processedFlags[foodType],
    ...overrides,
  });
};

/**
 * 创建单独的面包片
 */
export const createBread = (
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  return createBaseFood(EFoodType.bread, overrides);
};

/**
 * 创建空盘子
 */
export const createPlate = (
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  return createBaseFood(EGrabType.plate, overrides);
};

/**
 * 创建单个脏盘子
 */
export const createDirtyPlate = (
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  return createBaseFood(EGrabType.dirtyPlate, overrides);
};

/**
 * 创建汉堡（多种食物组合，包含面包）
 */
export const createBurger = (
  ingredients: Array<{ id?: string; type: EFoodType }>,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  const foodModel: MultiFoodModelType = {
    id: `test_burger_model_${Date.now()}`,
    type: ingredients.map((item, index) => ({
      id: item.id || `burger_ingredient_${index}`,
      type: item.type,
    })),
  };

  return createCompositeFood(EFoodType.burger, foodModel, overrides);
};

/**
 * 创建盘子+单种食物（BaseFoodModelType）
 */
export const createNormalWidthPlate = (
  foodType: EFoodType.cheese | EFoodType.tomato | EFoodType.meatPatty,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  const foodModel: BaseFoodModelType = {
    id: `test_${foodType}_model_${Date.now()}`,
    type: foodType,
  };

  return createCompositeFood(EGrabType.plate, foodModel, overrides);
};

/**
 * 创建盘子+多种食物（MultiFoodModelType，不包含面包）
 */
export const createMultiNormalWidthPlate = (
  ingredients: Array<{ id?: string; type: EFoodType.cheese | EFoodType.tomato | EFoodType.meatPatty }>,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  const foodModel: MultiFoodModelType = {
    id: `test_multi_normal_model_${Date.now()}`,
    type: ingredients.map((item, index) => ({
      id: item.id || `multi_normal_ingredient_${index}`,
      type: item.type,
    })),
  };

  return createCompositeFood(EGrabType.plate, foodModel, overrides);
};

/**
 * 创建盘子+面包（BaseFoodModelType）
 */
export const createBreadWithPlate = (
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  const foodModel: BaseFoodModelType = {
    id: `test_bread_model_${Date.now()}`,
    type: EFoodType.bread,
  };

  return createCompositeFood(EGrabType.plate, foodModel, overrides);
};

/**
 * 创建盘子+汉堡（MultiFoodModelType，包含面包）
 */
export const createBurgerWithPlate = (
  ingredients: Array<{ id?: string; type: EFoodType }>,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  const foodModel: MultiFoodModelType = {
    id: `test_burger_with_plate_model_${Date.now()}`,
    type: ingredients.map((item, index) => ({
      id: item.id || `burger_with_plate_ingredient_${index}`,
      type: item.type,
    })),
  };

  return createCompositeFood(EGrabType.plate, foodModel, overrides);
};

/**
 * 预设的汉堡配料组合
 */
export const BurgerPresets = {
  /** 简单汉堡：面包 + 肉饼 */
  simple: [
    { type: EFoodType.bread },
    { type: EFoodType.meatPatty },
  ] as const,

  /** 经典汉堡：面包 + 番茄 + 肉饼 */
  classic: [
    { type: EFoodType.bread },
    { type: EFoodType.tomato },
    { type: EFoodType.meatPatty },
  ] as const,

  /** 完整汉堡：面包 + 番茄 + 肉饼 + 芝士 */
  full: [
    { type: EFoodType.bread },
    { type: EFoodType.tomato },
    { type: EFoodType.meatPatty },
    { type: EFoodType.cheese },
  ] as const,
} as const;

/**
 * 预设的普通食物组合（无面包）
 */
export const NormalFoodPresets = {
  /** 番茄 + 肉饼 */
  tomatoMeat: [
    { type: EFoodType.tomato },
    { type: EFoodType.meatPatty },
  ] as const,

  /** 番茄 + 芝士 */
  tomatoCheese: [
    { type: EFoodType.tomato },
    { type: EFoodType.cheese },
  ] as const,

  /** 肉饼 + 芝士 */
  meatCheese: [
    { type: EFoodType.meatPatty },
    { type: EFoodType.cheese },
  ] as const,

  /** 番茄 + 肉饼 + 芝士 */
  all: [
    { type: EFoodType.tomato },
    { type: EFoodType.meatPatty },
    { type: EFoodType.cheese },
  ] as const,
} as const;

/**
 * 快速创建预设汉堡
 */
export const createPresetBurger = (
  preset: keyof typeof BurgerPresets,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  return createBurger([...BurgerPresets[preset]], overrides);
};

/**
 * 快速创建预设盘子+普通食物
 */
export const createPresetMultiNormalWidthPlate = (
  preset: keyof typeof NormalFoodPresets,
  overrides?: Partial<IFoodWithRef>,
): IFoodWithRef => {
  return createMultiNormalWidthPlate([...NormalFoodPresets[preset]], overrides);
};

/**
 * 测试辅助对象 - 集中导出所有创建函数
 */
export const TestFoodHelpers = {
  /** 基础物品 */
  normalFood: createNormalFood,
  bread: createBread,
  plate: createPlate,
  dirtyPlate: createDirtyPlate,

  /** 复合物品 */
  burger: createBurger,
  normalWidthPlate: createNormalWidthPlate,
  multiNormalWidthPlate: createMultiNormalWidthPlate,
  breadWithPlate: createBreadWithPlate,
  burgerWithPlate: createBurgerWithPlate,

  /** 预设组合 */
  presetBurger: createPresetBurger,
  presetMultiNormalWidthPlate: createPresetMultiNormalWidthPlate,

  /** 预设数据 */
  BurgerPresets,
  NormalFoodPresets,
} as const;
