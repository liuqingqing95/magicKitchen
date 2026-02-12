import { GrabContext } from "@/context/GrabContext";
import {
  BaseFoodModelType,
  EFoodType,
  EFurnitureType,
  EGrabType,
  ERigidBodyType,
  GrabbedItem,
  IFoodWithRef,
  TPLayerId,
} from "@/types/level";

import { GRAB_ARR } from "@/constant/data";
import ModelResourceContext from "@/context/ModelResourceContext";
import {
  IFurniturePosition,
  useObstaclesMap as useFurnitureObstacle,
  useFurnitureObstacleStore,
  useHighlightId,
} from "@/stores/useFurnitureObstacle";
import useGrabObstacleStore, {
  ObstacleInfo,
  useGetCleanPlates,
  useGrabOnFurniture,
  useGrabPendingIds,
  useRealHighlight,
} from "@/stores/useGrabObstacle";
import { EHandleIngredient } from "@/types/public";
import {
  computeGrabRotationFromPlayer,
  createFoodItem,
  getId,
} from "@/utils/util";
import { Collider as RapierCollider } from "@dimforge/rapier3d-compat";
import { useKeyboardControls } from "@react-three/drei";
import { RapierRigidBody } from "@react-three/rapier";
import { difference, isEqual } from "lodash";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { createNewFood } from "./useBurgerAssembly";

type GrabbedColliderState = {
  collider: RapierCollider;
  prevSensor: boolean;
};
interface IGrabItemProps {
  food: IFoodWithRef;
  model: THREE.Group<THREE.Object3DEventMap> | null;
  baseFoodModel: THREE.Group<THREE.Object3DEventMap> | null;
  clone?: boolean;
  customRotation?: [number, number, number];
}

const disableColliders = (rigidBody: RapierRigidBody) => {
  const states: GrabbedColliderState[] = [];
  const count = rigidBody?.numColliders() || 0;
  for (let i = 0; i < count; i += 1) {
    const collider = rigidBody.collider(i);
    if (!collider) {
      continue;
    }
    states.push({
      collider,
      prevSensor: collider.isSensor(),
    });
    collider.setSensor(true);
  }
  return states;
};

const restoreColliders = (states: GrabbedColliderState[] | null) => {
  if (!states) {
    return;
  }
  states.forEach((state) => {
    state.collider.setSensor(state.prevSensor);
  });
};
export const getOffset = (foodType: EFoodType | EGrabType, posY: number) => {
  let offsetZ = 1.4;
  switch (foodType) {
    case EGrabType.plate:
    case EGrabType.fireExtinguisher:
      offsetZ = 1.5;
      break;
    case EFoodType.tomato:
      offsetZ = 1.3;
      break;
    case EGrabType.pan:
      offsetZ = 1.4;
      break;
    case EFoodType.burger:
    case EFoodType.cheese:

    case EFoodType.meatPatty:
      offsetZ = 1.2;
      break;
    default:
      offsetZ = 1.4;
  }
  return [0, posY || 0, offsetZ] as [number, number, number]; //new THREE.Vector3(0, posY || 0, offsetZ);
};
export function useGrabSystem(playerId: TPLayerId) {
  const [heldItem, setHeldItem] = useState<GrabbedItem | null>(null);
  const { grabModels } = useContext(ModelResourceContext);
  const furniturelightId = useHighlightId();
  const { modelMapRef, handleIngredientsApi } = useContext(GrabContext);
  const furnitureObstacles = useFurnitureObstacle();
  const [isGrab, setIsGrab] = useState<boolean>(false);
  const isHolding = !!heldItem;
  const {
    handleIngredients,
    setIngredientStatus,
    stopTimer,
    addCompleteListener,
  } = handleIngredientsApi;
  const [subscribeKeys] = useKeyboardControls();
  const cleanPlates = useGetCleanPlates();
  const { getFurnitureObstacleInfo } = useFurnitureObstacleStore((s) => {
    return {
      getFurnitureObstacleInfo: s.getObstacleInfo,
    };
  });
  const setObstacleHeldItem = useGrabObstacleStore((s) => s.setHeldItem);
  const pendingGrabIds = useGrabPendingIds();
  const setGrabOnFurniture = useGrabObstacleStore((s) => s.setGrabOnFurniture);
  const setPendingGrabId = useGrabObstacleStore((s) => s.setPendingGrabId);
  const updateObstacleInfo = useGrabObstacleStore((s) => s.updateObstacleInfo);
  const grabOnFurniture = useGrabOnFurniture();
  const realHighlight = useRealHighlight(playerId);
  const getGrabOnFurniture = useGrabObstacleStore((s) => s.getGrabOnFurniture);
  const setOpenFoodTable = useFurnitureObstacleStore((s) => s.setOpenFoodTable);
  const registerObstacle = useGrabObstacleStore((s) => s.registerObstacle);
  const getObstacleInfo = useGrabObstacleStore((s) => s.getObstacleInfo);
  const removeGrabOnFurniture = useGrabObstacleStore(
    (s) => s.removeGrabOnFurniture,
  );
  const removeCleanPlate = useGrabObstacleStore((s) => s.removeCleanPlate);
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
  // const grabbedCollidersRef = useRef<GrabbedColliderState[] | null>(null);

  // const unsubscribeRef = useRef<(() => void) | null>(null);

  // unsubscribeRef.current = useObstacleStore.subscribe(
  //   (state) => state.obstacles.get(heldItem?.ref.current?.id || ""),
  //   (obstacle) => {
  //     if (rigidBody && obstacle && obstacle.position) {
  //       rigidBody.setTranslation(
  //         {
  //           x: obstacle.position[0],
  //           y: obstacle.position[1],
  //           z: obstacle.position[2],
  //         },
  //         true
  //       );
  //       const grab = obstacle as IGrabPosition;
  //       if (grab.rotation) {
  //         rigidBody.setRotation(
  //           {
  //             x: grab.rotation[0],
  //             y: grab.rotation[1],
  //             z: grab.rotation[2],
  //             w: grab.rotation[3],
  //           },
  //           true
  //         );
  //       }
  //     }
  //   }
  // );

  const grabItem = useCallback(
    ({
      food,
      model,
      baseFoodModel,
      customRotation,
      clone = true,
    }: IGrabItemProps) => {
      // if (heldItem) {
      //   console.warn("Already holding an item");
      //   return;
      // }
      console.log(model, "ddd");
      if (model) {
        // model.rotation.set(0, 0, 0);
        // rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        // rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        // grabbedCollidersRef.current = disableColliders(rigidBody);
      }
      if (baseFoodModel) {
        baseFoodModel.rotation.set(0, 0, 0);
      }
      console.log("heldItem before:", heldItem);

      // Ensure the held item state and its cloned models are applied synchronously
      // so the hand-mounted model is available the same frame the world instance
      // is hidden. This avoids a one-frame flash where neither is visible.
      const modelTemp = model ? model.clone() : null;
      const baseFoodModelTemp = baseFoodModel ? baseFoodModel.clone() : null;
      const obj: GrabbedItem = {
        id: food.id,
        hand: food,
        // foodModelId: food.foodModel?.id,
        model: modelTemp,
        baseFoodModel: baseFoodModelTemp || null,
        offset: getOffset(food.type, food.grabbingPosition?.inHand || 0),
        rotation: customRotation,
      };
      setObstacleHeldItem(playerId, obj.id);

      setHeldItem(obj);
    },
    [playerId],
  );

  const releaseItem = useCallback(() => {
    setObstacleHeldItem(playerId, "");
    setHeldItem(null);
  }, [playerId]);

  const keyNames = useMemo(() => {
    const keyPrefix = playerId === "firstPlayer" ? "firstP" : "secondP";
    return {
      grab: `${keyPrefix}Grab` as const,
    };
  }, [playerId]);

  const beforePendingGrabId = useRef<string[]>([]);

  const currentPendingGrabId = useMemo(() => {
    return pendingGrabIds[playerId] || [];
  }, [pendingGrabIds, playerId]);

  useEffect(() => {
    const arr = difference(beforePendingGrabId.current, currentPendingGrabId);
    if (arr.length > 0) {
      arr.forEach((id) => {
        const food = getObstacleInfo(id);

        if (food) {
          const model = modelMapRef.current?.get(food.id);
          const foodModel = modelMapRef.current?.get(food.foodModel?.id || "");
          const rotation = computeGrabRotationFromPlayer(food.type);

          grabItem({
            food,
            model: model || null,
            baseFoodModel: foodModel || null,
            customRotation: [0, rotation, 0],
            clone: true,
          });
        }
      });
    }
    if (!isEqual(beforePendingGrabId.current, currentPendingGrabId)) {
      beforePendingGrabId.current = [...currentPendingGrabId];
    }
  }, [currentPendingGrabId, playerId]);

  useEffect(() => {
    const unsubscribeGrab = subscribeKeys(
      (state) => state[keyNames.grab],
      (pressed) => {
        if (pressed) {
          setIsGrab((s) => !s);
        }
      },
    );

    return () => {
      unsubscribeGrab();
    };
  }, [keyNames.grab]);
  const getLightedFurnitureForPlayer = useCallback(():
    | IFurniturePosition
    | false => {
    if (!playerId) return false;
    const highlightId = furniturelightId[playerId];
    if (highlightId) {
      return getFurnitureObstacleInfo(highlightId) || false;
    }
    return false;
  }, [furniturelightId, getFurnitureObstacleInfo]);
  useEffect(() => {
    if (!heldItem) {
      const playerHighlightedFurniture = getLightedFurnitureForPlayer();

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
            area: "hand",
          })!;
          setPendingGrabId(playerId, newFood.id);
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

          setPendingGrabId(playerId, newFood.id);
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
      const info = realHighlight || false;
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
          area: "hand",
        })!;
        registerObstacle(newFood.id, {
          ...newFood,
          visible: false,
          isCut: handleIngredient ? handleIngredient.status === 5 : undefined,
          position: grab.position,
        });
        setPendingGrabId(playerId, newFood.id);
        setIngredientStatus(grab.id, false);
        updateObstacleInfo(grab.id, { foodModel: undefined, isCut: false });
        modelMapRef.current?.delete(grab.foodModel.id);
        return;
      } else if (grab.type == EGrabType.pan) {
        stopTimer(grab.id);
      }

      const rotation = computeGrabRotationFromPlayer(grab.type);
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

  return useMemo(
    () => ({
      heldItem,
      grabItem,
      releaseItem,
      holdStatus: () => !!heldItem,
      isHolding,
      isGrab,
    }),
    [heldItem, isGrab, grabItem, releaseItem],
  );
}
