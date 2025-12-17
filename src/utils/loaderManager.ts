import { useGLTF } from "@react-three/drei";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

// 创建加载器实例的通用函数
const createLoader = (decoderPath: string): GLTFLoader => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(decoderPath);
  loader.setDRACOLoader(dracoLoader);
  return loader;
};

// 导出加载器实例
export const coasterLoader = createLoader("/kenney_coaster-kit/");
export const foodLoader = createLoader("/kenney_food-kit/");
export const graveyardLoader = createLoader("/kenney_graveyard-kit_5.0/");
export const arcadeLoader = createLoader("/kenney_mini-arcade/");
export const marketLoader = createLoader("/kenney_mini-market/");
export const overcookedLoader = createLoader("/overcooked/");

// 模型路径配置
const MODEL_PATHS = {
  graveyard: {
    character: "/kenney_graveyard-kit_5.0/character-keeper.glb",
    brickWall: "/kenney_graveyard-kit_5.0/brick-wall.glb",
    // test: "/test.glb",
    // d: "/overcooked_kitchen_assets_fan_art.glb",
    wallCurve: "/kenney_graveyard-kit_5.0/brick-wall-curve-small.glb",
    player: "/kenney_graveyard-kit_5.0/character-keeper.glb",
    floor: "/kenney_graveyard-kit_5.0/floor.glb",
  },
  overcooked: {
    baseTable: "/overcooked/baseTable.gltf",
    gasStove: "/overcooked/gasStove.gltf",
    foodTable: "/overcooked/foodTable.gltf",
    drawerTable: "/overcooked/drawerTable.gltf",
    trash: "/overcooked/trash.gltf",
    fireExtinguisher: "/overcooked/fireExtinguisher.gltf",
    cuttingBoard: "/overcooked/cuttingBoard.gltf",
    cuttingBoardNoKnife: "/overcooked/cuttingBoardNoKnife.gltf",
    pan: "/overcooked/pan.gltf",
    plate: "/overcooked/plate.gltf",
    serveDishes: "/overcooked/serveDishes.gltf",
    stockpot: "/overcooked/stockpot.gltf",
    washSink: "/overcooked/washSink.gltf",
    floor: "/overcooked/floor.gltf",
    player: "/overcooked/player1/overcooked_-_pug_character.gltf",
    player2: "/overcooked/player1/little_chef_overcooked_like.gltf",
  },
  coaster: {
    stallFood: "/kenney_coaster-kit/stall-food.glb",
    floor: "/kenney_coaster-kit/floor.glb",
  },
  food: {
    floor: "/kenney_food-kit/floor.glb",
    burger: "/kenney_food-kit/burger.glb", // 预留汉堡模型路径
    cheese: "/kenney_food-kit/cheese.glb", // 预留奶酪模型路径
    cuttingBoardRound: "/kenney_food-kit/cutting-board-round.glb", // 预留生菜模型路径
    eggCooked: "/kenney_food-kit/egg-cooked.glb", // 预留煎蛋模型路径
    meatPatty: "/kenney_food-kit/meat-patty.glb", // 预留肉饼模型路径
  }, // 预留food kit的模型路径
  arcade: {
    // floor: "/kenney_mini-arcade/floor.glb",
  }, // 预留arcade kit的模型路径
  market: {
    floor: "/kenney_mini-market/floor.glb",
  }, // 预留market kit的模型路径
} as const;

// 加载器映射
const LOADER_MAP = {
  graveyard: graveyardLoader,
  coaster: coasterLoader,
  food: foodLoader,
  arcade: arcadeLoader,
  market: marketLoader,
  // overcooked: overcookedLoader,
} as const;

// 统一的预加载函数
export const preloadModels = () => {
  Object.entries(MODEL_PATHS).forEach(([kit, paths]) => {
    const loader = LOADER_MAP[kit as keyof typeof LOADER_MAP];
    Object.values(paths).forEach((path) => {
      if (path) {
        useGLTF.preload(path, loader);
      }
    });
  });
};

// 导出模型路径供其他组件使用
export { MODEL_PATHS };
