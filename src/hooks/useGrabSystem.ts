import { GrabbedItem } from "@/types/level";
import { useRef, useState } from "react";
import * as THREE from "three";

export function useGrabSystem() {
  const [heldItem, setHeldItem] = useState<GrabbedItem | null>(null);
  const grabPositionRef = useRef(new THREE.Vector3(0.3, 0.8, 0.5));

  const grabItem = (
    itemRef: React.RefObject<THREE.Group>,
    customPosition?: THREE.Vector3
  ) => {
    if (heldItem) {
      console.warn("Already holding an item");
      return;
    }
    console.log("grabItem ref:", itemRef, "current:", itemRef?.current);
    console.log("heldItem before:", heldItem);
    setHeldItem({
      ref: itemRef,
      offset: customPosition || grabPositionRef.current.clone(),
    });
  };

  const releaseItem = () => {
    if (heldItem) {
      console.log("Released item:", heldItem.ref.current);
      setHeldItem(null);
    }
  };

  const updateGrabPosition = (position: THREE.Vector3) => {
    grabPositionRef.current.copy(position);
    if (heldItem) {
      setHeldItem((prev) => ({
        ...prev!,
        offset: position.clone(),
      }));
    }
  };

  return {
    heldItem,
    grabItem,
    releaseItem,
    updateGrabPosition,
    isHolding: !!heldItem,
  };
}
