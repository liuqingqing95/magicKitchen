import { MODEL_PATHS } from "@/utils/loaderManager";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

type GrabModels = Record<string, THREE.Group>;

interface ModelResourceContextValue {
  grabModels: GrabModels;
  loading: boolean;
  loadModel: (type: string, path: string) => Promise<void>;
}

export const ModelResourceContext =
  React.createContext<ModelResourceContextValue>({
    grabModels: {},
    loading: true,
    loadModel: async () => {},
  });

export const ModelResourceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [grabModels, setGrabModels] = useState<GrabModels>({});
  const [loading, setLoading] = useState(true);

  const loader = useMemo(() => new GLTFLoader(), []);

  const loadModel = useCallback(
    async (type: string, path: string) => {
      const startTime = performance.now();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          path,
          (g) => resolve(g),
          undefined,
          (err) => reject(err)
        );
      });
      const loadTime = performance.now() - startTime;
      console.log(`Model ${type} loaded in ${loadTime.toFixed(2)}ms`);

      const cloned = gltf.scene.clone(true) as THREE.Group;
      cloned.name = type;
      setGrabModels((prev) => ({ ...prev, [type]: cloned }));
    },
    [loader]
  );

  useEffect(() => {
    // preload all grab types defined in MODEL_PATHS
    const entries: Array<[string, string]> = [];
    const totalStartTime = performance.now();
    for (const key in MODEL_PATHS) {
      const set = (MODEL_PATHS as any)[key];
      for (const type in set) {
        entries.push([type, set[type]]);
      }
    }
    console.log(`Starting to load ${entries.length} models...`);
    let mounted = true;
    (async () => {
      try {
        // Define a priority list of model types used by the Level (overcooked kit)
        const PRIORITY_TYPES = [
          "floor",
          "baseTable",
          "gasStove",
          // "breadTable",
          // "tomatoTable",
          // "meatPattyTable",
          // "cheeseTable",
          "drawerTable",
          "trash",
          "cuttingBoard",
          "serveDishes",
          "stockpot",
          "washSink",
          "pan",
          "plate",
        ];

        const priorityEntries = entries.filter(([type]) =>
          PRIORITY_TYPES.includes(type)
        );
        const restEntries = entries.filter(
          ([type]) => !PRIORITY_TYPES.includes(type)
        );

        // Helper to load an entry and set into grabModels
        // Helper to load an entry and set into grabModels
        const loadOne = async ([type, path]: [string, string]) => {
          const startTime = performance.now();
          const gltf: any = await new Promise((resolve, reject) => {
            loader.load(
              path,
              (g) => resolve(g),
              undefined,
              (e) => reject(e)
            );
          });
          if (!mounted) return;
          const loadTime = performance.now() - startTime;
          console.log(`Model ${type} loaded in ${loadTime.toFixed(2)}ms`);

          const cloned = gltf.scene.clone(true) as THREE.Group;
          cloned.name = type;
          setGrabModels((prev) => ({ ...prev, [type]: cloned }));
        };

        // 1) Load priority entries first (parallel among them)
        if (priorityEntries.length > 0) {
          // eslint-disable-next-line no-console
          console.debug(
            "ModelResourceProvider: loading priority entries",
            priorityEntries.map((e) => e[0])
          );
          await Promise.all(priorityEntries.map((e) => loadOne(e)));
        }

        // 2) Then load the rest (parallel)
        if (restEntries.length > 0) {
          // eslint-disable-next-line no-console
          console.debug(
            "ModelResourceProvider: loading remaining entries",
            restEntries.length
          );
          await Promise.all(restEntries.map((e) => loadOne(e)));
        }
      } catch (e) {
        // surface the error so it's visible during development
        // eslint-disable-next-line no-console
        console.error("ModelResourceProvider load error:", e);
      } finally {
        if (mounted) {
          const totalTime = performance.now() - totalStartTime;
          console.log(`All models loaded in ${totalTime.toFixed(2)}ms`);
          console.log("Loading summary:");
          Object.entries(grabModels).forEach(([key]) => {
            console.log(`- ${key}`);
          });
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loader]);

  const value = React.useMemo(
    () => ({ grabModels, loading, loadModel }),
    [grabModels, loading, loadModel]
  );

  return (
    <ModelResourceContext.Provider value={value}>
      {children}
    </ModelResourceContext.Provider>
  );
};

export default ModelResourceContext;
