import { GrabContext } from "@/context/GrabContext";
import { useContext, useRef, useSyncExternalStore } from "react";

function shallowEqual(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null) return false;
  if (typeof b !== "object" || b === null) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

export default function useGrabSelector<T>(selector: (api: any) => T): T {
  const { grabSystemApi } = useContext(GrabContext);
  if (!grabSystemApi) return selector({} as any);

  // Cache last selected snapshot and return the same reference when equal
  const lastRef = useRef<{ value?: T }>({ value: undefined });

  const subscribe = (cb: () => void) => grabSystemApi.subscribe(cb);

  const getSnapshot = () => {
    const next = selector(grabSystemApi);
    const prev = lastRef.current.value;
    // If primitive or small object with same shallow contents, reuse previous reference
    if (prev !== undefined && shallowEqual(prev, next)) {
      return prev as T;
    }
    lastRef.current.value = next;
    return next;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
