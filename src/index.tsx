import {
  KeyboardControls,
  OrbitControls,
  useKeyboardControls,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import Experience from "./Experience.tsx";
import Interface from "./Interface";
import useGame from "./stores/useGame.tsx";
import "./style.css";

const ViewPresets: Record<
  string,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, 0, 13], target: [0, 0, 0] },
  top: { position: [0, 20, 0], target: [0, 0, 0] },
  side: { position: [30, 0, 0], target: [0, 0, 0] },
};

function ViewControls() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [, get] = useKeyboardControls();
  const [subscribeKeys] = useKeyboardControls();
  const setCanvasPosition = useGame((state) => state.setCanvasPosition);

  useEffect(() => {
    const unsub = subscribeKeys(
      (state) => [state.viewFront, state.viewTop, state.viewSide],
      ([front, top, side]) => {
        if (front) {
          camera.position.set(...ViewPresets.front.position);
          controlsRef.current?.target.set(...ViewPresets.front.target);
          setCanvasPosition(ViewPresets.front.position);
        } else if (top) {
          camera.position.set(...ViewPresets.top.position);
          controlsRef.current?.target.set(...ViewPresets.top.target);
          setCanvasPosition(ViewPresets.top.position);
        } else if (side) {
          camera.position.set(...ViewPresets.side.position);
          controlsRef.current?.target.set(...ViewPresets.side.target);
          setCanvasPosition(ViewPresets.side.position);
        }

        controlsRef.current?.update();
      }
    );
    return unsub;
  }, [camera]);

  return null;
}

function App() {
  // useEffect(() => {
  //   preloadModels();
  // }, []);
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
      <Canvas
        shadows
        camera={{
          fov: 75,
          near: 0.1,
          far: 200,
          position: [1, 15, 10],
          // position: ViewPresets.front.position,
        }}
      >
        <Experience />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.5}
          // target={ViewPresets.front.target}
        />
        <ViewControls />
      </Canvas>
      <Interface />
    </KeyboardControls>
  );
}

const root = ReactDOM.createRoot(document.querySelector("#root")!);
root.render(<App />);
