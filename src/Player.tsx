import useGame from "@/stores/useGame";
import {
  useAnimations,
  useGLTF,
  useKeyboardControls,
  useTexture,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  IntersectionEnterPayload,
  IntersectionExitPayload,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { useMemo } from "react";
import { GrabbedItem } from "./types/level";

// 类型保护 helpers，运行时 three.js 会给 Mesh 设置 isMesh/isSkinnedMesh
function isMesh(node: THREE.Object3D): node is THREE.Mesh {
  return (node as any).isMesh === true;
}

function isSkinnedMesh(node: THREE.Object3D): node is THREE.SkinnedMesh {
  return (node as any).isSkinnedMesh === true;
}
interface PlayerProps {
  // onPositionUpdate?: (position: [number, number, number]) => void;
  playerModelUrl?: string;
  heldItem: GrabbedItem | null;
  // initialRotationY?: number;
  // Controlled position/rotation provided by parent (optional)
  position?: [number, number, number];
  rotationY?: number;
  walkWeight?: number;
  sprintWeight?: number;
  onObstacleEnter?: (handle: number, sensorHandle?: number) => void;
  onObstacleExit?: (handle: number) => void;
}
export default function Player({
  heldItem,
  playerModelUrl = "/character-keeper.glb",
  // initialRotationY,
  position,
  rotationY,
  walkWeight,
  sprintWeight,
  onObstacleEnter,
  onObstacleExit,
}: PlayerProps) {
  const body = useRef<RapierRigidBody | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  // previous sprinting state not needed when movement is controlled externally
  const modelBottomOffset = useRef(0);
  // const capsuleRadius = 0.35
  const VISUAL_ADJUST = -0.02;
  const GROUND_Y = 0;
  // const capsuleHeight = 0.9
  const COLLIDER_OFFSET_Y = 0.3; // 同 CapsuleCollider position 的 y
  // const capsuleHalf = capsuleRadius + capsuleHeight / 2
  const [capsuleSize, setCapsuleSize] = useState<[number, number]>([0.5, 1]);
  const [subscribeKeys] = useKeyboardControls();

  const { rapier, world } = useRapier();
  const [smoothedCameraPosition] = useState(
    () => new THREE.Vector3(10, 10, 10)
  );
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());
  const start = useGame((state) => state.start);
  const end = useGame((state) => state.end);
  const restart = useGame((state) => state.restart);
  const blocksCount = useGame((state) => state.blocksCount);

  const characterModel = useGLTF(playerModelUrl);
  const texture = useTexture("/Previews/character-keeper.png");

  // Debug visuals: box representing capsule AABB (centered at body.y + COLLIDER_OFFSET_Y)
  const debugBoxGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const debugWireMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "cyan",
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      }),
    []
  );
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

  //   return unsubscribeSprint;
  // }, [subscribeKeys]);
  const SPAWN_Y = useMemo(() => {
    return GROUND_Y + capsuleHalf - COLLIDER_OFFSET_Y;
  }, [capsuleHalf]);

  // movement/speed/sprint logic is handled by `usePlayerTransform` hook in parent

  // 调试：列出材料，确认名字与结构
  // console.log('gltf materials:', characterModel.materials);
  // console.log('gltf scene children:', characterModel.scene.children.map(c => ({ name: c.name, material: c.material && (c.material.name || c.material.type) })));

  // 确保贴图编码正确
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  const { actions } = useAnimations(characterModel.animations, playerRef);
  // console.log('gltf animations:', characterModel.animations.map(a => a.name));

  const jump = useCallback(() => {
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
  }, [rapier, world]);

  const reset = useCallback(() => {
    if (!body.current) {
      return;
    }
    // 重置到根据地面和碰撞器计算出的 spawnY，保证胶囊底部贴地
    body.current.setTranslation({ x: 0, y: SPAWN_Y, z: 0 }, true);
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }, [SPAWN_Y]);

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
  }, [subscribeKeys, start, restart, reset, jump]);

  // Reusable vector to avoid allocations each frame
  const handPositionRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // If parent provided a controlled position, enforce it on the physics body
    if (position && body.current) {
      try {
        const playerWorldPos = body.current.translation();
        console.log("Player world position:", {
          x: playerWorldPos.x.toFixed(3),
          y: playerWorldPos.y.toFixed(3),
          z: playerWorldPos.z.toFixed(3),
        });
        body.current.setTranslation(
          { x: position[0], y: position[1], z: position[2] },
          true
        );
        // zero horizontal velocity so physics doesn't fight controller
        const cur = body.current.linvel();
        body.current.setLinvel({ x: 0, y: cur.y, z: 0 }, true);
      } catch (e) {
        // body might not be ready yet
      }
    }

    // Visual model follows physics body and applies external rotation if provided
    if (playerRef.current && body.current && modelRef.current) {
      const p = body.current.translation();
      const visualY =
        p.y +
        COLLIDER_OFFSET_Y -
        capsuleHalf -
        (modelBottomOffset.current || 0) +
        VISUAL_ADJUST;
      playerRef.current.position.set(p.x, visualY, p.z);

      // rotation: prefer controlled rotationY prop if provided, otherwise derive from velocity
      let targetY: number | null = null;
      if (typeof rotationY === "number") {
        targetY = rotationY;
      } else {
        const lv = body.current.linvel();
        const horiz = new THREE.Vector3(lv.x, 0, lv.z);
        if (horiz.length() > 0.25) {
          horiz.normalize();
          targetY = Math.PI - Math.atan2(horiz.x, -horiz.z);
        }
      }

      if (targetY !== null) {
        const targetQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, targetY, 0)
        );
        modelRef.current.quaternion.slerp(targetQuat, Math.min(1, 10 * delta));
      }

      // animation blending: prefer hook-provided weights if available
      if (actions) {
        const walk = actions["Walk"] || actions["walk"];
        const sprint = actions["sprint"];
        const lerpFAnim = Math.min(1, 10 * delta);

        const hasHookWeights =
          typeof walkWeight === "number" || typeof sprintWeight === "number";
        if (hasHookWeights) {
          const tw = walkWeight ?? 0;
          const ts = sprintWeight ?? 0;
          if (walk) {
            const prev = actionWeights.current.get(walk) ?? 0;
            const newW = THREE.MathUtils.lerp(prev, tw, lerpFAnim);
            walk.setEffectiveWeight(newW);
            actionWeights.current.set(walk, newW);
          }
          if (sprint) {
            const prev = actionWeights.current.get(sprint) ?? 0;
            const newW = THREE.MathUtils.lerp(prev, ts, lerpFAnim);
            sprint.setEffectiveWeight(newW);
            actionWeights.current.set(sprint, newW);
          }
        } else {
          const lv = body.current.linvel();
          const horiz = new THREE.Vector3(lv.x, 0, lv.z);
          const speed = horiz.length();
          if (walk) {
            const prev = actionWeights.current.get(walk) ?? 0;
            const targetWeight = speed > 0.25 ? 1 : 0;
            const newW = THREE.MathUtils.lerp(prev, targetWeight, lerpFAnim);
            walk.setEffectiveWeight(newW);
            actionWeights.current.set(walk, newW);
          }
        }
      }
    }

    // Camera / phase checks
    if (body && body.current) {
      const bodyPosition = body.current.translation();
      if (bodyPosition.z < -(blocksCount * 4 + 2)) {
        end();
      }
      if (bodyPosition.y < -4) {
        restart();
      }
    }

    // Held item follow: compute hand world pos and copy into held item
    if (!heldItem || !playerRef.current) {
      return;
    }

    const handPos = handPositionRef.current;
    handPos.set(0.3, 0.8, 0.5);
    handPos.applyMatrix4(playerRef.current.matrixWorld);

    if (heldItem.ref.current) {
      heldItem.ref.current.position.copy(handPos);
      const playerRotation = new THREE.Euler();
      playerRotation.setFromRotationMatrix(playerRef.current.matrixWorld);
      heldItem.ref.current.rotation.set(0, playerRotation.y, 0);
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
        position={position ?? [0, SPAWN_Y, 0]}
      >
        <CapsuleCollider
          sensor
          args={capsuleSize}
          position={[0, COLLIDER_OFFSET_Y, 0]}
          onIntersectionEnter={(event: IntersectionEnterPayload) => {
            const handle = event.other.collider?.handle;
            const sensorHandle = event.collider?.handle;
            if (typeof handle === "number") {
              onObstacleEnter?.(handle, sensorHandle);
            }
          }}
          onIntersectionExit={(event: IntersectionExitPayload) => {
            const handle = event.other.collider?.handle;
            if (typeof handle === "number") {
              onObstacleExit?.(handle);
            }
          }}
        />
        {/* Sensor collider in front of player to detect nearby obstacles */}
        {/* <CuboidCollider
          args={[0.35, 0.6, 0.35]}
          position={[0, COLLIDER_OFFSET_Y, -0.35]}
          sensor
          onIntersectionEnter={(event: IntersectionEnterPayload) => {
            const handle = event.other.collider?.handle;
            if (typeof handle === "number") {
              onObstacleEnter?.(handle);
            }
          }}
          onIntersectionExit={(event: IntersectionExitPayload) => {
            const handle = event.other.collider?.handle;
            if (typeof handle === "number") {
              onObstacleExit?.(handle);
            }
          }}
        /> */}
      </RigidBody>

      {/* 玩家视觉模型 */}
      <group ref={playerRef}>
        <primitive
          ref={modelRef}
          rotation={[0, rotationY, 0]}
          object={characterModel.scene}
          scale={1}
        />

        {/* <Float floatIntensity={0.25} rotationIntensity={0.25}>
          <Text
            font="/bebas-neue-v9-latin-regular.woff"
            scale={0.5}
            maxWidth={0.25}
            lineHeight={0.75}
            textAlign="right"
            position={[2.75, 0.65, 0]}
            rotation-y={-0.25}
          >
            {isHolding ? "📦 拿着物品" : "👤 玩家"}
            <meshBasicMaterial toneMapped={false} />
          </Text>
        </Float> */}
        {/* <mesh position={[0.3, 0.8, 0.5]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="red" />
        </mesh> */}
      </group>
    </>
  );
}
