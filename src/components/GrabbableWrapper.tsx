// components/PlayerWithItem.jsx
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "@/stores/useFurnitureObstacle";
import {
  ObstacleInfo,
  useGetCleanPlates,
  useGetDirtyPlates,
  useGrabObstaclesMap,
  useGrabObstacleStore,
  useGrabOnFurniture,
  useRealHighlight,
} from "@/stores/useGrabObstacle";
import {
  BaseFoodModelType,
  EFoodType,
  EFurnitureType,
  EGrabType,
  ERigidBodyType,
  IFoodWithRef,
  TPLayerId,
} from "@/types/level";

// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import { ModelResourceContext } from "@/context/ModelResourceContext";
import Hamberger from "@/hamberger";
import { createNewFood } from "@/hooks/useBurgerAssembly";

import {
  useObstaclesMap as useFurnitureObstacle,
  useHighlightId,
  useRegistryFurniture,
} from "@/stores/useFurnitureObstacle";
import { EHandleIngredient } from "@/types/public";
import { createTextData } from "@/utils/test";
import {
  computeGrabRotationFromPlayer,
  createFoodItem,
  findObstacleByPosition,
  getId,
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
  playerPositionRefs: React.MutableRefObject<
    Record<TPLayerId, [number, number, number]>
  >;
  playerRefs: React.MutableRefObject<Record<TPLayerId, THREE.Group | null>>;
  updateGrabHandle?: (handle: Map<string, number> | undefined) => void;
  updateIsCutting?: (playerId: TPLayerId, isCutting: boolean) => void;
}
const GRAB_TYPES = [...Object.values(EGrabType), ...Object.values(EFoodType)];
function GrabbaleWrapper({
  playerPositionRefs,
  updateGrabHandle,
  updateIsCutting,
  playerRefs,
}: PlayerGrabbableItemProps) {
  const { world } = useRapier();
  const {
    grabSystemApi,
    modelMapRef,
    toolPosRef,
    handleIngredientsApi,
    pendingGrabIdRef,
    clickGrab: { isGrab, setIsGrab },
    clickIngredient: { isIngredient, setIsIngredient },
  } = useContext(GrabContext);
  const { getFurnitureObstacleInfo } = useFurnitureObstacleStore((s) => {
    return {
      getFurnitureObstacleInfo: s.getObstacleInfo,
      // registryFurniture: s.registryFurniture,
      // furniturelightId: s.highlightId,
    };
  });

  const registryFurniture = useRegistryFurniture();

  const furnitureObstacles = useFurnitureObstacle();

  const furniturelightId = useHighlightId();
  const setOpenFoodTable = useFurnitureObstacleStore((s) => s.setOpenFoodTable);
  // const [grabPositions, setGrabPositions] = useState<IGrabItem[]>([]);

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
  const rigidBodyMapRef = useRef<Map<string, RapierRigidBody | null>>(
    new Map(),
  );
  // ingredient management moved to hook
  const {
    handleIngredients,
    addIngredient,
    toggleTimer,
    setIngredientStatus,
    stopTimer,
    getTimer,
    addCompleteListener,
    cleanupTimers,
  } = handleIngredientsApi;
  const unmountHandlers = useRef(new Map<string, () => void>());
  const initialPosition: [number, number, number] = [0, 0, 0];
  const [subscribeKeys, getKeys] = useKeyboardControls();

  const registerObstacle = useGrabObstacleStore((s) => s.registerObstacle);
  const unregisterObstacle = useGrabObstacleStore((s) => s.unregisterObstacle);
  const getObstacleInfo = useGrabObstacleStore((s) => s.getObstacleInfo);
  const obstacles = useGrabObstaclesMap();
  // 获取两个玩家的高亮物品 - 用于视觉显示（任一玩家高亮都显示）

  const setRegistry = useGrabObstacleStore((s) => s.setRegistry);
  const removeGrabOnFurniture = useGrabObstacleStore(
    (s) => s.removeGrabOnFurniture,
  );
  const dirtyPlateArr = useGetDirtyPlates();
  const getGrabOnFurniture = useGrabObstacleStore((s) => s.getGrabOnFurniture);
  const setGrabOnFurniture = useGrabObstacleStore((s) => s.setGrabOnFurniture);
  const updateObstacleInfo = useGrabObstacleStore((s) => s.updateObstacleInfo);
  const grabOnFurniture = useGrabOnFurniture();

  const { heldItemsMap, grabItem, isHolding } = grabSystemApi;
  const firstHighlight = useRealHighlight("firstPlayer");
  const secondHighlight = useRealHighlight("secondPlayer");
  const highlightedFurnitureRef = useRef<IFurniturePosition | false>(false);
  // 跟踪哪个玩家触发了抓取事件
  const grabbingPlayerRef = useRef<TPLayerId | null>(null);
  const prevIsGrabRef = useRef<Record<TPLayerId, boolean>>({
    firstPlayer: false,
    secondPlayer: false,
  });
  const [isFoodReady, setIsFoodReady] = useState(false);
  const { compliteAssembBurgers } = createTextData();

  const heldItem = useMemo(() => {
    if (grabbingPlayerRef.current) {
      return heldItemsMap.get(grabbingPlayerRef.current || "") || null;
    }
    return null;
  }, [heldItemsMap, grabbingPlayerRef.current]);

  const realHighLightIds = useMemo(() => {
    const arr: string[] = [];

    arr.push(firstHighlight ? firstHighlight.id : "");
    arr.push(secondHighlight ? secondHighlight.id : "");
    return arr;
  }, [firstHighlight, secondHighlight]);

  const realHighLight = useCallback(() => {
    if (grabbingPlayerRef.current === "firstPlayer") {
      return firstHighlight;
    } else if (grabbingPlayerRef.current === "secondPlayer") {
      return secondHighlight;
    }
    return false;
  }, [grabbingPlayerRef.current, firstHighlight, secondHighlight]);

  // 获取指定玩家的高亮家具
  const getLightedFurnitureForPlayer = useCallback(
    (playerId: TPLayerId | null): IFurniturePosition | false => {
      if (!playerId) return false;
      const highlightId = furniturelightId[playerId];
      if (highlightId) {
        return getFurnitureObstacleInfo(highlightId) || false;
      }
      return false;
    },
    [furniturelightId, getFurnitureObstacleInfo],
  );

  useEffect(() => {
    // 检查哪个玩家的 isGrab 发生了变化
    let changedPlayer: TPLayerId | null = null;

    if (isGrab.firstPlayer !== prevIsGrabRef.current.firstPlayer) {
      changedPlayer = "firstPlayer";
    } else if (isGrab.secondPlayer !== prevIsGrabRef.current.secondPlayer) {
      changedPlayer = "secondPlayer";
    }

    // 更新 ref，以追踪是哪个玩家触发了变化
    grabbingPlayerRef.current = changedPlayer;

    // 更新之前的值
    prevIsGrabRef.current = {
      firstPlayer: isGrab.firstPlayer,
      secondPlayer: isGrab.secondPlayer,
    };
  }, [isGrab]);

  // 获取第一个非空的高亮ID（任一玩家）- 用于显示等非玩家特定的逻辑
  const highlightedFurniture = useMemo(() => {
    const firstHighlightId = Object.values(furniturelightId).find(
      (id) => id !== false,
    );
    if (firstHighlightId) {
      return getFurnitureObstacleInfo(firstHighlightId as string) || false;
    }
    return false;
  }, [furniturelightId, getFurnitureObstacleInfo]);

  const createIngredientItem = (item: IFoodWithRef) => {
    addIngredient({
      id: item.id,
      type:
        item.type === EGrabType.pan
          ? EHandleIngredient.cooking
          : EHandleIngredient.cutting,
      status: false,
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
  const modelNoKnifeCache = useRef<Map<string, THREE.Group>>(new Map());

  // const [foods, takeOutFood] = useState<IFoodWithRef[]>([]);

  // Initialize foods once the shared grabModels are ready. This ensures we create
  // stable clones once and pass the same `model` object to `Hamberger` instances.
  useEffect(() => {
    if (loading) return;
    if (!registryFurniture) return;
    // only initialize once
    if (Object.keys(grabModels).length === 0 || obstacles.size > 0) return;
    GRAB_ARR.forEach((item) => {
      if (item.visible === false) return;
      const model = grabModels[item.type] ?? new THREE.Group();
      const food = createFoodItem(item, model, true, modelMapRef);
      if (item.type === EGrabType.cuttingBoard) {
        toolPosRef.current?.set(food.id, [item.position[0], item.position[2]]);
      }
      if (item.type === EGrabType.pan || item.type === EGrabType.cuttingBoard) {
        createIngredientItem(food);
      }

      const furniture = findObstacleByPosition<IFurniturePosition>(
        furnitureObstacles,
        food.position[0],
        food.position[2],
      );

      if (furniture) {
        food.area = "table";
        setGrabOnFurniture(furniture.key, food.id);
      } else {
        food.area = "floor";
        food.position[1] = 0;
      }

      registerObstacle(food.id, { ...food });
    });
  }, [loading, registryFurniture]);

  // Populate foods once models are available

  useEffect(() => {
    // console.log("furnitureHighlight changed:", highlightedFurniture);
    const lightFurni = highlightedFurnitureRef.current;
    if (lightFurni) {
      let id = "";
      toolPosRef.current &&
        Array.from(toolPosRef.current).forEach((item) => {
          const [key, [x, z]] = item;

          if (
            lightFurni &&
            x === lightFurni.position[0] &&
            z === lightFurni.position[2]
          ) {
            id = key;
          }
        });
      // 切菜或者洗碗必须人守着，否则停止
      const time = getTimer(id || "");
      if (time > 0) {
        stopTimer(id);
      }
    }
    highlightedFurnitureRef.current = highlightedFurniture;
  }, [highlightedFurniture]);

  // useEffect(() => {
  //   const info = getObstacleInfo(heldItem?.id || "") || null;
  //   updateFoodType?.(info?.type || null);
  // }, [heldItem]);

  // 检查是否有任一玩家触发了 ingredient 事件
  const isIngredientEvent = useMemo(
    () => isIngredient.firstPlayer || isIngredient.secondPlayer,
    [isIngredient],
  );
  const cleanPlates = useGetCleanPlates();
  const removeCleanPlate = useGrabObstacleStore((s) => s.removeCleanPlate);
  useEffect(() => {
    if (!isHolding) {
      // 获取触发抓取的玩家的高亮家具
      const playerHighlightedFurniture = getLightedFurnitureForPlayer(
        grabbingPlayerRef.current,
      );

      // 尝试抓取物品
      if (playerHighlightedFurniture) {
        if (
          playerHighlightedFurniture.type === EFurnitureType.foodTable &&
          !getGrabOnFurniture(playerHighlightedFurniture.id)
        ) {
          const foodType = playerHighlightedFurniture.foodType!;
          setOpenFoodTable(playerHighlightedFurniture.id);
          const newFood = createNewFood({
            foodType,
            model: grabModels[foodType],
            belong: "foodTable",
            modelMapRef,
            pendingGrabIdRef,
            area: "hand",
          })!;
          registerObstacle(newFood.id, {
            ...newFood,
            area: "hand",
            visible: false,
          });
          return;
        } else if (
          playerHighlightedFurniture.type === EFurnitureType.washSink &&
          cleanPlates.length
        ) {
          const item = GRAB_ARR.find((item) => item.type === EGrabType.plate)!;
          const newFood = createFoodItem(
            item,
            grabModels[EGrabType.plate],
            false,
            modelMapRef,
          )!;

          pendingGrabIdRef.current = newFood.id;
          registerObstacle(newFood.id, {
            ...newFood,
            area: "hand",
            visible: false,
          });

          removeCleanPlate();
          return;
        }
      }

      const tableObstacleId = playerHighlightedFurniture
        ? getGrabOnFurniture(playerHighlightedFurniture.id)
        : null;
      const info = realHighLight();
      const grab = getObstacleInfo(tableObstacleId || (info ? info.id : ""));

      if (!grab) return;
      const handleIngredient =
        handleIngredients.find((ingredient) => ingredient.id === grab.id) ||
        null;

      if (grab.type === EGrabType.cuttingBoard) {
        if (!grab.foodModel) {
          return;
        }
        if (handleIngredient) {
          if (typeof handleIngredient.status === "number") {
            if (handleIngredient.status < 5) {
              return;
            }
          }
        }
        const type =
          handleIngredient?.status === false
            ? (grab.foodModel as BaseFoodModelType).type
            : replaceModelRef.current.get(grab.id);
        if (!type) return;
        const model = grabModels[type].clone() || null;

        if (!model) return;

        const newFood = createNewFood({
          foodType: grab.foodModel.type as EFoodType,
          model,
          belong: "newFood",
          modelMapRef,
          pendingGrabIdRef,
          area: "hand",
        })!;
        registerObstacle(newFood.id, {
          ...newFood,
          visible: false,
          isCut: handleIngredient ? handleIngredient.status === 5 : undefined,
          position: grab.position,
        });
        pendingGrabIdRef.current = newFood.id;
        setIngredientStatus(grab.id, false);
        updateObstacleInfo(grab.id, { foodModel: undefined, isCut: false });
        modelMapRef.current?.delete(grab.foodModel.id);
        return;
      } else if (grab.type == EGrabType.pan) {
        stopTimer(grab.id);
      }
      const rotation = computeGrabRotationFromPlayer(grab.type);
      // grabRef.current = grab;
      // 使用 ref 获取触发抓取的玩家ID
      const grabbingPlayer = grabbingPlayerRef.current;
      if (!grabbingPlayer) return;
      grabItem(grabbingPlayer, {
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
          // isCook: isCookType,
          // isCut: isCutType,
        });
      }
      const temp =
        playerHighlightedFurniture &&
        getGrabOnFurniture(playerHighlightedFurniture.id, true);
      if (temp) {
        setGrabOnFurniture(playerHighlightedFurniture.id, temp);
        removeGrabOnFurniture(playerHighlightedFurniture.id, true);
      } else {
        playerHighlightedFurniture
          ? removeGrabOnFurniture(playerHighlightedFurniture.id)
          : null;
      }
    }
  }, [isGrab]);

  useEffect(() => {
    const lightFurni = highlightedFurnitureRef.current;
    if (
      lightFurni &&
      lightFurni.type === EFurnitureType.washSink &&
      dirtyPlateArr.length
    ) {
      toggleTimer(lightFurni.id);
    }
  }, [isIngredientEvent]);

  const panCookingId = useMemo(() => {
    if (!highlightedFurniture) return false;
    if (highlightedFurniture.type === EFurnitureType.gasStove) {
      const id = getGrabOnFurniture(highlightedFurniture.id);
      if (!id) return false;
      if (getObstacleInfo(id)?.foodModel) {
        return id;
      }
      return false;
    }
  }, [highlightedFurniture, getGrabOnFurniture, getObstacleInfo]);

  useEffect(() => {
    if (!highlightedFurniture) {
      // 如果高亮的家具和当前高亮的家具相同，则不需要更新
      return;
    }

    const grabId = getGrabOnFurniture(highlightedFurniture.id);
    if (!grabId) return;

    if (
      !grabId ||
      handleIngredients.find((item) => item.id === grabId)?.status === 5
    ) {
      // 已经煎好则不再煎
      return;
    }
    if (!getObstacleInfo(grabId || "")?.foodModel) {
      return;
    }
    if (highlightedFurniture.type === EFurnitureType.gasStove && panCookingId) {
      toggleTimer(grabId);
    } else {
      toggleTimer(grabId);
    }

    // setIsSprinting(value);
  }, [isIngredientEvent, panCookingId]);

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

  // register completion listeners: when an ingredient reaches status 5,
  // find the furniture at that position and update the pan's foodModel
  const replaceModelRef = useRef<Map<string, string>>(new Map());

  const completeUnsubRef = useRef<Map<string, () => void>>(new Map());
  useEffect(() => {
    // subscribe to all current ingredients
    handleIngredients.forEach((h) => {
      if (completeUnsubRef.current.has(h.id)) return;
      const unsub = addCompleteListener(h.id, (detail) => {
        // const [xs, zs] = detail.id.split("_");
        // const x = parseFloat(xs);
        // const z = parseFloat(zs);
        // const { model: id } =
        //   findObstacleByPosition<string>(grabOnFurniture, x, z) || {};
        const obstacle = getObstacleInfo(detail.id || "");
        if (!obstacle) return;
        let model;
        const info: Partial<ObstacleInfo> = {};
        const foodModel = obstacle.foodModel as BaseFoodModelType;
        let type = "";
        if (detail.type === EHandleIngredient.cutting) {
          info.isCut = true;
          switch (foodModel.type) {
            case EFoodType.cheese:
              type = "cheeseCut";

              break;
            case EFoodType.tomato:
              type = "tomatoCut";

              break;
            case EFoodType.meatPatty:
              type = "rawMeatPie";

              break;
          }
        } else {
          info.isCook = true;
          info.isCut = true;
          switch (foodModel.type) {
            case EFoodType.meatPatty:
              type = "meatPie";

              break;
          }
        }
        model = type ? grabModels[type].clone() : undefined;
        if (model) {
          const newId = getId(ERigidBodyType.grab, foodModel.type, model.uuid);
          modelMapRef.current?.set(newId, model);
          modelMapRef.current?.delete(foodModel.id);
          info.foodModel = { id: newId, type: foodModel.type };

          updateObstacleInfo(obstacle.id, info);
          replaceModelRef.current.set(obstacle.id, type);
        }
      });
      completeUnsubRef.current.set(h.id, unsub);
    });

    return () => {
      // unsubscribe all
      completeUnsubRef.current.forEach((unsub) => unsub && unsub());
      completeUnsubRef.current.clear();
    };
  }, [
    handleIngredients.map((i) => i.id).join(","),
    grabOnFurniture,
    getObstacleInfo,
    furnitureObstacles,
  ]);

  useEffect(() => {
    console.log("grabOnFurniture changed, current state:", grabOnFurniture);
  }, [grabOnFurniture]);

  // const heldItemRef = useRef(heldItem);
  // useEffect(() => {
  //   heldItemRef.current = heldItem;
  // }, [heldItem]);

  useEffect(() => {
    // setGrabPositions(GRAB_ARR);

    const unsubscribeFirstPlayerIngredient = subscribeKeys(
      (state) => state.firstPHandleIngredient,
      (pressed) => {
        if (pressed) {
          const heldItem = grabSystemApi.getHeldItem("firstPlayer");
          if (heldItem === null) {
            setIsIngredient("firstPlayer", (s) => !s);
          }
        }
      },
    );

    const unsubscribeSecondPlayerIngredient = subscribeKeys(
      (state) => state.secondPHandleIngredient,
      (pressed) => {
        if (pressed) {
          const heldItem = grabSystemApi.getHeldItem("secondPlayer");
          if (heldItem === null) {
            setIsIngredient("secondPlayer", (s) => !s);
          }
        }
      },
    );

    const unsubscribeFirstPlayerGrab = subscribeKeys(
      (state) => state.firstPGrab,
      (pressed) => {
        if (pressed) {
          setIsGrab("firstPlayer", (s) => !s);
        }
      },
    );

    const unsubscribeSecondPlayerGrab = subscribeKeys(
      (state) => state.secondPGrab,
      (pressed) => {
        if (pressed) {
          setIsGrab("secondPlayer", (s) => !s);
        }
      },
    );

    return () => {
      obstacles.forEach((food) => {
        unregisterObstacle(food.id);
      });
      cleanupTimers();
      unsubscribeFirstPlayerIngredient();
      unsubscribeSecondPlayerIngredient();
      unsubscribeFirstPlayerGrab();
      unsubscribeSecondPlayerGrab();
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
            const grabbingPlayer = grabbingPlayerRef.current;
            if (!grabbingPlayer) return;
            grabItem(grabbingPlayer, {
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
        const grabbingPlayer = grabbingPlayerRef.current;
        if (!grabbingPlayer) return;
        grabItem(grabbingPlayer, {
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

  // 清理不再存在的缓存 clone，避免内存泄漏
  useEffect(() => {
    const ids = new Set(Array.from(obstacles.keys()));
    modelNoKnifeCache.current.forEach((_, key) => {
      const id = key.replace(/_noKnife$/, "");
      if (!ids.has(id)) {
        modelNoKnifeCache.current.delete(key);
      }
    });
  }, [obstacles.size]);

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
      // compliteAssembBurgers();
    }
  }, [registryFurniture, isFoodReady]);

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
    const length = GRAB_ARR.filter((item) => item.visible !== false).length;
    if (
      isFoodReady === false &&
      obstacles.size === length &&
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
        // 使用 ref 获取触发抓取的玩家ID
        const grabbingPlayer = grabbingPlayerRef.current || "firstPlayer";
        playerRefs.current[grabbingPlayer]?.getWorldQuaternion(
          playerQuaternion,
        );
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
  const heldItemIds = useMemo(() => {
    console.log("heldItemsMap changed:", heldItemsMap);
    return Array.from(heldItemsMap.values()).map((item) => item.id);
  }, [heldItemsMap]);

  const tempId = useMemo(() => {
    return (
      highlightedFurniture && getGrabOnFurniture(highlightedFurniture.id, true)
    );
  }, [getGrabOnFurniture, highlightedFurniture]);

  const renderFood = useMemo(() => {
    return Array.from(obstacles.values()).map((food) => {
      const hamIsHolding = heldItemIds.includes(food.id);
      let model = modelMapRef.current?.get(food.id);

      if (!model) {
        return null;
      }

      // 如果是带 foodModel 的切菜板，使用缓存的 clone（knife 隐藏），避免每帧重复 clone/traverse
      let modelToUse: THREE.Group | null = model;

      if (
        tempId === food.id ||
        (food.type === EGrabType.cuttingBoard && food.foodModel && model)
      ) {
        const cacheKey = `${food.id}_noKnife`;
        let cached = modelNoKnifeCache.current.get(cacheKey);
        if (!cached) {
          cached = grabModels[food.type].clone(true);
          const obj = cached.getObjectByName("knife") as THREE.Mesh;
          if (obj) {
            obj.visible = false;
          }
          modelNoKnifeCache.current.set(cacheKey, cached);
        }
        modelToUse = cached;
      }

      const baseFoodModel = food.foodModel
        ? modelMapRef.current?.get(food.foodModel.id)
        : undefined;
      // food.foodModel && !isMultiFoodModelType(food.foodModel)
      //   ? modelMapRef.current?.get(food.foodModel.id)
      //   : undefined;
      // if (food.type === EGrabType.cuttingBoard && food.foodModel && model) {
      //   model = grabModels[food.type].clone();
      //   const obj = model.getObjectByName("knife");
      //   if (obj) {
      //     obj.visible = false;
      //   }
      // }
      const isHighlighted = realHighLightIds.includes(food.id);
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
          model={modelToUse}
          baseFoodModel={baseFoodModel}
          // area={food.area}
          isHighlighted={isHighlighted}
          // handleIngredientId={handleIngredient?.status}
          initPos={food.position}
          visible={food.visible}
          foodModel={food.foodModel}
          // handleIngredient={handleIngredient}
          rotation={rotation}
          onMount={handleHamburgerMount(food.id)}
          onUnmount={handleHamburgerUnmount(food.id)}
        />
      );
    });
  }, [
    obstaclesChange,
    heldItemIds,
    realHighLightIds,
    // grabRef.current,
    // isHolding,
    // highlightStates,
    handleHamburgerMount,
    handleHamburgerUnmount,
  ]);
  console.log("GrabbableWrapper render");
  return <>{renderFood}</>;
}

export const MemoizedGrabbaleWrapper = React.memo(GrabbaleWrapper);

export default MemoizedGrabbaleWrapper;
