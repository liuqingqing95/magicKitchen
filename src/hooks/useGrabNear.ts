import { IFurniturePosition, useObstacleStore } from "@/stores/useObstacle";

export function useGrabNear() {
  const furnitureHighlighted = useObstacleStore((s) => s.highlightedFurniture);
  const getObstacleInfo = useObstacleStore((s) => s.getObstacleInfo);
  const setHighlightedFurniture = useObstacleStore(
    (s) => s.setHighlightedFurniture
  );

  const isPositionOnFurniture = (id: string | number, isHighLight: boolean) => {
    if (!isHighLight) {
      setHighlightedFurniture(false);
      return;
    }

    const furniture = getObstacleInfo(id);
    if (!furniture) return;
    // only update if changed
    if (!furnitureHighlighted || furnitureHighlighted.id !== id) {
      setHighlightedFurniture({ ...furniture } as IFurniturePosition);
    }
  };

  return { furnitureHighlighted, isPositionOnFurniture };
}
