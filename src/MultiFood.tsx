import React, { forwardRef } from "react";
import * as THREE from "three";
import { CookedImage } from "./Text";
import { BaseFoodModelType, EFoodType, FoodModelType } from "./types/level";
import { isMultiFoodModelType } from "./utils/util";

interface IFoodModelProps {
  foodModel?: FoodModelType | undefined;
  model: THREE.Group;
  baseFoodModel?: THREE.Group;
  position?: THREE.Vector3 | [number, number, number];
}
export const MultiFood = forwardRef<THREE.Group, IFoodModelProps>(
  ({ foodModel, model, baseFoodModel, position = [0, 0, 0] }, ref) => {
    if (!foodModel) {
      return (
        <group position={position} ref={ref}>
          <primitive key={model.uuid} object={model} scale={1} />
        </group>
      );
    }
    console.log("Rendering MultiFood:", position, foodModel);
    const isMulti = isMultiFoodModelType(foodModel);
    // const arr: BaseFoodModelType[] = isMulti
    //   ? foodModel.type
    //   : [foodModel.type];
    const positions: [number, number, number][] = [
      [-1, 2.3, 0],
      [0.1, 2.3, 0],
      [-1, 2.3, -1],
      [0.1, 2.3, -1],
    ];
    const multiArr = isMulti
      ? (foodModel.type as BaseFoodModelType[]).map((item) => item.type)
      : [];
    return (
      <>
        <group position={position} ref={ref}>
          <primitive object={model} scale={1} />
          {baseFoodModel && (
            <primitive key={foodModel.id} object={baseFoodModel} scale={1} />
          )}
          {
            isMulti ? (
              <>
                {multiArr.map((item, index) => {
                  return (
                    <CookedImage
                      key={item}
                      scale={item === EFoodType.cheese ? 0.86 : 0.9}
                      url={`/2D/${item}.png`}
                      position={positions[index]}
                    ></CookedImage>
                  );
                })}
              </>
            ) : (
              <CookedImage
                key={foodModel.type as EFoodType}
                scale={foodModel.type === EFoodType.cheese ? 0.86 : 0.9}
                url={`/2D/${foodModel.type as EFoodType}.png`}
                position={[0, 1.8, 0]}
              ></CookedImage>
            )
            //  (
            //   <DebugText
            //     color={"#000"}
            //     text={foodModel.type as EFoodType}
            //     position={2.3}
            //   ></DebugText>
            // )
          }
        </group>
      </>
    );
  }
);
export default React.memo(MultiFood);
MultiFood.displayName = "MultiFood";
