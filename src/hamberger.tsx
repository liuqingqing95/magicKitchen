// import { TrimeshArgs } from "@dimforge/rapier3d-compat/geometry/collider";
import {
  RapierRigidBody,
  RigidBody,
  RigidBodyTypeString,
  TrimeshCollider,
} from "@react-three/rapier";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import ProgressBar from "./ProgressBar";
import { DebugText } from "./Text";
import {
  BaseFoodModelType,
  EFoodType,
  EGrabType,
  FoodModelType,
} from "./types/level";
import { EDirection, IHandleIngredientDetail } from "./types/public";
import { getRotation } from "./utils/util";

type HambergerProps = {
  model: THREE.Group;
  type: EGrabType | EFoodType;
  id: string;
  size: [number, number, number];
  initPos?: [number, number, number];
  onMount?: (g: RapierRigidBody | null) => void;
  onUnmount?: (g: RapierRigidBody | null) => void;
  isHighlighted?: boolean;
  area?: "floor" | "table" | "hand";
  isHolding?: boolean;
  foodModel?: FoodModelType;
  visible?: boolean;
  // burgerContainer: []
  handleIngredient?: IHandleIngredientDetail;
  rotateDirection?: EDirection;
};

const Hamberger = forwardRef<THREE.Group, HambergerProps>(
  (
    {
      id,
      rotateDirection = EDirection.normal,
      handleIngredient,
      isHolding,
      type,
      size,
      visible = true,
      foodModel,
      area,
      model,
      initPos = [0, 0, 0],
      onMount,
      onUnmount,
      isHighlighted,
    },
    ref
  ) => {
    const [modelReady, setModelReady] = useState(false);
    const notColliderPlayer = useRef(true);
    const [collisionGroups, setCollisionGroups] = useState<
      number | undefined
    >();

    const rigidBodyRef = useRef<RapierRigidBody | null>(null); // 添加 RigidBody 的引用
    // const argsRef = useRef<TrimeshArgs | null>(null);
    // expose the inner group via the forwarded ref
    // if (type ===  EGrabType.hamburger)
    // {console.log("Hamberger render", position, isHighlighted);}
    const waitForGrab = useRef<boolean>(true);

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
      if (model) {
        // if (type !== EFoodType.burger) {
        //   debugger;
        // }
        // if (type === EGrabType.pan) {
        //   debugger;
        // }
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
            if (isHighlighted) {
              material.emissive = new THREE.Color("#ff9800");
              material.emissiveIntensity = 0.3;
              // 增加环境光反射
              material.roughness = 0.4;
              material.metalness = 0.3;
            } else {
              material.emissive = new THREE.Color(0x000000);
              material.emissiveIntensity = 0;
              material.roughness = 0.8;
              material.metalness = 0.2;
            }

            child.material = material;
          }
        });

        setModelReady(true);
      }
    }, [model, isHighlighted]);

    useEffect(() => {
      if (modelReady && rigidBodyRef.current) {
        onMount?.(rigidBodyRef.current);
        waitForGrab.current = false;
      }
    }, [onMount, modelReady]);
    // 组件卸载时通知父组件
    useEffect(() => {
      return () => {
        onUnmount?.(rigidBodyRef.current);
      };
    }, [onUnmount]);

    const [bodyArgs, setBodyArgs] = useState({
      type: "dynamic" as RigidBodyTypeString,
      sensor: false,
    });

    useEffect(() => {
      const val =
        notColliderPlayer.current && visible === false
          ? COLLISION_PRESETS.FOODHIDE
          : isHolding
            ? COLLISION_PRESETS.FOODHIDE
            : COLLISION_PRESETS.FOOD;

      setCollisionGroups(val);
      notColliderPlayer.current = false;
    }, [isHolding, bodyArgs.type]);

    useEffect(() => {
      // let type: RigidBodyTypeString = "dynamic";
      const obj: {
        type: RigidBodyTypeString;
        sensor: boolean;
      } = {
        type: "kinematicPosition",
        sensor: false,
      };
      if (area === "table") {
        obj.type = "kinematicPosition";
        obj.sensor = false;
      }
      obj.type = isHolding ? "kinematicPosition" : "dynamic";
      obj.sensor = isHolding ? true : false;
      setBodyArgs((prev) => {
        return {
          ...prev,
          sensor: obj.sensor,
        };
      });
      const time = setTimeout(() => {
        setBodyArgs((prev) => {
          return {
            ...prev,
            type: obj.type,
          };
        });
      }, 10);
      return () => {
        clearTimeout(time);
      };
      // console.log(id, "Hamberger bodyArgs:", obj, area);
    }, [isHolding, area]);

    const needProcessBar = () => {
      return (
        handleIngredient &&
        handleIngredient.status && (
          <ProgressBar
            position={initPos}
            offsetZ={type === EGrabType.cuttingBoard ? -1 : undefined}
            progress={handleIngredient.status / 5}
          ></ProgressBar>
        )
      );
    };
    const renderPan = () => {
      const pan = model.getObjectByName("pingdiguo") as THREE.Mesh;
      const handle = model.getObjectByName("handle") as THREE.Mesh;
      const panVertices = pan.geometry.attributes.position.array;
      const panIndices = pan.geometry.index
        ? pan.geometry.index.array
        : new Uint32Array(panVertices.length / 3).map((_, i) => i);

      const handleVertices = handle.geometry.attributes.position.array;
      const handleIndices = handle.geometry.index
        ? handle.geometry.index.array
        : new Uint32Array(handleVertices.length / 3).map((_, i) => i);

      return (
        <>
          <RigidBody
            ref={rigidBodyRef}
            colliders={false} // 禁用自动创建
            key={id}
            type={bodyArgs.type}
            sensor={bodyArgs.sensor}
            rotation={getRotation(rotateDirection)}
            friction={0.8}
            position={initPos}
            userData={id}
          >
            {/* Mesh 1：动态碰撞体（参与物理） */}
            <TrimeshCollider
              rotation={[-Math.PI / 2, 0, 0]}
              // type="trimesh"
              args={[panVertices, panIndices]}
              collisionGroups={collisionGroups}
            />

            {/* Mesh 2：固定效果（只检测，不影响物理） */}
            <TrimeshCollider
              rotation={[-Math.PI / 2, 0, 0]}
              // type="trimesh"
              args={[handleVertices, handleIndices]}
              sensor={true} // 设置为传感器
              collisionGroups={collisionGroups}
            />

            {/* 渲染模型 */}
            <primitive object={model} scale={1} />
          </RigidBody>
          {needProcessBar()}
        </>
      );
    };
    const renderFoodModel = () => {
      if (!foodModel) {
        return null;
      }
      const isMulti = Array.isArray(foodModel.type);
      // const arr: BaseFoodModelType[] = isMulti
      //   ? foodModel.type
      //   : [foodModel.type];
      const positions: [number, number, number][] = [
        [-1, 2.3, 0],
        [1, 2.3, 0],
        [-1, 2.3, -1],
        [1, 2.3, -1],
      ];

      return (
        <>
          <group key={foodModel.id}>
            <primitive
              position={[0, 0, 0]}
              key={foodModel.id}
              object={foodModel.model}
              scale={1}
            />
            {isMulti ? (
              (foodModel.type as BaseFoodModelType[]).map((item, index) => {
                let text = "";
                switch (item.type) {
                  case EFoodType.cheese:
                    text = "芝士";
                    break;
                  case EFoodType.meatPatty:
                    text = "肉饼";
                    break;
                  case EFoodType.eggCooked:
                    text = "煎蛋";
                    break;
                  case EFoodType.cuttingBoardRound:
                    text = "汉堡片";
                    break;
                }
                return (
                  <DebugText
                    key={item.id}
                    color={"#000"}
                    text={text}
                    rotation={[0, Math.PI, 0]}
                    position={positions[index]}
                  ></DebugText>
                );
              })
            ) : (
              <DebugText
                color={"#000"}
                text={foodModel.type as EFoodType}
                position={2.3}
              ></DebugText>
            )}
          </group>
        </>
      );
    };
    const renderPlate = (isFood?: boolean) => {
      return (
        <>
          <RigidBody
            ref={(g) => {
              rigidBodyRef.current = g;
              console.log("Hamberger RigidBody ref:", g);
            }}
            colliders="trimesh"
            type={bodyArgs.type}
            sensor={bodyArgs.sensor}
            key={id}
            friction={0.8}
            collisionGroups={collisionGroups}
            position={initPos}
            rotation={getRotation(rotateDirection)}
            userData={id}
          >
            {renderFoodModel()}

            <primitive key={id} object={model} scale={1} />
            <DebugText
              color={isFood ? "#000" : "white"}
              text={id!.slice(-6)}
            ></DebugText>
            {/* <Float floatIntensity={0.25} rotationIntensity={0.25}>
              <Text
                font="/bebas-neue-v9-latin-regular.woff"
                scale={0.5}
                maxWidth={3}
                lineHeight={0.75}
                color={isFood ? "#000" : "white"}
                textAlign="right"
                position={[0, isFood ? 2.2 : 1.3, 0]}
                rotation-y={-Math.PI / 2}
              >
                {id!.slice(-6)}
                <meshBasicMaterial toneMapped={false} />
              </Text>
            </Float> */}
          </RigidBody>
        </>
      );
    };
    const renderHamberger = () => {
      return (
        <>
          <RigidBody
            ref={(g) => {
              rigidBodyRef.current = g;
              console.log("Hamberger RigidBody ref:", g);
            }}
            colliders="trimesh"
            type={bodyArgs.type}
            sensor={bodyArgs.sensor}
            key={id}
            rotation={
              rotateDirection ? getRotation(rotateDirection) : undefined
            }
            friction={0.8}
            collisionGroups={collisionGroups}
            position={initPos}
            userData={id}
          >
            <primitive key={id} object={model} scale={1} />
          </RigidBody>
          {needProcessBar()}
        </>
      );
    };
    return (
      modelReady &&
      (() => {
        switch (type) {
          case EGrabType.pan:
            return renderPan();
          case EGrabType.plate:
            return renderPlate(false);
          // case EFoodType.eggCooked:
          //   return renderPlate(true);
          // case EGrabType.plate:
          // 没有碟子的汉堡必须依附于面包片
          // case EFoodType.cuttingBoardRound:
          //   return renderHamberger();
          default:
            return (
              <>
                <RigidBody
                  ref={(g) => {
                    rigidBodyRef.current = g;
                    console.log("Hamberger RigidBody ref:", g);
                  }}
                  colliders="trimesh"
                  type={bodyArgs.type}
                  sensor={bodyArgs.sensor}
                  key={id}
                  rotation={
                    rotateDirection ? getRotation(rotateDirection) : undefined
                  }
                  friction={0.8}
                  collisionGroups={collisionGroups}
                  position={initPos}
                  userData={id}
                >
                  <primitive object={model} scale={1} />
                </RigidBody>
                {needProcessBar()}
              </>
            );
        }
      })()
    );
  }
);
export default React.memo(Hamberger);
Hamberger.displayName = "Hamberger";
