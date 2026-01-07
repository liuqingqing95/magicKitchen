// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import { useGLTF } from "@react-three/drei";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import ProgressBar from "./ProgressBar";
import { EFoodType, EGrabType } from "./types/level";
import { EDirection, IHandleIngredientDetail } from "./types/public";
import { MODEL_PATHS } from "./utils/loaderManager";
import { getRotation } from "./utils/util";

type HambergerProps = {
  // model: THREE.Group;
  type: EGrabType | EFoodType;
  id?: string | number;
  size: [number, number, number];
  position?: [number, number, number];
  rotateDirection: EDirection;
  // onMount?: (g: RapierRigidBody | null) => void;
  // onUnmount?: (g: RapierRigidBody | null) => void;
  // isHighlighted?: boolean;
  // isHolding?: boolean;
  handleIngredient: IHandleIngredientDetail;
};

export const CuttingBoard = forwardRef<THREE.Group, HambergerProps>(
  (
    {
      id,
      // isHolding,
      type,
      rotateDirection,
      // model,
      position = [0, 0, 0],
      // onMount,
      handleIngredient,
      // onUnmount,
      // isHighlighted,
    },
    ref
  ) => {
    const [modelReady, setModelReady] = useState(false);
    const models = useMemo(() => {
      const models: Record<string, THREE.Group> = {};
      models.cuttingBoard = useGLTF(
        MODEL_PATHS.overcooked.cuttingBoard
      ).scene.clone();
      models.cuttingBoardNoKnife = useGLTF(
        MODEL_PATHS.overcooked.cuttingBoardNoKnife
      ).scene.clone();

      return models;
    }, []);
    const rigidBodyRef = useRef<RapierRigidBody | null>(null); // 添加 RigidBody 的引用
    // const argsRef = useRef<TrimeshArgs | null>(null);
    // expose the inner group via the forwarded ref
    // if (type ===  EGrabType.hamburger)
    // {console.log("Hamberger render", position, isHighlighted);}
    useImperativeHandle(
      ref,
      () =>
        ({
          rigidBody: rigidBodyRef.current,
          id,
        }) as any,
      []
    );
    useEffect(() => {
      console.log(
        handleIngredient,
        type,
        "handleIngredient",
        handleIngredient.status
          ? models.cuttingBoardNoKnife
          : models.cuttingBoard
      );
      if (handleIngredient.status) {
        const model = models.cuttingBoardNoKnife;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            // if (argsRef.current === null) {
            //   argsRef.current = [
            //     child.geometry.attributes.position.array,
            //     child.geometry.index?.array || [],
            //   ];
            // }
            // console.log(type, child, [
            //   child.geometry.attributes.position.array,
            //   child.geometry.index?.array || [],
            // ]);
            // 确保使用独立的材质
            // if (type === EGrabType.pan && child.name.includes("handle")) {
            //   console.log("pan mesh:", child);

            // }
            if (!child.userData.originalMaterial) {
              child.userData.originalMaterial = child.material;
            }

            // 创建新材质
            const material = child.userData.originalMaterial.clone();

            // 修改高亮效果
            // if (isHighlighted) {
            //   material.emissive = new THREE.Color("#ff9800");
            //   material.emissiveIntensity = 0.3;
            //   // 增加环境光反射
            //   material.roughness = 0.4;
            //   material.metalness = 0.3;
            // } else {
            //   material.emissive = new THREE.Color(0x000000);
            //   material.emissiveIntensity = 0;
            //   material.roughness = 0.8;
            //   material.metalness = 0.2;
            // }

            child.material = material;
          }
        });
      }
    }, [handleIngredient, id]);

    return (
      <>
        <RigidBody
          ref={(g) => {
            rigidBodyRef.current = g;
            console.log("Hamberger RigidBody ref:", g);
          }}
          //
          colliders={false}
          sensor={false}
          key={id}
          type={"kinematicPosition"}
          rotation={getRotation(rotateDirection)}
          friction={0.8}
          collisionGroups={COLLISION_PRESETS.FOOD}
          position={position}
          userData={id}
        >
          <CuboidCollider
            args={[0.7, 0.05, 0.7]}
            position={[0, 0, 0]}
            restitution={0.2}
            friction={1}
            collisionGroups={COLLISION_PRESETS.FLOOR}
          ></CuboidCollider>
          <primitive
            key={id}
            object={
              handleIngredient.status
                ? models.cuttingBoardNoKnife
                : models.cuttingBoard
            }
            scale={1}
          />
        </RigidBody>
        {handleIngredient.status && (
          <ProgressBar
            position={position}
            progress={handleIngredient.status / 5}
          ></ProgressBar>
        )}
      </>
    );
  }
);

CuttingBoard.displayName = "CuttingBoard";
