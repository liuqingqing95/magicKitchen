import store, {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@/stores/index";
import { EFoodType } from "@/types/level";
import { Burger } from "@/types/public";
import { ProgressUpdate } from "@/workers/progressWorker";
import { useMemo } from "react";
import {
  end as endAction,
  removeBurger as removeBurgerAction,
  restart as restartAction,
  setBurgers as setBurgersAction,
  setCanvasPosition as setCanvasPositionAction,
  setScore as setScoreAction,
  start as startAction,
  updateBurgerTime as updateBurgerTimeAction,
} from "./gameSlice";

export type GameAPI = {
  canvasPosition?: [number, number, number];
  score: number;
  burgers: Burger[];
  phase?: "ready" | "playing" | "ended";
  startTime?: number;
  endTime?: number;
  setCanvasPosition: (pos: [number, number, number]) => void;
  setBurger: (burgers: Burger[]) => void;
  removeBurger: (label: string) => void;
  updateBurgerTime: (time: ProgressUpdate[]) => void;
  start: () => void;
  end: () => void;
  restart: () => void;
  setScore: (type: EFoodType[]) => void;
};
export function useGame<T>(selector: (s: GameAPI) => T): T;
export function useGame(selector?: (s: GameAPI) => any) {
  const dispatch = useAppDispatch();
  const g = useAppSelector((s: RootState) => s.game);

  const api = useMemo<GameAPI>(() => {
    return {
      canvasPosition: g.canvasPosition,
      score: g.score,
      burgers: g.burgers,
      phase: g.phase,
      startTime: g.startTime,
      endTime: g.endTime,
      setCanvasPosition: (pos: [number, number, number]) =>
        dispatch(setCanvasPositionAction(pos)),
      setBurger: (burgers: Burger[]) => dispatch(setBurgersAction(burgers)),
      removeBurger: (label: string) => dispatch(removeBurgerAction(label)),
      updateBurgerTime: (time: ProgressUpdate[]) =>
        dispatch(updateBurgerTimeAction(time)),
      start: () => dispatch(startAction()),
      end: () => dispatch(endAction()),
      restart: () => dispatch(restartAction()),
      setScore: (n: EFoodType[]) => dispatch(setScoreAction(n)),
    };
  }, [g, dispatch]);

  if (typeof selector === "function") return selector(api as GameAPI);
  return api;
}

// Provide getState compatibility used by utilities
useGame.getState = () => {
  const s = store.getState().game;
  return {
    canvasPosition: s.canvasPosition,
    score: s.score,
    burgers: s.burgers,
    phase: s.phase,
    startTime: s.startTime,
    endTime: s.endTime,
    updateBurgerTime: (time: ProgressUpdate[]) =>
      store.dispatch(updateBurgerTimeAction(time)),
    setCanvasPosition: (pos: [number, number, number]) =>
      store.dispatch(setCanvasPositionAction(pos)),
    setBurger: (burgers: Burger[]) => store.dispatch(setBurgersAction(burgers)),
    start: () => store.dispatch(startAction()),
    end: () => store.dispatch(endAction()),
    restart: () => store.dispatch(restartAction()),
    removeBurger: (label: string) => store.dispatch(removeBurgerAction(label)),
    setScore: (n: EFoodType[]) => store.dispatch(setScoreAction(n)),
  } as GameAPI;
};

export default useGame;
