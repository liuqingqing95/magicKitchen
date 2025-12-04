import { EFurnitureType, EGrabType, IFurnitureItem, IGrabItem } from '@/types/level';
import { EDirection } from "@/types/public";
export const FURNITURE_ARR: IFurnitureItem[] = [
  {
    name: EFurnitureType.baseTable,
    position: [-6, 0.08, 4],
    rotate: EDirection.left,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [-4, 0.08, 4],
    rotate: EDirection.back,
  },
  // {
  //   name: EFurnitureType.pan,
  //   rotate: EDirection.normal,
  //   position: [-2, 0.8, 4],
  // },
  
  {
    name: EFurnitureType.drawerTable,
    position: [-2, 0.08, 4],
    rotate: EDirection.back,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [0, 0.08, 4],
    rotate: EDirection.back,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [2, 0.08, 4],
    rotate: EDirection.back,
  },
  {
    name: EFurnitureType.baseTable,
    position: [4, 0.08, 4],
    rotate: EDirection.left,
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.08, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.08, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [4, 0.08, -2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [4, 0.08, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.08, -8],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.08, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [6, 0.08, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [8, 0.08, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [8, 0.08, -8],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.normal,
    position: [8, 0.08, -10],
  },
 
  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [10, 0.08, -10],
  },
  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [12, 0.08, -10],
  },


  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [14, 0.08, -10],
  },
  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [16, 0.08, -10],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.right,
    position: [18, 0.08, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.08, -8],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.08, -6],
  },
  {
    name: EFurnitureType.serveDishes,
    rotate: EDirection.right,
    position: [18.5, 0.08, -3],
  },
  // {
  //   name: EFurnitureType.drawerTable,
  //   rotate: EDirection.right,
  //   position: [18.5, 1.8, -3],
  // },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.08, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.08, 2],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.right,
    position: [18, 0.08, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [16, 0.08, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [14, 0.08, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [12, 0.08, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [10, 0.08, 4],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.back,
    position: [8, 0.08, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.left,
    position: [8, 0.08, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.left,
    position: [8, 0.08, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [8, 0.08, -2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [6, 0.08, -2],
  },
  // {
  //   name: EFurnitureType.drawerTable,
  //   rotate: EDirection.back,
  //   position: [6, 0.08, 4],
  // },

  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [-6, 0.08, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [-4, 0.08, -10],
  },
  {
    name: EFurnitureType.washSink,
    rotate: EDirection.normal,
    position: [-1, 0.08, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [2, 0.08, -10],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.normal,
    position: [4, 0.08, -10],
  },
  {
    name: EFurnitureType.trash,
    rotate: EDirection.left,
    position: [-6, 0.08, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.left,
    position: [-6, 0.08, 0],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.08, -2],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.08, -4],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.08, -6],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.08, -8],
  },
  // {
  //
  //   position: [6, 0.2, -12],
  // },
];

export const GRAB_ARR: IGrabItem[] = [
  {
    name: EGrabType.plate,
    position: [-2, 0.6, 4],
    size: [1.5, 0.15, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0,
      inTable: 0.6
    }
  },
  {
    name: EGrabType.fireExtinguisher,
    position: [-6, 0.4, -8],
    size: [1.23, 0.8, 1.5],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0,
      inTable: 0.4
    }
  },
  {
    name: EGrabType.pan,
    position: [12, 0.6, -10],
    size: [1.26, 0.26, 2.2],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0,
      inTable: 0.6
    }
  },
  {
    name: EGrabType.hamburger,
    position: [-2, -0.2, -1],
    size: [0.8,0.08,0.8],
    grabbingPosition: {
      inFloor: 0,
      inHand: 0,
      inTable: 0.6
    }
  },
]