import { EFoodType, EGrabType, GrabbedItem, IFoodWithRef } from "@/types/level";
import { Collider as RapierCollider } from "@dimforge/rapier3d-compat";
import { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

type GrabbedColliderState = {
  collider: RapierCollider;
  prevSensor: boolean;
};

const disableColliders = (rigidBody: RapierRigidBody) => {
  const states: GrabbedColliderState[] = [];
  const count = rigidBody?.numColliders() || 0;
  for (let i = 0; i < count; i += 1) {
    const collider = rigidBody.collider(i);
    if (!collider) continue;
    states.push({ collider, prevSensor: collider.isSensor() });
    collider.setSensor(true);
  }
  return states;
};

const restoreColliders = (states: GrabbedColliderState[] | null) => {
  if (!states) return;
  states.forEach((state) => {
    state.collider.setSensor(state.prevSensor);
  });
};

export const getOffset = (foodType: EFoodType | EGrabType, posY: number) => {
  let offsetZ = 1.4;
  switch (foodType) {
    case EGrabType.plate:
    case EGrabType.fireExtinguisher:
      offsetZ = 1.4;
      break;
    case EFoodType.tomato:
      offsetZ = 1.3;
      break;
    case EGrabType.pan:
      offsetZ = 1.2;
      break;
    case EFoodType.burger:
    case EFoodType.cheese:
    case EFoodType.meatPatty:
      offsetZ = 1.2;
      break;
    default:
      offsetZ = 1.4;
  }
  return new THREE.Vector3(0, posY || 0, offsetZ);
};

type StoreState = {
  heldItem: GrabbedItem | null;
  isReleasing: boolean;
};

const subscribers = new Set<() => void>();
let grabbedColliders: GrabbedColliderState[] | null = null;
let state: StoreState = { heldItem: null, isReleasing: false };

function notify() {
  subscribers.forEach((cb) => cb());
}

export const grabStore = {
  getState(): StoreState {
    return state;
  },
  subscribe(cb: () => void) {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  },
  grabItem(food: IFoodWithRef, customRotation?: THREE.Euler) {
    if (state.heldItem) {
      console.warn("Already holding an item");
      return;
    }
    const itemRef = food.ref;
    const rb = itemRef.current?.rigidBody;
    if (rb) {
      grabbedColliders = disableColliders(rb);
    }
    state = {
      ...state,
      heldItem: {
        ref: itemRef,
        offset: getOffset(food.type, food.grabbingPosition?.inHand || 0),
        rotation: customRotation,
      },
    };
    notify();
  },
  releaseItem() {
    if (state.heldItem) {
      state = { ...state, isReleasing: true };
      restoreColliders(grabbedColliders);
      grabbedColliders = null;
      state = { ...state, heldItem: null };
      notify();
    }
  },
  updateGrabPosition(position: THREE.Vector3) {
    if (state.heldItem) {
      // clone to avoid accidental shared mutation
      state = {
        ...state,
        heldItem: {
          ...state.heldItem,
          offset: position.clone(),
        },
      };
      notify();
    }
  },
  holdStatus() {
    return !!state.heldItem;
  },
  isHolding() {
    return !!state.heldItem;
  },
};

export default grabStore;
