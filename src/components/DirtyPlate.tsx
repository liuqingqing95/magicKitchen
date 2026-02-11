import React, { useEffect } from "react";
import * as THREE from "three";
import { FoodModelType } from "../types/level";
import { deepCompare, isMultiFoodModelType } from "../utils/util";

export interface DirtyPlateProps {
  id: string;
  model: THREE.Group;
  foodModel: FoodModelType | undefined;
  // visible: boolean;
}

const DirtyPlate = ({ id, model, foodModel }: DirtyPlateProps) => {
  if (!model) return null;
  useEffect(() => {
    let count = 1;
    if (foodModel) {
      if (isMultiFoodModelType(foodModel)) {
        count = count + foodModel.type.length;
      } else {
        count = 2;
      }
    }
    for (let i = 0; i < 6; i++) {
      let mesh1 = model.getObjectByName(`dirtyPlate${i + 1}`);
      let mesh2 = model.getObjectByName(`dirtyPlate${i + 1}_1`);
      if (mesh1 && mesh2) {
        mesh1.visible = i < count ? true : false;
        mesh2.visible = i < count ? true : false;
      }
    }
  }, [model, foodModel]);

  // useEffect(() => {
  //   if (model) {
  //     for (let i = 0; i < 6; i++) {
  //       const plate = model.getObjectByName(`plate_${i + 1}`);
  //        plate.visible =  false;
  //     }
  //   }
  // },[model])

  return <primitive key={id} object={model} position={[0, 0, 0]} scale={1} />;
};
export default React.memo(DirtyPlate, (prevProps, nextProps) => {
  return deepCompare(prevProps, nextProps, (changedKeys) => {
    console.log(
      `DirtyPlate changed keys:${nextProps.id} `,
      changedKeys,
      nextProps.foodModel,
    );
  });
});
