// components/PlayerWithItem.jsx
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "@/stores/useFurnitureObstacle";
import {
  ObstacleInfo,
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
} from "@/types/level";
// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import { ModelResourceContext } from "@/context/ModelResourceContext";
import Hamberger from "@/hamberger";
import useBurgerAssembly from "@/hooks/useBurgerAssembly";

import {
  useObstaclesMap as useFurnitureObstacle,
  useHighlightId,
  useRegistryFurniture,
} from "@/stores/useFurnitureObstacle";
import { EHandleIngredient } from "@/types/public";
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
    handleIngredientsApi,
    pendingGrabIdRef,
    clickGrab: { isGrab, setIsGrab },
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
  const rigidBodyMapRef = useRef<Map<string, RapierRigidBody | null>>(
    new Map(),
  );
  // ingredient management moved to hook
  const {
    handleIngredients,
    addIngredient,
    setHandleIngredients,
    toggleTimer,
    setIngredientStatus,
    stopTimer,
    getTimer,
    addCompleteListener,
    removeAllCompleteListeners,
    handleIngredientsRef,
    cleanupTimers,
  } = handleIngredientsApi;
  const unmountHandlers = useRef(new Map<string, () => void>());
  const initialPosition: [number, number, number] = [0, 0, 0];
  const [subscribeKeys, getKeys] = useKeyboardControls();

  const registerObstacle = useGrabObstacleStore((s) => s.registerObstacle);
  const unregisterObstacle = useGrabObstacleStore((s) => s.unregisterObstacle);
  const getObstacleInfo = useGrabObstacleStore((s) => s.getObstacleInfo);
  const obstacles = useGrabObstaclesMap();
  const realHighLight = useRealHighlight();
  const setRegistry = useGrabObstacleStore((s) => s.setRegistry);
  const removeGrabOnFurniture = useGrabObstacleStore(
    (s) => s.removeGrabOnFurniture,
  );
  const getGrabOnFurniture = useGrabObstacleStore((s) => s.getGrabOnFurniture);
  const setGrabOnFurniture = useGrabObstacleStore((s) => s.setGrabOnFurniture);
  const updateObstacleInfo = useGrabObstacleStore((s) => s.updateObstacleInfo);
  const grabOnFurniture = useGrabOnFurniture();

  const { heldItem, grabItem, isHolding } = grabSystemApi;
  const highlightedFurnitureRef = useRef<IFurniturePosition | false>(false);
  const [isFoodReady, setIsFoodReady] = useState(false);
  const highlightedFurniture = useMemo(() => {
    if (furniturelightId) {
      return getFurnitureObstacleInfo(furniturelightId) || false;
    }
    return false;
  }, [furniturelightId]);

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
  const { createNewFood } = useBurgerAssembly();
  const modelNoKnifeCache = useRef<Map<string, THREE.Group>>(new Map());

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
        createIngredientItem(food);
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
      // 切菜必须人守着切，否则停止切菜
      const id = getGrabOnFurniture(lightFurni.id);
      const time = getTimer(id || "");
      if (
        id?.includes(EGrabType.cuttingBoard) &&
        time &&
        typeof highlightedFurniture !== "boolean" &&
        lightFurni.id !== highlightedFurniture.id
      ) {
        stopTimer(id);
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
        tableObstacleId || (realHighLight ? realHighLight.id : ""),
      );

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

        const newFood = createNewFood(
          grab.foodModel.type as EFoodType,
          model,
          "newFood",
          "hand",
        )!;

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
          // isCook: isCookType,
          // isCut: isCutType,
        });
      }
      const temp =
        highlightedFurniture &&
        getGrabOnFurniture(highlightedFurniture.id, true);
      if (temp) {
        setGrabOnFurniture(highlightedFurniture.id, temp);
        removeGrabOnFurniture(highlightedFurniture.id, true);
      } else {
        highlightedFurniture
          ? removeGrabOnFurniture(highlightedFurniture.id)
          : null;
      }
    }
  }, [isGrab]);

  useEffect(() => {
    const lightFurni = highlightedFurnitureRef.current;
    if (!lightFurni) {
      // 如果高亮的家具和当前高亮的家具相同，则不需要更新
      return;
    }

    const grabId = getGrabOnFurniture(lightFurni.id);
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

    // toggle timer (start if not running, stop if running)
    toggleTimer(grabId);

    // setIsSprinting(value);
  }, [isIngredientEvent]);

  // useEffect(() => {
  //   const isCutting = handleIngredients.some((i) => i.status !== false);
  //   console.log("handleIngredients changed:", handleIngredients);
  //   updateIsCutting?.(isCutting);
  // }, [handleIngredients]);

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
      cleanupTimers();
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
          updateObstacleInfo(food.id, { area: "table" });
          setGrabOnFurniture(furniture.key, food.id);
        }
      });
    }
  }, [registryFurniture, isFoodReady]);

  useEffect(() => {
    obstacles.forEach((food) => {
      const isHighlighted =
        !isHolding && realHighLight && realHighLight.id === food.id;
      setHighlightStates((prev) => ({
        ...prev,
        [food.id]: isHighlighted,
      }));
    });
    console.log("highlightStates updated:", obstacles);
  }, [isHolding, realHighLight, obstacles.size]);

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
  const tempId = useMemo(() => {
    return (
      highlightedFurniture && getGrabOnFurniture(highlightedFurniture.id, true)
    );
  }, [getGrabOnFurniture, highlightedFurniture]);
  const renderFood = useMemo(() => {
    return Array.from(obstacles.values()).map((food) => {
      const handleIngredient =
        food?.type === EGrabType.pan || food?.type === EGrabType.cuttingBoard
          ? handleIngredients.find((ingredient) => ingredient.id === food.id)
          : undefined;
      console.log("Rendering food item:", handleIngredient);
      const hamIsHolding = heldItem?.id
        ? // ? grabRef.current?.id === heldItem?.id
          food.id === heldItem?.id
        : // : food.id === grabRef.current?.id
          false;

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
      const isHighlighted =
        realHighLight && food.area === "floor"
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
          model={modelToUse}
          baseFoodModel={baseFoodModel}
          area={food.area}
          isHighlighted={isHighlighted}
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
    // realHighLight,
    // highlightStates,
    handleHamburgerMount,
    handleHamburgerUnmount,
  ]);
  console.log("GrabbableWrapper render");
  return <>{renderFood}</>;
}

export const MemoizedGrabbaleWrapper = React.memo(GrabbaleWrapper);

export default MemoizedGrabbaleWrapper;
