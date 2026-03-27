import { useGrabNear } from "@/hooks/useGrabNear";
import { setHighlightId } from "@/stores/useFurnitureObstacle";
import { getGrabOnFurniture, getObstacleInfo, setRealHighlight, useRealHighlight } from "@/stores/useGrabObstacle";
import React, { useEffect } from "react";
import { useRef } from "react";
import { TPLayerId } from "../types/level";


interface Props {
  playerPositionRef: React.RefObject<[number, number, number]>;
  playerId: TPLayerId;
  heldItemId?: string | undefined;
  highlightId?: string | false;
  hasCollided: React.MutableRefObject<Map<TPLayerId, Record<string, boolean>>>;
  isHighLightRef?: React.MutableRefObject<((id: string, light: boolean) => void) | undefined>;
}

 function GrabNearManager({
  playerPositionRef,
  playerId,
  heldItemId,
  highlightId,
  isHighLightRef,
  hasCollided,
}: Props) {
  // local refs to avoid dispatching identical values repeatedly
  const lastRealHighlightRef = useRef<string | false | undefined>(undefined);
  const lastHighlightIdRef = useRef<string | false | undefined>(undefined);
  const {
    isHighLight,
    getFurnitureNearest,
    getGrabNearest,
    highlightedGrabIds,
    furnitureNearList,
  } = useGrabNear(playerPositionRef.current || [0,0,0], playerId);
  const realHighLight = useRealHighlight(playerId);
  useEffect(() => {
    // keep external ref in sync for collision handlers
    if (isHighLightRef) {
      // assign stable wrapper to avoid identity churn
      isHighLightRef.current = isHighLight;
    }
  }, [isHighLight, isHighLightRef]);

useEffect(() => {
      if (heldItemId && realHighLight !== false) {
        const id = heldItemId;
        const playerCollisions = hasCollided.current.get(playerId);
        if (playerCollisions) {
          playerCollisions[id] = false;
        }
        // only call if different to avoid redundant store updates
        if (lastRealHighlightRef.current !== false) {
          isHighLight(id, false);
          lastRealHighlightRef.current = false;
        }
      }
    }, [heldItemId, playerId]);


  useEffect(() => {
    if (!highlightId) {
      if (!highlightedGrabIds) {
        if (lastRealHighlightRef.current !== false) {
          setRealHighlight(playerId, false);
          lastRealHighlightRef.current = false;
        }
        return;
      }
      const newGrab = getGrabNearest(heldItemId as any);
      const val = newGrab ? newGrab.id : false;
      if (lastRealHighlightRef.current !== val) {
        setRealHighlight(playerId, val);
        lastRealHighlightRef.current = val;
      }
    } else {
      const tableId = getGrabOnFurniture(highlightId as string);
      const grab = getObstacleInfo(tableId || "");
      const val = grab ? grab.id : false;
      if (lastRealHighlightRef.current !== val) {
        setRealHighlight(playerId, val);
        lastRealHighlightRef.current = val;
      }
    }
  }, [getGrabNearest, highlightedGrabIds, heldItemId, highlightId, playerId]);

  useEffect(() => {
    if (furnitureNearList.length === 0) {
      if (lastHighlightIdRef.current !== false) {
        setHighlightId(playerId, false);
        lastHighlightIdRef.current = false;
      }
      return;
    }
    const newFurniture = getFurnitureNearest();
    const val = newFurniture ? newFurniture.id : false;
    if (lastHighlightIdRef.current !== val) {
      setHighlightId(playerId, val);
      lastHighlightIdRef.current = val;
    }
  }, [playerId, getFurnitureNearest, furnitureNearList.length]);

  return null;
}

const MemoizedGrabNearManager = React.memo(GrabNearManager);
MemoizedGrabNearManager.displayName = "GrabNearManager";
export default MemoizedGrabNearManager;