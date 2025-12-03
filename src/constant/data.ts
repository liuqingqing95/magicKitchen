import { EFurnitureType, EGrabType, IFurnitureItem, IGrabItem } from '@/types/level';
import { EDirection } from "@/types/public";
export const FURNITURE_ARR: IFurnitureItem[] = [
  {
    name: EFurnitureType.baseTable,
    position: [-6, 0.2, 4],
    rotate: EDirection.left,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [-4, 0.2, 4],
    rotate: EDirection.back,
  },
  // {
  //   name: EFurnitureType.pan,
  //   rotate: EDirection.normal,
  //   position: [-2, 0.8, 4],
  // },
  
  {
    name: EFurnitureType.drawerTable,
    position: [-2, 0.2, 4],
    rotate: EDirection.back,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [0, 0.2, 4],
    rotate: EDirection.back,
  },
  {
    name: EFurnitureType.drawerTable,
    position: [2, 0.2, 4],
    rotate: EDirection.back,
  },
  {
    name: EFurnitureType.baseTable,
    position: [4, 0.2, 4],
    rotate: EDirection.left,
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.2, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.2, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [4, 0.2, -2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [4, 0.2, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.2, -8],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [4, 0.2, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [6, 0.2, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [8, 0.2, -6],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [8, 0.2, -8],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.normal,
    position: [8, 0.2, -10],
  },
 
  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [10, 0.2, -10],
  },
  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [12, 0.2, -10],
  },


  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [14, 0.2, -10],
  },
  {
    name: EFurnitureType.gasStove,
    rotate: EDirection.normal,
    position: [16, 0.2, -10],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.right,
    position: [18, 0.2, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.2, -8],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.2, -6],
  },
  {
    name: EFurnitureType.serveDishes,
    rotate: EDirection.right,
    position: [18.5, 0.2, -3],
  },
  // {
  //   name: EFurnitureType.drawerTable,
  //   rotate: EDirection.right,
  //   position: [18.5, 1.8, -3],
  // },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.2, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.right,
    position: [18, 0.2, 2],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.right,
    position: [18, 0.2, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [16, 0.2, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [14, 0.2, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [12, 0.2, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [10, 0.2, 4],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.back,
    position: [8, 0.2, 4],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.left,
    position: [8, 0.2, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.left,
    position: [8, 0.2, 0],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [8, 0.2, -2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.back,
    position: [6, 0.2, -2],
  },
  // {
  //   name: EFurnitureType.drawerTable,
  //   rotate: EDirection.back,
  //   position: [6, 0.2, 4],
  // },

  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [-6, 0.2, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [-4, 0.2, -10],
  },
  {
    name: EFurnitureType.washSink,
    rotate: EDirection.normal,
    position: [-1, 0.2, -10],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.normal,
    position: [2, 0.2, -10],
  },
  {
    name: EFurnitureType.baseTable,
    rotate: EDirection.normal,
    position: [4, 0.2, -10],
  },
  {
    name: EFurnitureType.trash,
    rotate: EDirection.left,
    position: [-6, 0.2, 2],
  },
  {
    name: EFurnitureType.drawerTable,
    rotate: EDirection.left,
    position: [-6, 0.2, 0],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.2, -2],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.2, -4],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.2, -6],
  },
  {
    name: EFurnitureType.foodTable,
    rotate: EDirection.left,
    position: [-6, 0.2, -8],
  },
  // {
  //
  //   position: [6, 0.2, -12],
  // },
];

export const GRAB_ARR: IGrabItem[] = [
  {
    name: EGrabType.plate,
    position: [-2, 0.8, 4],
  },

  {
    name: EGrabType.fireExtinguisher,
    position: [-6, 0.7, -8],
  },
  {
    name: EGrabType.pan,
    position: [12, 0.8, -10],
  },
  {
    name: EGrabType.hamburger,
    position: [-2, 1.1, 4],
  },
]