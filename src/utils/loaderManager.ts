import { EFoodType } from "@/types/level";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// 创建加载器实例的通用函数
const createLoader = (): GLTFLoader => {
  const decoderPath = `${import.meta.env.BASE_URL}libs/draco/`;
  const loader = new GLTFLoader();

  // 1. 设置 Draco 解码器（用于 Draco 压缩的模型）
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(decoderPath); // Draco 解码器路径
  dracoLoader.preload();
  loader.setDRACOLoader(dracoLoader);

  // 2. 设置 MeshOpt 解码器（用于 gltfpack -cc 压缩的模型）
  MeshoptDecoder.ready.then(() => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  return loader;
};

// 导出加载器实例
export const modelLoader = createLoader();

// 模型路径配置
const MODEL_PATHS = {
  graveyard: {
    // character: "/kenney_graveyard-kit_5.0/character-keeper.glb",
    // brickWall: "/kenney_graveyard-kit_5.0/brick-wall.glb",
    // // test: "/test.glb",
    // // d: "./overcooked_kitchen_assets_fan_art.glb",
    // wallCurve: "/kenney_graveyard-kit_5.0/brick-wall-curve-small.glb",
    // player: "/kenney_graveyard-kit_5.0/character-keeper.glb",
    // floor: "/kenney_graveyard-kit_5.0/floor.glb",
  },
  overcooked: {
    baseTable: "./overcooked/baseTable.glb",
    gasStove: "./overcooked/gasStove.glb",
    breadTable: "./overcooked/breadTable.glb",
    tomatoTable: "./overcooked/tomatoTable.glb",
    meatPattyTable: "./overcooked/meatPattyTable.glb",
    cheeseTable: "./overcooked/cheeseTable.glb",
    drawerTable: "./overcooked/drawerTable.glb",
    trash: "./overcooked/trash.glb",
    dirtyPlate: "./overcooked/dirtyPlate.glb",
    fireExtinguisher: "./overcooked/fireExtinguisher.glb",
    cuttingBoard: "./overcooked/cuttingBoard.glb",
    // cuttingBoardNoKnife: "./overcooked/cuttingBoardNoKnife.glb",
    pan: "./overcooked/pan.glb",
    plate: "./overcooked/plate.glb",
    serveDishes: "./overcooked/serveDishes.glb",
    wall: "./overcooked/wall.glb",
    stockpot: "./overcooked/stockpot.glb",
    washSink: "./overcooked/washSink.glb",
    floor: "./overcooked/floor.glb",
    // knife: "./overcooked/knife.glb",
    player: "./overcooked/player1/overcooked_-_pug_character.glb",
    player2: "./overcooked/player1/little_chef_overcooked_like.glb",
  },
  food: {
    burger: "./kenney_food-kit/burger.glb",
    cheese: "./kenney_food-kit/cheese.glb",
    bread: "./kenney_food-kit/bread.glb",
    tomato: "./kenney_food-kit/tomato.glb",
    tomatoCut: "./kenney_food-kit/tomato-cut.glb",
    meatPatty: "./kenney_food-kit/meat-patty.glb",
    tomatoMeat: "./kenney_food-kit/tomato-meat.glb",
    rawMeatPie: "./kenney_food-kit/raw-meat-pie.glb",
    cheeseCut: "./kenney_food-kit/cheese-cut.glb",
    meatPie: "./kenney_food-kit/meat-pie.glb",
    cheeseTomato: "./kenney_food-kit/cheese-tomato.glb",
    cheeseTomatoMeat: "./kenney_food-kit/cheese-tomato-meat.glb",
    cheeseMeat: "./kenney_food-kit/cheese-meat.glb",
  }, // 预留food kit的模型路径
  arcade: {
    // floor: "/kenney_mini-arcade/floor.glb",
  }, // 预留arcade kit的模型路径
  market: {
    // floor: "/kenney_mini-market/floor.glb",
  }, // 预留market kit的模型路径
} as const;

// 统一的预加载函数
// export const preloadModels = () => {
//   Object.entries(MODEL_PATHS).forEach(([, paths]) => {
//     Object.values(paths).forEach((path) => {
//       if (path) {
//         useGLTF.preload(path);
//       }
//     });
//   });
// };
const urls = [
  EFoodType.bread,
  EFoodType.meatPatty,
  EFoodType.tomato,
  EFoodType.cheese,
];
// 导出纹理 URL 列表，实际加载应在 React 组件（context provider）中使用 useLoader
export const TEXTURE_URLS = urls.map((k) => `./2D/${k}.png`);

// 导出模型路径供其他组件使用
export { MODEL_PATHS };
