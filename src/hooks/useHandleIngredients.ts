import { IHandleIngredientDetail } from "@/types/public";
import { useEffect, useRef, useState } from "react";

export default function useHandleIngredients() {
  const [handleIngredients, setHandleIngredients] = useState<
    IHandleIngredientDetail[]
  >([]);

  const intervalRef = useRef<Map<string, NodeJS.Timeout | null>>(new Map());

  const handleIngredientsRef = useRef<IHandleIngredientDetail[]>([]);
  const completeListenersRef = useRef<
    Map<string, Set<(detail: IHandleIngredientDetail) => void>>
  >(new Map());

  useEffect(() => {
    handleIngredientsRef.current = handleIngredients;
  }, [handleIngredients]);

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      intervalRef.current.forEach((t) => {
        if (t) clearInterval(t);
      });
      intervalRef.current.clear();
    };
  }, []);

  const setIngredientStatus = (id: string, status: false | number) => {
    setHandleIngredients((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newObj = { ...p, status };
          if (status === 5) {
            const listeners = completeListenersRef.current.get(id);
            if (listeners) {
              listeners.forEach((cb) => cb(newObj));
            }
          }
          return newObj;
        }
        return p;
      }),
    );
  };

  const addIngredient = (item: IHandleIngredientDetail) => {
    setHandleIngredients((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const hasTimer = (id: string) => {
    return !!intervalRef.current.get(id);
  };

  const stopTimer = (id: string) => {
    const t = intervalRef.current.get(id);
    if (t) {
      clearInterval(t);
      intervalRef.current.set(id, null);
    }
  };

  const toggleTimer = (id: string) => {
    const existing = intervalRef.current.get(id);
    if (existing) {
      // otherwise clear existing timer
      clearInterval(existing);
      intervalRef.current.set(id, null);
      return;
    }

    const ing = handleIngredientsRef.current.find((i) => i.id === id);
    if (!ing) return;
    if (ing.status === 5) return;

    intervalRef.current.set(
      id,
      setInterval(() => {
        setHandleIngredients((current) => {
          return current.map((obj) => {
            if (obj.id === id) {
              if (typeof obj.status === "number" && obj.status < 5) {
                const newStatus = obj.status + 1;
                if (newStatus === 5) {
                  const t = intervalRef.current.get(id);
                  if (t) {
                    clearInterval(t);
                    intervalRef.current.set(id, null);
                  }
                  // notify complete listeners
                  const newObj = {
                    ...obj,
                    status: newStatus,
                  } as IHandleIngredientDetail;
                  const listeners = completeListenersRef.current.get(id);
                  if (listeners) {
                    listeners.forEach((cb) => cb(newObj));
                  }
                }
                return { ...obj, status: newStatus };
              }
              const newStatus = obj.status === false ? 1 : obj.status;
              return { ...obj, status: newStatus };
            }
            return obj;
          });
        });
      }, 1000),
    );
  };

  const getTimer = (id: string) => intervalRef.current.get(id);

  const addCompleteListener = (
    id: string,
    cb: (detail: IHandleIngredientDetail) => void,
  ) => {
    let set = completeListenersRef.current.get(id);
    if (!set) {
      set = new Set();
      completeListenersRef.current.set(id, set);
    }
    set.add(cb);
    return () => {
      const s = completeListenersRef.current.get(id);
      s?.delete(cb);
      if (s && s.size === 0) completeListenersRef.current.delete(id);
    };
  };

  const removeAllCompleteListeners = (id: string) => {
    completeListenersRef.current.delete(id);
  };

  const cleanupTimers = () => {
    intervalRef.current.forEach((t) => {
      if (t) clearInterval(t);
    });
    intervalRef.current.clear();
  };

  return {
    handleIngredients,
    addIngredient,
    setHandleIngredients,
    setIngredientStatus,
    toggleTimer,
    stopTimer,
    hasTimer,
    getTimer,
    addCompleteListener,
    removeAllCompleteListeners,
    handleIngredientsRef,
    cleanupTimers,
  };
}
