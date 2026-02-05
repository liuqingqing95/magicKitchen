import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { CookedImage } from "./Text";
import { BaseFoodModelType, EFoodType, FoodModelType } from "./types/level";
import { isMultiFoodModelType } from "./utils/util";
export interface IFoodModelProps {
  foodModel?: FoodModelType | undefined;
  model: THREE.Group;
  baseFoodModel?: THREE.Group;
  baseFoodPos?: [number, number, number];
  id: string;
  rotation?: [number, number, number];
  position?: [number, number, number];
  visible?: boolean;
  imageVisible?: boolean;
}
export const MultiFood = forwardRef<THREE.Group, IFoodModelProps>(
  (
    {
      foodModel,
      imageVisible = true,
      id,
      rotation = [0, 0, 0],
      model,
      baseFoodPos,
      baseFoodModel,
      position = [0, 0, 0],
      visible = true,
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
    const rotationEuler = new THREE.Euler(
      rotation[0],
      rotation[1],
      rotation[2],
    );
    if (!foodModel) {
      return (
        <group
          position={position}
          rotation={rotationEuler}
          ref={ref}
          visible={visible}
        >
          <primitive object={model} scale={1} />
        </group>
      );
    }

    // const arr: BaseFoodModelType[] = isMulti
    //   ? foodModel.type
    //   : [foodModel.type];
    const positions: [number, number, number][] = [
      [-0.5, 2.3, 0],
      [0.5, 2.3, 0],
      [-0.5, 2.3, -1],
      [0.5, 2.3, -1],
    ];
    const foodImage = useMemo(() => {
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

    return (
      <>
        <group
          position={position}
          rotation={rotationEuler}
          ref={ref}
          key={model.uuid}
          visible={visible}
        >
          <primitive object={model} scale={1} />
          {baseFoodModel && (
            <primitive
              object={baseFoodModel}
              position={baseFoodPos}
              scale={1}
            />
          )}
          {imageVisible && foodImage}
        </group>
      </>
    );
  },
);

export default MultiFood;
MultiFood.displayName = "MultiFood";
