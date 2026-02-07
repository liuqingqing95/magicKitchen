import { GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import ModelResourceContext from "@/context/ModelResourceContext";
import { useObstaclesMap } from "@/stores/useFurnitureObstacle";
import useGame, { useGameReceiveFood, useGameScore } from "@/stores/useGame";
import useGrabObstacleStore, {
  useGrabOnFurniture,
} from "@/stores/useGrabObstacle";
import { EGrabType, ERigidBodyType, FoodModelType } from "@/types/level";
import {
  createFoodItem,
  findObstacleByPosition,
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
type Result = {
  newId: string;
  model: THREE.Group;
  furnitureId?: string;
  grabId?: string;
  dirtyPlate?: any;
};
const ServeDishes = React.memo(({ model, type, modelRef }: IServiceDishes) => {
  console.log(
    "Rendering serveDishes furniture:",
    model.getObjectByName("dirtyPlate1")?.visible,
  );
  const { grabModels } = useContext(ModelResourceContext);
  const { modelMapRef } = useContext(GrabContext);
  const score = useGameScore();
  const grabOnFurniture = useGrabOnFurniture();
  const receiveFood = useGameReceiveFood();
  const setReceiveFood = useGame((s) => s.setReceiveFood);
  const {
    registerObstacle,
    updateObstacleInfo,
    getObstacleInfo,
    setGrabOnFurniture,
  } = useGrabObstacleStore((s) => {
    return {
      registerObstacle: s.registerObstacle,
      setGrabOnFurniture: s.setGrabOnFurniture,
      getObstacleInfo: s.getObstacleInfo,
      updateObstacleInfo: s.updateObstacleInfo,
    };
  });
  const furnitureObstacles = useObstaclesMap();

  // if (!obj) {
  //   return null;
  // }
  const pendingRef = React.useRef<Map<string, number>>(new Map());

  const resultQueueRef = useRef<Promise<Result | null>[]>([]);
  const committingRef = useRef(false);
  const pendingTimeoutsRef = useRef<Map<string, number>>(new Map());
  const debugSnapshotsRef = useRef<Map<string, any>>(new Map());

  const startTimerResult = (
    dirtyPlate: any,
    furnitureId?: string,
    grabId?: string,
  ) => {
    const src = grabModels[EGrabType.dirtyPlate];
    if (!src) return null;
    const cloned = src.clone();
    const newId = getId(ERigidBodyType.grab, EGrabType.dirtyPlate, cloned.uuid);
    // debug: record snapshot and scheduled timer
    try {
      debugSnapshotsRef.current.set(newId, {
        furnitureId,
        grabId,
        pos: dirtyPlate?.position || null,
        scheduledAt: Date.now(),
      });
      console.log("ServeDishes: schedule timer", {
        newId,
        furnitureId,
        grabId,
        pos: dirtyPlate?.position,
      });
    } catch (e) {
      console.warn("ServeDishes: debug snapshot failed", e);
    }

    const p = new Promise<Result | null>((resolve) => {
      const tid = window.setTimeout(() => {
        pendingTimeoutsRef.current.delete(newId);
        const pos = dirtyPlate.position;
        // const { key: furnitureIdAfter, val: grabId } =
        //   findObstacleByPosition(grabOnFurniture, pos![0], pos![2]) || {};
        resolve({ newId, model: cloned, furnitureId, grabId, dirtyPlate });
      }, 5000);
      pendingTimeoutsRef.current.set(newId, tid);
    });

    resultQueueRef.current.push(p);
    // kick off commit processor
    processCommits();
    return newId;
  };

  const processCommits = async () => {
    if (committingRef.current) return;
    committingRef.current = true;
    try {
      while (resultQueueRef.current.length > 0) {
        const p = resultQueueRef.current.shift()!;
        let res: Result | null = null;
        try {
          res = await p;
        } catch (e) {}
        if (!res) {
          continue;
        }
        const { newId, model, furnitureId, grabId, dirtyPlate } = res;
        // debug: show snapshot and modelMap state before applying
        try {
          const snap = debugSnapshotsRef.current.get(newId);
          console.log("ServeDishes: committing result", {
            newId,
            furnitureId,
            grabId,
            snap,
            modelMapSize: modelMapRef.current?.size,
          });
        } catch (e) {
          console.warn("ServeDishes: debug read snapshot failed", e);
        }
        if (furnitureId && grabId) {
          const obj = getObstacleInfo(grabId);
          if (!obj) continue;
          let info: FoodModelType | undefined;
          const newType = { id: newId, type: EGrabType.dirtyPlate as any };
          if (obj.foodModel) {
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
          if (getObstacleInfo(grabId) == null) {
            console.warn(
              "ServeDishes: obstacle info missing for grabId",
              grabId,
            );
            continue;
          }
          updateObstacleInfo(grabId, { foodModel: info });
          modelMapRef.current?.set(newId, model);
          console.log("ServeDishes: committed to furniture", {
            newId,
            grabId,
            furnitureId,
            modelMapHas: modelMapRef.current?.has(newId),
            modelMapSize: modelMapRef.current?.size,
          });
        } else if (model && dirtyPlate) {
          const obj = createFoodItem(dirtyPlate, model, true, modelMapRef);
          registerObstacle(obj.id, obj);
          console.log("ServeDishes: created obstacle from dirtyPlate", {
            newId,
            createdId: obj.id,
            pos: dirtyPlate?.position,
            modelMapHas: modelMapRef.current?.has(newId),
            modelMapSize: modelMapRef.current?.size,
          });
          const id = Array.from(furnitureObstacles.keys()).find((key) =>
            pathInclude(key, dirtyPlate.position![0], dirtyPlate.position![2]),
          );
          if (id) setGrabOnFurniture(id, obj.id);
        }
      }
    } finally {
      committingRef.current = false;
    }
  };

  useEffect(() => {
    if (!receiveFood) return;
    const dirtyPlate = GRAB_ARR.find(
      (item) => item.type === EGrabType.dirtyPlate && item.visible === false,
    );
    if (!dirtyPlate) {
      return;
    }

    const pos = dirtyPlate.position;
    const { key: furnitureId, val: grabId } =
      findObstacleByPosition(grabOnFurniture, pos![0], pos![2]) || {};

    // start timer immediately and enqueue its result promise
    startTimerResult(dirtyPlate, furnitureId, grabId);
    // allow next triggers
    setReceiveFood(false);
    return;
  }, [receiveFood]);

  useEffect(() => {
    return () => {
      // clear any pending timeouts
      pendingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      resultQueueRef.current = [];
    };
  }, []);

  useEffect(() => {
    // Use a ref to track pending timeout so repeated triggers are debounced
    // and timeouts are cleared properly.

    if (receiveFood) {
      const dirtyPlate = GRAB_ARR.find(
        (item) => item.type === EGrabType.dirtyPlate && item.visible === false,
      );
      const model = grabModels[EGrabType.dirtyPlate].clone();
      const newId = getId(
        ERigidBodyType.grab,
        EGrabType.dirtyPlate,
        model.uuid,
      );
      let furnitureId: string | undefined;
      let grabId: string | undefined;
      if (dirtyPlate?.position) {
        const { key, val } =
          findObstacleByPosition(
            grabOnFurniture,
            dirtyPlate.position[0],
            dirtyPlate.position[2],
          ) || {};
        furnitureId = key;
        grabId = val;
      }

      // clear any previously scheduled timeout

      console.log("receiveFood scheduled", furnitureId, grabId);
      const timeoutId = window.setTimeout(() => {
        if (furnitureId && grabId) {
          const obj = getObstacleInfo(grabId);
          if (!obj) {
            return;
          }
          let info: FoodModelType | undefined;

          const newType = { id: newId, type: EGrabType.dirtyPlate as any };
          if (obj.foodModel) {
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
          updateObstacleInfo(grabId, { foodModel: info });
          modelMapRef.current?.set(newId, model);
        } else if (model && dirtyPlate) {
          const obj = createFoodItem(dirtyPlate, model, true, modelMapRef);
          registerObstacle(obj.id, obj);
          setReceiveFood(false);
          const id = Array.from(furnitureObstacles.keys()).find((key) =>
            pathInclude(key, dirtyPlate.position![0], dirtyPlate.position![2]),
          );
          if (id) {
            setGrabOnFurniture(id, obj.id);
          }
        }
        pendingRef.current.delete(newId);
      }, 10000);
      setReceiveFood(false);

      pendingRef.current.set(newId, timeoutId);
    }
  }, [receiveFood]);

  useEffect(() => {
    return () => {
      console.log("pending timeouts for ServeDishes", pendingRef.current);
    };
  }, [pendingRef.current.size]);

  useFrame(() => {
    const obj = model.getObjectByName("direction") as THREE.Mesh;
    (obj.material as THREE.MeshStandardMaterial)!.map!.offset.x += 0.018;
  });
  return <CreateRender ref={modelRef} model={model} type={type} />;
});

export default ServeDishes;
