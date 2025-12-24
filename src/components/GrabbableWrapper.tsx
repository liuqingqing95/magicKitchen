// components/PlayerWithItem.jsx
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import { useGrabSystem } from "@/hooks/useGrabSystem";
import {
  IFurniturePosition,
  ObstacleInfo,
  useObstacleStore,
} from "@/stores/useObstacle";
import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  ERigidBodyType,
  IGrabItem,
  IGrabPosition,
  ITablewareWithRef,
  type IFoodWithRef,
} from "@/types/level";
// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { GRAB_ARR, TABLEWARE_ARR } from "@/constant/data";
import { CuttingBoard } from "@/cuttingBoard";
import { Hamberger } from "@/hamberger";
import { useGrabNear } from "@/hooks/useGrabNear";
import {
  EDirection,
  EHandleIngredient,
  IHandleIngredientDetail,
} from "@/types/public";
import { MODEL_PATHS } from "@/utils/loaderManager";
import { foodTableData, transPosition } from "@/utils/util";
import { useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, useRapier } from "@react-three/rapier";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
// import Player from "../Player";

interface PlayerGrabbableItemProps {
  playerPositionRef: React.MutableRefObject<[number, number, number]>;
  updateFurnitureHighLight: (highlight: false | IFurniturePosition) => void;
  playerRef: React.MutableRefObject<THREE.Group<THREE.Object3DEventMap> | null>;
  updateGrabHandle?: (handle: number[] | undefined) => void;
  updateFoodType?: (type: EGrabType | EFoodType | null) => void;
  updateIsCutting?: (isCutting: boolean) => void;
}
const GRAB_TYPES = [...Object.values(EGrabType), ...Object.values(EFoodType)];
export default function PlayerWithItem({
  playerPositionRef,
  updateFurnitureHighLight,
  updateGrabHandle,
  updateFoodType,
  updateIsCutting,
  // furnitureHighlight,
  playerRef,
}: PlayerGrabbableItemProps) {
  const { world } = useRapier();
  // const [grabPositions, setGrabPositions] = useState<IGrabItem[]>([]);
  const isGrab = useRef<boolean | null>(null);

  const [highlightStates, setHighlightStates] = useState<
    Record<string, boolean>
  >({});
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
    registryFurniture,

    updateObstaclePosition,
    getGrabOnFurniture,
    setGrabOnFurniture,
    getAllGrabOnFurniture,
    updateObstacleInfo,
    grabOnFurniture,
  } = useObstacleStore();
  const {
    heldItem,
    holdStatus,
    grabItem,
    releaseItem,
    isHolding,
    isReleasing,
  } = useGrabSystem();
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
      // const d = new THREE.Quaternion().setFromEuler(rotation);
      // rb?.setRotation({ x: d.x, y: d.y, z: d.z, w: d.w }, true);
    } catch (e) {
      return new THREE.Euler(0, 0, 0);
    }
  };

  const { getNearest, grabNearList, furnitureNearList } = useGrabNear(
    playerPositionRef.current
  );
  const [highlightedFurniture, setHighlightedFurniture] = useState<
    IFurniturePosition | false
  >(false);
  const [highlightedGrab, setHighlightedGrab] = useState<IGrabPosition | false>(
    false
  );

  // 使用useEffect来更新高亮状态
  useEffect(() => {
    if (grabNearList.length === 0) {
      setHighlightedGrab(false);
      return;
    }
    const newGrab = getNearest(ERigidBodyType.grab, isHolding);
    setHighlightedGrab(newGrab as IGrabPosition | false);
  }, [getNearest, grabNearList.length, isHolding]);

  useEffect(() => {
    if (furnitureNearList.length === 0) {
      setHighlightedFurniture(false);
      return;
    }
    const newFurniture = getNearest(ERigidBodyType.furniture);
    setHighlightedFurniture(newFurniture as IFurniturePosition | false);
  }, [getNearest, furnitureNearList.length, isHolding]);

  // const highlightedFurniture = highlightedFurnitureNearest[0] || false;
  const [isFoodReady, setIsFoodReady] = useState(false);

  // const fireExtinguisher = useGLTF(MODEL_PATHS.overcooked.fireExtinguisher);
  // const pan = useGLTF(MODEL_PATHS.overcooked.pan);
  // const plate = useGLTF(MODEL_PATHS.overcooked.plate);
  // const hamburger = useGLTF(MODEL_PATHS.food.burger);

  // const hamburger = useGLTF(MODEL_PATHS.food.burger);
  // const hamburger = useGLTF(MODEL_PATHS.food.burger);
  // const hamburger = useGLTF(MODEL_PATHS.food.burger);

  // const grabModels = useMemo(() => {
  //   const models: Record<string, THREE.Object3D> = {};

  //   // FURNITURE_ARR.filter(
  //   //   (item) => item.name === EFurnitureType.foodTable
  //   // ).forEach((item) => {
  //   //   models[item.foodType] = useGLTF(
  //   //     MODEL_PATHS.food[item.foodType]
  //   //   ).scene.clone();
  //   // });
  //   return models;
  // }, [fireExtinguisher, pan, plate, hamburger]);
  const grabModels = useMemo(() => {
    const models: Record<string, THREE.Group> = {};
    GRAB_TYPES.forEach((type) => {
      let path = "food";
      switch (type) {
        case EGrabType.fireExtinguisher:
        case EGrabType.pan:
        case EGrabType.plate:
        case EGrabType.cuttingBoard:
        case EGrabType.cuttingBoardNoKnife:
          path = "overcooked";
          break;
        default:
          path = "food";
      }

      const clonedModel = useGLTF(MODEL_PATHS[path][type]).scene.clone();
      clonedModel.name = type;
      models[type] = clonedModel;
    });
    return models;
  }, []);

  const createFoodItem = (
    item: IGrabItem,
    model: THREE.Group
  ): IFoodWithRef => {
    const clonedModel = model.clone();
    const id = `Grab_${item.name}_${clonedModel.uuid}`;
    //
    if (item.name === EGrabType.pan) {
      setHandleIngredients((prev) => {
        return [
          ...prev,
          {
            id: `${item.position[0]}_${item.position[2]}`,
            type: EHandleIngredient.cooking,
            status: false,
            rotateDirection: EDirection.normal,
          },
        ];
      });
    }

    return {
      id,
      position: item.position,
      type: item.name,
      model: clonedModel,
      size: item.size,
      grabbingPosition: item.grabbingPosition,
      isFurniture: false,
      ref: {
        current: {
          id,
          rigidBody: undefined,
        },
      },
    };
  };
  const [tablewares] = useState<ITablewareWithRef[]>(() => {
    return TABLEWARE_ARR.map((item) => {
      // const model = grabModels[item.name];
      // const clonedModel = model.clone();

      const id = `Tableware_${item.name}_${item.position.join("_")}`;
      setHandleIngredients((prev) => {
        return [
          ...prev,
          {
            id: `${item.position[0]}_${item.position[2]}`,
            type: EHandleIngredient.cutting,
            status: false,
            rotateDirection: item.rotateDirection,
          },
        ];
      });
      return {
        id,
        position: item.position,
        type: item.name,
        // model: clonedModel,
        size: item.size,
      };
    });
  });
  const [foods, takeOutFood] = useState<IFoodWithRef[]>(() => {
    return GRAB_ARR.map((item) => {
      const model = grabModels[item.name];

      return createFoodItem(item, model);
    });
  });

  useEffect(() => {
    console.log("furnitureHighlight changed:", highlightedFurniture);
    const lightFurni = highlightedFurnitureRef.current;
    if (lightFurni) {
      const id = lightFurni.position[0] + "_" + lightFurni.position[2];
      const time = intervalRef.current.get(id);
      if (time && lightFurni.id !== highlightedFurniture.id) {
        clearInterval(time);
        intervalRef.current.set(id, null);
      }
    }
    highlightedFurnitureRef.current = highlightedFurniture;
    updateFurnitureHighLight(highlightedFurniture);
  }, [highlightedFurniture, updateFurnitureHighLight]);

  useEffect(() => {
    updateFoodType?.(grabRef.current?.type || null);
  }, [grabRef.current]);
  const ingredientEventRef = useRef<boolean>(false);

  useEffect(() => {
    if (isHolding) {
      // 释放物品
      const rigidBody = grabRef.current?.ref.current?.rigidBody;
      if (rigidBody) {
        const currentTranslation = rigidBody.translation();
        // 不强制设置 Y，让 Rapier 自然决定物体落在地面或家具上
        const currentPosition: [number, number, number] = [
          currentTranslation.x,
          currentTranslation.y,
          currentTranslation.z,
        ];
        const info = getObstacleInfo(
          grabRef.current?.ref.current?.id || ""
        )! as IGrabPosition;
        if (!info) {
          console.warn("info is null");
          return;
        }
        if (highlightedFurniture && info) {
          if (highlightedFurniture.type === EFurnitureType.trash) {
            takeOutFood((prev) => {
              return prev.filter((item) => item.id !== info.id);
            });
            unregisterObstacle(info.id, highlightedFurniture.id);
            // setHighlightedFurniture(highlightedFurniture, false);
          } else {
            const arr = getGrabOnFurniture(highlightedFurniture.id);
            let canPlace = false;
            // 如果为餐桌，则只允许叠放放置特定物品
            const tablewareArr = [
              EGrabType.plate,
              EGrabType.pan,
              EGrabType.cuttingBoard,
              EFoodType.burger,
            ];

            if (arr.length === 0) {
              canPlace = true;
            } else if (
              arr.length === 1 &&
              arr.find((item) => tablewareArr.indexOf(item.type) > -1)
            ) {
              if (arr.find((item) => item.type === EGrabType.plate)) {
                if (
                  info.type === EFoodType.meatPatty ||
                  info.type === EFoodType.eggCooked
                ) {
                  if (info.isCook === true) {
                    canPlace = true;
                  } else {
                    canPlace = false;
                  }
                } else {
                  canPlace = true;
                }
              } else {
                canPlace = true;
              }
            }

            // .findIndex((item) => item === info.type);
            if (canPlace) {
              // 只记录 x/z 到家具位置映射（不要强制覆盖 y）
              const position: [number, number, number] = [
                (highlightedFurniture as IFurniturePosition).position[0],
                currentPosition[1],
                (highlightedFurniture as IFurniturePosition).position[2],
              ];

              updateObstaclePosition(info.id, position, undefined, {
                source: "manual",
                lockMs: 500,
              });

              setGrabOnFurniture(highlightedFurniture.id, [
                ...arr,
                { id: info.id, type: info.type },
              ]);
              takeOutFood((prev) => {
                return prev.map((item) => {
                  if (item.id === info.id) {
                    return {
                      ...item,
                      area: "table",
                    };
                  }
                  return item;
                });
              });

              releaseItem(highlightedFurniture);
            } else {
              return;
            }
          }
        } else {
          // 在地面上也不要把 y 设为 0，而是使用刚体当前的 y
          updateObstaclePosition(info.id, currentPosition, undefined, {
            source: "manual",
            lockMs: 500,
          });
          takeOutFood((prev) => {
            return prev.map((item) => {
              if (item.id === info.id) {
                return {
                  ...item,
                  area: "floor",
                };
              }
              return item;
            });
          });
          releaseItem(highlightedFurniture);
        }
        grabRef.current = null;
      }
    } else {
      // 尝试抓取物品
      if (highlightedFurniture) {
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
        if (
          highlightedFurniture.type === EFurnitureType.foodTable &&
          !filterArr.length
        ) {
          const foodType = highlightedFurniture.foodType!;
          const foodInfo = foodTableData(foodType, playerPositionRef.current);
          const newFood = createFoodItem(foodInfo, grabModels[foodType]);
          pendingGrabIdRef.current = newFood.id;
          newFood.area = "hand";
          takeOutFood((prev) => {
            return [...prev, newFood];
          });
          grabRef.current = newFood;
          // grabItem(newFood);
          // 确保在抓取前获取完整的刚体信息
          // const checkAndGrab = () => {
          //   if (newFood.ref.current?.rigidBody) {
          //     grabRef.current = newFood;
          //     grabItem(newFood);
          //   } else {
          //     requestAnimationFrame(checkAndGrab);
          //   }
          // };
          // checkAndGrab();
        } else if (filterArr.length === 1) {
          const foodId = filterArr[0].id;
          const grab = foods.find((item) => foodId === item.id);
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

                if (filterArr[0].type === EGrabType.pan) {
                  updateObstacleInfo(foodId, { isCook: true });
                } else if (
                  filterArr[0].type === EGrabType.cuttingBoard ||
                  filterArr[0].type === EGrabType.cuttingBoardNoKnife
                ) {
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
              if (oldObj.x === newObj.x && oldObj.z === newObj.z) {
                return {
                  ...item,
                  area: "hand",
                };
              }
              return item;
            });
          });
          setGrabOnFurniture(
            highlightedFurniture.id,
            arr.filter((item) => item.id !== foodId)
          );
        }
      } else if (highlightedGrab) {
        const grab = foods.find((item) => highlightedGrab.id === item.id);
        if (grab) {
          grabRef.current = grab;
          grabItem(grab);
          takeOutFood((prev) => {
            return prev.map((item) => {
              const oldObj = transPosition(item.id);
              const newObj = transPosition(highlightedGrab.id);
              if (oldObj.x === newObj.x && oldObj.z === newObj.z) {
                return {
                  ...item,
                  area: "hand",
                };
              }
              return item;
            });
          });
        }
      }
    }
  }, [isGrab.current]);

  useEffect(() => {
    const lightFurni = highlightedFurnitureRef.current;
    if (!lightFurni) {
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
        } else if (info.type === EFoodType.eggCooked) {
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
      ? [EFoodType.eggCooked, EFoodType.meatPatty]
      : isCutType
        ? [EFoodType.cheese, EFoodType.meatPatty]
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
                      console.log(id, newStatus, "needCutting");
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
  }, [ingredientEventRef.current]);

  useEffect(() => {
    handleIngredientsRef.current = handleIngredients;
    const isCutting = handleIngredients.some((i) => i.status !== false);
    // console.log("handleIngredients changed:", isCutting);
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
    setIsFoodReady(true);

    const unsubscribeIngredient = subscribeKeys(
      (state) => state.handleIngredient,
      (pressed) => {
        if (pressed) {
          ingredientEventRef.current = !ingredientEventRef.current;
        }
      }
    );

    const unsubscribeGrab = subscribeKeys(
      (state) => state.grab,
      (pressed) => {
        if (pressed) {
          isGrab.current = !isGrab.current;
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
      const furnitureZ = transPosition(key)[2];
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
            isCut: false,
            isCook: false,
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
    console.log(
      "obstacles changed:",
      Array.from(obstacles.values()),
      " grabOnFurniture",
      getAllGrabOnFurniture()
    );
  }, [obstacles.size, grabOnFurniture.size]);

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
    if (registryFurniture) {
      tablewares.forEach((item) => {
        // console.log(
        //   "Registering food obstacle:",
        //   world.getCollider(food.ref.current?.rigidBody?.handle)
        // );
        const furniture = findFurnitureByPosition(
          obstacles,
          item.position[0],
          item.position[2]
        );
        if (furniture) {
          setGrabOnFurniture(furniture.key, [{ id: item.id, type: item.type }]);
        }
      });
    }
  }, [registryFurniture]);

  useEffect(() => {
    foods.forEach((food) => {
      const isHighlighted =
        !isHolding && highlightedGrab && highlightedGrab.id === food.id;
      setHighlightStates((prev) => ({
        ...prev,
        [food.id]: isHighlighted,
      }));
    });
  }, [isHolding, highlightedGrab, foods]);

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
          if (heldItem.rotation) {
            const info = getObstacleInfo(
              grabRef.current?.ref.current?.id || ""
            )! as IGrabPosition;
            if (!info) {
              console.log("info is null", grabRef.current?.ref.current?.id);
              return;
            }
            const rotation = computeGrabRotationFromPlayer(info.type);
            const customQ = new THREE.Quaternion().setFromEuler(rotation);
            updateObstaclePosition(
              heldItem.ref.current.id,
              [handPos.x, handPos.y, handPos.z],
              [customQ.x, customQ.y, customQ.z, customQ.w],
              { source: "frame" }
            );
          } else {
            updateObstaclePosition(
              heldItem.ref.current.id,
              [handPos.x, handPos.y, handPos.z],
              undefined,
              { source: "frame" }
            );
          }
        }
      }
    }
  });

  return (
    <>
      {/* <GrabbableItem
        initialPosition={initialPosition}
        isGrabbable={!!highlightedGrab}
        isGrab={isGrab}
      > */}
      {foods.map((food) => {
        const handleIngredient =
          food.type === EGrabType.pan
            ? handleIngredients.find(
                (ingredient) =>
                  ingredient.id === `${food.position[0]}_${food.position[2]}`
              )
            : undefined;
        return (
          <Hamberger
            id={food.id}
            key={food.id}
            size={food.size}
            isHolding={isHolding}
            type={food.type}
            model={food.model}
            area={food.area}
            initPos={food.position}
            ref={food.ref}
            handleIngredient={handleIngredient}
            isHighlighted={highlightStates[food.id]}
            onMount={handleHamburgerMount(food.id)}
            onUnmount={handleHamburgerUnmount(food.id)}
          />
        );
      })}

      {tablewares.map((item) => {
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
      })}
    </>
  );
}
