import { COLLISION_PRESETS } from "@/constant/collisionGroups";

import { useOpenFoodTableById } from "@/stores/useFurnitureObstacle";
import { EFurnitureType } from "@/types/level";
import { useAnimations } from "@react-three/drei";
// import { IFurniturePosition } from "@/stores/useObstacle";
import { GrabContext } from "@/context/GrabContext";
import ProgressBar from "@/ProgressBar";
import useGrabObstacleStore, {
  useGetCleanPlates,
  useGetDirtyPlates,
} from "@/stores/useGrabObstacle";
import { EHandleIngredient } from "@/types/public";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { isEqual } from "lodash";
import React, { forwardRef, useContext, useEffect, useMemo } from "react";
import * as THREE from "three";
import useHighlighted from "../hooks/useHighlighted";
import ServeDishes from "./ServeDishes";

type ItemVal = {
  type: EFurnitureType;
  model: THREE.Object3D;
  position: [number, number, number];
  rotation: [number, number, number];
};

type Props = {
  type: EFurnitureType;
  highlighted: boolean;
  val: React.MutableRefObject<ItemVal | undefined>;
  instanceKey: string;
  animations?: THREE.AnimationClip[];
  size: [number, number, number];
};
export type IRenderProps = {
  model: THREE.Object3D;
  type: EFurnitureType;
  size: [number, number, number];
  position?: [number, number, number];
};

interface IFoodTable extends IRenderProps {
  id: string | null;
  animations?: THREE.AnimationClip[];
  modelRef: React.RefObject<THREE.Group>;
}
interface IWashSink extends IRenderProps {
  modelRef: React.RefObject<THREE.Group>;
  id: string;
}
export const CreateRender = React.memo(
  forwardRef<THREE.Group | null, IRenderProps>(
    ({ model, type, size, position = [0, 0, 0] }, modelRef) => {
      const scale: [number, number, number] = [1, 1, 1];
      // let args: [number, number, number] = [scale[0], 0.51, scale[2]];
      // const position: [number, number, number] = [0, 0, 0];
      // if (type === EFurnitureType.serveDishes) {
      //   args = [2, 0.52, 1.52];
      //   position[1] = -1.5;
      // } else if (type === EFurnitureType.washSink) {
      //   args[0] = 2;
      // }
      if (!size) return;
      console.log("Rendering CreateRender:", type, model.name);
      return (
        <>
          <primitive ref={modelRef} object={model} position={[0, 0, 0]} />
          <CuboidCollider
            args={[size[0] / 2, size[1] / 2, size[2] / 2]}
            position={position}
            restitution={0.2}
            friction={1}
          />
        </>
      );
    },
  ),
);

const FoodTable = React.memo(
  ({ id, model, type, modelRef, animations, size }: IFoodTable) => {
    const { actions, mixer } = useAnimations(animations || [], modelRef);
    // 直接精确订阅当前 id 的 open 状态，避免订阅整个 api 导致高亮变化触发
    const isOpen = id ? useOpenFoodTableById(id) : undefined;
    if (type === EFurnitureType.foodTable) {
      console.log(
        "render CreateRender foodTable furniture",
        isOpen,
        id,
        model.uuid,
      );
    }

    useEffect(() => {
      const action = actions.coverOpen;
      if (action) {
        action.reset();
        action.clampWhenFinished = true;
        action.setLoop(THREE.LoopOnce, 1);
        action.setEffectiveWeight(0);
        action.timeScale = 1;
      }
    }, [actions]);

    useEffect(() => {
      const action = actions["coverOpen"];
      if (action && isOpen !== undefined) {
        action.reset().play();
        action.setEffectiveWeight(1);
      }
    }, [isOpen, actions]);
    return (
      <CreateRender ref={modelRef} model={model} size={size} type={type} />
    );
  },
);
const WashSink = React.memo(
  ({ modelRef, type, model, size, id }: IWashSink) => {
    const dirtyPlateArr = useGetDirtyPlates();
    const cleanPlates = useGetCleanPlates();
    const removeDirtyPlate = useGrabObstacleStore((s) => s.removeDirtyPlate);
    const {
      handleIngredientsApi: {
        addIngredient,
        handleIngredients,
        stopTimer,
        setIngredientStatus,
        toggleTimer,
      },
    } = useContext(GrabContext);

    useEffect(() => {
      addIngredient({
        id,
        type: EHandleIngredient.washing,
        status: false,
      });
    }, [model]);

    const ingredient = useMemo(() => {
      return handleIngredients.find((ingredient) => ingredient.id === id);
    }, [id, handleIngredients]);

    useEffect(() => {
      if (ingredient?.status === 5) {
        if (dirtyPlateArr.length > 1) {
          stopTimer(id);
          setIngredientStatus(id, 0);
          removeDirtyPlate();
          setTimeout(() => {
            toggleTimer(id);
          }, 0);
        } else {
          stopTimer(id);
          removeDirtyPlate();
          setIngredientStatus(id, false);
        }
      }
    }, [ingredient]);
    // const count = useRef(dirtyPlateArr.length);
    // useEffect(() => {
    //   if (dirtyPlateArr.length === 0) {
    //     return;
    //   }

    //   if (ingredient && ingredient?.status === 5) {

    //     count.current = dirtyPlateArr.length;
    //   }
    // }, [handleIngredients, ingredient, id, dirtyPlateArr.length]);

    // useEffect(() => {
    //   if (dirtyPlateArr.length === 1 && ingredient?.status === 5) {
    //     setIngredientStatus(id, false);
    //     stopTimer(id);
    //   }
    // }, [dirtyPlateArr.length, ingredient]);

    useEffect(() => {
      if (model) {
        const count = Math.min(dirtyPlateArr.length, 3);
        for (let i = 0; i < 3; i++) {
          let plate = model.getObjectByName(`dirtyPlate${i + 1}`);
          if (plate) plate.visible = i < count ? true : false;
        }
      }
    }, [model, dirtyPlateArr.length]);

    useEffect(() => {
      if (model) {
        for (let i = 0; i < 6; i++) {
          let plate = model.getObjectByName(`group${i + 1}`);
          if (plate) plate.visible = i < cleanPlates.length ? true : false;
        }
      }
    }, [model, cleanPlates.length]);

    return (
      <>
        <ProgressBar visible={true} id={id} position={[0, 1, -1]}></ProgressBar>
        <CreateRender ref={modelRef} model={model} size={size} type={type} />
      </>
    );
  },
);
const FurnitureEntityImpl = forwardRef<RapierRigidBody | null, Props>(
  ({ val, instanceKey, highlighted, type, animations, size }, ref) => {
    const item = val.current;
    if (!item) return null;
    const { model, position, rotation } = item;

    const modelRef = React.useRef<THREE.Group>(null);
    const props = useMemo(() => {
      return { model, type, modelRef, size };
    }, [model, type, modelRef, size]);
    useHighlighted(model, highlighted);

    const [foodTableId, setFoodTableId] = React.useState<string | null>(null);
    useMemo(() => {
      setFoodTableId(type === EFurnitureType.foodTable ? instanceKey : null);
    }, [instanceKey, type]);
    // useEffect(() => {
    //   console.log(foodTableId, "foodTableId");
    // }, [foodTableId]);

    const content = (() => {
      switch (type) {
        case EFurnitureType.serveDishes:
          return <ServeDishes {...props} />;
        case EFurnitureType.foodTable:
          return (
            <FoodTable
              id={foodTableId}
              model={model}
              size={size}
              type={type}
              animations={animations}
              modelRef={modelRef}
            />
          );
        case EFurnitureType.washSink:
          return <WashSink {...props} id={instanceKey} />;
        default:
          return <CreateRender {...props} />;
      }
    })();

    return (
      <RigidBody
        type="fixed"
        restitution={0.2}
        friction={0}
        position={position}
        rotation={rotation}
        userData={{ id: instanceKey }}
        colliders={false}
        collisionGroups={COLLISION_PRESETS.FURNITURE}
        ref={ref as any}
      >
        {content}
      </RigidBody>
    );
  },
);

export default React.memo(FurnitureEntityImpl, (prevProps, nextProps) => {
  const isSame = isEqual(nextProps, prevProps);
  if (!isSame) {
    const changedKeys = Object.keys(nextProps).filter(
      (key) => !isEqual(nextProps[key], prevProps[key]),
    );
    // if (changedKeys.findIndex((item) => item === "initPos") > -1) {
    //   console.log(
    //     `hamberger changed keys:${nextProps.id} `,
    //     changedKeys,
    //     nextProps.initPos,
    //     prevProps.initPos,
    //   );
    // }

    console.log(
      `furnitureEntity changed keys:${nextProps.instanceKey} `,
      changedKeys,
      nextProps.highlighted,
    );
  }
  return isSame;
});
FurnitureEntityImpl.displayName = "FurnitureEntityImpl";
