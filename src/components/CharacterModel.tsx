import { useAnimations } from "@react-three/drei";
import React, { useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import ModelResourceContext from "../context/ModelResourceContext";
import { getObstacleInfo } from "../stores/useGrabObstacle";
import { EGrabType, TPLayerId, GrabbedItem } from "../types/level";

interface Props {
  playerId: TPLayerId;
  playerRef: React.RefObject<THREE.Group>;
  scale?: number;
  heldItemId?: string | undefined;
  heldItemRef?: React.RefObject<GrabbedItem | null>;
  isCutting?: boolean;
}
const position:[number, number, number] = [0, 0, 0];
function CharacterModel({
  playerId,
  playerRef,
  scale = 1,
  heldItemId,
  isCutting,
}: Props) {
  const { grabModels, modelAnimations, notifyReady } = useContext(
    ModelResourceContext,
  );

  const [characterModel, setCharacterModel] = useState<THREE.Group | null>(
    null,
  );

    // const commitCountRef = useRef(0);
    // useEffect(() => {
    //   commitCountRef.current += 1;
    //   // eslint-disable-next-line no-console
    //   console.log(`Player(${playerId}) commit #${commitCountRef.current}`);
    //   return () => {
    //     // optional: track unmounts if needed
    //     // eslint-disable-next-line no-console
    //     // console.log(`Player(${playerId}) unmount`);
    //   };
    // });
  useEffect(() => {
    if (playerId === "firstPlayer" && grabModels.player && !characterModel) {
      setCharacterModel(grabModels.player);
      notifyReady("player");
    }
  }, [grabModels.player, characterModel, notifyReady, playerId]);

  useEffect(() => {
    if (playerId === "secondPlayer" && grabModels.player2 && !characterModel) {
      setCharacterModel(grabModels.player2);
      notifyReady("player2");
    }
  }, [grabModels.player2, characterModel, notifyReady, playerId]);

  const { actions } = useAnimations(
    playerId === "firstPlayer"
      ? modelAnimations?.player || []
      : modelAnimations?.player2 || [],
    playerRef,
  );

  useEffect(() => {
    if (!Object.values(actions).length) {return;}

    const grabAction = actions["grabPlate"] || actions["grabFood"];
    const handDownAction = actions["handDownPlate"] || actions["handDownFood"];
    if (!grabAction || !handDownAction) {return;}

    [grabAction, handDownAction].forEach((action) => {
      if (!action) {return;}
      action.reset();
      action.clampWhenFinished = true;
      action.setLoop(THREE.LoopOnce, 1);
      action.setEffectiveWeight(0);
      action.timeScale = 1;
    });

    if (!heldItemId) {
      return;
    }

    const foodType = getObstacleInfo(heldItemId)?.type;
    if (foodType === null) {
      return;
    }

    const isPlate = foodType === EGrabType.plate || foodType === EGrabType.pan;

    handDownAction.setEffectiveWeight(0);
    handDownAction.stop();
    grabAction.reset().play();
    grabAction.setEffectiveWeight(1);

    return () => {
      try {
        grabAction.setEffectiveWeight(0);
        grabAction.stop();
        handDownAction.setEffectiveWeight(0);
        handDownAction.stop();
      } catch (e) {
        // ignore
      }
    };
  }, [actions, heldItemId, isCutting, playerRef]);

  if (!characterModel) {return null;}

  return (
    <primitive position={position} object={characterModel} scale={scale} />
  );
}

const MemoizedCharacterModel = React.memo(CharacterModel);
MemoizedCharacterModel.displayName = "CharacterModel";

export default MemoizedCharacterModel;
