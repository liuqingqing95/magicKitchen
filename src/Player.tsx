import {
  useAnimations,
  useGLTF,
  useKeyboardControls,
  useTexture,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import useGame from "./stores/useGame";

import { useMemo } from "react";

export default function Player() {
  const [isSprinting, setIsSprinting] = useState(false); // 标记是否加速
  const body = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
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

  const { rapier, world } = useRapier();
  const [smoothedCameraPosition] = useState(
    () => new THREE.Vector3(10, 10, 10)
  );
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3());
  const start = useGame((state) => state.start);
  const end = useGame((state) => state.end);
  const restart = useGame((state) => state.restart);
  const blocksCount = useGame((state) => state.blocksCount);

  const hamburger = useGLTF("/character-keeper.glb");
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
  // console.log('gltf materials:', hamburger.materials);
  // console.log('gltf scene children:', hamburger.scene.children.map(c => ({ name: c.name, material: c.material && (c.material.name || c.material.type) })));

  // 确保贴图编码正确
  texture.encoding = THREE.sRGBEncoding;
  texture.flipY = false;
  const { actions } = useAnimations(hamburger.animations, modelRef);
  // console.log('gltf animations:', hamburger.animations.map(a => a.name));

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
      body.current.applyImpulse({ x: 0, y: 0.5, z: 0 });
    }
  };

  const reset = () => {
    if (!body.current) {
      return;
    }
    // 重置到根据地面和碰撞器计算出的 spawnY，保证胶囊底部贴地
    body.current.setTranslation({ x: 0, y: SPAWN_Y, z: 0 });
    // body.current.setTranslation({ x: 0, y: 1, z: 0 })
    body.current.setLinvel({ x: 0, y: 0, z: 0 });
    body.current.setAngvel({ x: 0, y: 0, z: 0 });
  };

  useEffect(() => {
    if (!hamburger?.scene) {
      return;
    }

    // 克隆一份并应用与渲染相同的 transform（scale/rotation）
    const tmp = hamburger.scene.clone(true);
    tmp.scale.set(1, 1, 1);
    tmp.rotation.set(0, Math.PI, 0);
    tmp.updateMatrixWorld(true);

    // 逐个网格计算 world-space 包围盒，兼容 SkinnedMesh
    const totalBox = new THREE.Box3();
    let any = false;

    tmp.traverse((node) => {
      if (!node.isMesh) {
        return;
      }

      // 确保矩阵更新
      node.updateMatrixWorld(true);

      if (node.isSkinnedMesh) {
        // 对 SkinnedMesh，要基于当前骨骼变换计算顶点 bbox
        // 将 geometry 的 bbox 先计算出，再把 bbox 用 mesh.matrixWorld 变换到世界空间
        const geom = node.geometry;
        if (!geom.boundingBox) {
          geom.computeBoundingBox();
        }
        const gb = geom.boundingBox.clone();
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
          const gb = geom.boundingBox.clone();
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
  }, [hamburger]);

  useEffect(() => {
    if (actions) {
      // 初始化动画函数
      const initializeAnimation = (action, timeScale = 1) => {
        if (action) {
          action.reset();
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          action.setEffectiveWeight(0); // 初始权重为 0
          action.timeScale = timeScale; // 设置动画播放速度
        }
      };

      // 初始化 walk 动画
      const walk = actions["Walk"] || actions["walk"];
      console.log(walk, "dddd");
      initializeAnimation(walk);

      // 初始化 sprint 动画
      const sprint = actions["sprint"];
      initializeAnimation(sprint);
    }
  }, [actions]);

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

    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
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

  useFrame((state, delta) => {
    const { forward, backward, leftward, rightward } = getKeys();

    // 计算输入方向
    const inputX = (rightward ? 1 : 0) + (leftward ? -1 : 0);
    const inputZ = (forward ? -1 : 0) + (backward ? 1 : 0);
    const inputMoving = Math.abs(inputX) > 0 || Math.abs(inputZ) > 0;

    // 如果刚刚从冲刺状态释放（上一帧为冲刺，当前不是冲刺），并且有移动输入，则施加一次前向冲量让角色滑行更自然
    if (prevSprinting.current && !isSprinting && inputMoving && body.current) {
      const forwardDir = new THREE.Vector3(0, 0, -1);
      if (modelRef.current) {
        forwardDir.applyQuaternion(modelRef.current.quaternion);
        forwardDir.y = 0;
        forwardDir.normalize();
      } else {
        // 回退到刚体当前速度方向
        const lv = body.current.linvel();
        forwardDir.set(lv.x, 0, lv.z);
        if (forwardDir.lengthSq() < 1e-6) {
          forwardDir.set(0, 0, -1);
        }
        forwardDir.normalize();
      }

      // 应用一次性冲量
      body.current.applyImpulse({
        x: forwardDir.x * SPRINT_GLIDE_IMPULSE,
        y: 0,
        z: forwardDir.z * SPRINT_GLIDE_IMPULSE,
      });
    }

    // 根据是否冲刺调整速度
    // const baseSpeed = 1; // walk 状态速度
    // const sprintMultiplier = 2; // 冲刺速度倍数
    const maxSpeed = isSprinting ? 8 : 4;

    const target = new THREE.Vector3(inputX, 0, inputZ);
    if (target.lengthSq() > 1e-6) {
      target.normalize().multiplyScalar(maxSpeed);
    }

    // 平滑设置刚体水平速度
    if (body.current) {
      const cur = body.current.linvel();
      const lerpF = Math.min(1, 10 * delta);
      const nx = THREE.MathUtils.lerp(cur.x, target.x, lerpF);
      const nz = THREE.MathUtils.lerp(cur.z, target.z, lerpF);
      body.current.setLinvel({ x: nx, y: cur.y, z: nz });
    }

    // 控制动画权重
    if (actions) {
      const walk = actions["Walk"] || actions["walk"];
      const sprint = actions["sprint"];

      if (inputMoving) {
        if (isSprinting && sprint) {
          // 播放 sprint 动画
          const sprintWeight = 1;
          const prevSprint = sprint.getEffectiveWeight
            ? sprint.getEffectiveWeight()
            : sprint._effectiveWeight || 0;
          const newSprintW = THREE.MathUtils.lerp(
            prevSprint,
            sprintWeight,
            Math.min(1, 10 * delta)
          );
          sprint.setEffectiveWeight(newSprintW);
          sprint._effectiveWeight = newSprintW;

          // 减少 walk 动画权重
          if (walk) {
            const adjustedWalkWeight = Math.max(
              0,
              walk._effectiveWeight - newSprintW
            );
            walk.setEffectiveWeight(adjustedWalkWeight);
            walk._effectiveWeight = adjustedWalkWeight;
          }
        } else if (walk) {
          // 播放 walk 动画
          const walkWeight = 1;
          const prevWalk = walk.getEffectiveWeight
            ? walk.getEffectiveWeight()
            : walk._effectiveWeight || 0;
          const newWalkW = THREE.MathUtils.lerp(
            prevWalk,
            walkWeight,
            Math.min(1, 10 * delta)
          );
          walk.setEffectiveWeight(newWalkW);
          walk._effectiveWeight = newWalkW;

          // 减少 sprint 动画权重
          if (sprint) {
            const adjustedSprintWeight = Math.max(
              0,
              sprint._effectiveWeight - newWalkW
            );
            sprint.setEffectiveWeight(adjustedSprintWeight);
            sprint._effectiveWeight = adjustedSprintWeight;
          }
        }
      } else {
        // 停止所有动画
        if (walk) {
          walk.setEffectiveWeight(0);
          walk._effectiveWeight = 0;
        }
        if (sprint) {
          sprint.setEffectiveWeight(0);
          sprint._effectiveWeight = 0;
        }
      }
    }

    /**
     * Controls
     */
    const { forward: f, backward: b, leftward: l, rightward: r } = getKeys();
    // console.log('forward:', forward, 'backward:', backward, 'leftward:', leftward, 'rightward:', rightward);
    const moving = f || b || l || r;

    // const impulse = { x: 0, y: 0, z: 0 }
    // const torque = { x: 0, y: 0, z: 0 }

    // const impulseStrength = 0.6 * delta
    // const torqueStrength = 0.2 * delta

    // if(forward)
    // {
    //     impulse.z -= impulseStrength
    //     torque.x -= torqueStrength
    // }

    // if(rightward)
    // {
    //     impulse.x += impulseStrength
    //     torque.z -= torqueStrength
    // }

    // if(backward)
    // {
    //     impulse.z += impulseStrength
    //     torque.x += torqueStrength
    // }

    // if(leftward)
    // {
    //     impulse.x -= impulseStrength
    //     torque.z += torqueStrength
    // }

    // body.current.applyImpulse(impulse)
    // body.current.applyTorqueImpulse(torque)

    // // 同步可视模型位置但不应用刚体旋转（避免摔倒）
    // if(modelRef.current && body.current){
    //     const p = body.current.translation()
    //     // 根据模型原点与刚体的偏移调整 y
    //     modelRef.current.position.set(p.x, p.y - 0.3, p.z)
    //     // 保持模型直立：只允许 y 轴旋转（可选）
    //     // modelRef.current.rotation.set(0, modelRef.current.rotation.y, 0)
    // }

    // // 简单控制动画：有移动就播放 walk，否则暂停
    // if(actions){
    //     const walk = actions['Walk'] || actions['walk'] || Object.values(actions)[0]
    //     if(walk){
    //         if(moving){
    //             walk.paused = false
    //             walk.timeScale = 1
    //         } else {
    //             walk.paused = true
    //         }
    //     }
    // }

    // 计算目标水平速度
    // const targetInputX = ((r ? 1 : 0) + (l ? -1 : 0));
    // const targetInputZ = ((f ? -1 : 0) + (b ? 1 : 0));
    // const targetMaxSpeed = 30
    // const obj = new THREE.Vector3(targetInputX, 0, targetInputZ)
    // // console.log('Target vector:', target);
    // if(obj.lengthSq() > 1e-6) obj.normalize().multiplyScalar(targetMaxSpeed)

    // 平滑设置刚体水平速度（保留 y）
    if (body.current) {
      const cur = body.current.linvel();
      const lerpF = Math.min(1, 10 * delta);
      const nx = THREE.MathUtils.lerp(cur.x, target.x, lerpF);
      const nz = THREE.MathUtils.lerp(cur.z, target.z, lerpF);
      if (moving) {
        console.log("Current velocity:", cur, "Target velocity:", target);
      }

      // body.current.setLinvel({ x: nx, y: cur.y, z: nz })

      // // 防止翻滚：清零角速度并提高角阻尼
      // body.current.setAngvel({ x: 0, y: 0, z: 0 })

      // const pos = body.current.translation()
      // const bottomY = pos.y + COLLIDER_OFFSET_Y - (capsuleRadius + capsuleHeight / 2)
      // if (bottomY < GROUND_Y) {
      //     const correctY = GROUND_Y + (capsuleRadius + capsuleHeight / 2) - COLLIDER_OFFSET_Y
      //     body.current.setTranslation({ x: pos.x, y: correctY, z: pos.z })
      //     // 清零竖直速度以避免再次穿透
      //     const cur = body.current.linvel()
      //     body.current.setLinvel({ x: cur.x, y: 0, z: cur.z })
      // }
      body.current.setLinvel({ x: nx, y: cur.y, z: nz });
      // 防止翻滚：清零角速度（可保留）
      body.current.setAngvel({ x: 0, y: 0, z: 0 });
      // 读取位置用于可视同步 / 调试，但不修改 body 的 y
      const pos = body.current.translation();
    }

    // 可视模型只跟随位置并控制朝向/动画
    if (modelRef.current && body.current) {
      const p = body.current.translation();
      // modelRef.current.position.set(p.x, p.y - 0.3, p.z)
      // 用 COLLIDER_OFFSET_Y 保持可视模型与碰撞器对齐（之前用 -0.3）
      // 把刚体位置和模型底部对齐：body.y + COLLIDER_OFFSET_Y 对应模型底部的 world y
      // modelBottomOffset 是模型在 modelRef 空间的底部 y（通常 <= 0），因此我们做 p.y + COLLIDER_OFFSET_Y - modelBottomOffset
      const visualY =
        p.y +
        COLLIDER_OFFSET_Y -
        capsuleHalf -
        (modelBottomOffset.current || 0) +
        VISUAL_ADJUST;
      modelRef.current.position.set(p.x, visualY, p.z);
      const lv = body.current.linvel();
      const horiz = new THREE.Vector3(lv.x, 0, lv.z);
      const speed = horiz.length();
      // 优先依据玩家输入决定朝向/动画，避免碰撞瞬时速度干扰
      const { forward, backward, leftward, rightward } = getKeys();
      // 计算输入方向，冲刺时放大 1.5 倍
      const inputX = (rightward ? 1 : 0) + (leftward ? -1 : 0);
      const inputZ = (forward ? -1 : 0) + (backward ? 1 : 0);
      const inputMoving = Math.abs(inputX) > 0 || Math.abs(inputZ) > 0;
      // 计算目标朝向：优先用输入方向，输入为空再回退到刚体速度方向（且速度需超过阈值）
      let hasTarget = false;
      let targetY = 0;
      if (inputMoving) {
        const dir = new THREE.Vector3(inputX, 0, inputZ).normalize();
        targetY = Math.PI - Math.atan2(dir.x, -dir.z); // 保持与 primitive 初始朝向一致
        hasTarget = true;
      } else if (speed > 0.25) {
        // 小阈值避免被轻微碰撞扰动
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

      // 控制 walk 和 sprint 动画权重：优先依据输入（按输入开/关与强度），碰撞推动不会立刻触发动画
      if (actions) {
        const sprint = actions["sprint"]; // 获取 sprint 动画
        const walk =
          actions["Walk"] || actions["walk"] || Object.values(actions)[0]; // 获取 walk 动画

        if (walk) {
          const inputSpeed = Math.min(
            1,
            (inputMoving ? Math.sqrt(inputX * inputX + inputZ * inputZ) : 0) *
              (maxSpeed > 0 ? 1 : 0)
          );
          const targetWeight = inputMoving ? inputSpeed : 0;
          const prev = walk.getEffectiveWeight
            ? walk.getEffectiveWeight()
            : walk._effectiveWeight || 0;
          const newW = THREE.MathUtils.lerp(
            prev,
            targetWeight,
            Math.min(1, 10 * delta)
          );
          walk.setEffectiveWeight(newW);
          walk._effectiveWeight = newW;
        }

        if (sprint && isSprinting) {
          // 如果正在冲刺，增加 sprint 动画权重，减少 walk 动画权重
          const sprintWeight = isSprinting && inputMoving ? 1 : 0; // 冲刺时权重为 1，否则为 0
          const prevSprint = sprint.getEffectiveWeight
            ? sprint.getEffectiveWeight()
            : sprint._effectiveWeight || 0;
          const newSprintW = THREE.MathUtils.lerp(
            prevSprint,
            sprintWeight,
            Math.min(1, 10 * delta)
          );
          sprint.setEffectiveWeight(newSprintW);
          sprint._effectiveWeight = newSprintW;

          // 同时减少 walk 动画权重（如果 sprint 动画权重增加）
          if (walk) {
            const adjustedWalkWeight = Math.max(
              0,
              walk._effectiveWeight - newSprintW
            );
            walk.setEffectiveWeight(adjustedWalkWeight);
            walk._effectiveWeight = adjustedWalkWeight;
          }
        }
      }

      // update debug capsule wireframe to match capsule AABB center and size
      // if (capsuleWireRef.current) {
      //   const centerY = p.y + COLLIDER_OFFSET_Y
      //   capsuleWireRef.current.position.set(p.x, centerY, p.z)
      //   capsuleWireRef.current.scale.set(capsuleRadius * 2, 2 * capsuleHalf, capsuleRadius * 2)
      // }
    }

    /**
     * Camera
     */
    const bodyPosition = body.current.translation();
    // 更新 prevSprinting 标志以便下一帧能检测到冲刺释放
    prevSprinting.current = isSprinting;

    // const cameraPosition = new THREE.Vector3()
    // cameraPosition.copy(bodyPosition)
    // cameraPosition.z += 2.25
    // cameraPosition.y += 0.65

    // const cameraTarget = new THREE.Vector3()
    // cameraTarget.copy(bodyPosition)
    // cameraTarget.y += 0.25

    // smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
    // smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

    // state.camera.position.copy(smoothedCameraPosition)
    // state.camera.lookAt(smoothedCameraTarget)

    /**
     * Phases
     */
    if (bodyPosition.z < -(blocksCount * 4 + 2)) {
      end();
    }

    if (bodyPosition.y < -4) {
      restart();
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
        position={[0, 1, 0]}
      >
        {/* <mesh castShadow>
            <icosahedronGeometry args={ [ 0.3, 1 ] } />
            <meshStandardMaterial flatShading color="mediumpurple" />
        </mesh> */}
        <CapsuleCollider
          args={capsuleSize}
          position={[0, COLLIDER_OFFSET_Y, 0]}
        />
        {/* <CapsuleCollider args={[capsuleRadius, capsuleHeight]} position={[0, COLLIDER_OFFSET_Y, 0]} /> */}
      </RigidBody>
      <primitive
        ref={modelRef}
        rotation={[0, Math.PI, 0]}
        object={hamburger.scene}
        scale={1}
      />
    </>
  );
}
