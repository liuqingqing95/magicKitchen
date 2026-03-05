# 🍔 汉堡组装系统文档

## 📚 概述

汉堡组装系统是游戏的核心功能之一，负责处理玩家手中物品与场景中物品的交互、组合逻辑。系统支持多种物品状态转换，包括食材处理、汉堡制作、盘子堆叠等复杂操作。

---

## 🏗️ 核心类型系统

### 1. 物品数据结构

#### IFoodData - 基础数据接口

```typescript
export interface IFoodData {
  type: EFoodType | EGrabType;    // 物品的基础类型
  position: [number, number, number];
  size: [number, number, number];
  grabbingPosition?: { ... };
  rotateDirection?: EDirection;
}
```

#### IFoodWithRef - 扩展接口

```typescript
export interface IFoodWithRef extends IGrabPosition {
  foodModel?: FoodModelType;       // 可选的复合类型信息
  area?: IAreaType;
  visible?: boolean;
  isCut?: boolean;
  isCook?: boolean;
  // ... 其他字段
}
```

---

### 2. FoodModelType - 复合类型定义

**重要：** BaseFoodModelType 和 MultiFoodModelType 都是**复合类型**，只有物品内部有结构时才使用。

```typescript
// 盘子 + 单种食物（复合类型）
type BaseFoodModelType = {
  id: string;        // 食物唯一标识
  type: EFoodType;   // 单种食物类型（芝士/番茄/肉饼/面包）
};

// 多种食物组合（复合类型）
type MultiFoodModelType = {
  id: string;           // 组合物品唯一标识
  type: IMultiType[];   // 子食物数组（多种食物）
};

type FoodModelType = BaseFoodModelType | MultiFoodModelType;
```

**类型说明：**

| 类型 | 用途 | foodModel.type 结构 | 示例 |
|------|------|-------------------|------|
| **无 foodModel** | 基础物品 | - | 单纯番茄、空盘子 |
| **BaseFoodModelType** | 盘子+单种食物 | 单个值 | 盘子+番茄、盘子+面包 |
| **MultiFoodModelType** | 多种食物组合 | 数组 | 汉堡、盘子+多种食物 |

---

### 3. EMultiFoodType - 物品状态分类

系统核心枚举，用于分类游戏中所有可能的物品状态：

```typescript
export enum EMultiFoodType {
  // ===== 基础物品类型（没有 foodModel）=====
  normalFood = "normalFood",         // 普通食物（已处理好的食材）
  bread = "bread",                   // 单独的面包片
  plate = "plate",                   // 空盘子
  dirtyPlate = "dirtyPlate",         // 单个脏盘子
  notValid = "notValid",             // 无效状态（不可组装）

  // ===== 复合物品类型（有 foodModel）=====
  burger = "burger",                           // 汉堡（多种食物组合）
  multiDirtyPlate = "multiDirtyPlate",         // 多个脏盘子叠加
  normalWidthPlate = "normalWidthPlate",       // 盘子+单种食物
  multiNormalWidthPlate = "multiNormalWidthPlate", // 盘子+多种食物
  breadWithPlate = "breadWithPlate",           // 盘子+面包
  burgerWithPlate = "burgerWithPlate",         // 盘子+汉堡
}
```

---

## 🔄 物品状态识别

### foodType() 函数

**位置：** [canAssembleBurger.ts:190-231](../src/utils/canAssembleBurger.ts#L190-L231)

**作用：** 根据物品属性判断其属于哪种 EMultiFoodType 类型

#### 判断逻辑流程图（修正版）

```
IFoodWithRef（物品对象）
    │
    ├─ 有 foodModel？（复合物品）
    │   ├─ 是 → isMultiFoodModelType() 判断
    │   │   ├─ 是 → MultiFoodModelType（多种食物组合）
    │   │   │   ├─ 外层 type === burger → burger
    │   │   │   └─ 外层 type === plate →
    │   │   │       ├─ 包含汉堡（面包+其他食物）→ burgerWithPlate
    │   │   │       └─ 只有普通食物（无面包）→ multiNormalWidthPlate
    │   │   │
    │   │   └─ 否 → BaseFoodModelType（盘子+单种食物）
    │   │       └─ 外层 type === plate
    │   │           ├─ foodModel.type === 普通食物 → normalWidthPlate
    │   │           └─ foodModel.type === 面包 → breadWithPlate
    │   │
    │   └─ 否 → 基础物品（没有 foodModel）
    │       ├─ 是已处理的普通食物 → normalFood
    │       ├─ type === bread → bread
    │       ├─ type === plate → plate
    │       ├─ type === dirtyPlate → dirtyPlate
    │       └─ 其他 → notValid
    │
    └─ 返回 notValid（无效状态）
```

---

#### 实际数据示例对比

**1. 基础物品（没有 foodModel）**

```typescript
// 单纯的番茄（已切割）
{
  id: "tomato_1",
  type: EFoodType.tomato,
  isCut: true,
  isCook: false,
  // ❌ 没有 foodModel
}
// foodType() 结果：EMultiFoodType.normalFood

// 空盘子
{
  id: "plate_1",
  type: EGrabType.plate,
  // ❌ 没有 foodModel
}
// foodType() 结果：EMultiFoodType.plate

// 单独的面包片
{
  id: "bread_1",
  type: EFoodType.bread,
  // ❌ 没有 foodModel
}
// foodType() 结果：EMultiFoodType.bread
```

**2. 复合物品 - BaseFoodModelType（盘子+单种食物）**

```typescript
// 盘子 + 番茄
{
  id: "plate_combo_1",
  type: EGrabType.plate,           // 外层是盘子
  foodModel: {                      // ✅ 有 foodModel
    id: "tomato_1",
    type: EFoodType.tomato          // 单种食物
  }
}
// foodType() 结果：EMultiFoodType.normalWidthPlate

// 盘子 + 面包
{
  id: "plate_bread_1",
  type: EGrabType.plate,           // 外层是盘子
  foodModel: {                      // ✅ 有 foodModel
    id: "bread_1",
    type: EFoodType.bread           // 单种食物
  }
}
// foodType() 结果：EMultiFoodType.breadWithPlate
```

**3. 复合物品 - MultiFoodModelType（多种食物组合）**

```typescript
// 汉堡（面包 + 番茄 + 肉饼）
{
  id: "burger_1",
  type: EFoodType.burger,          // 外层是汉堡
  foodModel: {                      // ✅ 有 foodModel
    id: "burger_1",
    type: [                         // 多种食物数组
      { id: "bread_1", type: EFoodType.bread },
      { id: "tomato_1", type: EFoodType.tomato },
      { id: "meat_1", type: EFoodType.meatPatty }
    ]
  }
}
// foodType() 结果：EMultiFoodType.burger

// 盘子 + 多种食物
{
  id: "plate_multi_1",
  type: EGrabType.plate,           // 外层是盘子
  foodModel: {                      // ✅ 有 foodModel
    id: "combo_1",
    type: [                         // 多种食物数组
      { id: "tomato_1", type: EFoodType.tomato },
      { id: "meat_1", type: EFoodType.meatPatty }
    ]
  }
}
// foodType() 结果：EMultiFoodType.multiNormalWidthPlate
```

---

#### 判断规则详解

**1. 基础物品判断（没有 foodModel）**

| 条件 | 示例 | 结果 |
|------|------|------|
| `type` 在 valiable 数组中 + 已处理 | `{type: tomato, isCut: true}` | normalFood |
| `type === bread` | `{type: bread}` | bread |
| `type === plate` | `{type: plate}` | plate |
| `type === dirtyPlate` | `{type: dirtyPlate}` | dirtyPlate |

**2. 复合物品判断（有 foodModel）**

| foodModel 类型 | 外层 type | foodModel 内容 | 结果 |
|---------------|----------|---------------|------|
| BaseFoodModelType | plate | 普通食物 | normalWidthPlate |
| BaseFoodModelType | plate | 面包 | breadWithPlate |
| MultiFoodModelType | burger | **包含面包**的多种食物 | burger |
| MultiFoodModelType | plate | **不包含面包**的多种食物 | multiNormalWidthPlate |

---

## 🎮 组装系统核心逻辑

### 组装流程

```
玩家操作（尝试组装）
    ↓
assembleType() 获取两个物品的类型
    ↓
foodType(highlighted) + "&" + foodType(hand)
    ↓
组装类型字符串（如 "bread&normalFood"）
    ↓
assembleDetail() switch 判断
    ↓
返回 IAssembleMultiFoodEnable（组装结果）
```

### 组装结果类型

```typescript
export type IAssembleMultiFoodEnable =
  | IBurgerDetail              // 汉堡相关组装
  | ISinglePlateDetail         // 单物品放盘子
  | IPlateAddMultiNormalFood   // 盘子添加多种食物
  | IMultiNormalCreateBurger   // 多种食物创建汉堡
  | IPlateBurgerAddMultiNormalFood // 汉堡添加多种食物
  | IMultiNormalFoodAddIngredient // 多种食物添加配料
  | IPlateChangeDetail         // 盘子交换
  | IOverLapDirtyPlate;        // 脏盘子叠加
```

---

## 📋 组装规则矩阵

### 可组装的组合

| 组合类型 | 结果 | 说明 |
|---------|------|------|
| `bread & normalFood` | 创建汉堡 | 面包 + 处理好的食材 = 汉堡原料 |
| `bread & normalWidthPlate` | 创建汉堡 | 面包 + 盘子中食材 = 汉堡原料 |
| `burger & normalFood` | 添加配料 | 汉堡 + 食材 = 添加配料到汉堡 |
| `burger & normalWidthPlate` | 添加多种配料 | 汉堡 + 盘子中多种食材 = 添加多种配料 |
| `normalFood & plate` | 单食物放盘子 | 食材 + 空盘子 = 盘子+单种食物 |
| `bread & plate` | 面包放盘子 | 面包 + 空盘子 = 盘子+面包 |
| `normalWidthPlate & normalFood` | 盘子添加食物 | 盘子中已有食物 + 新食材 = 盘子+多种食物 |
| `dirtyPlate & dirtyPlate` | 脏盘子叠加 | 两个脏盘子 = 叠加状态 |
| `breadWithPlate & breadWithPlate` | 盘子交换 | 两个盘子+面包 = 交换内容 |
| `burgerWithPlate & burger` | 盘子交换 | 汉堡盘 + 汉堡 = 交换内容 |

### 禁止组装的组合

| 组合类型 | 原因 |
|---------|------|
| `bread & bread` | 两个面包不能组装 |
| `normalFood & normalFood` | 两个食材不能直接组装 |
| `plate & plate` | 两个空盘子不能组装 |
| `burger & burger` | 两个汉堡不能组装 |
| `normalWidthPlate & normalWidthPlate` | **如果两个盘子包含相同食材则不能组装**（如两个盘子都有番茄） |
| `multiNormalWidthPlate & multiNormalWidthPlate` | **如果两个盘子包含相同食材则不能组装** |
| 复合物品添加已有食材 | **每种食材只能有一个**（如汉堡已有番茄，不能再加番茄） |

---

## 🔧 扩展指南

### 添加新的食物类型

1. 在 `EFoodType` 枚举中添加新类型
2. 在 `valiable` 数组中添加需要处理的食物
3. 在 `foodType()` 函数中添加判断逻辑
4. 在 `assembleDetail()` switch 中添加新的组合规则

### 添加新的组装规则

1. 在 `IAssembleMultiFoodEnable` 类型中添加新的结果类型
2. 在 `assembleDetail()` 函数中添加新的 case
3. 在 `useBurgerAssembly.ts` 中实现对应的 UI 更新逻辑

---

## 📊 性能优化建议

1. **缓存 foodType 结果**：避免重复计算同一物品的类型
2. **使用 Map 替代 switch**：对于大量组合规则，Map 查找更快
3. **惰性计算**：只在需要时才计算复杂的组合结果

---

## 🐛 常见问题

### Q: 为什么我的食物不能组装？

**A:** 检查以下几点：
1. 食物是否已完成必要处理（切割、烹饪）
2. 是否是禁止的组合（如两个面包）
3. 汉堡中是否已包含相同食材

### Q: 如何调试组装逻辑？

**A:** 可以在 `assembleDetail()` 函数中添加日志：

```typescript
console.log("组装类型:", type);
console.log("高亮物品:", highlighted);
console.log("手中物品:", hand);
```

---

## 📝 相关文件

| 文件 | 说明 |
|------|------|
| [canAssembleBurger.ts](../src/utils/canAssembleBurger.ts) | 核心组装逻辑 |
| [useBurgerAssembly.ts](../src/hooks/useBurgerAssembly.ts) | UI 更新逻辑 |
| [level.ts](../src/types/level.ts) | 类型定义 |
| [canCut.ts](../src/utils/canCut.ts) | 切割逻辑 |
| [canCook.ts](../src/utils/canCook.ts) | 烹饪逻辑 |

---

**最后更新：** 2026-03-05
**维护者：** Bamzc
