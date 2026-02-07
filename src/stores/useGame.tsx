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
  setReceiveFood as setReceiveFoodAction,
  setScore as setScoreAction,
  start as startAction,
  updateBurgerTime as updateBurgerTimeAction,
} from "./gameSlice";

export type GameAPI = {
  setCanvasPosition: (pos: [number, number, number]) => void;
  setBurger: (burgers: Burger[]) => void;
  removeBurger: (label: string) => void;
  updateBurgerTime: (time: ProgressUpdate[]) => void;
  start: () => void;
  end: () => void;
  restart: () => void;
  setScore: (type: EFoodType[]) => void;
  setReceiveFood: (b: boolean) => void;
};
export function useGame<T>(selector: (s: GameAPI) => T): T;
export function useGame(selector?: (s: GameAPI) => any) {
  const dispatch = useAppDispatch();
  // const g = useAppSelector((s: RootState) => s.game);

  const api = useMemo<GameAPI>(() => {
    return {
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
      setReceiveFood: (b: boolean) => dispatch(setReceiveFoodAction(b)),
    };
  }, [dispatch]);

  if (typeof selector === "function") return selector(api as GameAPI);
  return api;
}

// Provide getState compatibility used by utilities
useGame.getState = () => {
  return {
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
    setReceiveFood: (b: boolean) => store.dispatch(setReceiveFoodAction(b)),
  } as GameAPI;
};

export default useGame;

export const useGameReceiveFood = () =>
  useAppSelector((s: RootState) => s.game.receiveFood);
// Narrow selector hooks for precise subscriptions
export const useGameCanvasPosition = () =>
  useAppSelector((s: RootState) => s.game.canvasPosition);

export const useGameScore = () =>
  useAppSelector((s: RootState) => s.game.score);

export const useGameBurgers = () =>
  useAppSelector((s: RootState) => s.game.burgers);

export const useGamePhase = () =>
  useAppSelector((s: RootState) => s.game.phase);

export const useGameStartTime = () =>
  useAppSelector((s: RootState) => s.game.startTime);

export const useGameEndTime = () =>
  useAppSelector((s: RootState) => s.game.endTime);
