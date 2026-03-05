/**
 * 创建测试辅助函数（用于测试环境）
 * Mock 了所有 React Context 和 zustand store
 *
 * @author Bamzc
 */

import {
  EFoodType,
  EGrabType,
  ERigidBodyType,
  IFoodWithRef,
} from "@/types/level";
import { mock } from "vitest";

/**
 * 创建测试用的 useCreateTextData 函数
 * 这个版本可以在测试中使用，不需要 React Context
 */
export function createTestHelper() {
  // Mock grabModels
  const mockGrabModels: any = {
    [EFoodType.burger]: {
      clone: () => ({ uuid: `test_burger_${Date.now()}` }),
    },
  };

  // Mock modelMapRef
  const mockModelMapRef = {
    current: new Map(),
  };

  // Mock updateObstacleInfo
  const mockUpdateObstacleInfo = mock.fn();

  const burgerWithPlate = (food: IFoodWithRef) => {
    if (food.type === EGrabType.plate) {
      const burgerModel = mockGrabModels[EFoodType.burger].clone();
      const id = `test_${ERigidBodyType.grab}_${EFoodType.burger}_${burgerModel.uuid}`;

      mockUpdateObstacleInfo(food.id, {
        foodModel: {
          id,
          type: [{ id: "0", type: EFoodType.bread },],
        },
      });
      mockModelMapRef.current?.set(id, burgerModel);
    }
  };

  return {
    burgerWithPlate,
    mockModelMapRef,
    mockUpdateObstacleInfo,
  };
}
