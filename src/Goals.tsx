import styles from "@/style/goals.module.less";
import classNames from "classnames";
import * as Comlink from "comlink";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import useGame, { useGameBurgers, useGameScore } from "./stores/useGame";
import { useRegistryGrab } from "./stores/useGrabObstacle";
import { EFoodType } from "./types/level";
import { Burger } from "./types/public";
import type {
  ProgressUpdate,
  ProgressWorkerAPI,
} from "./workers/progressWorker";
export const types = [
  [{ name: EFoodType.bread }, { name: EFoodType.meatPatty }],
  [
    { name: EFoodType.bread },
    { name: EFoodType.tomato },
    { name: EFoodType.meatPatty },
  ],
  [
    { name: EFoodType.bread },
    { name: EFoodType.tomato },
    { name: EFoodType.cheese },
    { name: EFoodType.meatPatty },
  ],
];
export const MenuGoals = () => {
  const { removeBurger, updateBurgerTime, setBurgers } = useGame((state) => ({
    updateBurgerTime: state.updateBurgerTime,
    setBurgers: state.setBurger,
    removeBurger: state.removeBurger,
  }));
  const burgers = useGameBurgers();
  const registryGrab = useRegistryGrab();

  // const [burgers, setBurgers] = useState<Burger[]>([]);
  const [workerConnected, setWorkerConnected] = useState(false);
  const burgersRef = useRef<Burger[]>([]);
  const cbRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    burgersRef.current = burgers;
  }, [burgers]);
  // 生成单个汉堡的函数
  const generateBurger = (): Burger => {
    const materials = types[Math.floor(Math.random() * types.length)];

    const expiresAt = Date.now() + 60000; // 60秒后到期

    return {
      label: `${EFoodType.burger}-${Date.now()}`, // 使用时间戳确保唯一性
      materials: materials.map((m) => m.name),
      score: materials.length * 20,
      timeLeft: 60,
      isActive: true,
      expiresAt,
      progressPercentage: 100,
    };
  };

  // 生成1-3个汉堡
  const generateMultipleBurgers = () => {
    const count = Math.floor(Math.random() * 3) + 1; // 生成1-3个
    const newBurgers = Array.from({ length: count }, generateBurger);
    setBurgers(newBurgers);
  };

  // 初始生成汉堡
  useEffect(() => {
    generateMultipleBurgers();
  }, []);

  // 使用 Comlink worker 处理倒计时并推送进度更新到主线程
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<ProgressWorkerAPI> | null>(null);
  useEffect(() => {
    if (registryGrab) {
      const cb = Comlink.proxy((updates: ProgressUpdate[]) => {
        const hamberger = updates.find((item) => item.progress === 0);
        if (hamberger) {
          flushSync(() => {
            removeBurger(hamberger.label);
          });
        }
        const arr = updates.map((u) => ({
          label: u.label,
          timeLeftSec: u.timeLeftSec,
          isActive: u.isActive,
          progress: u.progress,
        }));

        updateBurgerTime(arr);
      });

      cbRef.current = cb;
      apiRef.current?.subscribe(cb).then(() => {
        setWorkerConnected(true);
        // send current burgers with fresh expiresAt so progress starts from 100%
        try {
          const payload = burgersRef.current.map((b) => ({
            label: b.label,
            expiresAt: Date.now() + b.timeLeft * 1000,
          }));
          apiRef.current?.setBurgers(payload).catch(() => {});
        } catch (e) {}
      });

      // 初次检查并根据当前数量启动/不启动定时器
      startIntervalIfNeeded();

      const unsubscribe = () => {
        if (intervalRef.current != null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      return () => {
        unsubscribe();
      };
    }
  }, [registryGrab]);

  const startIntervalIfNeeded = useCallback(() => {
    // 如果当前数量 < 3，启动一个定时器：每 10s 补 1 个，直到总数达到 6
    // 当 burgers 数量变化时，如果变为 <3 启动定时器，或变为 >=6 停止定时器
    const current = burgers.length;
    if (current >= 6) return; // 已经够多，别启动
    if (current < 3 && intervalRef.current == null) {
      intervalRef.current = window.setInterval(() => {
        const cur = burgers.length;
        if (cur >= 6) {
          if (intervalRef.current != null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        // const maxAdd = Math.min(6 - cur, 3);
        // const addCount = Math.min(maxAdd, Math.floor(Math.random() * 3) + 1);
        const newBurgers = generateBurger();
        setBurgers([newBurgers]);
      }, 10000);
    }
  }, []);

  // 监听 burgers.length 的变化，在变化时启动或停止定时器
  useEffect(() => {
    startIntervalIfNeeded();
    if (burgers.length >= 6 && intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [burgers.length, startIntervalIfNeeded]);

  useEffect(() => {
    const worker = new Worker(
      new URL("./workers/progressWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    const api = Comlink.wrap<ProgressWorkerAPI>(worker);
    workerRef.current = worker;
    apiRef.current = api;

    return () => {
      if (workerRef.current) workerRef.current.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  // Send burger deadlines to worker whenever burgers change
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const payload = burgers.map((b) => ({
      label: b.label,
      // Always compute expiresAt from now + remaining seconds to avoid
      // sending stale expiresAt values that cause jumps in progress.
      expiresAt: Date.now() + b.timeLeft * 1000,
    }));
    api.setBurgers(payload).catch(() => {});
  }, [burgers]);

  return (
    workerConnected && (
      <div className={styles.menuGoals}>
        <div style={{ position: "absolute", right: 8, top: 8, zIndex: 999 }}>
          {/* <div
            style={{ fontSize: 12, color: workerConnected ? "lime" : "salmon" }}
          >
            worker: {workerConnected ? "connected" : "disconnected"}
          </div> */}
          {/* <div style={{ fontSize: 11, color: "#fff" }}>
            {lastWorkerPing
              ? new Date(lastWorkerPing).toLocaleTimeString()
              : ""}
          </div> */}
        </div>
        {burgers.map((burger, index) => (
          <div className={styles.burger} key={index}>
            <div className={styles.title}>
              {/* 分数: {burger.score} */}
              <div className={styles.timer}>
                <div className={styles.progress}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: `${
                        typeof burger.progressPercentage === "number"
                          ? burger.progressPercentage
                          : (burger.timeLeft / 60) * 100
                      }%`,
                    }}
                  />
                </div>
                {/* <div className={styles.timeDisplay}>{burger.timeLeft}秒</div> */}
              </div>
              <div className={styles.burgerWrapper}>
                <img className={styles.burgerImg} src={`/2D/burger.png`} />
              </div>
            </div>
            <div
              className={styles.materials}
              style={{ ["--cols" as any]: burger.materials.length }}
            >
              {burger.materials.map((material, idx) => (
                <div className={styles.wrapper} key={idx}>
                  <div
                    className={classNames(
                      styles.wrapperInner,
                      material === EFoodType.meatPatty
                        ? styles.meatPattyWrapper
                        : "",
                    )}
                  >
                    <img
                      className={styles.materialItem}
                      src={`/2D/${material}.png`}
                      alt={material}
                    />
                  </div>
                  {material === EFoodType.meatPatty && (
                    <div className={styles.meatPatty}>
                      <img src="/2D/pan.png" className={styles.panImg} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  );
};

export const Score = () => {
  const score = useGameScore();
  return (
    <div className={styles.scoreGoal}>
      {/* <img className={styles.coinImg} src="/2D/coin.png" /> */}
      <div className={styles.score}>{score}</div>
      {/* <div className={styles.score}>
        <span>0</span>
        <div className={styles.text}></div>
      </div> */}
    </div>
  );
};

export const TimeRemaining = ({ time = 200 }: { time?: number }) => {
  const [timeLeft, setTimeLeft] = useState(time); // 200秒 = 3:20

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `0${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (timeLeft / time) * 100;
  const bgColor =
    timeLeft >= 60 && time < 120
      ? styles.yellow
      : timeLeft < 60
        ? styles.red
        : styles.green;

  return (
    <div className={styles.timeRemaining}>
      <div className={classNames(styles.time)}>{formatTime(timeLeft)}</div>
      <div
        className={classNames(bgColor, styles.progressBar)}
        style={{
          width: `${progressPercentage}%`,
        }}
      />
    </div>
  );
};
