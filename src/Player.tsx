import { useAnimations, useKeyboardControls } from "@react-three/drei";
import {
  CapsuleCollider,
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { useGrabNear } from "@/hooks/useGrabNear";
import {
  useGrabObstacleStore,
  useRealHighlight,
} from "@/stores/useGrabObstacle";
import { Collider } from "@dimforge/rapier3d-compat/geometry/collider";
import { useFrame } from "@react-three/fiber";

import React from "react";
import { COLLISION_PRESETS } from "./constant/collisionGroups";
import ModelResourceContext from "./context/ModelResourceContext";
import { GrabItem } from "./GrabItem";
import { useGrabSystem } from "./hooks/useGrabSystem";
import useProgressBar from "./hooks/useProgressBar";
import {
  useFurnitureObstacleStore,
  useHighlightId,
  useRegistryFurniture,
} from "./stores/useFurnitureObstacle";
import { useGameCanvasPosition, useGameControlsTarget } from "./stores/useGame";
import { EGrabType, IGrabPosition, TPLayerId } from "./types/level";
import { EDirection } from "./types/public";
import { getRotation } from "./utils/util";

interface PlayerProps {
  onPositionUpdate?: (position: [number, number, number]) => void;
  // playerModelUrl?: string;
  // heldItem?: GrabbedItem | null;
  // foodType: EFoodType | EGrabType | null;
  initialPositionRef: React.MutableRefObject<[number, number, number]>;
  direction: EDirection.normal;
  isCutting: boolean;
  // isReleasing:boolean
  playerId: TPLayerId;
}
// 位置：[Player.tsx](src/Player.tsx#L380-L440)

export const Player = forwardRef<THREE.Group, PlayerProps>(
  (
    {
      onPositionUpdate,
      initialPositionRef,
      // foodType,
      isCutting,
      // heldItem,
      // isReleasing,
      // playerModelUrl = "/character-keeper.glb",
      direction,
      playerId,
    }: PlayerProps,
    ref,
  ) => {
    const prevTableHighLight = useRef<string | false>(false);
    const { grabModels, modelAnimations, loading } =
      useContext(ModelResourceContext);
    const grabSystem = useGrabSystem(playerId);
    useProgressBar(playerId);
    const { heldItem } = grabSystem;
    const { setRealHighlight, getObstacleInfo, getGrabOnFurniture } =
      useGrabObstacleStore((s) => {
        return {
          getObstacleInfo: s.getObstacleInfo,
          getGrabOnFurniture: s.getGrabOnFurniture,
          setRealHighlight: s.setRealHighlight,
        };
      });
    const realHighLight = useRealHighlight(playerId);
    const { setHighlightId } = useFurnitureObstacleStore((s) => ({
      setHighlightId: s.setHighlightId,
    }));

    const registryFurniture = useRegistryFurniture();
    const highlightIds = useHighlightId();
    // 获取当前玩家的高亮ID
    const highlightId = highlightIds[playerId];

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

    const cameraPosition = useGameCanvasPosition();
    const cameraTarget = useGameControlsTarget();
    const [capsuleSize, setCapsuleSize] = useState<[number, number]>([
      0.5, 0.7,
    ]);
    const [subscribeKeys, getKeys] = useKeyboardControls();

    // const { updateObstaclePosition, getObstacleInfo } = useObstacleStore();

    const playerPositionRef = useRef<[number, number, number]>(
      initialPositionRef.current,
    );
    // const lastReportedRef = useRef<number>(0);
    // const { rapier, world } = useRapier();
    // const start = useGame((state) => state.start);
    // const end = useGame((state) => state.end);
    // const restart = useGame((state) => state.restart);
    // const blocksCount = useGame((state) => state.blocksCount);
    const isGrabActionPlay = useRef<"food" | "plate" | false>(false);
    const isCuttingActionPlay = useRef(false);
    const characterModel = useMemo(() => {
      if (!grabModels.player) return null;
      if (playerId === "firstPlayer") {
        return grabModels.player;
      } else {
        return grabModels.player2;
      }
    }, [grabModels.player, grabModels.player2]);

    // const characterModel2 = useGLTF(MODEL_PATHS.overcooked.player2);

    const {
      isHighLight,
      getFurnitureNearest,
      getGrabNearest,
      highlightedGrabIds,
      furnitureNearList,
    } = useGrabNear(playerPositionRef, playerId);
    // const [highlightedFurniture, setHighlightedFurniture] = useState<
    //   IFurniturePosition | false
    // >(false);
    useEffect(() => {
      console.log("realHighLight", realHighLight, highlightedGrabIds);
    }, [realHighLight]);

    useEffect(() => {
      if (!highlightId) {
        if (!highlightedGrabIds) {
          setRealHighlight(playerId, false);
          return;
        }
        const newGrab = getGrabNearest(heldItem?.id) as IGrabPosition;

        setRealHighlight(playerId, newGrab ? newGrab.id : false);
      } else {
        const tableId = getGrabOnFurniture(highlightId);
        const grab = getObstacleInfo(tableId || "");
        if (grab) {
          setRealHighlight(playerId, grab.id);
          return;
        } else {
          setRealHighlight(playerId, false);
        }
      }
    }, [
      getGrabNearest,
      getObstacleInfo,
      highlightedGrabIds,
      heldItem?.id,
      highlightId,
      playerId,
    ]);

    useEffect(() => {
      if (furnitureNearList.length === 0) {
        setHighlightId(playerId, false);
        return;
      }
      const newFurniture = getFurnitureNearest();

      setHighlightId(playerId, newFurniture ? newFurniture.id : false);
    }, [playerId, getFurnitureNearest, furnitureNearList.length]);

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

    // 根据 playerId 获取对应的键盘键名 - 使用 useMemo 避免每次渲染重新创建
    const keyNames = useMemo(() => {
      const keyPrefix = playerId === "firstPlayer" ? "firstP" : "secondP";
      return {
        forward: `${keyPrefix}Forward` as const,
        backward: `${keyPrefix}Backward` as const,
        leftward: `${keyPrefix}Leftward` as const,
        rightward: `${keyPrefix}Rightward` as const,
        grab: `${keyPrefix}Grab` as const,
        handleIngredient: `${keyPrefix}HandleIngredient` as const,
        sprint: `${keyPrefix}Sprint` as const,
      };
    }, [playerId]);

    useEffect(() => {
      // 监听 sprint 状态
      const unsubscribeSprint = subscribeKeys(
        (state) => state[keyNames.sprint],
        (value) => {
          console.log(`Sprint (${playerId}):`, value);
          setIsSprinting(value);
        },
      );

      return unsubscribeSprint;
    }, [playerId]);

    // 冲刺释放后的滑行冲量（数值可调，越大滑的越远）
    const SPRINT_GLIDE_IMPULSE = 1;

    // 调试：列出材料，确认名字与结构
    // console.log('gltf materials:', characterModel.materials);
    // console.log('gltf scene children:', characterModel.scene.children.map(c => ({ name: c.name, material: c.material && (c.material.name || c.material.type) })));

    // 确保贴图编码正确
    // texture.colorSpace = THREE.SRGBColorSpace;
    // texture.flipY = false;
    // 多玩家碰撞状态：每个玩家对应一个碰撞家具的 Record
    const hasCollided = useRef<Map<TPLayerId, Record<string, boolean>>>(
      new Map([
        ["firstPlayer", {}],
        ["secondPlayer", {}],
      ]),
    );
    // store a reference to the rigid bodies we've collided with so we can
    // query their world positions later when deciding to clear stale highlights
    const hasCollidedBodies = useRef<Record<string, RapierRigidBody | null>>(
      {},
    );
    const { actions } = useAnimations(modelAnimations?.player || [], playerRef);
    // console.log('gltf animations:', characterModel.animations.map(a => a.name));

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
      if (!Object.values(actions).length) return;

      const grabAction = actions["grabPlate"] || actions["grabFood"];
      const handDownAction =
        actions["handDownPlate"] || actions["handDownFood"];
      // const cutRotationAction = actions["cutRotation"];

      if (!grabAction || !handDownAction) return;

      // 初始化动画设置
      [grabAction, handDownAction].forEach((action) => {
        if (!action) return;
        action.reset();
        action.clampWhenFinished = true;
        action.setLoop(THREE.LoopOnce, 1);
        action.setEffectiveWeight(0);
        action.timeScale = 1;
      });
      // if (isCutting) {
      //   cutRotationAction.reset().play();
      //   cutRotationAction.setEffectiveWeight(1);
      //   // 切割动画
      // } else {
      //   // isCuttingActionPlay.current = true;
      //   cutRotationAction.setEffectiveWeight(0);
      //   cutRotationAction.stop();
      // }
      if (!heldItem?.id) return;
      const foodType = getObstacleInfo(heldItem.id)?.type;
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
    }, [heldItem?.id, isCutting, actions]);

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
      // if (bodyRef.current) {
      //   updatePlayerHandle(bodyRef.current?.handle);
      // }

      if (playerRef.current) {
        const box = new THREE.Box3().setFromObject(playerRef.current);
        const size = box.getSize(new THREE.Vector3());
        playerSize.current = size;
        // 根据模型尺寸计算胶囊体参数
        const radius = Math.max(size.x, size.z) * 0.5; // 宽度取80%
        const height = size.y - 2 * radius - 0.1; //(size.y / 2); // 高度取90%
        const center = box.getCenter(new THREE.Vector3());
        console.log("包围盒中心:", center);
        // setCapsuleSize([radius, height]);
        playerRef.current.rotation.y = getRotation(direction)[1];
        // If the physics body already exists, align its rotation to the visual
      }
      return () => {
        // unsubscribeReset();
        // unsubscribeJump();
        // unsubscribeAny();
      };
    }, [characterModel]);

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
    useEffect(() => {
      if (heldItem?.id && realHighLight !== false) {
        const id = heldItem.id;
        // 移除当前玩家对该物品的碰撞记录
        const playerCollisions = hasCollided.current.get(playerId);
        if (playerCollisions) {
          playerCollisions[id] = false;
        }
        isHighLight(id, false);
      }
    }, [heldItem?.id, playerId]);

    useFrame((state, delta) => {
      // gather input - 使用对应玩家的键盘控制
      const keys = getKeys();

      const forward = keys[keyNames.forward];
      const backward = keys[keyNames.backward];
      const leftward = keys[keyNames.leftward];
      const rightward = keys[keyNames.rightward];
      const inputX = (rightward ? 1 : 0) + (leftward ? -1 : 0);
      const inputZ = (forward ? -1 : 0) + (backward ? 1 : 0);
      const inputMoving = Math.abs(inputX) > 0 || Math.abs(inputZ) > 0;

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
          // keep physics body rotation in sync with visual rotation so
          // colliders (children of the RigidBody) follow player's facing
          if (bodyRef.current) {
            const q = playerRef.current.quaternion;
            bodyRef.current.setRotation(
              { x: q.x, y: q.y, z: q.z, w: q.w },
              true,
            );
          }
        }

        // const bodyPosition = bodyRef.current.translation();

        // const cameraPosition = new THREE.Vector3();
        // cameraPosition.copy(bodyPosition);
        // cameraPosition.z += 0.01;
        // cameraPosition.y += 0.01;

        // const cameraTarget = new THREE.Vector3();
        // cameraTarget.copy(bodyPosition);
        // cameraTarget.y += 0.01;
        // // const smoothedCameraPosition = new THREE.Vector3(
        // //   cameraPosition.x,
        // //   cameraPosition.y,
        // //   cameraPosition.z,
        // // );
        // // smoothedCameraPosition.lerp(cameraPosition, 5 * delta);
        // const smoothedCameraTarget = new THREE.Vector3(
        //   cameraTarget.x,
        //   cameraTarget.y,
        //   cameraTarget.z,
        // );
        // smoothedCameraTarget.lerp(cameraTarget, 5 * delta);

        // // state.camera.position.copy(smoothedCameraPosition);
        // state.camera.lookAt(smoothedCameraTarget);
      }
    });

    const handleCollisionEnter = useCallback(
      (other: any) => {
        const rigidBody = other.rigidBody;
        if (rigidBody) {
          const id = rigidBody.userData.id;
          const playerCollisions = hasCollided.current.get(playerId);
          if (playerCollisions && !playerCollisions[id]) {
            playerCollisions[id] = true;
            console.log(`玩家 ${playerId} 首次碰撞家具：${id}`);
            isHighLight(id, true);
          }
        }
        // console.log("Player Sensor enter", other);
      },
      [playerId],
    );

    const handleCollisionExit = useCallback(
      (other: any) => {
        const rigidBody = other.rigidBody;
        if (rigidBody) {
          const id = rigidBody.userData.id;
          console.log(`玩家 ${playerId} 离开家具：${id}`);
          const playerCollisions = hasCollided.current.get(playerId);
          if (playerCollisions) {
            playerCollisions[id] = false;
          }
          isHighLight(id, false);
        }
      },
      [playerId],
    );

    // useEffect(() => {
    //   if (onPositionUpdate) {
    //     onPositionUpdate(playerPosition);
    //   }
    // }, [playerPosition]);
    // Small child component subscribes only to `isHolding` so Player avoids re-renders
    const sensorCollider = () => {
      return (
        <>
          <CuboidCollider
            args={[1.4, (capsuleSize[1] + capsuleSize[0]) / 2, 0.7]}
            sensor={true}
            position={[
              0,
              -(1.5 * capsuleSize[1] + 1.5 * capsuleSize[0]) / 4 - 0.2,
              0.5,
            ]}
            onIntersectionEnter={handleCollisionEnter}
            onIntersectionExit={handleCollisionExit}
          />
          {/* <group>
            {Array.from({ length: 5 }).map((_, i) => {
              const segments = 5;
              const angle = -Math.PI / 2 + (i / (segments - 1)) * Math.PI; // -90deg -> 90deg
              const R = Math.max(1.2, (capsuleSize[0] + capsuleSize[1]) * 0.6);
              const x = Math.sin(angle) * R;
              const z = Math.cos(angle) * R; // forward is +Z
              const y =
                -(1.5 * capsuleSize[1] + 1.5 * capsuleSize[0]) / 4 - 0.4;
              return (
                <CapsuleCollider
                  key={i}
                  args={[0.6, 0.4]}
                  position={[x, y, z]}
                  sensor={true}
                  onIntersectionEnter={handleCollisionEnter}
                  onIntersectionExit={handleCollisionExit}
                />
              );
            })}
          </group> */}
        </>
      );
    };

    console.log(
      "Player render:",
      direction,
      isCutting,
      initialPositionRef.current,
      playerId,
    );

    return (
      registryFurniture && (
        <>
          <group position={initialPositionRef.current} ref={playerRef}>
            {/* <Flashlight playerRef={playerRef} /> */}

            <RigidBody
              type="dynamic"
              ref={bodyRef}
              canSleep={false}
              restitution={0.2}
              friction={0.5}
              linearDamping={0.5}
              angularDamping={0.5}
              colliders={false}
              userData={playerId}
              enabledTranslations={[true, false, true]}
              enabledRotations={[false, false, false]}
            >
              <CapsuleCollider
                collisionGroups={COLLISION_PRESETS.PLAYER}
                sensor={false}
                args={capsuleSize}
              />
              {sensorCollider()}
            </RigidBody>
            {/* <GrabSystemProvider grabSystem={grabSystem}> */}
            <GrabItem
              playerPositionRef={playerPositionRef}
              playerRef={playerRef}
              grabSystem={grabSystem}
              playerId={playerId}
            />
            {/* </GrabSystemProvider> */}
            {characterModel && (
              <primitive
                position={[0, 0, 0]}
                object={characterModel}
                scale={0.8}
              />
            )}
          </group>
        </>
      )
    );
  },
);
export default React.memo(Player);
Player.displayName = "Player";
