// components/PlayerWithItem.jsx
// import { useGrabSystem } from "@/hooks/useGrabSystem";
// import usePlayerTransform from "@/hooks/usePlayerTransform";
import {
  getObstacleInfo as getFurnitureObstacleInfo,
  IFurniturePosition,
} from "@/stores/useFurnitureObstacle";
import {
  getGrabOnFurniture,
  ObstacleInfo,
  registerObstacle,
  removePendingGrabId,
  setGrabOnFurniture,
  setRegistry,
  unregisterObstacle,
  updateObstacleInfo,
  useGrabHeldItem,
  useGrabObstaclesMap,
  useGrabOnFurniture,
  useGrabPendingIds,
  useRealHighlight,
} from "@/stores/useGrabObstacle";
import { EFoodType, EGrabType, IFoodWithRef, TPLayerId } from "@/types/level";

// import { registerObstacle, unregisterObstacle } from "@/utils/obstacleRegistry";
import { GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import { ModelResourceContext } from "@/context/ModelResourceContext";
import Hamberger from "@/hamberger";

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
} from "@/utils/util";
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
  const { modelMapRef, toolPosRef, handleIngredientsApi } =
    useContext(GrabContext);

  const registryFurniture = useRegistryFurniture();
  const pendingGrab = useGrabPendingIds();
  const furnitureObstacles = useFurnitureObstacle();

  const furniturelightId = useHighlightId();

  useEffect(() => {
    return () => {
      obstacles.forEach((food) => {
        unregisterObstacle(food.id);
      });
      cleanupTimers();
    };
  }, []);
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
  const { addIngredient, stopTimer, getTimer, cleanupTimers } =
    handleIngredientsApi;
  const unmountHandlers = useRef(new Map<string, () => void>());

  const obstacles = useGrabObstaclesMap();
  // 获取两个玩家的高亮物品 - 用于视觉显示（任一玩家高亮都显示）
  const heldItemRecord = useGrabHeldItem();
  // 保存上一次的 heldItemRecord，用于判断是哪个玩家放下了物品
  const prevHeldItemRecordRef = useRef<Record<TPLayerId, string>>({
    firstPlayer: "",
    secondPlayer: "",
  });

  const grabOnFurniture = useGrabOnFurniture();

  const firstHighlight = useRealHighlight("firstPlayer");
  const secondHighlight = useRealHighlight("secondPlayer");
  const highlightedFurnitureRef = useRef<IFurniturePosition | false>(false);

  const [isFoodReady, setIsFoodReady] = useState(false);
  const { compliteAssembBurgers } = createTextData();

  const realHighLightIds = useMemo(() => {
    const arr: string[] = [];
    if (firstHighlight) {
      arr.push(firstHighlight.id);
    }
    if (secondHighlight) {
      arr.push(secondHighlight.id);
    }

    return arr;
  }, [firstHighlight, secondHighlight]);

  // const realHighLight = useCallback(() => {
  //   if (grabbingPlayerRef.current === "firstPlayer") {
  //     return firstHighlight;
  //   } else if (grabbingPlayerRef.current === "secondPlayer") {
  //     return secondHighlight;
  //   }
  //   return false;
  // }, [grabbingPlayerRef.current, firstHighlight, secondHighlight]);

  // 获取指定玩家的高亮家具

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

  // 更新 prevHeldItemRecordRef，用于在 onSpawn 中判断是哪个玩家放下的物品
  useEffect(() => {
    prevHeldItemRecordRef.current = heldItemRecord;
  }, [heldItemRecord]);

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

  useEffect(() => {
    console.log("grabOnFurniture changed, current state:", grabOnFurniture);
  }, [grabOnFurniture]);

  // const heldItemRef = useRef(heldItem);
  // useEffect(() => {
  //   heldItemRef.current = heldItem;
  // }, [heldItem]);

  useEffect(() => {
    obstacles.forEach((food) => {
      if (!mountHandlers.current.has(food.id)) {
        mountHandlers.current.set(food.id, (rigidBody) => {
          if (!rigidBody) {
            return;
          }

          rigidBodyMapRef.current.set(food.id, rigidBody);
          Object.entries(pendingGrab).forEach(([playerId, arr]) => {
            if (arr.includes(food.id) && modelMapRef.current?.has(food.id)) {
              removePendingGrabId(playerId as TPLayerId, food.id);
            }
          });
        });
      }
      // If the Hamberger already mounted and provided a rigidBody earlier,
      Object.entries(pendingGrab).forEach(([playerId, arr]) => {
        if (arr.includes(food.id) && modelMapRef.current?.has(food.id)) {
          removePendingGrabId(playerId as TPLayerId, food.id);
        }
      });
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
        // 通过比较前后状态找出是哪个玩家放下的
        let grabbingPlayer: TPLayerId = "firstPlayer";
        for (const playerId of Object.keys(
          prevHeldItemRecordRef.current,
        ) as TPLayerId[]) {
          if (
            prevHeldItemRecordRef.current[playerId] === id &&
            heldItemRecord[playerId] !== id
          ) {
            grabbingPlayer = playerId;
            break;
          }
        }
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
    [heldItemRecord],
  );
  const heldItemIds = useMemo(() => {
    console.log("heldItemRecord changed:", heldItemRecord);
    return Object.values(heldItemRecord);
  }, [heldItemRecord]);

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
