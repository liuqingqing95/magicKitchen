import { EFoodType } from "@/types/level";
import { MODEL_PATHS, TEXTURE_URLS, modelLoader } from "@/utils/loaderManager";
import { useLoader } from "@react-three/fiber";
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

type GrabModels = Record<string, THREE.Group>;
type ModelAnimations = Record<string, THREE.AnimationClip[]>;

interface ModelResourceContextValue {
  grabModels: GrabModels;
  loading: boolean;
  loadedCount: number;
  totalCount: number;
  progress: number; // 0-100
  textures: { [key in EFoodType]?: THREE.Texture };
  modelAnimations: ModelAnimations;
  // notify that N items have been instantiated/registered in-scene
  notifyReady: (count?: number) => void;
}

export const ModelResourceContext =
  React.createContext<ModelResourceContextValue>({
    grabModels: {},
    loading: true,
    loadedCount: 0,
    totalCount: 0,
    progress: 0,
    textures: {},
    modelAnimations: {},
    notifyReady: () => {},
  });

export const ModelResourceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [grabModels, setGrabModels] = useState<GrabModels>({});
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [modelAnimations, setModelAnimations] = useState<ModelAnimations>({});
  const [modelsLoadedDone, setModelsLoadedDone] = useState(false);

  const loader = useMemo(() => modelLoader, []);

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
          PRIORITY_TYPES.includes(type),
        );
        const GrabTypes = [
          "plate",
          "fireExtinguisher",
          "pan",
          "cuttingBoard",
          "dirtyPlate",
        ];
        const grabEntries = entries.filter(([type]) =>
          GrabTypes.includes(type),
        );
        const restEntries = entries.filter(
          ([type]) =>
            !PRIORITY_TYPES.includes(type) && !GrabTypes.includes(type),
        );
        // set total count for progress tracking
        if (mounted) {
          setTotalCount(PRIORITY_TYPES.length + GrabTypes.length); // we only count priority and grab types for loading progress
          setLoadedCount(0);
          setLoading(true);
        }
        // Helper to load an entry and set into grabModels
        // Helper to load an entry and set into grabModels
        const loadOne = async ([type, path]: [string, string]) => {
          const startTime = performance.now();
          const gltf: any = await new Promise((resolve, reject) => {
            loader.load(
              path,
              (g) => resolve(g),
              undefined,
              (e) => {
                console.log(e, type, "error loading model");
                return reject(e);
              },
            );
          });
          if (!mounted) return;
          const loadTime = performance.now() - startTime;
          console.log(`Model ${type} loaded in ${loadTime.toFixed(2)}ms`);

          const cloned = gltf.scene.clone(true) as THREE.Group;
          cloned.name = type;
          setGrabModels((prev) => ({ ...prev, [type]: cloned }));
          if (gltf.animations && gltf.animations.length > 0) {
            setModelAnimations((prev) => ({
              ...prev,
              [type]: gltf.animations,
            }));
          }
          // do not increment `loadedCount` here — we count readiness
          // only when components instantiate/register the models in-scene.
        };

        // 1) Load priority entries first (parallel among them)
        if (priorityEntries.length > 0) {
          await Promise.all(priorityEntries.map((e) => loadOne(e)));
        }
        if (grabEntries.length > 0) {
          await Promise.all(grabEntries.map((e) => loadOne(e)));
        }
        // 2) Then load the rest (parallel)
        if (restEntries.length > 0) {
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
          // mark that model files have finished loading; actual `loading`
          // should stay true until scene components signal readiness.
          setModelsLoadedDone(true);
          // if nothing needs to be instantiated (totalCount === 0), clear loading
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loader]);

  // Preload 2D textures for food icons using useLoader (works because this provider
  // is rendered inside the Canvas tree in this app). We map them by EFoodType key.
  const loadedTextures = useLoader(
    THREE.TextureLoader,
    TEXTURE_URLS as string[],
  );
  const textures = useMemo(() => {
    const keys: EFoodType[] = [
      EFoodType.bread,
      EFoodType.meatPatty,
      EFoodType.tomato,
      EFoodType.cheese,
    ];
    const map: { [key in EFoodType]?: THREE.Texture } = {};
    keys.forEach((k, i) => {
      const t = loadedTextures[i];
      map[k] = t;
    });
    return map;
  }, [loadedTextures]);

  const value = React.useMemo(
    () => ({
      grabModels,
      loading,
      loadedCount,
      totalCount,
      progress:
        totalCount > 0
          ? Math.min(Math.round((loadedCount / totalCount) * 100), 100)
          : 0,
      textures,
      modelAnimations,
      notifyReady: (count = 1) => {
        setLoadedCount((n) => {
          const next = n + (count || 1);
          // when all models have been instantiated and model files finished
          // loading, turn off the loading flag
          if (modelsLoadedDone && totalCount > 0 && next >= totalCount) {
            setLoading(false);
          }
          return next;
        });
      },
    }),
    [
      grabModels,
      loading,
      loadedCount,
      totalCount,
      textures,
      modelAnimations,
      modelsLoadedDone,
    ],
  );

  return (
    <ModelResourceContext.Provider value={value}>
      {children}
    </ModelResourceContext.Provider>
  );
};

export default ModelResourceContext;
