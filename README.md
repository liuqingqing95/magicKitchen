<div align="center">

# Magic Kitchen

**基于 React Three Fiber 的 3D 交互式厨房游戏**

[在线 Demo](https://liuqingqing95.github.io/magicKitchenDemo/) · [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

## 简介

Magic Kitchen 是一款受 Switch 平台热门游戏启发的 3D 互动厨房模拟游戏。玩家可以单人或双人合作，体验切菜、烹饪、装盘上菜的完整烹饪流程，通过积累积分来通关。

本项目旨在通过实践深入理解 Three.js 的 3D 渲染原理，掌握 React Three Fiber 框架开发技巧，实现包括 3D 场景构建、物理引擎模拟、动画系统等核心功能。

## 操作说明

### 玩家 1

| 按键            | 功能     |
| --------------- | -------- |
| `W` `A` `S` `D` | 移动方向 |
| `Left Shift`    | 抓取物品 |
| `Left Control`  | 放下物品 |

### 玩家 2

| 按键            | 功能     |
| --------------- | -------- |
| `↑` `↓` `←` `→` | 移动方向 |
| `Right Shift`   | 抓取物品 |
| `Right Control` | 放下物品 |

### 游戏规则

- 牛排必须切成肉末并煎熟才可装盘
- 西红柿和芝士必须切成小块才可装盘
- 必须有碟子且组成了汉堡才可上菜

## 技术栈

### 核心框架

- [React 18](https://react.dev/) - UI 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Vite](https://vitejs.dev/) - 构建工具

### 3D 渲染

- [Three.js](https://threejs.org/) - 3D 图形库
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) - React Three.js 渲染器
- [@react-three/drei](https://github.com/pmndrs/drei) - R3F 辅助工具集
- [@react-three/postprocessing](https://docs.pmnd.rs/react-three/postprocessing) - 后期处理效果

### 物理引擎

- [@react-three/rapier](https://pmnd.rs/drei-latest) - 3D 物理引擎（基于 Rapier）

### 状态管理

- [Redux Toolkit](https://redux-toolkit.js.org/) - 全局状态管理
- [Zustand](https://zustand-demo.pmnd.rs/) - 轻量级状态管理

### 测试

- [Vitest](https://vitest.dev/) - 单元测试框架
- [jsdom](https://github.com/jsdom/jsdom) - DOM 模拟

## 功能特性

- ✅ 3D 模型加载与动画播放
- ✅ 玩家移动与物品抓取系统
- ✅ 物理引擎模拟（碰撞检测、重力等）
- ✅ 汉堡组合系统
- ✅ 烹饪进度系统
- ✅ 双人合作模式

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── DirtyPlate.tsx  # 脏盘子组件
│   ├── FurnitureEntity.tsx
│   ├── ServeDishes.tsx # 上菜组件
│   └── GrabbableWrapper.tsx
├── hooks/              # 自定义 Hooks
│   ├── useBurgerAssembly.ts
│   ├── useGrabSystem.ts
│   ├── useProgressBar.ts
│   └── ...
├── stores/             # Redux Store Slices
│   ├── furnitureSlice.ts
│   ├── gameSlice.ts
│   └── obstaclesSlice.ts
├── context/            # React Context
│   ├── GrabContext.tsx
│   └── ModelResourceContext.tsx
├── utils/              # 工具函数
│   ├── canAssembleBurger.ts
│   ├── canCook.ts
│   ├── canCut.ts
│   └── loaderManager.ts
├── constant/           # 常量定义
├── types/              # TypeScript 类型定义
├── workers/            # Web Workers
└── __tests__/          # 单元测试
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
# 运行所有测试
npm run test:run

# 测试覆盖率
npm run test:coverage

# 测试 UI
npm run test:ui
```

### 代码检查

```bash
npm run lint
```

## TODO

- [ ] 添加游戏准备页面
- [ ] 添加游戏结束结算页面
- [ ] 完善动画过渡效果
- [ ] 支持 Switch 手柄适配
- [ ] 添加背景音乐与音效
- [ ] 更多菜谱与关卡设计

## 许可证

MIT License

---

**开发中，欢迎贡献！**
