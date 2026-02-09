import { GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import ModelResourceContext from "@/context/ModelResourceContext";
import { useObstaclesMap } from "@/stores/useFurnitureObstacle";
import useGame, { useGameReceiveFood } from "@/stores/useGame";
import useGrabObstacleStore, {
  useGrabOnFurniture,
} from "@/stores/useGrabObstacle";
import { EGrabType, ERigidBodyType, FoodModelType } from "@/types/level";
import {
  createFoodItem,
  generateUUID,
  getId,
  isMultiFoodModelType,
  pathInclude,
} from "@/utils/util";
import { useFrame } from "@react-three/fiber";
import React, { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { CreateRender, IRenderProps } from "./FurnitureEntity";

interface IServiceDishes extends IRenderProps {
  modelRef: React.RefObject<THREE.Group>;
}

const ServeDishes = React.memo(
  ({ model, type, modelRef, size }: IServiceDishes) => {
    console.log(
      "Rendering serveDishes furniture:",
      model.getObjectByName("dirtyPlate1")?.visible,
    );
    const { grabModels } = useContext(ModelResourceContext);
    const { modelMapRef } = useContext(GrabContext);

    const grabOnFurniture = useGrabOnFurniture();
    const receiveFood = useGameReceiveFood();
    const setReceiveFood = useGame((s) => s.setReceiveFood);
    const {
      registerObstacle,
      updateObstacleInfo,
      getObstacleInfo,
      setGrabOnFurniture,
      getGrabOnFurniture,
    } = useGrabObstacleStore((s) => {
      return {
        registerObstacle: s.registerObstacle,
        setGrabOnFurniture: s.setGrabOnFurniture,
        getObstacleInfo: s.getObstacleInfo,
        getGrabOnFurniture: s.getGrabOnFurniture,
        updateObstacleInfo: s.updateObstacleInfo,
      };
    });
    const furnitureObstacles = useObstaclesMap();

    const pendingRef = React.useRef<Map<string, number>>(new Map());

    const getObstacleInfoRef = useRef(getObstacleInfo);
    const getGrabOnFurnitureRef = useRef(getGrabOnFurniture);
    useEffect(() => {
      getObstacleInfoRef.current = getObstacleInfo;
    }, [getObstacleInfo]);

    useEffect(() => {
      getGrabOnFurnitureRef.current = getGrabOnFurniture;
    }, [getGrabOnFurniture]);

    const [obstacleId, setObstacleId] = React.useState<string | null>(null);

    useEffect(() => {
      if (obstacleId) {
        const obj = getObstacleInfo(obstacleId);
        if (obj?.visible !== true) {
          setObstacleId(null);
        }
      }
    }, [getObstacleInfo, obstacleId]);

    useEffect(() => {
      if (receiveFood) {
        const dirtyPlate = GRAB_ARR.find(
          (item) =>
            item.type === EGrabType.dirtyPlate && item.visible === false,
        )!;
        const newId = getId(
          ERigidBodyType.grab,
          EGrabType.dirtyPlate,
          generateUUID(),
        );

        const putPlateTableId = Array.from(furnitureObstacles.keys()).find(
          (key) =>
            pathInclude(key, dirtyPlate.position![0], dirtyPlate.position![2]),
        )!;

        const timeoutId = window.setTimeout(() => {
          // clear any previously scheduled timeout
          const dirtyPlate = GRAB_ARR.find(
            (item) =>
              item.type === EGrabType.dirtyPlate && item.visible === false,
          );
          const id = getGrabOnFurnitureRef.current(putPlateTableId);
          if (id) {
            const obj = getObstacleInfoRef.current(id);
            if (!obj) {
              return;
            }
            let info: FoodModelType | undefined;

            const newType = { id: newId, type: EGrabType.dirtyPlate as any };
            if (obj.foodModel) {
              // 此处的id只做key使用，不需要实际的model模型
              if (isMultiFoodModelType(obj.foodModel)) {
                info = {
                  id: obj.foodModel.id,
                  type: obj.foodModel.type.concat(newType),
                };
              } else {
                info = {
                  id: obj.id,
                  type: [
                    { id: obj.foodModel.id, type: obj.foodModel.type },
                    newType,
                  ],
                };
              }
            } else {
              info = newType;
            }
            updateObstacleInfo(id, { foodModel: info });
          } else if (model && dirtyPlate) {
            const model = grabModels[EGrabType.dirtyPlate].clone();

            const newObstacle = createFoodItem(
              dirtyPlate,
              model,
              true,
              modelMapRef,
            );

            if (putPlateTableId) {
              setGrabOnFurniture(putPlateTableId, newObstacle.id);
            }
            newObstacle.position = dirtyPlate.position;
            registerObstacle(newObstacle.id, newObstacle);
          }
          const time = pendingRef.current.get(newId) || -1;
          clearTimeout(time!);
          pendingRef.current.delete(newId);
        }, 5000);
        setReceiveFood(false);

        pendingRef.current.set(newId, timeoutId);
      }
    }, [receiveFood, setGrabOnFurniture, grabOnFurniture, updateObstacleInfo]);

    useFrame(() => {
      const obj = model.getObjectByName("direction") as THREE.Mesh;
      (obj.material as THREE.MeshStandardMaterial)!.map!.offset.x += 0.018;
    });
    return (
      <CreateRender
        size={size}
        position={[0, -1.5, 0]}
        ref={modelRef}
        model={model}
        type={type}
      />
    );
  },
);

export default ServeDishes;
