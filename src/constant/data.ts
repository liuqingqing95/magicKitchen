import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  IFoodData,
  IFurnitureItem,
} from "@/types/level";
import { EDirection } from "@/types/public";
export const FURNITURE_ARR: IFurnitureItem[] = [
  {
    type: EFurnitureType.baseTable,
    position: [-6, 0.5, 4],
    rotateDirection: EDirection.left,
  },
  {
    type: EFurnitureType.drawerTable,
    position: [-4, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  // {
  //   type: EFurnitureType.pan,
  //   rotateDirection: EDirection.normal,
  //   position: [-2, 0.8, 4],
  // },
  {
    type: EFurnitureType.drawerTable,
    position: [-2, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  {
    type: EFurnitureType.drawerTable,
    position: [0, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  {
    type: EFurnitureType.drawerTable,
    position: [2, 0.5, 4],
    rotateDirection: EDirection.back,
  },
  {
    type: EFurnitureType.baseTable,
    position: [4, 0.5, 4],
    rotateDirection: EDirection.left,
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [4, 0.5, 2],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [4, 0.5, 0],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [4, 0.5, -2],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [4, 0.5, -6],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [4, 0.5, -8],
  },
  // {
  //   type: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.right,
  //   position: [4, 0.5, -10],
  // },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [6, 0.5, -6],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [8, 0.5, -6],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [8, 0.5, -8],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.right,
    position: [8, 0.5, -10],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [10, 0.55, -10],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [12, 0.55, -10],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [14, 0.55, -10],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [16, 0.55, -10],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, -10],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, -8],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, -6],
  },
  {
    type: EFurnitureType.serveDishes,
    rotateDirection: EDirection.right,
    position: [18.5, 2.025, -3],
  },
  // {
  //   type: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.right,
  //   position: [18.5, 1.8, -3],
  // },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, 0],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, 2],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.right,
    position: [18, 0.5, 4],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [16, 0.5, 4],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [14, 0.5, 4],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [12, 0.5, 4],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [10, 0.5, 4],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.back,
    position: [8, 0.5, 4],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [8, 0.5, 2],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [8, 0.5, 0],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [8, 0.5, -2],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [6, 0.5, -2],
  },
  // {
  //   type: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.back,
  //   position: [6, 0.5, 4],
  // },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [-6, 0.5, -10],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [-4, 0.5, -10],
  },
  {
    type: EFurnitureType.washSink,
    rotateDirection: EDirection.normal,
    position: [-1, 0.5, -10],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [2, 0.5, -10],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [4, 0.5, -10],
  },
  {
    type: EFurnitureType.trash,
    rotateDirection: EDirection.left,
    position: [-6, 0.448, 2],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.5, 0],
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -2],
    foodType: EFoodType.bread,
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -4],
    foodType: EFoodType.tomato,
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -6],
    foodType: EFoodType.meatPatty,
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-6, 0.453, -8],
    foodType: EFoodType.cheese,
  },
];
// export const TABLEWARE_ARR: ITABLEWARE[] = [
//   {
//     type: EGrabType.cuttingBoard,
//     rotateDirection: EDirection.back,
//     //  position: [-2, 0, -2],
//     size: [4.69, 0.299, 2.5],

//     position: [-2, 1.1, 4],
//   },
//   {
//     type: EGrabType.cuttingBoard,
//     rotateDirection: EDirection.back,
//     size: [4.69, 0.299, 2.5],
//     position: [2, 1.1, 4],
//   },
// ];
export const GRAB_ARR: IFoodData[] = [
  {
    type: EGrabType.plate,
    position: [4, 1, 2],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.plate,
    position: [4, 1, 0],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.plate,
    position: [4, 1, -2],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.plate,
    position: [-6, 1, 0],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.fireExtinguisher,
    position: [4, 1, -8],
    size: [1.23, 0.8, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.5,
      inTable: 0.4,
    },
  },
  {
    type: EGrabType.pan,
    position: [12, 1.1, -10],
    size: [1.26, 0.26, 2.2],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.7,
    },
  },
  {
    type: EFoodType.bread,
    position: [0, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  // {
  //   type: EFoodType.meatPatty,
  //   // type: EFoodType.burger,
  //   // type: EFoodType.cheese,
  //   // position: [12, 0, 2],
  //   position: [-2, 0, 0],
  //   size: [0.8, 0.1, 0.8],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.7,
  //     inTable: 0.6,
  //   },
  // },
  // {
  //   // type: EFoodType.meatPatty,
  //   type: EFoodType.cheese,
  //   // position: [12, 0, 2],
  //   position: [-2, 0, 2],
  //   size: [0.8, 0.1, 0.8],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.7,
  //     inTable: 0.6,
  //   },
  // },
  // {
  //   // type: EFoodType.meatPatty,
  //   type: EFoodType.burger,
  //   // position: [12, 0, 2],
  //   position: [-2, 0, -4],
  //   size: [0.975, 0.975, 0.975],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.7,
  //     inTable: 0.6,
  //   },
  // },
  {
    type: EGrabType.cuttingBoard,
    rotateDirection: EDirection.back,
    //  position: [-2, 0, -2],
    size: [4.69, 0.299, 2.5],

    position: [-2, 1.1, 4],
  },
  {
    type: EGrabType.cuttingBoard,
    rotateDirection: EDirection.back,
    size: [4.69, 0.299, 2.5],
    position: [2, 1.1, 4],
  },
];
export const cameraPosition = [1, 15, 10];
export const foodData: IFoodData[] = [
  {
    type: EFoodType.bread,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 1.2,
    },
  },
  {
    type: EFoodType.tomato,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
  {
    type: EFoodType.cheese,
    position: [-2, 0, -2],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
  {
    type: EFoodType.burger,
    position: [-2, 0, -2],
    size: [0.975, 0.975, 0.975],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.7,
    },
  },
  {
    type: EFoodType.meatPatty,
    position: [-2, 0, -2],
    size: [0.87, 0.181, 1.27],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.8,
      inTable: 0.6,
    },
  },
];
