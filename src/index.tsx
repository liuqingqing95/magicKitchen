import { store } from "@/stores";
import { KeyboardControls, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { GrabContextProvider } from "./context/GrabContext.tsx";
import Experience from "./Experience.tsx";
import { MenuGoals, Score, TimeRemaining } from "./Goals.tsx";
import Interface from "./Interface";
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
  // const setCanvasPosition = useGame((s) => s.setCanvasPosition);
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
const CanvasWrapper = ({ children }: { children: React.ReactNode }) => {
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
        // position: ViewPresets.front.position,
      }}
    >
      {children}
    </Canvas>
  );
};

function App() {
  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "KeyW"] },
        { name: "backward", keys: ["ArrowDown", "KeyS"] },
        { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
        { name: "rightward", keys: ["ArrowRight", "KeyD"] },
        { name: "jump", keys: ["Space"] },
        { name: "viewFront", keys: ["Digit1"] },
        { name: "viewTop", keys: ["Digit2"] },
        { name: "viewSide", keys: ["Digit3"] },
      ]}
    >
      <GrabContextProvider>
        <CanvasWrapper>
          <Experience />

          <ViewControls />
        </CanvasWrapper>
        <Interface />
        <MenuGoals></MenuGoals>
        <Score></Score>
        <TimeRemaining></TimeRemaining>
      </GrabContextProvider>
    </KeyboardControls>
  );
}

const root = ReactDOM.createRoot(document.querySelector("#root")!);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
