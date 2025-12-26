import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  IFurnitureItem,
  IGrabItem,
} from "@/types/level";
import { EDirection } from "@/types/public";
export const FURNITURE_ARR: IFurnitureItem[] = [
  {
    name: EFurnitureType.baseTable,
    position: [-6, 0.5, 4],
    rotateDirection: EDirection.left,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [-4, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  // {
  //   name: EFurnitureType.pan,
  //   rotateDirection: EDirection.normal,
  //   position: [-2, 0.8, 4],
  // },

  {
    name: EFurnitureType.drawerTable,
    position: [-2, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [0, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [2, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  {
    name: EFurnitureType.baseTable,
    position: [4, 0.5, 4],
    rotateDirection: EDirection.left,
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [4, 0.5, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [4, 0.5, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [4, 0.5, -2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [4, 0.5, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [4, 0.5, -8],
  },
  // {
  //   name: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.right,
  //   position: [4, 0.5, -10],
  // },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [6, 0.5, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [8, 0.5, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [8, 0.5, -8],
  },
  {
    name: EFurnitureType.baseTable,
    rotateDirection: EDirection.right,
    position: [8, 0.5, -10],
  },

  {
    name: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [10, 0.55, -10],
  },
  {
    name: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [12, 0.55, -10],
  },

  {
    name: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [14, 0.55, -10],
  },
  {
    name: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [16, 0.55, -10],
  },
  {
    name: EFurnitureType.baseTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, -8],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, -6],
  },
  {
    name: EFurnitureType.serveDishes,
    rotateDirection: EDirection.right,
    position: [18.5, 2.025, -3],
  },
  // {
  //   name: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.right,
  //   position: [18.5, 1.8, -3],
  // },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, 2],
  },
  {
    name: EFurnitureType.baseTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [16, 0.5, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [14, 0.5, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [12, 0.5, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [10, 0.5, 4],
  },
  {
    name: EFurnitureType.baseTable,
    rotateDirection: EDirection.back,
    position: [8, 0.5, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [8, 0.5, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [8, 0.5, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [8, 0.5, -2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [6, 0.5, -2],
  },
  // {
  //   name: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.back,
  //   position: [6, 0.5, 4],
  // },

  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [-6, 0.5, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [-4, 0.5, -10],
  },
  {
    name: EFurnitureType.washSink,
    rotateDirection: EDirection.normal,
    position: [-1, 0.5, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [2, 0.5, -10],
  },
  {
    name: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [4, 0.5, -10],
  },
  {
    name: EFurnitureType.trash,
    rotateDirection: EDirection.left,
    position: [-6, 0.448, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.5, 0],
  },
  {
    name: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -2],
    foodType: EFoodType.cuttingBoardRound,
  },
  {
    name: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -4],
    foodType: EFoodType.eggCooked,
  },
  {
    name: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -6],
    foodType: EFoodType.meatPatty,
  },
  {
    name: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -8],
    foodType: EFoodType.cheese,
  },
];
// export const TABLEWARE_ARR: ITABLEWARE[] = [
//   {
//     name: EGrabType.cuttingBoard,
//     rotateDirection: EDirection.back,
//     //  position: [-2, 0, -2],
//     size: [4.69, 0.299, 2.5],

//     position: [-2, 1.1, 4],
//   },
//   {
//     name: EGrabType.cuttingBoard,
//     rotateDirection: EDirection.back,
//     size: [4.69, 0.299, 2.5],
//     position: [2, 1.1, 4],
//   },
// ];
export const GRAB_ARR: IGrabItem[] = [
  {
    name: EGrabType.plate,
    position: [4, 1, 2],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
  // {
  //   name: EGrabType.plate,
  //   position: [8, 1, 0],
  //   size: [1.5, 0.15, 1.5],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.8,
  //     inTable: 0.6,
  //   },
  // },
  // {
  //   name: EGrabType.plate,
  //   position: [14, 1, 4],
  //   size: [1.5, 0.15, 1.5],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.8,
  //     inTable: 0.6,
  //   },
  // },
  // {
  //   name: EGrabType.plate,
  //   position: [16, 1, 4],
  //   size: [1.5, 0.15, 1.5],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.8,
  //     inTable: 0.6,
  //   },
  // },
  {
    name: EGrabType.fireExtinguisher,
    position: [4, 1, -8],
    size: [1.23, 0.8, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0,
      inTable: 0.4,
    },
  },
  {
    name: EGrabType.pan,
    position: [12, 1.1, -10],
    size: [1.26, 0.26, 2.2],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.5,
      inTable: 0.6,
    },
  },
  {
    // name: EFoodType.eggCooked,
    name: EFoodType.cuttingBoardRound,
    // position: [12, 0, 2],
    position: [0, 0, -2],
    size: [0.8, 0.1, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    name: EFoodType.meatPatty,
    // name: EFoodType.cheese,
    // position: [12, 0, 2],
    position: [-2, 0, 0],
    size: [0.8, 0.1, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    // name: EFoodType.meatPatty,
    name: EFoodType.cheese,
    // position: [12, 0, 2],
    position: [-2, 0, 2],
    size: [0.8, 0.1, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    name: EGrabType.cuttingBoard,
    rotateDirection: EDirection.back,
    //  position: [-2, 0, -2],
    size: [4.69, 0.299, 2.5],

    position: [-2, 1.1, 4],
  },
  {
    name: EGrabType.cuttingBoard,
    rotateDirection: EDirection.back,
    size: [4.69, 0.299, 2.5],
    position: [2, 1.1, 4],
  },
];
export const cameraPosition = [1, 15, 10];
export const foodData = [
  {
    name: EFoodType.cuttingBoardRound,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    name: EFoodType.eggCooked,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    name: EFoodType.cheese,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    name: EFoodType.burger,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    name: EFoodType.meatPatty,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
];
