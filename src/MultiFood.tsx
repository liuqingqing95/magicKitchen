import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { CookedImage, DebugText } from "./Text";
import { BaseFoodModelType, EFoodType, FoodModelType } from "./types/level";
import { isMultiFoodModelType } from "./utils/util";

export interface IFoodModelProps {
  foodModel?: FoodModelType | undefined;
  model: THREE.Group;
  baseFoodModel?: THREE.Group;
  position?: THREE.Vector3 | [number, number, number];
}
export const MultiFood = forwardRef<THREE.Group, IFoodModelProps>(
  ({ foodModel, model, baseFoodModel, position = [0, 0, 0] }, ref) => {
    console.log(
      "Rendering MultiFood:",
      position,
      foodModel,
      model,
      baseFoodModel
    );
    if (!foodModel) {
      return (
        <group position={position} ref={ref}>
          <primitive key={model.uuid} object={model} scale={1} />
        </group>
      );
    }

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
    const renderContent = useMemo(() => {
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
            <DebugText
              color={"#000"}
              text={foodModel.type as EFoodType}
              position={2.3}
            ></DebugText>
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
        <group position={position} ref={ref}>
          <primitive object={model} scale={1} />
          {baseFoodModel && (
            <primitive key={foodModel.id} object={baseFoodModel} scale={1} />
          )}
          {renderContent}
        </group>
      </>
    );
  }
);

export default MultiFood;
MultiFood.displayName = "MultiFood";
