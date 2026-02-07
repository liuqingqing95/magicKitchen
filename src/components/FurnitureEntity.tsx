import { COLLISION_PRESETS } from "@/constant/collisionGroups";

import { useOpenFoodTableById } from "@/stores/useFurnitureObstacle";
import { EFurnitureType } from "@/types/level";
import { useAnimations } from "@react-three/drei";
// import { IFurniturePosition } from "@/stores/useObstacle";
import { GrabContext } from "@/context/GrabContext";
import ProgressBar from "@/ProgressBar";
import useGrabObstacleStore, {
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
};
export type IRenderProps = {
  model: THREE.Object3D;
  type: EFurnitureType;
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
  forwardRef<THREE.Group | null, IRenderProps>(({ model, type }, modelRef) => {
    const scale: [number, number, number] = [0.99, 0.8, 0.99];
    let args: [number, number, number] = [scale[0], 0.51, scale[2]];
    const position: [number, number, number] = [0, 0, 0];
    if (type === EFurnitureType.serveDishes) {
      args = [2, 0.52, 1.52];
      position[1] = -1.5;
    } else if (type === EFurnitureType.washSink) {
      args[0] = 2;
    }
    console.log("Rendering CreateRender:", type, model.name);
    return (
      <>
        <primitive ref={modelRef} object={model} position={[0, 0, 0]} />
        <CuboidCollider
          args={args}
          position={position}
          restitution={0.2}
          friction={1}
        />
      </>
    );
  }),
);

const FoodTable = React.memo(
  ({ id, model, type, modelRef, animations }: IFoodTable) => {
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
    return <CreateRender ref={modelRef} model={model} type={type} />;
  },
);
const WashSink = React.memo(({ modelRef, type, model, id }: IWashSink) => {
  const dirtyPlateArr = useGetDirtyPlates();
  const removeDirtyPlate = useGrabObstacleStore((s) => s.removeDirtyPlate);
  const {
    handleIngredientsApi: {
      addIngredient,
      handleIngredients,
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

  const cleanPlateRef = React.useRef(0);

  useEffect(() => {
    if (dirtyPlateArr.length === 0) {
      return;
    }
    const ingredient = handleIngredients.find(
      (ingredient) => ingredient.id === id,
    );
    if (ingredient?.status === 5) {
      cleanPlateRef.current = cleanPlateRef.current + 1;
      setIngredientStatus(id, false);
      toggleTimer(id);
      removeDirtyPlate();
    }
  }, [handleIngredients, id, dirtyPlateArr.length]);

  // useEffect(() => {
  //   if (cleanPlateRef.current > 0) {
  //     cleanPlateRef.current = cleanPlateRef.current - 1;

  //   }
  // }, [cleanPlateRef.current]);

  useEffect(() => {
    if (model) {
      const count = Math.min(dirtyPlateArr.length, 3);
      for (let i = 0; i < 3; i++) {
        let plate = model.getObjectByName(`dirtyPlate${i + 1}`);
        if (plate) plate.visible = i < count ? true : false;
      }
      for (let i = 0; i < 6; i++) {
        let plate = model.getObjectByName(`group${i + 1}`);
        if (plate) plate.visible = i < cleanPlateRef.current ? true : false;
      }
    }
  }, [model, dirtyPlateArr]);

  return (
    <>
      <ProgressBar visible={true} id={id} position={[0, 1, -1]}></ProgressBar>
      <CreateRender ref={modelRef} model={model} type={type} />
    </>
  );
});
const FurnitureEntityImpl = forwardRef<RapierRigidBody | null, Props>(
  ({ val, instanceKey, highlighted, type, animations }, ref) => {
    const item = val.current;
    if (!item) return null;
    const { model, position, rotation } = item;

    const modelRef = React.useRef<THREE.Group>(null);
    const props = useMemo(() => {
      return { model, type, modelRef };
    }, [model, type, modelRef]);

    useEffect(() => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.visible === false) return;

          const material = child.material as THREE.MeshStandardMaterial;
          if (highlighted) {
            material.emissive = new THREE.Color("#ff9800");
            material.emissiveIntensity = 0.3;
            material.roughness = 0.4;
            material.metalness = 0.3;
          } else {
            material.emissive = new THREE.Color(0x000000);
            material.emissiveIntensity = 0;
            material.roughness = 0.8;
            material.metalness = 0.2;
          }
        }
      });
      // apply highlight to this entity if it's selected
    }, [highlighted, model]);
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
