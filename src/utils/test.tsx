import { GrabContext } from "@/context/GrabContext";
import ModelResourceContext from "@/context/ModelResourceContext";
import { types as burgerTypes } from "@/Goals";
import useGrabObstacleStore, {
  useGrabObstaclesMap,
} from "@/stores/useGrabObstacle";
import {
  EFoodType,
  EGrabType,
  ERigidBodyType,
  IFoodWithRef,
} from "@/types/level";
import { useContext } from "react";
import { getId } from "./util";
export const createTextData = (registryFurniture: boolean) => {
  // useGrabObstacleStore()
  const obstacles = useGrabObstaclesMap();
  const { modelMapRef } = useContext(GrabContext);
  const { updateObstacleInfo, setGrabOnFurniture } = useGrabObstacleStore(
    (s) => {
      return {
        updateObstacleInfo: s.updateObstacleInfo,
        setGrabOnFurniture: s.setGrabOnFurniture,
      };
    },
  );
  const { grabModels } = useContext(ModelResourceContext);
  const burgerWithPlate = (food: IFoodWithRef) => {
    if (food.type === EGrabType.plate) {
      const materials = burgerTypes[
        Math.floor(Math.random() * burgerTypes.length)
      ].map((m, i) => {
        return {
          id: `${i}`,
          type: m.name,
        };
      });

      const burgerModel = grabModels[EFoodType.burger].clone();
      const id = getId(ERigidBodyType.grab, EFoodType.burger, burgerModel.uuid);

      updateObstacleInfo(food.id, {
        foodModel: {
          id,
          type: materials,
        },
      });
      modelMapRef.current?.set(id, burgerModel);
    }
  };
  const compliteAssembBurgers = () => {
    if (!registryFurniture) return;
    obstacles.forEach((food) => {
      if (food.type !== EGrabType.plate) return;
      burgerWithPlate(food);
    });
  };
  return {
    compliteAssembBurgers,
  };
};
