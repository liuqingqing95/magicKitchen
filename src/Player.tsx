import useGame from "@/stores/useGame";
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
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { useGrabNear } from "@/hooks/useGrabNear";
import { MODEL_PATHS } from "@/utils/loaderManager";
import { Collider } from "@dimforge/rapier3d-compat/geometry/collider";
import { useFrame } from "@react-three/fiber";
import { EDirection } from "./types/public";
import { getRotation } from "./utils/util";

interface PlayerProps {
  updatePlayerHandle: (handle: number | undefined) => void;
  onPositionUpdate?: (position: [number, number, number]) => void;
  // playerModelUrl?: string;
  // heldItem?: GrabbedItem | null;
  initialPosition: [number, number, number];
  direction: EDirection.normal;
  // isReleasing:boolean
}

export const Player = forwardRef<THREE.Group, PlayerProps>(
  (
    {
      onPositionUpdate,
      initialPosition,
      updatePlayerHandle,
      // heldItem,
      // isReleasing,
      // playerModelUrl = "/character-keeper.glb",
      direction,
    }: PlayerProps,
    ref
  ) => {
    const capsuleColliderRef = useRef<Collider | null>(null);
    const [isSprinting, setIsSprinting] = useState(false); // 标记是否加速
    const bodyRef = useRef<RapierRigidBody | null>(null);
    // const modelRef = useRef<THREE.Group | null>(null);
    const playerRef = useRef<THREE.Group | null>(null);
    const prevSprinting = useRef(false);
    const playerSize = useRef<THREE.Vector3>(new THREE.Vector3());
    // const capsuleRadius = 0.35
    const VISUAL_ADJUST = -0.02;
    const GROUND_Y = 0;
    // const { nearbyGrabObstacles, isNearby, furnitureHighlight } =
    //   useGrabbableDistance(playerPosition);
    // const capsuleHeight = 0.9
    const COLLIDER_OFFSET_Y = 0.3; // 同 CapsuleCollider position 的 y
    // const capsuleHalf = capsuleRadius + capsuleHeight / 2
    const [capsuleSize, setCapsuleSize] = useState<[number, number]>([0.5, 1]);
    const [subscribeKeys, getKeys] = useKeyboardControls();

    // const { updateObstaclePosition, getObstacleInfo } = useObstacleStore();
    const [playerPosition, setPlayerPosition] = useState(initialPosition);
    const { rapier, world } = useRapier();
    const [userData, setUserData] = useState<string>("");
    const start = useGame((state) => state.start);
    const end = useGame((state) => state.end);
    const restart = useGame((state) => state.restart);
    const blocksCount = useGame((state) => state.blocksCount);

    const characterModel = useGLTF(MODEL_PATHS.overcooked.player);
    const characterModel2 = useGLTF(MODEL_PATHS.overcooked.player2);
    const { isHighLight } = useGrabNear();
    // const texture = useTexture("/kenney_graveyard-kit_5.0/textures/colormap.png");

    // const capsuleWireRef = useRef()

    // const capsuleRadius = capsuleSize[0];
    // const capsuleHeight = capsuleSize[1];
    const capsuleHalf = capsuleSize[0] + capsuleSize[1] / 2;
    const SPAWN_Y = GROUND_Y + capsuleHalf - COLLIDER_OFFSET_Y;
    // 存储 animation 权重以便 TypeScript 安全访问和更新
    const actionWeights = useRef<WeakMap<THREE.AnimationAction, number>>(
      new WeakMap()
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
        }
      );

      return unsubscribeSprint;
    }, [subscribeKeys]);

    // 冲刺释放后的滑行冲量（数值可调，越大滑的越远）
    const SPRINT_GLIDE_IMPULSE = 1;

    // 调试：列出材料，确认名字与结构
    // console.log('gltf materials:', characterModel.materials);
    // console.log('gltf scene children:', characterModel.scene.children.map(c => ({ name: c.name, material: c.material && (c.material.name || c.material.type) })));

    // 确保贴图编码正确
    // texture.colorSpace = THREE.SRGBColorSpace;
    // texture.flipY = false;
    const hasCollided = useRef<Record<string, boolean>>({});
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
      bodyRef.current.setTranslation({ x: 0, y: SPAWN_Y, z: 0 }, true);
      // bodyRef.current.setTranslation({ x: 0, y: 1, z: 0 })
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    };

    // useEffect(() => {
    //   if (actions) {
    //     // 初始化动画函数
    //     const initializeAnimation = (
    //       action?: THREE.AnimationAction,
    //       timeScale = 1
    //     ) => {
    //       if (action) {
    //         action.reset();
    //         action.setLoop(THREE.LoopRepeat, Infinity);
    //         action.play();
    //         action.setEffectiveWeight(0); // 初始权重为 0
    //         action.timeScale = timeScale; // 设置动画播放速度
    //         actionWeights.current.set(action, 0);
    //       }
    //     };

    //     // 初始化 walk 动画
    //     const walk = actions["Walk"] || actions["walk"];
    //     if (walk) {
    //       console.log(walk, "dddd");
    //       initializeAnimation(walk);
    //     }

    //     // 初始化 sprint 动画
    //     const sprint = actions["sprint"];
    //     if (sprint) {
    //       initializeAnimation(sprint);
    //     }
    //   }
    // }, [actions]);

    useEffect(() => {
      const unsubscribeReset = useGame.subscribe(
        (state) => state.phase,
        (value) => {
          if (value === "ready") {
            reset();
          }
        }
      );

      const unsubscribeJump = subscribeKeys(
        (state) => state.jump,
        (value) => {
          if (value) {
            jump();
          }
        }
      );

      const unsubscribeAny = subscribeKeys(() => {
        start();
      });
      if (bodyRef.current) {
        updatePlayerHandle(bodyRef.current?.handle);
      }
      if (playerRef.current) {
        const box = new THREE.Box3().setFromObject(playerRef.current);
        const size = box.getSize(new THREE.Vector3());
        playerSize.current = size;
        // 根据模型尺寸计算胶囊体参数
        const radius = (Math.max(size.x, size.z) / 2) * 0.6; // 宽度取80%
        const height = (size.y / 2) * 0.6; // 高度取90%

        setCapsuleSize([radius, height]);
        playerRef.current.rotation.y = getRotation(direction)[1];
      }

      return () => {
        unsubscribeReset();
        unsubscribeJump();
        unsubscribeAny();
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
          true
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

      // 3) Animation blending (walk / sprint)
      if (actions) {
        const walk = actions["Walk"] || actions["walk"];
        const sprint = actions["sprint"];

        if (inputMoving) {
          if (isSprinting && sprint) {
            const prevSprint = actionWeights.current.get(sprint) ?? 0;
            const newSprintW = THREE.MathUtils.lerp(
              prevSprint,
              1,
              Math.min(1, 10 * delta)
            );
            sprint.setEffectiveWeight(newSprintW);
            actionWeights.current.set(sprint, newSprintW);

            if (walk) {
              const prevWalk = actionWeights.current.get(walk) ?? 0;
              const adjustedWalkWeight = Math.max(0, prevWalk - newSprintW);
              walk.setEffectiveWeight(adjustedWalkWeight);
              actionWeights.current.set(walk, adjustedWalkWeight);
            }
          } else if (walk) {
            const prevWalk = actionWeights.current.get(walk) ?? 0;
            const newWalkW = THREE.MathUtils.lerp(
              prevWalk,
              1,
              Math.min(1, 10 * delta)
            );
            walk.setEffectiveWeight(newWalkW);
            actionWeights.current.set(walk, newWalkW);

            if (sprint) {
              const prevSprint = actionWeights.current.get(sprint) ?? 0;
              const adjustedSprintWeight = Math.max(0, prevSprint - newWalkW);
              sprint.setEffectiveWeight(adjustedSprintWeight);
              actionWeights.current.set(sprint, adjustedSprintWeight);
            }
          }
        } else {
          if (walk) {
            walk.setEffectiveWeight(0);
            actionWeights.current.set(walk, 0);
          }
          if (sprint) {
            sprint.setEffectiveWeight(0);
            actionWeights.current.set(sprint, 0);
          }
        }
      }

      // 4) Visual model follows physics body and orients toward input or movement
      if (playerRef.current && bodyRef.current) {
        const p = bodyRef.current.translation();
        const visualY = p.y + COLLIDER_OFFSET_Y - capsuleHalf + VISUAL_ADJUST;
        playerRef.current.position.set(p.x, visualY, p.z);
        const newPosition: [number, number, number] = [p.x, visualY, p.z];
        // onPositionUpdate?.(newPosition);
        setPlayerPosition(newPosition);

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
            new THREE.Euler(0, targetY, 0)
          );
          playerRef.current.quaternion.slerp(
            targetQuat,
            Math.min(1, 10 * delta)
          );
        }
      }
      // }

      // 5) Camera / phase checks and prevSprinting update
      if (bodyRef && bodyRef.current) {
        const bodyPosition = bodyRef.current.translation();
        prevSprinting.current = isSprinting;

        if (bodyPosition.z < -(blocksCount * 4 + 2)) {
          end();
        }
        if (bodyPosition.y < -4) {
          restart();
        }
      }

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

    useEffect(() => {
      if (onPositionUpdate) {
        onPositionUpdate(playerPosition);
      }
    }, [playerPosition]);
    return (
      <>
        <group position={initialPosition} ref={playerRef}>
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
            <CapsuleCollider sensor={false} args={capsuleSize} />
            {/* 玩家用来检测附近家具的传感器（thin sensor） */}
            <CuboidCollider
              args={[1.2, 1.2, 1.2]}
              sensor={true}
              // collisionGroups={2}
              onIntersectionEnter={handleCollisionEnter} // ✅ 正确事件名
              onIntersectionExit={handleCollisionExit}
              // onIntersectionEnter={(e) => handleSensorEnter(e.other)}
              // onIntersectionExit={(e) => handleSensorExit(e.other)}
            />
          </RigidBody>
          <primitive
            object={characterModel.scene}
            scale={0.8}
            position={[0, -0.3, 0]}
            // position={[0, 0, 0]}
          />
        </group>
      </>
    );
  }
);
