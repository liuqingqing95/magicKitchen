import { COLLISION_PRESETS } from "@/constant/collisionGroups";
import { GRAB_ARR } from "@/constant/data";
import { GrabContext } from "@/context/GrabContext";
import ModelResourceContext from "@/context/ModelResourceContext";

import {
  useObstaclesMap,
  useOpenFoodTableById,
} from "@/stores/useFurnitureObstacle";
import useGame, { useGameReceiveFood, useGameScore } from "@/stores/useGame";
import useGrabObstacleStore, {
  useGrabOnFurniture,
} from "@/stores/useGrabObstacle";
import {
  EFurnitureType,
  EGrabType,
  ERigidBodyType,
  FoodModelType,
} from "@/types/level";
import {
  createFoodItem,
  findObstacleByPosition,
  getId,
  isMultiFoodModelType,
  pathInclude,
} from "@/utils/util";
import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
// import { IFurniturePosition } from "@/stores/useObstacle";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { isEqual } from "lodash";
import React, { forwardRef, useContext, useEffect, useMemo } from "react";
import * as THREE from "three";

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
type IRenderProps = {
  model: THREE.Object3D;
  type: EFurnitureType;
};
interface IServiceDishes extends IRenderProps {
  modelRef: React.RefObject<THREE.Group>;
}
interface IFoodTable extends IRenderProps {
  id: string | null;
  animations?: THREE.AnimationClip[];
  modelRef: React.RefObject<THREE.Group>;
}
interface IWashSink extends IRenderProps {
  modelRef: React.RefObject<THREE.Group>;
}
const CreateRender = React.memo(
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

const ServeDishes = React.memo(({ model, type, modelRef }: IServiceDishes) => {
  console.log(
    "Rendering serveDishes furniture:",
    model.getObjectByName("dirtyPlate1")?.visible,
  );
  const { grabModels } = useContext(ModelResourceContext);
  const { modelMapRef } = useContext(GrabContext);
  const score = useGameScore();
  const grabOnFurniture = useGrabOnFurniture();
  const receiveFood = useGameReceiveFood();
  const setReceiveFood = useGame((s) => s.setReceiveFood);
  const {
    registerObstacle,
    updateObstacleInfo,
    getObstacleInfo,
    setGrabOnFurniture,
  } = useGrabObstacleStore((s) => {
    return {
      registerObstacle: s.registerObstacle,
      setGrabOnFurniture: s.setGrabOnFurniture,
      getObstacleInfo: s.getObstacleInfo,
      updateObstacleInfo: s.updateObstacleInfo,
    };
  });
  const furnitureObstacles = useObstaclesMap();
  const obj = model.getObjectByName("direction") as THREE.Mesh;
  if (!obj) {
    return null;
  }
  useEffect(() => {
    if (receiveFood) {
      const dirtyPlate = GRAB_ARR.find(
        (item) => item.type === EGrabType.dirtyPlate,
      );
      let furnitureId: string | undefined;
      let grabId: string | undefined;
      if (dirtyPlate?.position) {
        const { key, val } =
          findObstacleByPosition(
            grabOnFurniture,
            dirtyPlate.position[0],
            dirtyPlate.position[2],
          ) || {};
        furnitureId = key;
        grabId = val;
      }
      console.log("ddddf", furnitureId, grabId);
      const timeoutId = setTimeout(() => {
        const model = grabModels[EGrabType.dirtyPlate].clone(true);
        if (furnitureId && grabId) {
          const newId = getId(
            ERigidBodyType.grab,
            EGrabType.dirtyPlate,
            model.uuid,
          );
          const obj = getObstacleInfo(grabId);
          if (!obj) return;
          let info: FoodModelType | undefined;
          const newType = {
            id: newId,
            type: EGrabType.dirtyPlate as any,
          };
          if (obj.foodModel) {
            if (isMultiFoodModelType(obj.foodModel)) {
              info = {
                id: obj.foodModel.id,
                type: obj.foodModel.type.concat(newType),
              };
            } else {
              info = {
                id: obj.id,
                type: [
                  { id: obj.foodModel.id, type: obj.foodModel.type },
                  newType,
                ],
              };
            }
          } else {
            info = newType;
          }
          updateObstacleInfo(grabId, {
            foodModel: info,
          });
          modelMapRef.current?.set(newId, model);
          setReceiveFood(false);
          // setGrabOnFurniture(furnitureId, grabId);
        } else if (model && dirtyPlate) {
          const obj = createFoodItem(dirtyPlate, model, true, modelMapRef);
          registerObstacle(obj.id, obj);
          setReceiveFood(false);
          const id = Array.from(furnitureObstacles.keys()).find((key) =>
            pathInclude(key, dirtyPlate.position![0], dirtyPlate.position![2]),
          );
          if (id) {
            setGrabOnFurniture(id, obj.id);
          }
        }
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [receiveFood]);
  useFrame(() => {
    (obj.material as THREE.MeshStandardMaterial)!.map!.offset.x += 0.018;
  });
  return <CreateRender ref={modelRef} model={model} type={type} />;
});
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

      // 切割动画
      // } else {
      //   // isCuttingActionPlay.current = true;
      //   cutRotationAction.setEffectiveWeight(0);
      //   cutRotationAction.stop();
      // }
    }, [isOpen, actions]);
    return <CreateRender ref={modelRef} model={model} type={type} />;
  },
);
const WashSink = React.memo(({ modelRef, type, model }: IWashSink) => {
  useEffect(() => {
    if (type === EFurnitureType.washSink) {
      if (model) {
        let plate1 = model.getObjectByName("dirtyPlate1");
        if (plate1) plate1.visible = false;
      }
    }
  }, [type]);

  if (type === EFurnitureType.washSink) {
    console.log("Rendering washSink furniture");
  }
  return <CreateRender ref={modelRef} model={model} type={type} />;
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
    useEffect(() => {
      console.log(foodTableId, "foodTableId");
    }, [foodTableId]);

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
          return <WashSink {...props} />;
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
