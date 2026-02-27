import { store } from "@/stores";
import { KeyboardControls, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ReactNode, useContext, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { GrabContextProvider } from "./context/GrabContext.tsx";
import {
  ModelResourceContext,
  ModelResourceProvider,
} from "./context/ModelResourceContext";
import Experience from "./Experience.tsx";
import { MenuGoals, Score, TimeRemaining } from "./Goals.tsx";
import { useGameCanvasPosition } from "./stores/useGame.tsx";
import "./style.css";

const ViewPresets: Record<
  string,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, 0, 13], target: [0, 0, 0] },
  top: { position: [0, 20, 0], target: [0, 0, 0] },
  side: { position: [30, 0, 0], target: [0, 0, 0] },
};
const ViewControls = () => {
  const controlsRef = useRef<any>(null);
  // const [, get] = useKeyboardControls();
  // const [subscribeKeys] = useKeyboardControls();
  // const controTarget = useGameControlsTarget();
  // useEffect(() => {
  //   if (!controlsRef.current) return;

  //   const logCamera = () => {
  //     const camera = controlsRef.current.object;
  //     const target = controlsRef.current.target;
  //     console.log("Camera Position:", [
  //       camera.position.x.toFixed(2),
  //       camera.position.y.toFixed(2),
  //       camera.position.z.toFixed(2),
  //     ]);
  //     console.log("Controls Target:", [
  //       target.x.toFixed(2),
  //       target.y.toFixed(2),
  //       target.z.toFixed(2),
  //     ]);
  //   };

  //   // 初始打印
  //   // logCamera();
  //   // controlsRef.current.object.lookAt(new THREE.Vector3(...controTarget));
  //   // 监听变化
  //   controlsRef.current.addEventListener("change", logCamera);
  // }, []);

  // useEffect(() => {
  //   const unsub = subscribeKeys(
  //     (state) => [state.viewFront, state.viewTop, state.viewSide],
  //     ([front, top, side]) => {
  //       if (front) {
  //         // camera.position.set(...ViewPresets.front.position);
  //         // controlsRef.current?.target.set(...ViewPresets.front.target);
  //         setCanvasPosition(ViewPresets.front.position);
  //       } else if (top) {
  //         // camera.position.set(...ViewPresets.top.position);
  //         // controlsRef.current?.target.set(...ViewPresets.top.target);
  //         setCanvasPosition(ViewPresets.top.position);
  //       } else if (side) {
  //         // camera.position.set(...ViewPresets.side.position);
  //         // controlsRef.current?.target.set(...ViewPresets.side.target);
  //         setCanvasPosition(ViewPresets.side.position);
  //       }

  //       controlsRef.current?.update();
  //     },
  //   );
  //   return unsub;
  // }, [setCanvasPosition]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      // target={controTarget}
      zoomSpeed={0.6}
      panSpeed={0.5}
      rotateSpeed={0.5}
      // target={ViewPresets.front.target}
    />
  );
};
const CanvasWrapper = ({ children }: { children: ReactNode }) => {
  const canvasPosition = useGameCanvasPosition();

  useEffect(() => {
    console.log("canvasPosition", canvasPosition);
  }, [canvasPosition]);

  return (
    <Canvas
      shadows
      camera={{
        fov: 60,
        near: 0.1,
        far: 200,
        position: canvasPosition,
      }}
    >
      <KeyboardControls
        map={[
          // 玩家1 - 方向键
          { name: "firstPForward", keys: ["ArrowUp"] },
          { name: "firstPBackward", keys: ["ArrowDown"] },
          { name: "firstPLeftward", keys: ["ArrowLeft"] },
          { name: "firstPRightward", keys: ["ArrowRight"] },
          // 玩家1其他控制
          { name: "firstPHandleIngredient", keys: ["ControlRight"] },
          { name: "firstPGrab", keys: ["ShiftRight"] },
          { name: "firstPSprint", keys: ["AltRight"] },

          // 玩家2 -  WASD键
          { name: "secondPForward", keys: ["KeyW"] },
          { name: "secondPBackward", keys: ["KeyS"] },
          { name: "secondPLeftward", keys: ["KeyA"] },
          { name: "secondPRightward", keys: ["KeyD"] },
          // 玩家2其他控制
          { name: "secondPHandleIngredient", keys: ["ControlLeft"] },
          { name: "secondPGrab", keys: ["ShiftLeft"] },
          { name: "secondPSprint", keys: ["AltLeft"] },
        ]}
      >
        {/* ModelResourceProvider lives inside Canvas. The Suspense boundary is placed
              outside the Canvas (in App) because the Suspense fallback renders a DOM
              node which cannot be a child of the <Canvas>. */}

        {children}
        {/* <LoadingManager /> */}
      </KeyboardControls>
    </Canvas>
  );
};

// Simple fallback shown while Suspense boundary is pending (before provider mounts)

// LoadingManager listens to ModelResourceContext.loading and shows an overlay with status
function LoadingManager() {
  const ctx = useContext(ModelResourceContext);
  if (!ctx) return null;
  const { loadedCount, totalCount, progress } = ctx;
  if (progress === 100) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 320,
          padding: 12,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 8 }}>模型加载中… {progress}%</div>
        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#4caf50",
              borderRadius: 4,
              transition: "width 200ms linear",
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
          {loadedCount}/{totalCount} 已加载
        </div>
      </div>
    </div>
  );
}

function App() {
  // Prevent browser default Alt shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <GrabContextProvider>
      <ModelResourceProvider>
        {/* <Suspense fallback={<LoadingManager />}> */}
        <CanvasWrapper>
          <Experience />

          <ViewControls />
        </CanvasWrapper>
        {/* </Suspense> */}
        <LoadingManager />
        <TimeRemaining></TimeRemaining>
      </ModelResourceProvider>
      {/* <Interface /> */}
      <MenuGoals></MenuGoals>
      <Score></Score>
    </GrabContextProvider>
  );
}

const root = ReactDOM.createRoot(document.querySelector("#root")!);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
