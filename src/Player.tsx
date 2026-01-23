import { useAnimations, useGLTF, useKeyboardControls } from "@react-three/drei";
import {
  CapsuleCollider,
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { useGrabNear } from "@/hooks/useGrabNear";
import { useGrabObstacleStore } from "@/stores/useGrabObstacle";
import { MODEL_PATHS } from "@/utils/loaderManager";
import { Collider } from "@dimforge/rapier3d-compat/geometry/collider";
import { useFrame } from "@react-three/fiber";

import React from "react";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import { GrabContext } from "./context/GrabContext";
import { GrabItem } from "./GrabItem";
import {
  IFurniturePosition,
  useFurnitureObstacleStore,
} from "./stores/useFurnitureObstacle";
import {
  EFoodType,
  EGrabType,
  ERigidBodyType,
  IGrabPosition,
} from "./types/level";
import { EDirection } from "./types/public";
import { getRotation } from "./utils/util";

interface PlayerProps {
  updatePlayerHandle: (handle: number | undefined) => void;
  onPositionUpdate?: (position: [number, number, number]) => void;
  // playerModelUrl?: string;
  // heldItem?: GrabbedItem | null;
  foodType: EFoodType | EGrabType | null;
  initialPosition: React.MutableRefObject<[number, number, number]>;
  direction: EDirection.normal;
  isCutting: boolean;
  // isReleasing:boolean
}
// 位置：[Player.tsx](src/Player.tsx#L380-L440)

export const Player = forwardRef<THREE.Group, PlayerProps>(
  (
    {
      onPositionUpdate,
      initialPosition,
      updatePlayerHandle,
      foodType,
      isCutting,
      // heldItem,
      // isReleasing,
      // playerModelUrl = "/character-keeper.glb",
      direction,
    }: PlayerProps,
    ref,
  ) => {
    const prevTableHighLight = useRef<string | false>(false);
    // const { grabModels, loading } = useContext(ModelResourceContext);
    const { grabSystemApi } = useContext(GrabContext);
    const { setRealHighlight, realHighLight, getGrabOnFurniture } =
      useGrabObstacleStore((s) => {
        return {
          realHighLight: s.realHighLight,
          getGrabOnFurniture: s.getGrabOnFurniture,
          setRealHighlight: s.setRealHighlight,
        };
      });

    const { setHighlightId, highlightId } = useFurnitureObstacleStore((s) => {
      return {
        setHighlightId: s.setHighlightId,
        highlightId: s.highlightId,
      };
    });

    const { isHolding, heldItem } = grabSystemApi;
    const capsuleColliderRef = useRef<Collider | null>(null);
    const [isSprinting, setIsSprinting] = useState(false); // 标记是否加速
    const bodyRef = useRef<RapierRigidBody | null>(null);
    // const modelRef = useRef<THREE.Group | null>(null);
    const playerRef = useRef<THREE.Group | null>(null);
    const prevSprinting = useRef(false);
    const playerSize = useRef<THREE.Vector3>(new THREE.Vector3());
    // const capsuleRadius = 0.35
    // const VISUAL_ADJUST = -0.02;
    const GROUND_Y = 0;
    // const { nearbyGrabObstacles, isNearby, furnitureHighlight } =
    //   useGrabbableDistance(playerPosition);
    // const capsuleHeight = 0.9
    // const COLLIDER_OFFSET_Y = 0.3; // 同 CapsuleCollider position 的 y
    // const capsuleHalf = capsuleRadius + capsuleHeight / 2
    const [capsuleSize, setCapsuleSize] = useState<[number, number]>([0.5, 1]);
    const [subscribeKeys, getKeys] = useKeyboardControls();

    // const { updateObstaclePosition, getObstacleInfo } = useObstacleStore();
    const playerPositionRef = useRef<[number, number, number]>(
      // keep initial value stable
      (initialPosition as any).current ?? (initialPosition as any),
    );
    const lastReportedRef = useRef<number>(0);
    const { rapier, world } = useRapier();
    const [userData, setUserData] = useState<string>("");
    // const start = useGame((state) => state.start);
    // const end = useGame((state) => state.end);
    // const restart = useGame((state) => state.restart);
    // const blocksCount = useGame((state) => state.blocksCount);
    const isGrabActionPlay = useRef<"food" | "plate" | false>(false);
    const isCuttingActionPlay = useRef(false);
    const characterModel = useGLTF(MODEL_PATHS.overcooked.player);
    const characterModel2 = useGLTF(MODEL_PATHS.overcooked.player2);

    const { isHighLight, getNearest, grabNearList, furnitureNearList } =
      useGrabNear(playerPositionRef.current);
    // const [highlightedFurniture, setHighlightedFurniture] = useState<
    //   IFurniturePosition | false
    // >(false);
    useEffect(() => {
      console.log("realHighLight", realHighLight);
    }, [realHighLight]);

    useEffect(() => {
      if (grabNearList.length === 0) {
        setRealHighlight(false);
        return;
      }
      // if (highlightId) {
      //   const id = getGrabOnFurniture(highlightId);
      //   if (id) {
      //     setRealHighlight(id);
      //   }
      // }
      const newGrab = getNearest(
        ERigidBodyType.grab,
        heldItem?.id,
      ) as IGrabPosition;
      console.log("Player highlight grab:", heldItem?.id, newGrab);

      setRealHighlight(newGrab.id);
    }, [getNearest, grabNearList.length, heldItem?.id]);

    useEffect(() => {
      if (furnitureNearList.length === 0) {
        setHighlightId(false);
        return;
      }
      const newFurniture = getNearest(
        ERigidBodyType.furniture,
      ) as IFurniturePosition;
      setHighlightId(newFurniture.id || "");
    }, [getNearest, furnitureNearList.length]);

    // useEffect(() => {
    //   if (highlightId) {
    //     const id = getGrabOnFurniture(highlightId);
    //     if (id) {
    //       isHighLight(id, true);
    //       prevTableHighLight.current = id;
    //     }
    //   } else {
    //     isHighLight(prevTableHighLight.current || "", true);
    //     prevTableHighLight.current = false;
    //   }
    // }, [highlightId]);
    // const texture = useTexture("/kenney_graveyard-kit_5.0/textures/colormap.png");

    // const capsuleWireRef = useRef()

    // const capsuleRadius = capsuleSize[0];
    // const capsuleHeight = capsuleSize[1];
    const capsuleHalf = capsuleSize[0] + capsuleSize[1] / 2;
    // const SPAWN_Y = GROUND_Y + capsuleHalf;
    // 存储 animation 权重以便 TypeScript 安全访问和更新
    const actionWeights = useRef<WeakMap<THREE.AnimationAction, number>>(
      new WeakMap(),
    );
    // expose the inner group via the forwarded ref
    // if (type ===  EGrabType.hamburger)
    // {console.log("Hamberger render", position, isHighlighted);}
    useImperativeHandle(ref, () => playerRef.current as THREE.Group);
    useEffect(() => {
      // 监听 sprint 状态
      const unsubscribeSprint = subscribeKeys(
        (state) => state.sprint,
        (value) => {
          console.log("Sprint:", value);
          setIsSprinting(value);
        },
      );

      return unsubscribeSprint;
    }, []);

    // 冲刺释放后的滑行冲量（数值可调，越大滑的越远）
    const SPRINT_GLIDE_IMPULSE = 1;

    // 调试：列出材料，确认名字与结构
    // console.log('gltf materials:', characterModel.materials);
    // console.log('gltf scene children:', characterModel.scene.children.map(c => ({ name: c.name, material: c.material && (c.material.name || c.material.type) })));

    // 确保贴图编码正确
    // texture.colorSpace = THREE.SRGBColorSpace;
    // texture.flipY = false;
    const hasCollided = useRef<Record<string, boolean>>({});
    // store a reference to the rigid bodies we've collided with so we can
    // query their world positions later when deciding to clear stale highlights
    const hasCollidedBodies = useRef<Record<string, RapierRigidBody | null>>(
      {},
    );
    const { actions } = useAnimations(characterModel.animations, playerRef);
    // console.log('gltf animations:', characterModel.animations.map(a => a.name));

    const jump = () => {
      if (!bodyRef.current || !rapier || !world) {
        return;
      }
      const origin = bodyRef.current.translation();
      origin.y -= 0.31;
      const direction = { x: 0, y: -1, z: 0 };
      const ray = new rapier.Ray(origin, direction);
      const hit = world.castRay(ray, 10, true);

      if (hit && hit.timeOfImpact < 0.15) {
        bodyRef.current.applyImpulse({ x: 0, y: 0.5, z: 0 }, true);
      }
    };

    const reset = () => {
      if (!bodyRef.current) {
        return;
      }
      // 重置到根据地面和碰撞器计算出的 spawnY，保证胶囊底部贴地
      bodyRef.current.setTranslation({ x: 0, y: 0, z: 0 }, true);
      // bodyRef.current.setTranslation({ x: 0, y: 1, z: 0 })
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    };

    useEffect(() => {
      if (!actions) return;

      const grabAction =
        actions["grabPlate"] || actions["grabFood"] || actions["cutRotation"];
      const handDownAction =
        actions["handDownPlate"] || actions["handDownFood"];
      const cutRotationAction = actions["cutRotation"];

      if (!grabAction || !handDownAction || !cutRotationAction) return;

      // 初始化动画设置
      [grabAction, handDownAction, cutRotationAction].forEach((action) => {
        if (!action) return;
        action.reset();
        action.clampWhenFinished = true;
        action.setLoop(THREE.LoopOnce, 1);
        action.setEffectiveWeight(0);
        action.timeScale = 1;
      });
      if (isCutting) {
        cutRotationAction.reset().play();
        cutRotationAction.setEffectiveWeight(1);
        // 切割动画
      } else {
        // isCuttingActionPlay.current = true;
        cutRotationAction.setEffectiveWeight(0);
        cutRotationAction.stop();
      }
      if (foodType === null) {
        // 放下物品
        if (isGrabActionPlay.current) {
          // 停止抓取动画
          grabAction.setEffectiveWeight(0);
          grabAction.stop();

          // 播放放下动画
          handDownAction.reset().play();
          handDownAction.setEffectiveWeight(1);

          // 动画完成后重置状态
          const handleFinished = () => {
            isGrabActionPlay.current = false;
            handDownAction
              .getMixer()
              .removeEventListener("finished", handleFinished);
          };
          handDownAction
            .getMixer()
            .addEventListener("finished", handleFinished);
        }
      } else {
        // 抓取物品
        const isPlate =
          foodType === EGrabType.plate || foodType === EGrabType.pan;
        isGrabActionPlay.current = isPlate ? "plate" : "food";

        // 停止放下动画
        handDownAction.setEffectiveWeight(0);
        handDownAction.stop();

        // 播放抓取动画
        grabAction.reset().play();
        grabAction.setEffectiveWeight(1);
      }
    }, [foodType, isCutting, actions]);

    useEffect(() => {
      // const unsubscribeReset = useGame.subscribe(
      //   (state) => state.phase,
      //   (value) => {
      //     if (value === "ready") {
      //       reset();
      //     }
      //   }
      // );

      // const unsubscribeJump = subscribeKeys(
      //   (state) => state.jump,
      //   (value) => {
      //     if (value) {
      //       jump();
      //     }
      //   }
      // );

      // const unsubscribeAny = subscribeKeys(() => {
      //   start();
      // });
      if (bodyRef.current) {
        updatePlayerHandle(bodyRef.current?.handle);
      }
      if (playerRef.current) {
        const box = new THREE.Box3().setFromObject(playerRef.current);
        const size = box.getSize(new THREE.Vector3());
        playerSize.current = size;
        // 根据模型尺寸计算胶囊体参数
        const radius = Math.max(size.x, size.z) * 0.5; // 宽度取80%
        const height = size.y - 2 * radius; //(size.y / 2); // 高度取90%
        const center = box.getCenter(new THREE.Vector3());
        console.log("包围盒中心:", center);

        setCapsuleSize([radius, height]);
        playerRef.current.rotation.y = getRotation(direction)[1];
      }

      return () => {
        // unsubscribeReset();
        // unsubscribeJump();
        // unsubscribeAny();
      };
    }, []);

    // useEffect(() => {
    //   console.log("capsuleColliderRef changed", capsuleColliderRef?.current);
    //   capsuleColliderRef?.current?.setSensor(false);
    // }, [capsuleColliderRef]);

    // useEffect(() => {
    //   if (playerRef.current) {
    //     const box = new THREE.Box3().setFromObject(playerRef.current);
    //     const size = box.getSize(new THREE.Vector3());
    //     playerSize.current = size;
    //     // 根据模型尺寸计算胶囊体参数
    // Reusable vector to avoid allocations each frame

    // useEffect(() =>{
    //   const radius = (Math.max(playerSize.current.x, playerSize.current.z) / 2) ; // 宽度取80%
    //   const height = (playerSize.current.y / 2) ; // 高度取90%
    //   if (!heldItem) {

    //     setCapsuleSize([radius*0.6, height*0.6]);
    //   } else {
    //     setCapsuleSize([radius*0.6, height*1.2]);
    //   }

    // }, [playerSize.current, heldItem]);

    useFrame((_, delta) => {
      // gather input
      const { forward, backward, leftward, rightward } = getKeys();
      const inputX = (rightward ? 1 : 0) + (leftward ? -1 : 0);
      const inputZ = (forward ? -1 : 0) + (backward ? 1 : 0);
      const inputMoving = Math.abs(inputX) > 0 || Math.abs(inputZ) > 0;

      // 1) Sprint glide impulse when sprint was just released
      if (
        prevSprinting.current &&
        !isSprinting &&
        inputMoving &&
        bodyRef.current
      ) {
        const forwardDir = new THREE.Vector3(0, 0, -1);
        if (playerRef.current) {
          forwardDir.applyQuaternion(playerRef.current.quaternion);
          forwardDir.y = 0;
          forwardDir.normalize();
        } else {
          const lv = bodyRef.current.linvel();
          forwardDir.set(lv.x, 0, lv.z);
          if (forwardDir.lengthSq() < 1e-6) {
            forwardDir.set(0, 0, -1);
          }
          forwardDir.normalize();
        }

        bodyRef.current.applyImpulse(
          {
            x: forwardDir.x * SPRINT_GLIDE_IMPULSE,
            y: 0,
            z: forwardDir.z * SPRINT_GLIDE_IMPULSE,
          },
          true,
        );
      }
      if (isSprinting) {
        console.log("正在冲刺");
      }
      // 2) Compute desired velocity and smoothly apply to Rapier body
      const maxSpeed = isSprinting ? 16 : 8;
      const desired = new THREE.Vector3(inputX, 0, inputZ);
      if (desired.lengthSq() > 1e-6) {
        desired.normalize().multiplyScalar(maxSpeed);
      }

      if (bodyRef.current) {
        const cur = bodyRef.current.linvel();
        const lerpF = Math.min(1, 10 * delta);
        const nx = THREE.MathUtils.lerp(cur.x, desired.x, lerpF);
        const nz = THREE.MathUtils.lerp(cur.z, desired.z, lerpF);
        bodyRef.current.setLinvel({ x: nx, y: cur.y, z: nz }, true);
        // body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }

      // 4) Visual model follows physics body and orients toward input or movement
      if (playerRef.current && bodyRef.current) {
        const p = bodyRef.current.translation();
        const visualY = p.y - capsuleHalf;
        playerRef.current.position.set(p.x, visualY, p.z);
        const newPosition: [number, number, number] = [p.x, visualY, p.z];
        // update ref instead of state to avoid re-renders
        playerPositionRef.current = newPosition;
        // throttle external updates to ~100ms
        // const now = performance.now();
        // if (onPositionUpdate && now - lastReportedRef.current > 100) {
        //   onPositionUpdate(newPosition);
        //   lastReportedRef.current = now;
        // }
        onPositionUpdate && onPositionUpdate(newPosition);
        const lv = bodyRef.current.linvel();
        const horiz = new THREE.Vector3(lv.x, 0, lv.z);
        const speed = horiz.length();

        // if (!isReleasing) {
        let hasTarget = false;
        let targetY = 0;
        if (inputMoving) {
          const dir = new THREE.Vector3(inputX, 0, inputZ).normalize();
          targetY = Math.PI - Math.atan2(dir.x, -dir.z);
          hasTarget = true;
        } else if (speed > 0.5) {
          horiz.normalize();
          targetY = Math.PI - Math.atan2(horiz.x, -horiz.z);
          hasTarget = true;
        }

        if (hasTarget) {
          const targetQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, targetY, 0),
          );
          playerRef.current.quaternion.slerp(
            targetQuat,
            Math.min(1, 10 * delta),
          );
        }
      }
      // }

      // 5) Camera / phase checks and prevSprinting update
      // if (bodyRef && bodyRef.current) {
      //   const bodyPosition = bodyRef.current.translation();
      //   prevSprinting.current = isSprinting;

      //   if (bodyPosition.z < -(blocksCount * 4 + 2)) {
      //     end();
      //   }
      //   if (bodyPosition.y < -4) {
      //     restart();
      //   }
      // }

      // 6) Held item follow: compute hand world pos and copy into held item
    });

    const handleCollisionEnter = useCallback((other: any) => {
      const rigidBody = other.rigidBody;
      if (rigidBody) {
        const id = rigidBody.userData;
        if (!hasCollided.current[id]) {
          hasCollided.current[id] = true;
          console.log(`首次碰撞家具：${id}`);
          isHighLight(id, true);
        }
      }
      // console.log("Player Sensor enter", other);
    }, []);

    const handleCollisionExit = useCallback((other: any) => {
      const rigidBody = other.rigidBody;
      if (rigidBody) {
        const id = rigidBody.userData;
        console.log(`离开家具：${id}`);
        hasCollided.current[id] = false;
        isHighLight(id, false);
      }
    }, []);

    // useEffect(() => {
    //   if (onPositionUpdate) {
    //     onPositionUpdate(playerPosition);
    //   }
    // }, [playerPosition]);
    // Small child component subscribes only to `isHolding` so Player avoids re-renders
    const PlayerHoldingCollider = ({
      capsuleSize,
      onEnter,
      onExit,
    }: {
      capsuleSize: [number, number];
      onEnter: (other: any) => void;
      onExit: (other: any) => void;
    }) => {
      const { grabSystemApi } = useContext(GrabContext);
      const { isHolding } = grabSystemApi;
      console.log("PlayerHoldingCollider render, isHolding:", isHolding);
      return (
        <>
          <CapsuleCollider
            collisionGroups={COLLISION_PRESETS.PLAYER}
            sensor={false}
            args={capsuleSize}
          />
        </>
      );
    };

    console.log(
      "Player render:",
      foodType,
      direction,
      isCutting,
      initialPosition,
    );

    return (
      <>
        <group position={initialPosition.current} ref={playerRef}>
          <RigidBody
            type="dynamic"
            ref={bodyRef}
            canSleep={false}
            restitution={0.2}
            friction={1}
            linearDamping={0.5}
            angularDamping={0.5}
            colliders={false}
            userData={"player1"}
            enabledRotations={[false, false, false]}
          >
            <PlayerHoldingCollider
              capsuleSize={capsuleSize}
              onEnter={handleCollisionEnter}
              onExit={handleCollisionExit}
            />
            <CuboidCollider
              args={[1.4, (capsuleSize[1] + capsuleSize[0]) / 2, 1.4]}
              sensor={true}
              position={[
                0,
                -(1.5 * capsuleSize[1] + 1.5 * capsuleSize[0]) / 4,
                0,
              ]}
              onIntersectionEnter={handleCollisionEnter}
              onIntersectionExit={handleCollisionExit}
            />
          </RigidBody>
          <GrabItem
            playerPositionRef={playerPositionRef}
            isHolding={isHolding}
            playerRef={playerRef}
          />
          <primitive object={characterModel.scene} scale={0.8} />
        </group>
      </>
    );
  },
);
export default React.memo(Player);
Player.displayName = "Player";
