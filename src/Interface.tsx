import { useKeyboardControls } from "@react-three/drei";
import { addEffect } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import useGame, {
  useGameEndTime,
  useGamePhase,
  useGameStartTime,
} from "./stores/useGame";

export default function Interface() {
  const time = useRef<HTMLDivElement>(null);

  const restart = useGame((state) => state.restart);

  const forward = useKeyboardControls((state) => state.forward);
  const backward = useKeyboardControls((state) => state.backward);
  const leftward = useKeyboardControls((state) => state.leftward);
  const rightward = useKeyboardControls((state) => state.rightward);
  const jump = useKeyboardControls((state) => state.jump);
  const startTime = useGameStartTime();
  const endTime = useGameEndTime();
  const phase = useGamePhase();
  useEffect(() => {
    const unsubscribeEffect = addEffect(() => {
      let elapsedTime = 0;
      if (phase === "playing") {
        elapsedTime = Date.now() - startTime;
      } else if (phase === "ended") {
        elapsedTime = endTime - startTime;
      }
      elapsedTime /= 1000;
      elapsedTime = parseInt(elapsedTime.toFixed(2));
      if (time.current) {
        time.current.textContent = elapsedTime.toString();
      }
    });
    return () => {
      unsubscribeEffect();
    };
  }, []);

  return (
    <div className="interface">
      {/* Time */}
      <div ref={time} className="time">
        0.00
      </div>

      {/* Restart */}
      {phase === "ended" && (
        <div className="restart" onClick={restart}>
          Restart
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="raw">
          <div className={`key ${forward ? "active" : ""}`}></div>
        </div>
        <div className="raw">
          <div className={`key ${leftward ? "active" : ""}`}></div>
          <div className={`key ${backward ? "active" : ""}`}></div>
          <div className={`key ${rightward ? "active" : ""}`}></div>
        </div>
        <div className="raw">
          <div className={`key large ${jump ? "active" : ""}`}></div>
        </div>
      </div>
    </div>
  );
}
