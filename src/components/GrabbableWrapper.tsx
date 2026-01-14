// components/PlayerWithItem.jsx
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import { useFurnitureObstacleStore } from "@/stores/useFurnitureObstacle";
import { IFurniturePosition, ObstacleInfo } from "@/stores/useGrabObstacle";
import {
  BaseFoodModelType,
  EFoodType,
  EFurnitureType,
  EGrabType,
  FoodModelType,
  IGrabItem,
  IGrabPosition,
  type IFoodWithRef,
} from "@/types/level";
// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { FURNITURE_ARR, GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import { ModelResourceContext } from "@/context/ModelResourceContext";
import Hamberger from "@/hamberger";
import useBurgerAssembly from "@/hooks/useBurgerAssembly";
import { EHandleIngredient, IHandleIngredientDetail } from "@/types/public";
import { assembleBurger } from "@/utils/canAssembleBurger";
import { foodTableData, transPosition } from "@/utils/util";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, useRapier } from "@react-three/rapier";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
// import Player from "../Player";

interface PlayerGrabbableItemProps {
  playerPositionRef: React.MutableRefObject<[number, number, number]>;
  // highlightHandlerRef?: React.RefObject<((id: string | false) => void) | null>;

  playerRef: React.MutableRefObject<THREE.Group<THREE.Object3DEventMap> | null>;
  updateGrabHandle?: (handle: number[] | undefined) => void;
  updateFoodType?: (type: EGrabType | EFoodType | null) => void;
  updateIsCutting?: (isCutting: boolean) => void;
}
const GRAB_TYPES = [...Object.values(EGrabType), ...Object.values(EFoodType)];
function GrabbaleWrapper({
  playerPositionRef,
  // highlightHandlerRef,
  updateGrabHandle,
  updateFoodType,
  updateIsCutting,
  // furnitureHighlight,
  playerRef,
}: PlayerGrabbableItemProps) {
  const { world } = useRapier();
  const { grabSystemApi, obstacleStore } = useContext(GrabContext);
  const { registryFurniture, getFurnitureObstacleInfo, furniturelightId } =
    useFurnitureObstacleStore((s) => {
      return {
        getFurnitureObstacleInfo: s.getObstacleInfo,
        registryFurniture: s.registryFurniture,
        furniturelightId: s.highlightId,
      };
    });
  // const [grabPositions, setGrabPositions] = useState<IGrabItem[]>([]);
  const [isGrab, setIsGrab] = useState<boolean>(false);

  const [highlightStates, setHighlightStates] = useState<
    Record<string, boolean>
  >({});

  const stablePropsRef = useRef(
    new Map<
      string,
      {
        initPosRef: React.MutableRefObject<[number, number, number]>;
        sizeRef: React.MutableRefObject<[number, number, number]>;
        modelRef: React.MutableRefObject<THREE.Group>;
        foodModelRef: React.MutableRefObject<FoodModelType | undefined>;
        handleIngredientRef: React.MutableRefObject<
          IHandleIngredientDetail | undefined
        >;
      }
    >()
  );

  // const releaseItemPosition = useRef<[number, number, number]>([0, 0, 0]);
  const handPositionRef = useRef(new THREE.Vector3());
  const handQuaternionRef = useRef(new THREE.Quaternion());
  // 处理汉堡挂载
  const mountHandlers = useRef(
    new Map<string, (rigidBody: RapierRigidBody | null) => void>()
  );
  const [handleIngredients, setHandleIngredients] = useState<
    IHandleIngredientDetail[]
  >([]);
  const intervalRef = useRef<Map<string, NodeJS.Timeout | null>>(new Map());
  // const ingredientTempRef = useRef<IFoodWithRef[]>([]);
  const pendingGrabIdRef = useRef<string | null>(null);
  const grabRef = useRef<IFoodWithRef | null>(null);
  const unmountHandlers = useRef(new Map<string, () => void>());
  const initialPosition: [number, number, number] = [0, 0, 0];
  const [subscribeKeys, getKeys] = useKeyboardControls();

  const {
    registerObstacle,
    unregisterObstacle,
    getObstacleInfo,
    obstacles,
    realHighLight: highlightedGrab,
    setRegistry,
    updateObstaclePosition,
    getGrabOnFurniture,
    setGrabOnFurniture,
    updateObstacleInfo,
    grabOnFurniture,
  } = obstacleStore;
  const {
    heldItem,
    holdStatus,
    grabItem,
    releaseItem,
    isHolding,
    isReleasing,
  } = grabSystemApi;
  const highlightedFurnitureRef = useRef<IFurniturePosition | false>(false);
  const handleIngredientsRef = useRef<IHandleIngredientDetail[]>([]);

  // 调整常量：如果模型本身有局部轴偏移（通常需要试错），在这里微调
  // const GRAB_YAW_OFFSET = Math.PI / 12; // 之前发现 -PI/2 是正确的，可按模型调整
  const computeGrabRotationFromPlayer = (
    type: EGrabType | EFoodType,
    grab?: boolean
  ) => {
    try {
      if (!playerRef.current) return new THREE.Euler(0, 0, 0);
      const q = new THREE.Quaternion();
      playerRef.current.getWorldQuaternion(q);
      // 玩家在本地的前方向为 -Z，转换到 world 空间得到玩家朝向向量
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) return new THREE.Euler(0, 0, 0);
      forward.normalize();
      // 我们希望物体的 +X 与玩家朝向一致（因为物体手柄面向 -X，
      // 当物体的 +X 与玩家朝向相同时，物体的 -X 即与玩家朝向的相反方向对齐）
      let yaw: number = 0; //+GRAB_YAW_OFFSET;
      switch (type) {
        // case EDirection.left: {
        //   yaw = Math.atan2(forward.x, -forward.z) + Math.PI / 2;
        //   break;

        // }
        case EGrabType.fireExtinguisher:
          // EDirection right
          yaw = Math.atan2(forward.z, forward.x);
          break;
        case EGrabType.pan:
          // EDirection normal
          yaw = Math.atan2(forward.x, -forward.z);
          break;
        default:
          break;
      }
      //  = Math.atan2(forward.z, forward.x)
      // let yaw = Math.atan2(forward.x, -forward.z);

      // return new THREE.Euler(0, yaw, 0);
      yaw = grab ? yaw : Math.PI - yaw;
      return new THREE.Euler(0, yaw, 0);
    } catch (e) {
      return new THREE.Euler(0, 0, 0);
    }
  };

  // const { getNearest, grabNearList, furnitureNearList } = useGrabNear(
  //   playerPositionRef.current
  // );
  // const [highlightedFurniture, setHighlightedFurniture] = useState<
  //   IFurniturePosition | false
  // >(false);
  // const [highlightedGrab, setHighlightedGrab] = useState<IGrabPosition | false>(
  //   false
  // );

  // // 使用useEffect来更新高亮状态
  // useEffect(() => {
  //   if (grabNearList.length === 0) {
  //     setHighlightedGrab(false);
  //     return;
  //   }
  //   const newGrab = getNearest(ERigidBodyType.grab, isHolding);
  //   setHighlightedGrab(newGrab as IGrabPosition | false);
  // }, [getNearest, grabNearList.length, isHolding]);

  // useEffect(() => {
  //   if (furnitureNearList.length === 0) {
  //     setHighlightedFurniture(false);
  //     return;
  //   }
  //   const newFurniture = getNearest(ERigidBodyType.furniture);
  //   setHighlightedFurniture(newFurniture as IFurniturePosition | false);
  // }, [getNearest, furnitureNearList.length, isHolding]);

  // const highlightedFurniture = highlightedFurnitureNearest[0] || false;
  const [isFoodReady, setIsFoodReady] = useState(false);
  const highlightedFurniture = useMemo(() => {
    if (furniturelightId) {
      return getFurnitureObstacleInfo(furniturelightId) || false;
    }
    return false;
  }, [furniturelightId]);

  const createFoodItem = (
    item: IGrabItem,
    model: THREE.Group,
    visible: boolean = true
  ): IFoodWithRef => {
    const clonedModel = model.clone();
    const id = `Grab_${item.name}_${clonedModel.uuid}`;
    //
    if (item.name === EGrabType.pan || item.name === EGrabType.cuttingBoard) {
      setHandleIngredients((prev) => {
        return [
          ...prev,
          {
            id: `${item.position[0]}_${item.position[2]}`,
            type:
              item.name === EGrabType.pan
                ? EHandleIngredient.cooking
                : EHandleIngredient.cutting,
            status: false,
            rotateDirection: item.rotateDirection,
          },
        ];
      });
    }

    const obj: IFoodWithRef = {
      id,
      position: item.position,
      type: item.name,
      model: clonedModel,
      size: item.size,
      grabbingPosition: item.grabbingPosition,
      isFurniture: false,
      foodModel: undefined,
      visible: visible,
      ref: {
        current: {
          id,
          rigidBody: undefined,
        },
      },
    };
    if (item.name === EFoodType.meatPatty) {
      obj.isCook = true;
      obj.isCut = true;
    }
    return obj;
  };
  // const [tablewares] = useState<ITablewareWithRef[]>(() => {
  //   return TABLEWARE_ARR.map((item) => {
  //     // const model = grabModels[item.name];
  //     // const clonedModel = model.clone();

  //     const id = `Tableware_${item.name}_${item.position.join("_")}`;
  //     setHandleIngredients((prev) => {
  //       return [
  //         ...prev,
  //         {
  //           id: `${item.position[0]}_${item.position[2]}`,
  //           type: EHandleIngredient.cutting,
  //           status: false,
  //           rotateDirection: item.rotateDirection,
  //         },
  //       ];
  //     });
  //     return {
  //       id,
  //       position: item.position,
  //       type: item.name,
  //       // model: clonedModel,
  //       size: item.size,
  //     };
  //   });
  // });
  const { grabModels, loading } = useContext(ModelResourceContext);

  const burgerAssembly = useBurgerAssembly();
  const [foods, takeOutFood] = useState<IFoodWithRef[]>([]);

  // Initialize foods once the shared grabModels are ready. This ensures we create
  // stable clones once and pass the same `model` object to `Hamberger` instances.
  useEffect(() => {
    if (loading) return;
    // only initialize once
    if (Object.keys(grabModels).length === 0 || foods.length > 0) return;
    const items = GRAB_ARR.map((item) => {
      const model = grabModels[item.name] ?? new THREE.Group();
      return createFoodItem(item, model, true);
    });
    takeOutFood(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Populate foods once models are available

  useEffect(() => {
    console.log("furnitureHighlight changed:", highlightedFurniture);
    const lightFurni = highlightedFurnitureRef.current;
    if (lightFurni) {
      const id = lightFurni.position[0] + "_" + lightFurni.position[2];
      const time = intervalRef.current.get(id);
      if (
        time &&
        typeof highlightedFurniture !== "boolean" &&
        lightFurni.id !== highlightedFurniture.id
      ) {
        clearInterval(time);
        intervalRef.current.set(id, null);
      }
    }
    highlightedFurnitureRef.current = highlightedFurniture;
  }, [highlightedFurniture]);

  useEffect(() => {
    updateFoodType?.(grabRef.current?.type || null);
  }, [grabRef.current]);

  const [isIngredientEvent, setIsIngredient] = useState<boolean>(false);
  // Helper: 检查家具上是否可以合成汉堡并返回 partIds
  const canAssembleBurger = useCallback(
    (furnId: string, info: IGrabPosition) => {
      return assembleBurger(getGrabOnFurniture(furnId) || [], info);
    },
    [getGrabOnFurniture]
  );

  useEffect(() => {
    console.log("grabOnFurniture changed: ", grabOnFurniture);
  }, [grabOnFurniture]);
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
      const foodModel = foods.find((f) => f.id === dePositId)?.foodModel;
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
      takeOutFood((prev) => {
        return prev
          .map((item) => {
            if (item.id === plate?.id) {
              return {
                ...item,
                // area: "table",
                foodModel: newFood.foodModel,
              };
            }
            return item;
          })
          .filter((p) => deleteIds.indexOf(p.id) === -1);
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
    [burgerAssembly, grabModels, foods, getGrabOnFurniture, setGrabOnFurniture]
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

  // Helper: 把手中物放到地面并更新 store/UI
  const dropHeldToFloor = useCallback(
    (infoId: string, pos: [number, number, number]) => {
      updateObstaclePosition(infoId, pos, undefined);
      takeOutFood((prev) =>
        prev.map((item) =>
          item.id === infoId
            ? {
                ...item,
                position: pos,
                area: "floor",
              }
            : item
        )
      );
      try {
        releaseItem();
      } catch (e) {}
    },
    [updateObstaclePosition, releaseItem]
  );

  useEffect(() => {
    if (isHolding) {
      // Simplified release flow using helpers. Preserve trash handling.
      const rigidBody = grabRef.current?.ref.current?.rigidBody;
      if (!rigidBody) return;
      const t = rigidBody.translation();
      const currentPosition: [number, number, number] = [t.x, t.y, t.z];
      const info = getObstacleInfo(grabRef.current?.ref.current?.id || "") as
        | IGrabPosition
        | undefined;
      if (!info) return;

      // If furniture highlighted handle trash / assembly / place / drop
      if (highlightedFurniture) {
        if (highlightedFurniture.type === EFurnitureType.trash) {
          takeOutFood((prev) => prev.filter((item) => item.id !== info.id));
          unregisterObstacle(info.id, highlightedFurniture.id);
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
          takeOutFood((prev) => {
            if (arr.length === 0 || (arr.length === 1 && haveCuttingBoard)) {
              return prev.map((item) =>
                item.id === info.id ? { ...item, area: "table" } : item
              );
            } else if (havePlate) {
              if (info.type !== EGrabType.plate) {
                const model = foods.find((item) => item.id === info.id)?.model;
                return prev
                  .map((item) => {
                    if (item.id === havePlate.id) {
                      return {
                        ...item,
                        foodModel: {
                          id: info.id,
                          model: model?.clone(),
                          type: info.type,
                        } as BaseFoodModelType,
                      };
                    }
                    return item;
                  })
                  .filter((item) => item.id !== info.id);
              } else {
                // 交换盘子里面物品
                const tableFoodModel = foods.find(
                  (item) => item.id === havePlate.id
                )?.foodModel;
                const infoFoodModel = foods.find(
                  (item) => item.id === info.id
                )?.foodModel;

                return prev.map((item) => {
                  if (item.id === havePlate.id) {
                    return {
                      ...item,
                      area: "table",
                      foodModel: infoFoodModel,
                    };
                  }
                  if (item.id === info.id) {
                    return {
                      ...item,
                      // area: "hand",
                      foodModel: tableFoodModel,
                    };
                  }
                  return item;
                });
              }
            }
            return prev;
          });
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
    } else {
      // 尝试抓取物品
      if (highlightedGrab) {
        const grab = foods.find((item) => highlightedGrab.id === item.id);
        if (grab) {
          const rotation = computeGrabRotationFromPlayer(grab.type, true);
          grabRef.current = grab;
          grabItem(grab, rotation);
          takeOutFood((prev) => {
            return prev.map((item) => {
              const oldObj = transPosition(item.id);
              const newObj = transPosition(highlightedGrab.id);
              if (oldObj[0] === newObj[0] && oldObj[1] === newObj[1]) {
                return {
                  ...item,
                  area: "hand",
                };
              }
              return item;
            });
          });
        }
      } else if (highlightedFurniture) {
        const arr = getGrabOnFurniture(highlightedFurniture.id);
        const filterArr = arr.filter((item) => {
          return (
            [
              EGrabType.cuttingBoard,
              EGrabType.cuttingBoardNoKnife,
              EGrabType.pan,
            ].findIndex((type) => type === item.type) === -1
          );
        });
        const plateIndex = arr.findIndex(
          (item) => item.type === EGrabType.plate
        );
        const panIndex = arr.findIndex((item) => item.type === EGrabType.pan);
        if (
          highlightedFurniture.type === EFurnitureType.foodTable &&
          !filterArr.length
        ) {
          const foodType = highlightedFurniture.foodType!;
          const foodInfo = foodTableData(foodType, playerPositionRef.current);
          const newFood = createFoodItem(foodInfo, grabModels[foodType], false);
          pendingGrabIdRef.current = newFood.id;
          newFood.area = "hand";
          takeOutFood((prev) => {
            return [...prev, newFood];
          });
          grabRef.current = newFood;
        } else if (
          filterArr.length === 1 ||
          plateIndex > -1 ||
          (filterArr.length === 0 && panIndex > -1)
        ) {
          const foodId = filterArr.length
            ? filterArr[plateIndex > -1 ? plateIndex : 0].id
            : arr[panIndex > -1 ? panIndex : 0].id;
          const grab = foods.find((item) => foodId === item.id);
          const foodItems = filterArr.filter(
            (item) => item.type !== EGrabType.plate
          );
          const foodItemsRefs = foodItems.map((food) => {
            return foods.find((item) => item.id === food.id)!;
          });
          if (!grab) return;
          const handleIngredient = handleIngredients.find(
            (ingredient) =>
              ingredient.id ===
              `${highlightedFurniture.position[0]}_${highlightedFurniture.position[2]}`
          );
          // if (arr.find((item) => item.type === EGrabType.pan)) {
          //   updateObstacleInfo(foodId, { isCook: true });
          // } else {
          //   updateObstacleInfo(foodId, { isCut: true });
          // }
          if (handleIngredient) {
            if (typeof handleIngredient.status === "number") {
              if (handleIngredient.status === 5) {
                // if (highlightedFurniture.type === EG.cuttingBoard) {

                setHandleIngredients((prev) => {
                  return prev.map((item) => {
                    if (item.id === handleIngredient?.id) {
                      return {
                        ...item,
                        status: false,
                      };
                    }
                    return item;
                  });
                });
                const isCookType = !!arr.find((item) => {
                  return item.type === EGrabType.pan;
                });
                const isCutType = !!arr.find((item) => {
                  return (
                    item.type === EGrabType.cuttingBoard ||
                    item.type === EGrabType.cuttingBoardNoKnife
                  );
                });
                if (isCookType) {
                  updateObstacleInfo(foodId, { isCook: true });
                } else if (isCutType) {
                  updateObstacleInfo(foodId, { isCut: true });
                }
              } else {
                return;
              }
            }
          }

          const rotation = computeGrabRotationFromPlayer(grab.type, true);
          grabRef.current = grab;
          grabItem(grab, rotation);
          takeOutFood((prev) => {
            return prev.map((item) => {
              const oldObj = transPosition(item.id);
              const newObj = transPosition(highlightedFurniture.id);
              if (oldObj[0] === newObj[0] && oldObj[1] === newObj[1]) {
                return {
                  ...item,
                  area: "hand",
                };
              }
              return item;
            });
          });
          const items = arr.filter((item) => {
            if (item.id === foodId) {
              return false;
            } else if (foodItems.findIndex((i) => i.id === item.id) > -1) {
              return false;
            }
            return true;
          });
          console.log(items, "items");
          setGrabOnFurniture(highlightedFurniture.id, items);
        }
      }
    }
  }, [isGrab]);

  useEffect(() => {
    const lightFurni = highlightedFurnitureRef.current;
    if (!lightFurni) {
      // 如果高亮的家具和当前高亮的家具相同，则不需要更新
      return;
    }

    // 砧板状态(砍菜状态，空置状态)切换
    const needCutting =
      handleIngredientsRef.current.find(
        (i) => i.id === `${lightFurni.position[0]}_${lightFurni.position[2]}`
      )?.status === false
        ? true
        : false;
    console.log(needCutting, "needCutting");
    // let newType = needCutting
    //   ? EGrabType.cuttingBoardNoKnife
    //   : EGrabType.cuttingBoard;
    // let currentType = needCutting
    //   ? EGrabType.cuttingBoard
    //   : EGrabType.cuttingBoardNoKnife;
    const arr = getGrabOnFurniture(lightFurni.id);
    const isCookType = !!arr.find((item) => {
      return item.type === EGrabType.pan;
    });
    const isCutType = !!arr.find((item) => {
      return (
        item.type === EGrabType.cuttingBoard ||
        item.type === EGrabType.cuttingBoardNoKnife
      );
    });
    const foodArr = arr.filter(
      (food) =>
        [
          EGrabType.cuttingBoard,
          EGrabType.cuttingBoardNoKnife,
          EGrabType.pan,
        ].findIndex((key) => food.type === key) === -1
    );
    if (foodArr.length === 0 || foodArr.length > 1) return;

    if (foodArr.length === 1) {
      const info = getObstacleInfo(foodArr[0].id) as IGrabPosition;
      if (info && isCutType && info.isCut) {
        return;
      }
      if (info && isCookType) {
        if (info.type === EFoodType.meatPatty) {
          if (!info.isCut) {
            return;
          }
          if (info.isCook) {
            return;
          }
        } else if (info.type === EFoodType.tomato) {
          if (info.isCook) {
            return;
          }
        } else {
          return;
        }
      }
    }
    // 奶酪和肉饼需要切，肉饼和鸡蛋需要煎
    const validateFood = isCookType
      ? [EFoodType.tomato, EFoodType.meatPatty]
      : isCutType
        ? [EFoodType.cheese, EFoodType.meatPatty, EFoodType.tomato]
        : [];

    const foodValiable =
      validateFood.findIndex((item) => item === foodArr[0].type) > -1;
    if (!foodValiable) return;
    // const cuttingBoard = arr.find((item) => item.type === currentType);
    // foodArr.length > 0 &&
    // if (cuttingBoard) {
    // setTablewares((prev) => {
    //   return prev.map((item) => {
    //     if (item.id === cuttingBoard.id) {
    //       const clonedModel = grabModels[newType].clone();
    //       const id = `Grab_${newType}_${clonedModel.uuid}`;
    // removeGrabOnFurniture(highlightedFurniture.id, cuttingBoard.id);
    // setGrabOnFurniture(highlightedFurniture.id, [
    //   ...foodArr,
    //   { id, type: newType },
    // ]);
    //       return {
    //         ...item,
    //         id,
    //         type: newType,
    //         model: clonedModel, // value === EHandleIngredient.cutting,
    //       };
    //     }
    //     return item;
    //   });
    // });

    const id = lightFurni.position[0] + "_" + lightFurni.position[2];
    if (handleIngredients.find((item) => item.id === id)?.status === 5) {
      // 已经煎好则不再煎
      return;
    }
    handleIngredients.forEach((ingredient) => {
      if (ingredient.id === id) {
        const timer = intervalRef.current.get(id);
        if (timer) {
          clearInterval(timer);
          intervalRef.current.set(id, null);
          return;
        }
        if (
          ingredient.status === false ||
          (typeof ingredient.status === "number" && ingredient.status < 5)
        ) {
          intervalRef.current.set(
            id,
            setInterval(() => {
              setHandleIngredients((current) => {
                return current.map((obj) => {
                  if (obj.id === id) {
                    if (typeof obj.status === "number" && obj.status < 5) {
                      const newStatus = obj.status + 1;
                      if (newStatus === 5) {
                        // 达到5时清除定时器
                        const timer = intervalRef.current.get(id);
                        if (timer) {
                          clearInterval(timer);
                          intervalRef.current.set(id, null);
                        }
                      }
                      console.log(
                        id,
                        newStatus,
                        ingredient.type === EHandleIngredient.cooking
                          ? "ddIngredient Cooking"
                          : "ddIngredient Cutting"
                      );
                      return { ...obj, status: newStatus };
                    }
                    const newStatus =
                      ingredient.status === false ? 1 : ingredient.status;
                    return { ...ingredient, status: newStatus };
                  }
                  return obj;
                });
              });
            }, 1000)
          );
        }
      }
    });

    // setIsSprinting(value);
  }, [isIngredientEvent]);

  useEffect(() => {
    handleIngredientsRef.current = handleIngredients;
    const isCutting = handleIngredients.some((i) => i.status !== false);
    console.log("handleIngredients changed:", handleIngredients);
    updateIsCutting?.(isCutting);
  }, [handleIngredients]);

  useEffect(() => {
    const arr: number[] = [];
    // 遍历所有已挂载的食物实例
    foods.forEach((food) => {
      const rigidBody = food.ref.current?.rigidBody;
      if (rigidBody) {
        // 获取 rigidBody 的 collider handle
        const handle = rigidBody.handle;
        if (handle !== undefined) {
          arr.push(handle);
        }
      }
    });

    if (arr.length) {
      updateGrabHandle?.(arr);
    }
  }, [foods, mountHandlers.current.size, updateGrabHandle]);

  useEffect(() => {
    // setGrabPositions(GRAB_ARR);

    const unsubscribeIngredient = subscribeKeys(
      (state) => state.handleIngredient,
      (pressed) => {
        if (pressed) {
          setIsIngredient((s) => !s);
        }
      }
    );

    const unsubscribeGrab = subscribeKeys(
      (state) => state.grab,
      (pressed) => {
        if (pressed) {
          setIsGrab((s) => !s);
        }
      }
    );
    return () => {
      foods.forEach((food) => {
        unregisterObstacle(food.id);
      });
      intervalRef.current.forEach((timer) => {
        if (timer) clearInterval(timer);
      });
      intervalRef.current.clear();
      unsubscribeIngredient();
      unsubscribeGrab();
    };
  }, []);

  const findFurnitureByPosition = (
    obstacles: Map<string, ObstacleInfo>,
    x: number,
    z: number
  ) => {
    for (const [key, model] of obstacles) {
      if (key.startsWith("Grab") || key.startsWith("Tableware")) {
        continue;
      }
      const furnitureX = transPosition(key)[0];
      const furnitureZ = transPosition(key)[1];
      if (furnitureX === x && furnitureZ === z) {
        return { key, model };
      }
    }
    return null;
  };
  useEffect(() => {
    foods.forEach((food) => {
      if (!mountHandlers.current.has(food.id)) {
        mountHandlers.current.set(food.id, (rigidBody) => {
          if (!rigidBody) {
            return;
          }

          if (food.ref.current) {
            food.ref.current.rigidBody = rigidBody;
          }
          console.log("Registering food obstacle:", food.id);
          registerObstacle(food.id, {
            id: food.id,
            type: food.type,
            // 使用刚体当前的位置（让物理决定 Y），如果不可用则回退到初始配置
            position: (() => {
              try {
                const t = rigidBody.translation();
                return [
                  food.position[0],
                  food.position[1],
                  food.position[2],
                ] as [number, number, number];
              } catch (e) {
                return food.position;
              }
            })(),
            isCut: food.isCut,
            isCook: food.isCook,
            size: food.size,
            grabbingPosition: food.grabbingPosition,
            isFurniture: false,
          });
          // If this food was created with an immediate-grab intent, perform grab now
          if (pendingGrabIdRef.current === food.id) {
            pendingGrabIdRef.current = null;
            grabItem(food);
          }
        });
      }
      // If the Hamberger already mounted and provided a rigidBody earlier,
      // we may need to trigger the pending grab immediately.
      if (pendingGrabIdRef.current === food.id && food.ref.current?.rigidBody) {
        pendingGrabIdRef.current = null;
        grabItem(food);
      }
      if (!unmountHandlers.current.has(food.id)) {
        unmountHandlers.current.set(food.id, () => {
          if (food.ref.current?.rigidBody) {
            unregisterObstacle(food.id);
          }
        });
      }
    });

    //
  }, [foods, registerObstacle, unregisterObstacle]);

  useEffect(() => {
    if (grabOnFurniture.size <= 0) {
      return;
    }
    console.log("grabOnFurniture changed:", grabOnFurniture);

    // const cheese = foods.find((item) => item.type === EFoodType.cheese)!;
    // if (!cheese) return;
    // const plate = foods.find((item) => item.type === EGrabType.plate)!;
    // takeOutFood((prev) => {
    //   return prev
    //     .map((item) => {
    //       if (item.type === EGrabType.plate) {
    //         return {
    //           ...item,
    //           foodModel: {
    //             id: cheese.id,
    //             type: EFoodType.cheese,
    //             model: cheese.model.clone(),
    //           },
    //         };
    //       }
    //       return item;
    //     })
    //     .filter((item) => item.type !== EFoodType.cheese);
    // });
    // const id = `Furniture_drawerTable_${plate.position[0]}_0.5_${plate.position[2]}`;
    // setGrabOnFurniture(id, [
    //   {
    //     id: plate.id,
    //     type: EGrabType.plate,
    //   },
    //   {
    //     id: cheese.id,
    //     type: EFoodType.cheese,
    //   },
    // ]);
  }, [grabOnFurniture.size]);

  const handleHamburgerMount = useCallback(
    (id: string) => mountHandlers.current.get(id),
    []
  );
  const handleHamburgerUnmount = useCallback(
    (id: string) => unmountHandlers.current.get(id),
    []
  );

  useEffect(() => {
    if (registryFurniture && isFoodReady) {
      foods.forEach((food) => {
        // console.log(
        //   "Registering food obstacle:",
        //   world.getCollider(food.ref.current?.rigidBody?.handle)
        // );
        const furniture = findFurnitureByPosition(
          obstacles,
          food.position[0],
          food.position[2]
        );
        if (furniture) {
          setGrabOnFurniture(furniture.key, [{ id: food.id, type: food.type }]);
        }
      });
    }
  }, [registryFurniture, isFoodReady]);

  useEffect(() => {
    foods.forEach((food) => {
      const isHighlighted =
        !isHolding && highlightedGrab && highlightedGrab.id === food.id;
      setHighlightStates((prev) => ({
        ...prev,
        [food.id]: isHighlighted,
      }));
    });
    console.log("highlightStates updated:", foods);
  }, [isHolding, highlightedGrab, foods]);

  useEffect(() => {
    console.log("obstacles changed:", " grabOnFurniture", grabOnFurniture);
    if (obstacles.size > FURNITURE_ARR.length && registryFurniture) {
      setRegistry(true, "grab");
      setIsFoodReady(true);
    }
  }, [obstacles.size, registryFurniture]);

  useFrame(() => {
    if (!playerRef.current) {
      return;
    }
    // if (isReleasing) {
    //   return;
    // }
    if (heldItem) {
      const handPos = handPositionRef.current;
      handPos.set(heldItem.offset.x, heldItem.offset.y, heldItem.offset.z);
      handPos.applyMatrix4(playerRef.current.matrixWorld);

      if (heldItem.ref.current) {
        // 更新位置
        // heldItem.ref.current.position.copy(handPos);

        // // 更新旋转，使其与玩家保持一致
        // const playerQuaternion = handQuaternionRef.current;
        // playerRef.current.getWorldQuaternion(playerQuaternion);

        // 如果是汉堡或其他物体，更新其物理状态
        const rigidBody = heldItem.ref.current.rigidBody;
        if (rigidBody) {
          // takeOutFood((prev) => {
          //   return prev.map((item) => {
          //     if (item.id === heldItem.ref.current?.id) {
          //       return {
          //         ...item,
          //         position: [handPos.x, handPos.y, handPos.z],
          //       };
          //     }
          //     return item;
          //   });
          // });
          const info = getObstacleInfo(
            heldItem.ref.current.id || ""
          )! as IGrabPosition;
          if (grabRef.current)
            rigidBody.setTranslation(
              {
                x: handPos.x,
                y: handPos.y,
                z: handPos.z,
              },
              true
            );

          if (heldItem.rotation) {
            if (!info) {
              console.log("info is null", grabRef.current?.ref.current?.id);
              return;
            }
            const rotation = computeGrabRotationFromPlayer(info.type, false);
            const customQ = new THREE.Quaternion().setFromEuler(rotation);
            // updateObstaclePosition(
            //   heldItem.ref.current.id,
            //   [handPos.x, handPos.y, handPos.z],
            //   [customQ.x, customQ.y, customQ.z, customQ.w]
            // );
            rigidBody.setRotation(
              {
                x: customQ.x,
                y: customQ.y,
                z: customQ.z,
                w: customQ.w,
              },
              true
            );
          } else {
            // updateObstaclePosition(heldItem.ref.current.id, [
            //   handPos.x,
            //   handPos.y,
            //   handPos.z,
            // ]);
          }
        }
      }
    }
  });

  const renderFood = useMemo(() => {
    return foods.map((food) => {
      const handleIngredient =
        food?.type === EGrabType.pan || food?.type === EGrabType.cuttingBoard
          ? handleIngredients.find(
              (ingredient) =>
                ingredient.id === `${food.position[0]}_${food.position[2]}`
            )
          : undefined;
      const hamIsHolding = isHolding ? food.id === grabRef.current?.id : false;

      //     // ensure stable refs for frequently-changing array/object props
      let stable = stablePropsRef.current.get(food.id);
      if (!stable) {
        stable = {
          initPosRef: { current: food.position },
          sizeRef: { current: food.size },
          modelRef: { current: food.model },
          foodModelRef: { current: food.foodModel },
          handleIngredientRef: { current: handleIngredient },
        };
        stablePropsRef.current.set(food.id, stable);
      } else {
        stable.initPosRef.current = food.position;
        stable.sizeRef.current = food.size;
        stable.modelRef.current = food.model;
        stable.foodModelRef.current = food.foodModel;
        stable.handleIngredientRef.current = handleIngredient;
      }

      // if (stable.foodModelRef) {
      //   console.log("Rendering food:", stable, food);
      // }
      if (food.type === EFoodType.tomato) {
        console.log("Rendering food:", stable, food);
      }
      return (
        <Hamberger
          id={food.id}
          key={food.id}
          sizeRef={stable.sizeRef}
          isHolding={hamIsHolding}
          foodModelId={food.foodModel?.id || null}
          type={food.type}
          modelRef={stable.modelRef}
          area={food.area}
          isHighlighted={highlightStates[food.id] || false}
          ingredientStatus={handleIngredient?.status}
          // handleIngredientId={handleIngredient?.status}
          initPosRef={stable.initPosRef}
          visible={food.visible}
          foodModelRef={stable.foodModelRef}
          ref={food.ref}
          handleIngredientRef={stable.handleIngredientRef}
          rotateDirection={handleIngredient?.rotateDirection}
          onMount={handleHamburgerMount(food.id)}
          onUnmount={handleHamburgerUnmount(food.id)}
        />
      );
    });
  }, [
    foods,
    handleIngredients.map((i) => i.status).join(","),
    // isHolding,
    // highlightedGrab,
    highlightStates,
    handleHamburgerMount,
    handleHamburgerUnmount,
  ]);
  console.log("GrabbableWrapper render");
  return (
    <>
      {/* <GrabbableItem
        initialPosition={initialPosition}
        isGrabbable={!!highlightedGrab}
        isGrab={isGrab}
      > */}
      {renderFood}

      {/* {tablewares.map((item) => {
        const handleIngredient = handleIngredients.find(
          (ingredient) =>
            ingredient.id === `${item.position[0]}_${item.position[2]}`
        );

        if (!handleIngredient) return null;
        const id =
          item.id +
          (handleIngredient.status ? "cuttingBoardNoKnife" : "cuttingBoard");
        return (
          <CuttingBoard
            id={id}
            handleIngredient={handleIngredient}
            key={id}
            rotateDirection={handleIngredient.rotateDirection}
            size={item.size}
            type={item.type}
            position={item.position}
          />
        );
      })} */}
    </>
  );
}

export const MemoizedGrabbaleWrapper = React.memo(GrabbaleWrapper);

export default MemoizedGrabbaleWrapper;
