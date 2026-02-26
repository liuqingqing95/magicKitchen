import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  IFoodData,
  IFurnitureItem,
  IGrabItem,
} from "@/types/level";
import { EDirection } from "@/types/public";
export const FURNITURE_ARR: IFurnitureItem[] = [
  {
    type: EFurnitureType.baseTable,
    position: [-12, 0.5, 11],
    rotateDirection: EDirection.normal,
  },
  {
    type: EFurnitureType.drawerTable,
    position: [-10, 0.5, 11],
    rotateDirection: EDirection.back,
  },
  // {
  //   type: EFurnitureType.pan,
  //   rotateDirection: EDirection.normal,
  //   position: [-2, 0.8, 11],
  // },
  {
    type: EFurnitureType.drawerTable,
    position: [-8, 0.5, 11],
    rotateDirection: EDirection.back,
  },
  {
    type: EFurnitureType.drawerTable,
    position: [-6, 0.5, 11],
    rotateDirection: EDirection.back,
  },
  {
    type: EFurnitureType.drawerTable,
    position: [-4, 0.5, 11],
    rotateDirection: EDirection.back,
  },
  {
    type: EFurnitureType.baseTable,
    position: [-2, 0.5, 11],
    rotateDirection: EDirection.normal,
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [-2, 0.5, 9],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [-2, 0.5, 7],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [-2, 0.5, 5],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [-2, 0.5, 1],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [-2, 0.5, -1],
  },
  // {
  //   type: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.right,
  //   position: [-2, 0.5, -3],
  // },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [0, 0.5, 1],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [2, 0.5, 1],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [2, 0.5, -1],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [2, 0.5, -3],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [4, 0.55, -3],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [6, 0.55, -3],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [8, 0.55, -3],
  },
  {
    type: EFurnitureType.gasStove,
    rotateDirection: EDirection.normal,
    position: [10, 0.55, -3],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [12, 0.5, -3],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [12, 0.5, -1],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [12, 0.5, 1],
  },
  {
    type: EFurnitureType.serveDishes,
    rotateDirection: EDirection.right,
    position: [12.5, 2.025, 4],
  },
  // {
  //   type: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.right,
  //   position: [12.5, 1.8, 4],
  // },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [12, 0.5, 7],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.right,
    position: [12, 0.5, 9],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [12, 0.5, 11],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [10, 0.5, 11],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [8, 0.5, 11],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [6, 0.5, 11],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [4, 0.5, 11],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [2, 0.5, 11],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [2, 0.5, 9],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [2, 0.5, 7],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [2, 0.5, 5],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.back,
    position: [0, 0.5, 5],
  },
  // {
  //   type: EFurnitureType.drawerTable,
  //   rotateDirection: EDirection.back,
  //   position: [0, 0.5, 11],
  // },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [-12, 0.5, -3],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [-10, 0.5, -3],
  },
  {
    type: EFurnitureType.washSink,
    rotateDirection: EDirection.normal,
    position: [-7, 0.5, -3],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.normal,
    position: [-4, 0.5, -3],
  },
  {
    type: EFurnitureType.baseTable,
    rotateDirection: EDirection.normal,
    position: [-2, 0.5, -3],
  },
  {
    type: EFurnitureType.trash,
    rotateDirection: EDirection.left,
    position: [-12, 0.448, 9],
  },
  {
    type: EFurnitureType.drawerTable,
    rotateDirection: EDirection.left,
    position: [-12, 0.5, 7],
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-12, 0.453, 5],
    foodType: EFoodType.bread,
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-12, 0.453, 3],
    foodType: EFoodType.tomato,
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-12, 0.453, 1],
    foodType: EFoodType.meatPatty,
  },
  {
    type: EFurnitureType.foodTable,
    rotateDirection: EDirection.left,
    position: [-12, 0.453, -1],
    foodType: EFoodType.cheese,
  },
];

export const GRAB_ARR: IGrabItem[] = [
  {
    type: EGrabType.dirtyPlate,
    position: [12, 1, 7],
    size: [1.5, 0.15, 1.5],
    visible: false,
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.plate,
    position: [12, 1, 9],
    size: [1.5, 0.15, 1.5],
    visible: false,
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  // {
  //   type: EGrabType.dirtyPlate,
  //   // position: [12, 1, 9],
  //   position: [-2, 1, -1],
  //   size: [1.5, 0.15, 1.5],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.7,
  //     inTable: 0.6,
  //   },
  // },
  // {
  //   type: EGrabType.dirtyPlate,
  //   position: [8, 1, 9],
  //   size: [1.5, 0.15, 1.5],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.7,
  //     inTable: 0.6,
  //   },
  // },
  {
    type: EGrabType.dirtyPlate,
    position: [-10, 1, -3],
    // position: [6, 1, 11],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },

  {
    type: EGrabType.plate,
    position: [-2, 1, 9],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.dirtyPlate,
    position: [-4, 1, -3],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.plate,
    position: [-6, 1, 11],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.plate,
    position: [-10, 1, 11],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    type: EGrabType.fireExtinguisher,
    position: [-2, 1, -1],
    size: [1.23, 0.8, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.5,
      inTable: 0.4,
    },
  },
  {
    type: EGrabType.pan,
    position: [10, 1.1, -3],
    size: [1.26, 0.26, 2.2],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.7,
    },
    rotateDirection: EDirection.normal,
  },
  {
    type: EGrabType.pan,
    position: [8, 1.1, -3],
    size: [1.26, 0.26, 2.2],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.7,
    },
    rotateDirection: EDirection.normal,
  },
  {
    type: EGrabType.pan,
    position: [6, 1.1, -3],
    size: [1.26, 0.26, 2.2],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.7,
    },
    rotateDirection: EDirection.normal,
  },
  {
    type: EGrabType.pan,
    position: [4, 1.1, -3],
    size: [1.26, 0.26, 2.2],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.7,
    },
    rotateDirection: EDirection.normal,
  },

  {
    type: EFoodType.meatPatty,
    // position: [-6, 0, 5],
    position: [6, 0, 7],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  // {
  //   type: EFoodType.cheese,
  //   // position: [-6, 0, 5],
  //   position: [5, 0, 7],
  //   size: [0.8, 0.08, 0.8],
  //   grabbingPosition: {
  //     inFloor: 0,
  //     inHand: 0.7,
  //     inTable: 0.6,
  //   },
  // },
  // {
  //   // type: EFoodType.meatPatty,
  //   // type: EFoodType.burger,
  //   type: EFoodType.cheese,
  //   position: [6, 0, 9],
  //   // position: [-8, 0, 7],
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
  //   // position: [6, 0, 9],
  //   position: [-8, 0, 9],
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
  //   // position: [6, 0, 9],
  //   position: [-8, 0, 3],
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
    //  position: [-8, 0, 5],
    size: [4.69, 0.299, 2.5],

    position: [-8, 1, 11],
  },
  {
    type: EGrabType.cuttingBoard,
    rotateDirection: EDirection.back,
    size: [4.69, 0.299, 2.5],
    position: [-4, 1, 11],
  },
];
export const cameraPosition = [-5, 15, 17];
export const foodData: IFoodData[] = [
  {
    type: EFoodType.bread,
    position: [-8, 0, 5],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 1.2,
    },
  },
  {
    type: EFoodType.tomato,
    position: [-8, 0, 5],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    type: EFoodType.cheese,
    position: [-8, 0, 5],
    size: [0.8, 0.08, 0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
  {
    type: EFoodType.burger,
    position: [-8, 0, 5],
    size: [0.975, 0.975, 0.975],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.7,
    },
  },
  {
    type: EFoodType.meatPatty,
    position: [-8, 0, 5],
    size: [0.87, 0.181, 1.27],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0.7,
      inTable: 0.6,
    },
  },
];
