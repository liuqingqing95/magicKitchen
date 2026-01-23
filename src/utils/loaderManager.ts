import { EFoodType } from "@/types/level";
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
    // character: "/kenney_graveyard-kit_5.0/character-keeper.glb",
    // brickWall: "/kenney_graveyard-kit_5.0/brick-wall.glb",
    // // test: "/test.glb",
    // // d: "/overcooked_kitchen_assets_fan_art.glb",
    // wallCurve: "/kenney_graveyard-kit_5.0/brick-wall-curve-small.glb",
    // player: "/kenney_graveyard-kit_5.0/character-keeper.glb",
    // floor: "/kenney_graveyard-kit_5.0/floor.glb",
  },
  overcooked: {
    baseTable: "/overcooked/baseTable.gltf",
    gasStove: "/overcooked/gasStove.gltf",
    breadTable: "/overcooked/breadTable.gltf",
    tomatoTable: "/overcooked/tomatoTable.gltf",
    meatPattyTable: "/overcooked/meatPattyTable.gltf",
    cheeseTable: "/overcooked/cheeseTable.gltf",
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
    // knife: "/overcooked/knife.glb",
    player: "/overcooked/player1/overcooked_-_pug_character.gltf",
    player2: "/overcooked/player1/little_chef_overcooked_like.gltf",
  },
  coaster: {
    // stallFood: "/kenney_coaster-kit/stall-food.glb",
    // floor: "/kenney_coaster-kit/floor.glb",
  },
  food: {
    burger: "/kenney_food-kit/burger.glb", // 预留汉堡模型路径
    cheese: "/kenney_food-kit/cheese.glb", // 预留奶酪模型路径
    bread: "/kenney_food-kit/bread.glb", // 预留生菜模型路径
    tomato: "/kenney_food-kit/tomato.glb", // 预留煎蛋模型路径
    meatPatty: "/kenney_food-kit/meat-patty.glb", // 预留肉饼模型路径
  }, // 预留food kit的模型路径
  arcade: {
    // floor: "/kenney_mini-arcade/floor.glb",
  }, // 预留arcade kit的模型路径
  market: {
    // floor: "/kenney_mini-market/floor.glb",
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
  Object.entries(MODEL_PATHS).forEach(([, paths]) => {
   
    Object.values(paths).forEach((path) => {
      if (path) {
        useGLTF.preload(path);
      }
    });
  });
};
const urls = [
  EFoodType.bread,
  EFoodType.meatPatty,
  EFoodType.tomato,
  EFoodType.cheese,
];
// 导出纹理 URL 列表，实际加载应在 React 组件（context provider）中使用 useLoader
export const TEXTURE_URLS = urls.map((k) => `/2D/${k}.png`);

// 导出模型路径供其他组件使用
export { MODEL_PATHS };

