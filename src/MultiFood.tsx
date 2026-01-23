import React, { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { CookedImage } from "./Text";
import { BaseFoodModelType, EFoodType, FoodModelType } from "./types/level";
import { isMultiFoodModelType } from "./utils/util";
export interface IFoodModelProps {
  foodModel?: FoodModelType | undefined;
  model: THREE.Group;
  baseFoodModel?: THREE.Group;
  id: string;
  rotation?: THREE.Euler;
  position?: THREE.Vector3 | [number, number, number];
}
export const MultiFood = forwardRef<THREE.Group, IFoodModelProps>(
  (
    {
      foodModel,
      id,
      rotation = new THREE.Euler(0, 0, 0),
      model,
      baseFoodModel,
      position = [0, 0, 0],
    },
    ref,
  ) => {
    console.log(
      "Rendering MultiFood:",
      id,
      position,
      foodModel,
      model,
      baseFoodModel,
    );
    if (!foodModel) {
      return (
        <group position={position} rotation={rotation} ref={ref}>
          <primitive key={id} object={model} scale={1} />
        </group>
      );
    }

    // const arr: BaseFoodModelType[] = isMulti
    //   ? foodModel.type
    //   : [foodModel.type];
    const positions: [number, number, number][] = [
      [-1, 2.3, 0],
      [0.1, 2.3, 0],
      [-1, 2.3, -1],
      [0.1, 2.3, -1],
    ];
    const renderContent = useMemo(() => {
      const isMulti = isMultiFoodModelType(foodModel);
      const multiArr = isMulti
        ? (foodModel.type as BaseFoodModelType[]).map((item) => item.type)
        : [];
      return (
        <>
          {isMulti ? (
            multiArr.map((item, index) => {
              return (
                <CookedImage
                  key={item}
                  scale={1}
                  url={`/2D/${item}.png`}
                  position={positions[index]}
                ></CookedImage>
              );
            })
          ) : (
            <CookedImage
              key={foodModel.type as EFoodType}
              scale={1}
              url={`/2D/${foodModel.type}.png`}
              position={[0, 2.3, 0]}
            ></CookedImage>
          )}
        </>
      );
    }, [foodModel.type]);

    // const foodModelId = useMemo(() => {
    //   return (
    //     baseFoodModel &&
    //     getId(
    //       ERigidBodyType.grab,
    //       isMultiFoodModelType(foodModel) ? EFoodType.burger : foodModel.type,
    //       baseFoodModel.uuid
    //     )
    //   );
    // }, [baseFoodModel, foodModel]);

    //   const modelId = useMemo(() => {
    //   return (
    //     baseFoodModel &&
    //     getId(
    //       ERigidBodyType.grab,
    //       isMultiFoodModelType(foodModel) ? EFoodType.burger : foodModel.type,
    //       baseFoodModel.uuid
    //     )
    //   );
    // }, [baseFoodModel, foodModel]);

    return (
      <>
        <group position={position} rotation={rotation} ref={ref}>
          <primitive key={id} object={model} scale={1} />
          {baseFoodModel && (
            <primitive key={foodModel.id} object={baseFoodModel} scale={1} />
          )}
          {renderContent}
        </group>
      </>
    );
  },
);

export default React.memo(MultiFood);
MultiFood.displayName = "MultiFood";
