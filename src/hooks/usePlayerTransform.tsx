import {
  getObstacleInfo,
  isObstacleHandle,
  type ObstacleInfo,
} from "@/obstacleRegistry";
import { useRapier } from "@react-three/rapier";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Dir type no longer used; kept for historic reference
// type Dir = "forward" | "back" | "left" | "right";

interface UsePlayerTransformOptions {
  initialPosition?: [number, number, number];
  initialRotationY?: number; // radians
  step?: number; // movement step (units per update)
}

export default function usePlayerTransform(
  opts: UsePlayerTransformOptions = {}
) {
  const {
    initialPosition = [0, 0, 0],
    initialRotationY = Math.PI,
    step = 1,
  } = opts;

  // position represents the physics body center position (world)
  const [position, setPositionState] = useState(() => ({
    x: initialPosition[0],
    y: initialPosition[1],
    z: initialPosition[2],
  }));

  const positionRef = useRef(
    new THREE.Vector3(position.x, position.y, position.z)
  );
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const [rotationY, setRotationY] = useState<number>(initialRotationY);
  const [walkWeight, setWalkWeight] = useState<number>(0);
  const [sprintWeight, setSprintWeight] = useState<number>(0);
  const walkWeightRef = useRef<number>(0);
  const sprintWeightRef = useRef<number>(0);
  const blockingObstaclesRef = useRef<Map<number, ObstacleInfo>>(new Map());
  const intentDirRef = useRef(new THREE.Vector3());
  const diffVecRef = useRef(new THREE.Vector3());
  const sensorHandleRef = useRef<number | null>(null);
  const { world } = useRapier();

  // move accepts full input state and delta (seconds)
  const move = useCallback(
    (
      input: {
        forward?: boolean;
        backward?: boolean;
        leftward?: boolean;
        rightward?: boolean;
        isSprinting?: boolean;
      },
      delta: number
    ) => {
      const {
        forward = false,
        backward = false,
        leftward = false,
        rightward = false,
        isSprinting = false,
      } = input;

      const inputX = (rightward ? 1 : 0) + (leftward ? -1 : 0);
      const inputZ = (forward ? -1 : 0) + (backward ? 1 : 0);
      const forwardIntent = forward && !backward;
      const intentDir = intentDirRef.current;
      intentDir.set(inputX, 0, inputZ);
      const hasIntent = intentDir.lengthSq() > 0;
      const normalizedIntent = hasIntent
        ? intentDir.clone().normalize()
        : new THREE.Vector3(0, 0, 0);
      const obstacleEntries = Array.from(
        blockingObstaclesRef.current.entries()
      );
      let shouldBlockForward = false;
      if (forwardIntent && obstacleEntries.length > 0 && hasIntent) {
        const frontThreshold = 0.65;
        const blockDistance = 0.6;
        const sensorHandle = sensorHandleRef.current;
        const physicsWorld = world;
        if (sensorHandle !== null && physicsWorld) {
          const sensorCollider = physicsWorld.getCollider(sensorHandle);
          if (sensorCollider) {
            for (const [handle] of obstacleEntries) {
              const obstacleCollider = physicsWorld.getCollider(handle);
              if (!obstacleCollider) {
                continue;
              }
              const contact = sensorCollider.contactCollider(
                obstacleCollider,
                blockDistance + 0.3
              );
              if (!contact) {
                continue;
              }
              const distanceBetween = Math.max(contact.distance, 0);
              if (distanceBetween > blockDistance) {
                continue;
              }
              const diffVec = diffVecRef.current;
              diffVec.set(
                contact.point2.x - contact.point1.x,
                0,
                contact.point2.z - contact.point1.z
              );
              if (diffVec.lengthSq() < 1e-6) {
                continue;
              }
              const dot = diffVec.clone().normalize().dot(normalizedIntent);
              if (dot > frontThreshold) {
                shouldBlockForward = true;
                break;
              }
            }
          }
        }
      }
      const effectiveInputZ = shouldBlockForward ? 0 : inputZ;
      const inputMoving = Math.abs(inputX) > 0 || Math.abs(effectiveInputZ) > 0;

      const maxSpeed = isSprinting ? step * 2 : step; // step used as base speed units/sec

      // desired velocity in local input space
      const desired = new THREE.Vector3(inputX, 0, effectiveInputZ);
      if (desired.lengthSq() > 1e-6) {
        desired.normalize().multiplyScalar(maxSpeed);
      }

      // smooth velocity
      const curVel = velocityRef.current;
      const lerpF = Math.min(1, 10 * delta);
      curVel.lerp(desired, lerpF);

      // integrate position
      positionRef.current.addScaledVector(curVel, delta);

      // rotation: prefer input direction; fallback to velocity direction
      if (inputMoving) {
        const dir = new THREE.Vector3(inputX, 0, effectiveInputZ).normalize();
        const yaw = Math.PI - Math.atan2(dir.x, -dir.z);
        setRotationY(yaw);
      } else if (curVel.length() > 0.25) {
        const horiz = new THREE.Vector3(curVel.x, 0, curVel.z).normalize();
        const yaw = Math.PI - Math.atan2(horiz.x, -horiz.z);
        setRotationY(yaw);
      }

      // publish position state
      const p = positionRef.current;
      setPositionState({ x: p.x, y: p.y, z: p.z });

      // compute animation weights and smooth them
      const desiredWalk = inputMoving ? 1 : 0;
      const desiredSprint = isSprinting && inputMoving ? 1 : 0;
      const wPrev = walkWeightRef.current ?? 0;
      const sPrev = sprintWeightRef.current ?? 0;
      const lerpFAnim = Math.min(1, 10 * delta);
      const newWalk = THREE.MathUtils.lerp(wPrev, desiredWalk, lerpFAnim);
      const newSprint = THREE.MathUtils.lerp(sPrev, desiredSprint, lerpFAnim);
      // set refs and states
      walkWeightRef.current = newWalk;
      sprintWeightRef.current = newSprint;
      setWalkWeight(newWalk);
      setSprintWeight(newSprint);
    },
    [step, world]
  );

  const onObstacleEnter = useCallback(
    (handle: number, sensorHandle?: number) => {
      if (!isObstacleHandle(handle)) {
        return;
      }
      if (
        typeof sensorHandle === "number" &&
        sensorHandleRef.current === null
      ) {
        sensorHandleRef.current = sensorHandle;
      }
      const info = getObstacleInfo(handle);
      if (!info) {
        return;
      }
      blockingObstaclesRef.current.set(handle, info);
    },
    []
  );

  const onObstacleExit = useCallback((handle: number) => {
    if (!isObstacleHandle(handle)) {
      return;
    }
    blockingObstaclesRef.current.delete(handle);
  }, []);

  const set = useCallback((pos: [number, number, number], rotY?: number) => {
    positionRef.current.set(pos[0], pos[1], pos[2]);
    setPositionState({ x: pos[0], y: pos[1], z: pos[2] });
    if (typeof rotY === "number") {
      setRotationY(rotY);
    }
  }, []);

  const asArrayPos = useMemo<[number, number, number]>(
    () => [position.x, position.y, position.z],
    [position]
  );

  return {
    position: asArrayPos,
    rotationY,
    move,
    set,
    setPosition: (pos: [number, number, number]) => set(pos),
    setRotationY,
    walkWeight,
    sprintWeight,
    // sensor handlers for Rapier collider events
    onObstacleEnter,
    onObstacleExit,
  };
}
