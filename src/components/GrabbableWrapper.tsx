// components/PlayerWithItem.jsx
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "@/stores/useFurnitureObstacle";
import { ObstacleInfo, useGrabObstacleStore } from "@/stores/useGrabObstacle";
import {
  EFoodType,
  EFurnitureType,
  EGrabType,
  IGrabItem,
  IGrabPosition,
} from "@/types/level";
// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import { ModelResourceContext } from "@/context/ModelResourceContext";
import Hamberger from "@/hamberger";
import useBurgerAssembly from "@/hooks/useBurgerAssembly";
import { EHandleIngredient, IHandleIngredientDetail } from "@/types/public";
import {
  computeGrabRotationFromPlayer,
  createFoodItem,
  findObstacleByPosition,
} from "@/utils/util";
import { useKeyboardControls } from "@react-three/drei";
import { RapierRigidBody, useRapier } from "@react-three/rapier";
import { isEqual } from "lodash";
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
  updateGrabHandle?: (handle: Map<string, number> | undefined) => void;
  // updateFoodType?: (type: EGrabType | EFoodType | null) => void;
  updateIsCutting?: (isCutting: boolean) => void;
}
const GRAB_TYPES = [...Object.values(EGrabType), ...Object.values(EFoodType)];
function GrabbaleWrapper({
  playerPositionRef,
  // highlightHandlerRef,
  updateGrabHandle,
  // updateFoodType,
  updateIsCutting,
  // furnitureHighlight,
  playerRef,
}: PlayerGrabbableItemProps) {
  const { world } = useRapier();
  const {
    grabSystemApi,
    modelMapRef,
    grabRef,
    pendingGrabIdRef,
    clickGrab: { isGrab, setIsGrab },
  } = useContext(GrabContext);
  const {
    registryFurniture,
    furnitureObstacles,
    setOpenFoodTable,
    getFurnitureObstacleInfo,
    furniturelightId,
  } = useFurnitureObstacleStore((s) => {
    return {
      furnitureObstacles: s.obstacles,
      getFurnitureObstacleInfo: s.getObstacleInfo,
      setOpenFoodTable: s.setOpenFoodTable,
      registryFurniture: s.registryFurniture,
      furniturelightId: s.highlightId,
    };
  });
  // const [grabPositions, setGrabPositions] = useState<IGrabItem[]>([]);

  const [highlightStates, setHighlightStates] = useState<
    Record<string, boolean>
  >({});

  // const stablePropsRef = useRef(
  //   new Map<
  //     string,
  //     {
  //       initPosRef: React.MutableRefObject<[number, number, number]>;
  //       sizeRef: React.MutableRefObject<[number, number, number]>;
  //       modelRef: React.MutableRefObject<THREE.Group>;
  //       foodModelRef: React.MutableRefObject<FoodModelType | undefined>;
  //       handleIngredientRef: React.MutableRefObject<
  //         IHandleIngredientDetail | undefined
  //       >;
  //     }
  //   >()
  // );

  // const releaseItemPosition = useRef<[number, number, number]>([0, 0, 0]);
  const handQuaternionRef = useRef(new THREE.Quaternion());
  // 处理汉堡挂载
  const mountHandlers = useRef(
    new Map<string, (rigidBody: RapierRigidBody | null) => void>(),
  );
  const [handleIngredients, setHandleIngredients] = useState<
    IHandleIngredientDetail[]
  >([]);
  const rigidBodyMapRef = useRef<Map<string, RapierRigidBody | null>>(
    new Map(),
  );
  const intervalRef = useRef<Map<string, NodeJS.Timeout | null>>(new Map());
  // const ingredientTempRef = useRef<IFoodWithRef[]>([]);

  // const grabRef = useRef<IFoodWithRef | null>(null);
  const unmountHandlers = useRef(new Map<string, () => void>());
  const initialPosition: [number, number, number] = [0, 0, 0];
  const [subscribeKeys, getKeys] = useKeyboardControls();

  const registerObstacle = useGrabObstacleStore((s) => s.registerObstacle);
  const unregisterObstacle = useGrabObstacleStore((s) => s.unregisterObstacle);
  const getObstacleInfo = useGrabObstacleStore((s) => s.getObstacleInfo);
  const obstacles = useGrabObstacleStore((s) => s.obstacles);
  const realHighLight = useGrabObstacleStore((s) => s.realHighLight);
  const highlightedGrab = useGrabObstacleStore((s) => s.realHighLight);
  const setRegistry = useGrabObstacleStore((s) => s.setRegistry);
  const removeGrabOnFurniture = useGrabObstacleStore(
    (s) => s.removeGrabOnFurniture,
  );
  const getGrabOnFurniture = useGrabObstacleStore((s) => s.getGrabOnFurniture);
  const setGrabOnFurniture = useGrabObstacleStore((s) => s.setGrabOnFurniture);
  const updateObstacleInfo = useGrabObstacleStore((s) => s.updateObstacleInfo);
  const grabOnFurniture = useGrabObstacleStore((s) => s.grabOnFurniture);

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

  const createIngredientItem = (item: IGrabItem) => {
    setHandleIngredients((prev) => {
      return [
        ...prev,
        {
          id: `${item.position[0]}_${item.position[2]}`,
          type:
            item.type === EGrabType.pan
              ? EHandleIngredient.cooking
              : EHandleIngredient.cutting,
          status: false,
        },
      ];
    });
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
  const { createNewFood } = useBurgerAssembly();
  // const [foods, takeOutFood] = useState<IFoodWithRef[]>([]);

  // Initialize foods once the shared grabModels are ready. This ensures we create
  // stable clones once and pass the same `model` object to `Hamberger` instances.
  useEffect(() => {
    if (loading) return;
    // only initialize once
    if (Object.keys(grabModels).length === 0 || obstacles.size > 0) return;
    GRAB_ARR.forEach((item) => {
      const model = grabModels[item.type] ?? new THREE.Group();
      const food = createFoodItem(item, model, true, modelMapRef);
      if (item.type === EGrabType.pan || item.type === EGrabType.cuttingBoard) {
        createIngredientItem(item);
      }
      registerObstacle(food.id, { ...food });
    });

    // takeOutFood(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    // takeOutFood(items);
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

  // useEffect(() => {
  //   const info = getObstacleInfo(heldItem?.id || "") || null;
  //   updateFoodType?.(info?.type || null);
  // }, [heldItem]);

  const [isIngredientEvent, setIsIngredient] = useState<boolean>(false);

  useEffect(() => {
    if (!isHolding) {
      // 尝试抓取物品
      if (
        highlightedFurniture &&
        highlightedFurniture.type === EFurnitureType.foodTable &&
        !getGrabOnFurniture(highlightedFurniture.id)
      ) {
        const foodType = highlightedFurniture.foodType!;
        setOpenFoodTable(highlightedFurniture.id);
        const newFood = createNewFood(
          foodType,
          grabModels[foodType],
          "foodTable",
          "hand",
        )!;
        registerObstacle(newFood.id, {
          ...newFood,
          area: "hand",
          visible: false,
        });
        return;
      }

      const tableObstacleId = highlightedFurniture
        ? getGrabOnFurniture(highlightedFurniture.id)
        : null;

      const grab = getObstacleInfo(
        tableObstacleId || (highlightedGrab ? highlightedGrab.id : ""),
      );

      if (!grab) return;
      if (grab.type === EGrabType.cuttingBoard) {
        return;
      }
      const handleIngredient = highlightedFurniture
        ? handleIngredients.find(
            (ingredient) =>
              ingredient.id ===
              `${highlightedFurniture.position[0]}_${highlightedFurniture.position[2]}`,
          )
        : null;
      const isCookType = grab.type === EGrabType.pan;
      const isCutType =
        grab.type === EGrabType.cuttingBoard ||
        grab.type === EGrabType.cuttingBoardNoKnife;

      // if (isCookType) {
      //   updateObstacleInfo(grab.id, { isCook: true });
      // } else if (isCutType) {
      //   updateObstacleInfo(grab.id, { isCut: true });
      // }
      if (handleIngredient) {
        if (typeof handleIngredient.status === "number") {
          if (handleIngredient.status === 5) {
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
          } else {
            return;
          }
        }
      }
      const rotation = computeGrabRotationFromPlayer(grab.type);
      // grabRef.current = grab;
      grabItem({
        food: grab,
        model: modelMapRef.current?.get(grab.id) || null,
        baseFoodModel:
          modelMapRef.current?.get(grab.foodModel?.id || "") || null,
        customRotation: [0, rotation, 0],
        clone: true,
      });

      if (grab) {
        updateObstacleInfo(grab.id, {
          area: "hand",
          visible: true,
          isCook: isCookType,
          isCut: isCutType,
        });
      }

      highlightedFurniture
        ? removeGrabOnFurniture(highlightedFurniture.id)
        : null;
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
        (i) => i.id === `${lightFurni.position[0]}_${lightFurni.position[2]}`,
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
    const grabId = getGrabOnFurniture(lightFurni.id);
    if (!grabId) return;
    const info = getObstacleInfo(grabId) as IGrabPosition;
    const isCookType = info.type === EGrabType.pan;

    const isCutType =
      info.type === EGrabType.cuttingBoard ||
      info.type === EGrabType.cuttingBoardNoKnife;

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
    // 奶酪和肉饼需要切，肉饼和鸡蛋需要煎
    const validateFood = isCookType
      ? [EFoodType.tomato, EFoodType.meatPatty]
      : isCutType
        ? [EFoodType.cheese, EFoodType.meatPatty, EFoodType.tomato]
        : [];

    const foodValiable =
      validateFood.findIndex((item) => item === info.type) > -1;
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
                          : "ddIngredient Cutting",
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
            }, 1000),
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
    const arr = new Map<string, number>();
    // 遍历所有已挂载的食物实例
    obstacles.forEach((food) => {
      const rigidBody = rigidBodyMapRef.current.get(food.id);
      if (rigidBody) {
        // 获取 rigidBody 的 collider handle
        const handle = rigidBody.handle;
        if (handle !== undefined) {
          arr.set(food.id, handle);
        }
      }
    });

    if (arr.size) {
      updateGrabHandle?.(arr);
    }
  }, [obstacles.size, mountHandlers.current.size, updateGrabHandle]);

  useEffect(() => {
    // setGrabPositions(GRAB_ARR);

    const unsubscribeIngredient = subscribeKeys(
      (state) => state.handleIngredient,
      (pressed) => {
        if (pressed) {
          setIsIngredient((s) => !s);
        }
      },
    );

    const unsubscribeGrab = subscribeKeys(
      (state) => state.grab,
      (pressed) => {
        if (pressed) {
          setIsGrab((s) => !s);
        }
      },
    );
    return () => {
      obstacles.forEach((food) => {
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

  useEffect(() => {
    obstacles.forEach((food) => {
      if (!mountHandlers.current.has(food.id)) {
        mountHandlers.current.set(food.id, (rigidBody) => {
          if (!rigidBody) {
            return;
          }

          rigidBodyMapRef.current.set(food.id, rigidBody);
          const model = modelMapRef.current?.get(food.id);
          const foodModel = modelMapRef.current?.get(food.foodModel?.id || "");
          // If this food was created with an immediate-grab intent, perform grab now
          if (pendingGrabIdRef.current === food.id) {
            pendingGrabIdRef.current = null;
            const rotation = computeGrabRotationFromPlayer(food.type);
            grabItem({
              food,
              model: model || null,
              baseFoodModel: foodModel || null,
              customRotation: [0, rotation, 0],
              clone: true,
            });
            // grabRef.current = food;
          }
        });
      }
      // If the Hamberger already mounted and provided a rigidBody earlier,
      // we may need to trigger the pending grab immediately.
      if (
        pendingGrabIdRef.current === food.id &&
        modelMapRef.current?.has(food.id)
      ) {
        pendingGrabIdRef.current = null;
        const rotation = computeGrabRotationFromPlayer(food.type);
        grabItem({
          food,
          model: modelMapRef.current.get(food.id) || null,
          baseFoodModel:
            modelMapRef.current.get(food.foodModel?.id || "") || null,
          customRotation: [0, rotation, 0],
          clone: true,
        });
        // grabRef.current = food;
      }
      if (!unmountHandlers.current.has(food.id)) {
        unmountHandlers.current.set(food.id, () => {
          unregisterObstacle(food.id);
        });
      }
    });
  }, [obstacles, registerObstacle, unregisterObstacle]);

  useEffect(() => {
    if (Object.keys(grabOnFurniture).length == 0) {
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
  }, [Object.keys(grabOnFurniture).length]);

  const handleHamburgerMount = useCallback(
    (id: string) => mountHandlers.current.get(id),
    [],
  );
  const handleHamburgerUnmount = useCallback(
    (id: string) => unmountHandlers.current.get(id),
    [],
  );

  useEffect(() => {
    if (registryFurniture && isFoodReady) {
      obstacles.forEach((food) => {
        // console.log(
        //   "Registering food obstacle:",
        //   world.getCollider(food.ref.current?.rigidBody?.handle)
        // );
        const furniture = findObstacleByPosition<IFurniturePosition>(
          furnitureObstacles,
          food.position[0],
          food.position[2],
        );
        if (furniture) {
          setGrabOnFurniture(furniture.key, food.id);
        }
      });
    }
  }, [registryFurniture, isFoodReady]);

  useEffect(() => {
    obstacles.forEach((food) => {
      const isHighlighted =
        !isHolding && highlightedGrab && highlightedGrab.id === food.id;
      setHighlightStates((prev) => ({
        ...prev,
        [food.id]: isHighlighted,
      }));
    });
    console.log("highlightStates updated:", obstacles);
  }, [isHolding, highlightedGrab, obstacles.size]);

  const [obstaclesChange, setObstaclesChange] = useState<Boolean>(false);
  const prevObstaclesRef = useRef<Map<string, ObstacleInfo> | null>(null);

  useEffect(() => {
    const currentObstacles = Array.from(obstacles.values());
    const prevObstacles = prevObstaclesRef.current
      ? Array.from(prevObstaclesRef.current.values())
      : [];

    // 找出变化的 obstacle
    const changedObstacles = currentObstacles.filter((current, index) => {
      const prev = prevObstacles[index];
      return !prev || !isEqual(current, prev);
    });

    if (changedObstacles.length > 0) {
      // console.log("Changed obstacles:", changedObstacles);
      // flushSync(() => {
      setObstaclesChange((s) => !s);
      // });

      // 找出具体变化的属性
      changedObstacles.forEach((current) => {
        const prev = prevObstacles?.find((o) => o.id === current.id);
        if (prev) {
          const changedKeys = Object.keys(current).filter(
            (key) => !isEqual(current[key], prev[key]),
          );

          console.log(
            `Obstacle ${current.id} changed keys:`,
            changedKeys,
            current.position,
          );
        }
      });
    }

    prevObstaclesRef.current = obstacles;

    if (
      isFoodReady === false &&
      obstacles.size === GRAB_ARR.length &&
      registryFurniture
    ) {
      setRegistry(true);
      setIsFoodReady(true);
    }
    console.log("obstacles changed:", obstacles);
  }, [obstacles, registryFurniture]);

  const onSpawn = useCallback(
    (
      rb: RapierRigidBody | null,
      id: string,
      type: EFoodType | EGrabType,
      initPos?: [number, number, number],
    ) => {
      if (!rb) return;
      if (!initPos) {
        const playerQuaternion = handQuaternionRef.current;
        playerRef.current?.getWorldQuaternion(playerQuaternion);
        const rotation = computeGrabRotationFromPlayer(type);
        if (rotation) {
          const yawQuaternion = new THREE.Quaternion();
          yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
          playerQuaternion.multiply(yawQuaternion);
        }
        rb.setRotation(
          {
            x: playerQuaternion.x,
            y: playerQuaternion.y,
            z: playerQuaternion.z,
            w: playerQuaternion.w,
          },
          true,
        );
      } else {
        rb.setTranslation(
          {
            x: initPos[0],
            y: initPos[1],
            z: initPos[2],
          },
          true,
        );
      }
      updateObstacleInfo(id, {
        visible: true,
      });
    },
    [],
  );
  const renderFood = useMemo(() => {
    return Array.from(obstacles.values()).map((food) => {
      const handleIngredient =
        food?.type === EGrabType.pan || food?.type === EGrabType.cuttingBoard
          ? handleIngredients.find(
              (ingredient) =>
                ingredient.id === `${food.position[0]}_${food.position[2]}`,
            )
          : undefined;
      const hamIsHolding = heldItem?.id
        ? // ? grabRef.current?.id === heldItem?.id
          food.id === heldItem?.id
        : // : food.id === grabRef.current?.id
          false;
      // if (hamIsHolding) {
      //   console.log("Rendering held food:", heldItem);
      //   return;
      // }
      const model = modelMapRef.current?.get(food.id);
      if (!model) {
        return null;
      }

      const baseFoodModel = food.foodModel
        ? modelMapRef.current?.get(food.foodModel.id)
        : undefined;
      // food.foodModel && !isMultiFoodModelType(food.foodModel)
      //   ? modelMapRef.current?.get(food.foodModel.id)
      //   : undefined;
      if (food.type === EFoodType.tomato) {
        console.log("Rendering food model:", model, hamIsHolding, food);
      }
      const isHighlighted = realHighLight
        ? food.id === realHighLight?.id
        : false;
      const rotation = food.rotation;
      return (
        <Hamberger
          id={food.id}
          key={food.id}
          onSpawn={onSpawn}
          size={food.size}
          isHolding={hamIsHolding}
          foodModelId={food.foodModel?.id || null}
          type={food.type}
          model={model}
          baseFoodModel={baseFoodModel}
          // area={food.area}
          isHighlighted={isHighlighted}
          ingredientStatus={handleIngredient?.status}
          // handleIngredientId={handleIngredient?.status}
          initPos={food.position}
          visible={food.visible}
          foodModel={food.foodModel}
          handleIngredient={handleIngredient}
          rotation={rotation}
          onMount={handleHamburgerMount(food.id)}
          onUnmount={handleHamburgerUnmount(food.id)}
        />
      );
    });
  }, [
    obstaclesChange,
    handleIngredients.map((i) => i.status).join(","),
    heldItem?.id,
    realHighLight,
    // grabRef.current,
    // isHolding,
    // highlightedGrab,
    // highlightStates,
    handleHamburgerMount,
    handleHamburgerUnmount,
  ]);
  console.log("GrabbableWrapper render");
  return <>{renderFood}</>;
}

export const MemoizedGrabbaleWrapper = React.memo(GrabbaleWrapper);

export default MemoizedGrabbaleWrapper;
