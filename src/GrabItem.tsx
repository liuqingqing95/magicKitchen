import { useGrabObstacleStore } from "@/stores/useGrabObstacle";
import { round } from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { GrabContext } from "./context/GrabContext";
import ModelResourceContext from "./context/ModelResourceContext";
import useBurgerAssembly from "./hooks/useBurgerAssembly";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "./stores/useFurnitureObstacle";
import {
  BaseFoodModelType,
  EFoodType,
  EFurnitureType,
  EGrabType,
  IGrabPosition,
} from "./types/level";
import { assembleBurger } from "./utils/canAssembleBurger";

export const GrabItem = React.memo(
  ({
    playerRef,
    isHolding,
  }: {
    playerRef: React.RefObject<THREE.Group>;
    isHolding: boolean;
  }) => {
    const { grabModels } = useContext(ModelResourceContext);
    const {
      modelMapRef,
      grabSystemApi,
      grabRef,
      clickGrab: { isGrab },
    } = useContext(GrabContext);

    const { heldItem, releaseItem } = grabSystemApi;
    const {
      obstacles,
      updateObstacleInfo,
      unregisterObstacle,
      setGrabOnFurniture,
      getGrabOnFurniture,
      getObstacleInfo,
    } = useGrabObstacleStore((s) => {
      return {
        obstacles: s.obstacles,
        updateObstacleInfo: s.updateObstacleInfo,
        getObstacleInfo: s.getObstacleInfo,
        unregisterObstacle: s.unregisterObstacle,
        getGrabOnFurniture: s.getGrabOnFurniture,
        setGrabOnFurniture: s.setGrabOnFurniture,
      };
    });
    const {
      furniturelightId,
      unregisterFurnitureObstacle,
      getFurnitureObstacleInfo,
    } = useFurnitureObstacleStore((s) => {
      return {
        furniturelightId: s.highlightId,
        getFurnitureObstacleInfo: s.getObstacleInfo,
        unregisterFurnitureObstacle: s.unregisterObstacle,
      };
    });
    const handPositionRef = useRef(new THREE.Vector3());
    const burgerAssembly = useBurgerAssembly();
    const prevId = useRef<string | null | undefined>(undefined);
    const model = useMemo(() => {
      const val = heldItem ? modelMapRef.current?.get(heldItem.id) : null;
      return val;
    }, [isHolding]);
    const highlightedFurniture = useMemo(() => {
      if (furniturelightId) {
        return getFurnitureObstacleInfo(furniturelightId) || false;
      }
      return false;
    }, [furniturelightId]);
    // Helper: 检查家具上是否可以合成汉堡并返回 partIds
    const canAssembleBurger = useCallback(
      (furnId: string, info: IGrabPosition) => {
        return assembleBurger(getGrabOnFurniture(furnId) || [], info);
      },
      [getGrabOnFurniture]
    );
    // Helper: 使用 assembly（优先 store）合成汉堡并更新本地 foods
    const assembleAndUpdateUI = useCallback(
      (
        furnId: string,
        position: [number, number, number],
        info: IGrabPosition
      ) => {
        const burgerModel = grabModels.burger.clone();
        const id = "Grab_burger_" + burgerModel.uuid;
        const res = burgerAssembly.assembleBurgerOnPlate(furnId, info, id);
        if (!res) return false;
        const { newId, deleteIds, dePositId } = res;
        // 没有汉堡，只有食物材料，则把之前的食物材料设置为汉堡的夹层
        // 有汉堡则添加夹层
        const foodModel = getObstacleInfo(dePositId)?.foodModel;
        const types = foodModel
          ? typeof foodModel?.type === "string"
            ? ([
                {
                  id: foodModel.id,
                  type: foodModel.type,
                },
              ] as {
                id: string;
                type: EFoodType;
              }[])
            : Array.isArray(foodModel.type)
              ? foodModel.type
              : []
          : [];

        const newFood = burgerAssembly.buildBurgerFood(
          newId,
          position,
          info,
          types,
          burgerModel
        );

        // 更新家具映射：把汉堡放在第一位，如果有 plate 则保留
        const current = getGrabOnFurniture(furnId) || [];
        const plate = current.find((i) => i.type === EGrabType.plate);
        updateObstacleInfo(plate?.id || "", { foodModel: newFood.foodModel });
        deleteIds.forEach((did) => {
          unregisterObstacle(did);
        });

        const mapping = plate
          ? [
              { id: newId, type: EFoodType.burger },
              { id: plate.id, type: plate.type },
            ]
          : [{ id: newId, type: EFoodType.burger }];
        setGrabOnFurniture(furnId, mapping);
        return true;
      },
      [
        burgerAssembly,
        grabModels,
        obstacles,
        getGrabOnFurniture,
        setGrabOnFurniture,
      ]
    );

    // Helper: 放置手中物体到家具（原子操作，使用 assembly helper）
    const placeHeldToFurniture = useCallback(
      (furnId: string, pos: [number, number, number]) => {
        return burgerAssembly.placeHeldItemOnFurniture(
          furnId,
          highlightedFurniture,
          pos
        );
      },
      [burgerAssembly]
    );
    const dropHeldToFloor = useCallback(
      (infoId: string, pos: [number, number, number]) => {
        // updateObstaclePosition(infoId, pos, undefined);
        updateObstacleInfo(infoId, {
          visible: false,
          position: pos,
          area: "floor",
        });
        try {
          releaseItem();
        } catch (e) {}
      },
      [updateObstacleInfo, releaseItem]
    );
    const info = useMemo(() => {
      return getObstacleInfo(grabRef.current?.id || "");
    }, [grabRef.current?.id]);

    useEffect(() => {
      if (isHolding) {
        // Simplified release flow using helpers. Preserve trash handling.
        const model = modelMapRef.current?.get(grabRef.current?.id || "");
        // const rigidBody = rigidBodyMapRef.current.get(grabRef.current?.id || "");
        if (!model || !playerRef.current) return;
        const t = model.position;
        const handPos = handPositionRef.current;
        handPos.set(t.x, t.y, t.z);
        handPos.applyMatrix4(playerRef.current.matrixWorld);
        const currentPosition: [number, number, number] = [
          round(playerRef.current.position.x, 3),
          0,
          round(playerRef.current.position.z, 3),
        ];

        if (!info) return;

        // If furniture highlighted handle trash / assembly / place / drop
        if (highlightedFurniture) {
          if (highlightedFurniture.type === EFurnitureType.trash) {
            unregisterObstacle(info.id);
            // takeOutFood((prev) => prev.filter((item) => item.id !== info.id));
            unregisterFurnitureObstacle(info.id);
            // unregisterObstacle(info.id);
            grabRef.current = null;
            return;
          }

          const furnId = highlightedFurniture.id;

          // 1) Try assembly
          const possible = canAssembleBurger(furnId, info);
          if (possible.ok) {
            const did = assembleAndUpdateUI(
              furnId,
              (highlightedFurniture as IFurniturePosition).position as [
                number,
                number,
                number,
              ],
              info
            );
            if (did) {
              try {
                releaseItem();
              } catch (e) {}
              grabRef.current = null;
              return;
            }
          }

          // 2) Try place to furniture
          const placePos: [number, number, number] = [
            (highlightedFurniture as IFurniturePosition).position[0],
            currentPosition[1],
            (highlightedFurniture as IFurniturePosition).position[2],
          ];
          const placed = placeHeldToFurniture(furnId, placePos);
          if (placed && (placed as any).ok) {
            // mirror minimal UI updates (table/plate) like previous behavior
            const arr =
              (placed as any).mapping || getGrabOnFurniture(furnId) || [];
            const havePlate = arr.find((i) => i.type === EGrabType.plate);
            const haveCuttingBoard = arr.find(
              (i) => i.type === EGrabType.cuttingBoard
            );
            let isChangeSomething = havePlate && info.type === EGrabType.plate;
            if (arr.length === 0 || (arr.length === 1 && haveCuttingBoard)) {
              updateObstacleInfo(info.id, {
                area: "table",
              });
            } else if (havePlate) {
              if (info.type !== EGrabType.plate) {
                const model = modelMapRef.current?.get(info.id);
                updateObstacleInfo(havePlate.id, {
                  foodModel: {
                    id: info.id,
                    model: model?.clone(),
                    type: info.type,
                  } as BaseFoodModelType,
                });
              } else {
                const tableFoodModel = getObstacleInfo(havePlate.id)?.foodModel;
                const infoFoodModel = info?.foodModel;
                updateObstacleInfo(havePlate.id, {
                  area: "table",
                  foodModel: infoFoodModel,
                });
                updateObstacleInfo(info.id, {
                  area: "hand",
                  foodModel: tableFoodModel,
                });
              }
            }

            if (!isChangeSomething) {
              grabRef.current = null;
              releaseItem();
            }

            return;
          }

          // 3) Fallback: drop to floor
          dropHeldToFloor(info.id, currentPosition);
          grabRef.current = null;
          return;
        }

        // no furniture highlighted: drop to floor
        dropHeldToFloor(info.id, currentPosition);
        grabRef.current = null;
        return;
      }
      prevId.current = heldItem ? heldItem.id : undefined;
    }, [isGrab]);

    if (!model) return null;
    console.log("GrabItem render", isHolding);
    return (
      isHolding && (
        <group>
          <primitive position={heldItem?.offset} object={model} scale={1} />
        </group>
      )
    );
  }
);
export default React.memo(GrabItem);
GrabItem.displayName = "GrabItem";
