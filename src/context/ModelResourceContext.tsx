import { EFoodType } from "@/types/level";
import { MODEL_PATHS, TEXTURE_URLS, getLoader } from "@/utils/loaderManager";
import { useLoader } from "@react-three/fiber";
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

type GrabModels = Record<string, THREE.Group>;
type ModelAnimations = Record<string, THREE.AnimationClip[]>;

interface ModelResourceContextValue {
  grabModels: GrabModels;
  loading: boolean;
  loadedCount: string[];
  totalCount: string[];
  progress: number; // 0-100
  textures: { [key in EFoodType]?: THREE.Texture };
  modelAnimations: ModelAnimations;
  // notify that N items have been instantiated/registered in-scene
  notifyReady: (type: string) => void;
}

export const ModelResourceContext =
  React.createContext<ModelResourceContextValue>({
    grabModels: {},
    loading: true,
    loadedCount: [],
    totalCount: [],
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
  const [loadedCount, setLoadedCount] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<string[]>([]);
  const [modelAnimations, setModelAnimations] = useState<ModelAnimations>({});
  const [modelsLoadedDone, setModelsLoadedDone] = useState(false);

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
    let loaderInstance: GLTFLoader | null = null;
    let mounted = true;
    (async () => {
      try {
        loaderInstance = await getLoader();
        // Define a priority list of model types used by the Level (overcooked kit)
        const PRIORITY_TYPES = [
          "floor",
          "baseTable",
          "breadTable",
          "tomatoTable",
          "meatPattyTable",
          "cheeseTable",
          "player",
          "player2",
          // "foodTable",
          "gasStove",
          // "player",
          "drawerTable",
          "trash",
          // "cuttingBoard",
          "serveDishes",
          // "stockpot",
          "washSink",
          // "pan",
        ];
        // const arr = PRIORITY_TYPES.filter(
        //   (item) => item !== "foodTable" && item !== "player",
        // ).concat(
        //   "breadTable",
        //   "tomatoTable",
        //   "meatPattyTable",
        //   "cheeseTable",
        //   "player",
        //   "player2",
        // );
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
          setTotalCount([...PRIORITY_TYPES, ...GrabTypes]); // we only count priority and grab types for loading progress
          setLoadedCount([]);
          setLoading(true);
        }
        // Helper to load an entry and set into grabModels
        // Helper to load an entry and set into grabModels
        const loadOne = async ([type, path]: [string, string]) => {
          const startTime = performance.now();
          const gltf: any = await new Promise((resolve, reject) => {
            if (!loaderInstance) return;
            loaderInstance.load(
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

        for (const entry of priorityEntries) {
          await loadOne(entry);
        }

        for (const entry of grabEntries) {
          await loadOne(entry);
        }
        for (const entry of restEntries) {
          await loadOne(entry);
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
  }, []);

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
        totalCount.length > 0
          ? Math.min(
              Math.round((loadedCount.length / totalCount.length) * 100),
              100,
            )
          : 0,
      textures,
      modelAnimations,
      notifyReady: (type: string) => {
        if (!totalCount.includes(type)) return;
        setLoadedCount((n) => {
          const next = [...n, type];
          // when all models have been instantiated and model files finished
          // loading, turn off the loading flag
          if (
            modelsLoadedDone &&
            totalCount.length > 0 &&
            next.length >= totalCount.length
          ) {
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
