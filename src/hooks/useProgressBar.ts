import { GrabContext } from "@/context/GrabContext";
import {
  useFurnitureObstacleStore,
  useHighlightId,
} from "@/stores/useFurnitureObstacle";
import useGrabObstacleStore, {
  useGetDirtyPlates,
  useGrabHeldItem,
} from "@/stores/useGrabObstacle";
import { EFurnitureType, TPLayerId } from "@/types/level";
import { useKeyboardControls } from "@react-three/drei";
import { useContext, useEffect, useMemo, useState } from "react";

export default function useProgressBar(playerId: TPLayerId) {
  const { handleIngredientsApi } = useContext(GrabContext);

  const [isIngredient, setIsIngredient] = useState<Record<TPLayerId, boolean>>({
    firstPlayer: false,
    secondPlayer: false,
  });
  const { handleIngredients, toggleTimer } = handleIngredientsApi;
  const dirtyPlateArr = useGetDirtyPlates();
  const getGrabOnFurniture = useGrabObstacleStore((s) => s.getGrabOnFurniture);
  const [subscribeKeys] = useKeyboardControls();

  const getObstacleInfo = useGrabObstacleStore((s) => s.getObstacleInfo);
  const { getFurnitureObstacleInfo } = useFurnitureObstacleStore((s) => {
    return {
      getFurnitureObstacleInfo: s.getObstacleInfo,
      // registryFurniture: s.registryFurniture,
      // furniturelightId: s.highlightId,
    };
  });

  const keyNames = useMemo(() => {
    const keyPrefix = playerId === "firstPlayer" ? "firstP" : "secondP";
    return {
      ingredient: `${keyPrefix}HandleIngredient` as const,
    };
  }, [playerId]);

  const furniturelightId = useHighlightId();
  const heldItem = useGrabHeldItem()[playerId];
  useEffect(() => {
    const unsubscribeIngredient = subscribeKeys(
      (state) => state[keyNames.ingredient],
      (pressed) => {
        if (pressed) {
          if (!heldItem) {
            setIsIngredient((s) => ({ ...s, [playerId]: !s[playerId] }));
          }
        }
      },
    );
    return () => {
      unsubscribeIngredient();
    };
  }, [keyNames.ingredient, heldItem, playerId]);
  useEffect(() => {
    if (
      highlightedFurniture &&
      highlightedFurniture.type === EFurnitureType.washSink &&
      dirtyPlateArr.length
    ) {
      toggleTimer(highlightedFurniture.id);
    }
  }, [isIngredient[playerId]]);

  const highlightedFurniture = useMemo(() => {
    const highlightId = furniturelightId[playerId];
    if (highlightId) {
      return getFurnitureObstacleInfo(highlightId as string) || false;
    }
    return false;
  }, [furniturelightId, getFurnitureObstacleInfo, playerId]);

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
  }, [isIngredient[playerId], panCookingId]);

  return {
    isIngredient,
  };
}
