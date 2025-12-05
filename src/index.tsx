import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import ReactDOM from "react-dom/client";
import Experience from "./Experience.tsx";
import Interface from "./Interface";
import "./style.css";

const root = ReactDOM.createRoot(document.querySelector("#root")!);

root.render(
  <KeyboardControls
    map={[
      { name: "forward", keys: ["ArrowUp", "KeyW"] },
      { name: "backward", keys: ["ArrowDown", "KeyS"] },
      { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
      { name: "rightward", keys: ["ArrowRight", "KeyD"] },
      { name: "jump", keys: ["Space"] },
    ]}
  >
    <Canvas
      shadows
      camera={{
        fov: 75,
        near: 0.1,
        far: 200,
        position: [0, 10, 10],
      }}
    >
      <Experience />
      {/* <OrbitControls
        enableZoom={true} // 允许缩放
        enablePan={true} // 允许平移
        enableRotate={true} // 允许旋转
        zoomSpeed={0.6} // 缩放速度
        panSpeed={0.5} // 平移速度
        rotateSpeed={0.5} // 旋转速度
      /> */}
    </Canvas>
    <Interface />
  </KeyboardControls>
);
