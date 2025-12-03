import useGame from "@/stores/useGame";
import { useObstacleStore } from "@/stores/useObstacle";
import { useAnimations, useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { GrabbedItem } from "@/types/level";
import { MODEL_PATHS } from "@/utils/loaderManager";

import { useMemo } from "react";

// 类型保护 helpers，运行时 three.js 会给 Mesh 设置 isMesh/isSkinnedMesh
function isMesh(node: THREE.Object3D): node is THREE.Mesh {
  return (node as any).isMesh === true;
}

function isSkinnedMesh(node: THREE.Object3D): node is THREE.SkinnedMesh {
  return (node as any).isSkinnedMesh === true;
}
interface PlayerProps {
  onPositionUpdate?: (position: [number, number, number]) => void;
  // playerModelUrl?: string;
  heldItem?: GrabbedItem | null;
  initialPosition?: [number, number, number];
  initialRotationY?: number;
}

export default function Player({
  onPositionUpdate,
  initialPosition,
  heldItem,
  // playerModelUrl = "/character-keeper.glb",
  initialRotationY,
}: PlayerProps) {
  const [isSprinting, setIsSprinting] = useState(false); // 标记是否加速
  const body = useRef<RapierRigidBody | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const prevSprinting = useRef(false);
  const modelBottomOffset = useRef(0);
  // const capsuleRadius = 0.35
  const VISUAL_ADJUST = -0.02;
  const GROUND_Y = 0;
  // const capsuleHeight = 0.9
  const COLLIDER_OFFSET_Y = 0.3; // 同 CapsuleCollider position 的 y
  // const capsuleHalf = capsuleRadius + capsuleHeight / 2
  const [capsuleSize, setCapsuleSize] = useState<[number, number]>([0.5, 1]);
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { updateObstaclePosition } = useObstacleStore();
  const { rapier, world } = useRapier();

  const start = useGame((state) => state.start);
  const end = useGame((state) => state.end);
  const restart = useGame((state) => state.restart);
  const blocksCount = useGame((state) => state.blocksCount);

  const characterModel = useGLTF(MODEL_PATHS.overcooked.player);
  const characterModel2 = useGLTF(MODEL_PATHS.overcooked.player2);
  // const texture = useTexture("/kenney_graveyard-kit_5.0/textures/colormap.png");

  // const capsuleWireRef = useRef()

  const capsuleRadius = useMemo(() => {
    return capsuleSize[0];
  }, [capsuleSize]);
  const capsuleHeight = useMemo(() => {
    return capsuleSize[1];
  }, [capsuleSize]);
  const capsuleHalf = useMemo(() => {
    return capsuleRadius + capsuleHeight / 2;
  }, [capsuleRadius, capsuleHeight]);

  // 存储 animation 权重以便 TypeScript 安全访问和更新
  const actionWeights = useRef<WeakMap<THREE.AnimationAction, number>>(
    new WeakMap()
  );

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
  const SPAWN_Y = useMemo(() => {
    return GROUND_Y + capsuleHalf - COLLIDER_OFFSET_Y;
  }, [capsuleHalf]);

  // 冲刺释放后的滑行冲量（数值可调，越大滑的越远）
  const SPRINT_GLIDE_IMPULSE = 1;

  // 调试：列出材料，确认名字与结构
  // console.log('gltf materials:', characterModel.materials);
  // console.log('gltf scene children:', characterModel.scene.children.map(c => ({ name: c.name, material: c.material && (c.material.name || c.material.type) })));

  // 确保贴图编码正确
  // texture.colorSpace = THREE.SRGBColorSpace;
  // texture.flipY = false;
  const { actions } = useAnimations(characterModel.animations, playerRef);
  // console.log('gltf animations:', characterModel.animations.map(a => a.name));

  const jump = () => {
    if (!body.current || !rapier || !world) {
      return;
    }
    const origin = body.current.translation();
    origin.y -= 0.31;
    const direction = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    const hit = world.castRay(ray, 10, true);

    if (hit && hit.timeOfImpact < 0.15) {
      body.current.applyImpulse({ x: 0, y: 0.5, z: 0 }, true);
    }
  };

  const reset = () => {
    if (!body.current) {
      return;
    }
    // 重置到根据地面和碰撞器计算出的 spawnY，保证胶囊底部贴地
    body.current.setTranslation({ x: 0, y: SPAWN_Y, z: 0 }, true);
    // body.current.setTranslation({ x: 0, y: 1, z: 0 })
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useEffect(() => {
    if (!characterModel?.scene) {
      return;
    }

    // 克隆一份并应用与渲染相同的 transform（scale/rotation）
    const tmp = characterModel.scene.clone(true);
    tmp.scale.set(1, 1, 1);
    tmp.rotation.set(0, Math.PI, 0);
    tmp.updateMatrixWorld(true);

    // 逐个网格计算 world-space 包围盒，兼容 SkinnedMesh
    const totalBox = new THREE.Box3();
    let any = false;

    tmp.traverse((node: THREE.Object3D) => {
      if (!isMesh(node)) {
        return;
      }
      // node.material.map = texture;
      // node.material.needsUpdate = true;
      // 确保矩阵更新
      node.updateMatrixWorld(true);

      if (isSkinnedMesh(node)) {
        // 对 SkinnedMesh，要基于当前骨骼变换计算顶点 bbox
        // 将 geometry 的 bbox 先计算出，再把 bbox 用 mesh.matrixWorld 变换到世界空间
        const geom = node.geometry;
        if (!geom.boundingBox) {
          geom.computeBoundingBox();
        }
        const gb = geom.boundingBox!.clone();
        // 注意：skinned mesh 的顶点位置受骨骼影响，简单用 geometry bbox 可能仍有偏差，
        // 但在大多数模型上比直接 setFromObject 更稳定。若模型有显著骨骼位移需更复杂处理。
        gb.applyMatrix4(node.matrixWorld);
        if (!any) {
          totalBox.copy(gb);
          any = true;
        } else {
          totalBox.union(gb);
        }
      } else {
        // 普通 Mesh，直接用 geometry bbox 变换到 world
        const geom = node.geometry;
        if (geom) {
          if (!geom.boundingBox) {
            geom.computeBoundingBox();
          }
          const gb = geom.boundingBox!.clone();
          gb.applyMatrix4(node.matrixWorld);
          if (!any) {
            totalBox.copy(gb);
            any = true;
          } else {
            totalBox.union(gb);
          }
        }
      }
    });

    if (!any) {
      console.warn("compute bbox: no meshes found in gltf scene");
      modelBottomOffset.current = 0;
    } else {
      modelBottomOffset.current = totalBox.min.y;
      console.log(
        "computed model world bbox:",
        totalBox.min,
        totalBox.max,
        "modelBottomOffset:",
        modelBottomOffset.current
      );
    }
  }, [characterModel]);

  useEffect(() => {
    if (actions) {
      // 初始化动画函数
      const initializeAnimation = (
        action?: THREE.AnimationAction,
        timeScale = 1
      ) => {
        if (action) {
          action.reset();
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          action.setEffectiveWeight(0); // 初始权重为 0
          action.timeScale = timeScale; // 设置动画播放速度
          actionWeights.current.set(action, 0);
        }
      };

      // 初始化 walk 动画
      const walk = actions["Walk"] || actions["walk"];
      if (walk) {
        console.log(walk, "dddd");
        initializeAnimation(walk);
      }

      // 初始化 sprint 动画
      const sprint = actions["sprint"];
      if (sprint) {
        initializeAnimation(sprint);
      }
    }
  }, [actions]);

  // useEffect(() => {
  //   // If parent provides a controlled initialPosition after mount, apply it to the physics body
  //   if (initialPosition && body.current) {
  //     try {
  //       body.current.setTranslation(
  //         {
  //           x: initialPosition[0],
  //           y: initialPosition[1],
  //           z: initialPosition[2],
  //         },
  //         true
  //       );
  //     } catch (e) {
  //       // ignore if body not ready yet
  //     }
  //   }

  //   // Apply initial rotation to the visual model if provided
  //   if (typeof initialRotationY === "number" && modelRef.current) {
  //     modelRef.current.rotation.y = initialRotationY;
  //   }
  // }, [initialPosition, initialRotationY]);

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

    if (playerRef.current) {
      const box = new THREE.Box3().setFromObject(playerRef.current);
      const size = box.getSize(new THREE.Vector3());

      // 根据模型尺寸计算胶囊体参数
      const radius = (Math.max(size.x, size.z) / 2) * 0.8; // 宽度取80%
      const height = (size.y / 2) * 0.9; // 高度取90%

      setCapsuleSize([radius, height]);
    }

    return () => {
      unsubscribeReset();
      unsubscribeJump();
      unsubscribeAny();
    };
  }, []);

  // Reusable vector to avoid allocations each frame
  const handPositionRef = useRef(new THREE.Vector3());
  const handQuaternionRef = useRef(new THREE.Quaternion());

  useFrame((_, delta) => {
    // gather input
    const { forward, backward, leftward, rightward } = getKeys();
    const inputX = (rightward ? 1 : 0) + (leftward ? -1 : 0);
    const inputZ = (forward ? -1 : 0) + (backward ? 1 : 0);
    const inputMoving = Math.abs(inputX) > 0 || Math.abs(inputZ) > 0;

    // 1) Sprint glide impulse when sprint was just released
    if (prevSprinting.current && !isSprinting && inputMoving && body.current) {
      const forwardDir = new THREE.Vector3(0, 0, -1);
      if (playerRef.current) {
        forwardDir.applyQuaternion(playerRef.current.quaternion);
        forwardDir.y = 0;
        forwardDir.normalize();
      } else {
        const lv = body.current.linvel();
        forwardDir.set(lv.x, 0, lv.z);
        if (forwardDir.lengthSq() < 1e-6) {
          forwardDir.set(0, 0, -1);
        }
        forwardDir.normalize();
      }

      body.current.applyImpulse(
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
    const maxSpeed = isSprinting ? 8 : 4;
    const desired = new THREE.Vector3(inputX, 0, inputZ);
    if (desired.lengthSq() > 1e-6) {
      desired.normalize().multiplyScalar(maxSpeed);
    }

    if (body.current) {
      const cur = body.current.linvel();
      const lerpF = Math.min(1, 10 * delta);
      const nx = THREE.MathUtils.lerp(cur.x, desired.x, lerpF);
      const nz = THREE.MathUtils.lerp(cur.z, desired.z, lerpF);
      body.current.setLinvel({ x: nx, y: cur.y, z: nz }, true);
      body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
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
    if (playerRef.current && body.current && modelRef.current) {
      const p = body.current.translation();
      const visualY =
        p.y +
        COLLIDER_OFFSET_Y -
        capsuleHalf -
        (modelBottomOffset.current || 0) +
        VISUAL_ADJUST;
      playerRef.current.position.set(p.x, visualY, p.z);
      const newPosition: [number, number, number] = [p.x, visualY, p.z];
      onPositionUpdate?.(newPosition);

      const lv = body.current.linvel();
      const horiz = new THREE.Vector3(lv.x, 0, lv.z);
      const speed = horiz.length();

      let hasTarget = false;
      let targetY = 0;
      if (inputMoving) {
        const dir = new THREE.Vector3(inputX, 0, inputZ).normalize();
        targetY = Math.PI - Math.atan2(dir.x, -dir.z);
        hasTarget = true;
      } else if (speed > 0.25) {
        horiz.normalize();
        targetY = Math.PI - Math.atan2(horiz.x, -horiz.z);
        hasTarget = true;
      }

      if (hasTarget) {
        const targetQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, targetY, 0)
        );
        modelRef.current.quaternion.slerp(targetQuat, Math.min(1, 10 * delta));
      }
    }

    // 5) Camera / phase checks and prevSprinting update
    if (body && body.current) {
      const bodyPosition = body.current.translation();
      prevSprinting.current = isSprinting;

      if (bodyPosition.z < -(blocksCount * 4 + 2)) {
        end();
      }
      if (bodyPosition.y < -4) {
        restart();
      }
    }

    // 6) Held item follow: compute hand world pos and copy into held item
    if (!heldItem || !playerRef.current || !modelRef.current) {
      return;
    }

    const handPos = handPositionRef.current;
    handPos.set(heldItem.offset.x, heldItem.offset.y, heldItem.offset.z);
    handPos.applyMatrix4(modelRef.current.matrixWorld);

    if (heldItem.ref.current) {
      // 更新位置
      // heldItem.ref.current.position.copy(handPos);

      // // 更新旋转，使其与玩家保持一致
      const playerQuaternion = handQuaternionRef.current;
      modelRef.current.getWorldQuaternion(playerQuaternion);

      // 如果是汉堡，更新其物理状态
      const rigidBody = (heldItem.ref.current as any).rigidBody;
      if (rigidBody) {
        updateObstaclePosition(
          rigidBody.handle,
          [handPos.x, handPos.y, handPos.z],
          [
            playerQuaternion.x,
            playerQuaternion.y,
            playerQuaternion.z,
            playerQuaternion.w,
          ]
        );
        // rigidBody.setTranslation(
        //   {
        //     x: handPos.x,
        //     y: handPos.y,
        //     z: handPos.z,
        //   },
        //   true
        // );
        // rigidBody.setRotation(
        //   {
        //     x: playerQuaternion.x,
        //     y: playerQuaternion.y,
        //     z: playerQuaternion.z,
        //     w: playerQuaternion.w,
        //   },
        //   true
        // );
      }
    }
  });

  return (
    <>
      <RigidBody
        ref={body}
        canSleep={false}
        colliders="ball"
        restitution={0.2}
        friction={1}
        linearDamping={0.5}
        angularDamping={0.5}
        position={initialPosition}
      >
        <CapsuleCollider
          args={capsuleSize}
          position={[0, COLLIDER_OFFSET_Y, 0]}
        />
      </RigidBody>

      {/* 玩家视觉模型 */}
      <group ref={playerRef}>
        <primitive
          ref={modelRef}
          rotation={[0, initialRotationY ?? Math.PI, 0]}
          object={characterModel2.scene}
          scale={1}
        />
      </group>
    </>
  );
}
