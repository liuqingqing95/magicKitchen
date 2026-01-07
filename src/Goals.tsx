import styles from "@/style/goals.module.less";
import classNames from "classnames";
import * as Comlink from "comlink";
import { useContext, useEffect, useRef, useState } from "react";
import { GrabContext } from "./context/GrabContext";
import { EFoodType } from "./types/level";
import type { ProgressWorkerAPI } from "./workers/progressWorker";

interface Burger {
  label: string;
  materials: Array<{ label: string; name: EFoodType; score: number }>;
  score: number;
  timeLeft: number;
  isActive: boolean;
  expiresAt?: number;
  progressPercentage?: number;
}

export const MenuGoals = () => {
  const { obstacleStore } = useContext(GrabContext);
  const store = obstacleStore;

  const types = [
    [
      { label: "汉堡片", name: EFoodType.cuttingBoardRound, score: 15 },
      { label: "肉饼", name: EFoodType.meatPatty, score: 20 },
    ],
    [
      { label: "汉堡片", name: EFoodType.cuttingBoardRound, score: 15 },
      { label: "西红柿", name: EFoodType.tomato, score: 10 },
      { label: "肉饼", name: EFoodType.meatPatty, score: 20 },
    ],
    [
      { label: "汉堡片", name: EFoodType.cuttingBoardRound, score: 15 },
      { label: "西红柿", name: EFoodType.tomato, score: 10 },
      { label: "肉饼", name: EFoodType.meatPatty, score: 20 },
      { label: "芝士", name: EFoodType.cheese, score: 10 },
    ],
  ];

  const [burgers, setBurgers] = useState<Burger[]>([]);
  const [workerConnected, setWorkerConnected] = useState(false);
  const burgersRef = useRef<Burger[]>([]);
  const cbRef = useRef<any>(null);

  useEffect(() => {
    burgersRef.current = burgers;
  }, [burgers]);
  // 生成单个汉堡的函数
  const generateBurger = (): Burger => {
    const materials = types[Math.floor(Math.random() * types.length)];
    const totalScore = materials.reduce(
      (sum, material) => sum + material.score,
      0
    );

    const expiresAt = Date.now() + 60000; // 60秒后到期

    return {
      label: `汉堡${Date.now()}`, // 使用时间戳确保唯一性
      materials,
      score: totalScore,
      timeLeft: 60,
      isActive: true,
      expiresAt,
      progressPercentage: 100,
    };
  };

  // 生成1-3个汉堡
  const generateMultipleBurgers = () => {
    setBurgers((prevBurgers) => {
      if (prevBurgers.length >= 6) return prevBurgers;

      const count = Math.floor(Math.random() * 3) + 1; // 生成1-3个
      const newBurgers = Array.from({ length: count }, generateBurger);
      return [...prevBurgers, ...newBurgers].slice(0, 6); // 确保不超过6个
    });
  };

  // 初始生成汉堡
  useEffect(() => {
    generateMultipleBurgers();
  }, []);

  // 使用 Comlink worker 处理倒计时并推送进度更新到主线程
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<ProgressWorkerAPI> | null>(null);
  useEffect(() => {
    if (store.registryGrab) {
      const cb = Comlink.proxy((updates: any[]) => {
        setBurgers((prev) =>
          prev.map((b) => {
            const u = updates.find((x) => x.label === b.label);
            if (!u) return b;
            return {
              ...b,
              timeLeft: u.timeLeftSec,
              isActive: u.isActive,
              progressPercentage: u.progress,
            };
          })
        );
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

      const interval = setInterval(() => {
        generateMultipleBurgers();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [store.registryGrab]);
  useEffect(() => {
    const worker = new Worker(
      new URL("./workers/progressWorker.ts", import.meta.url),
      {
        type: "module",
      }
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
          <div
            style={{ fontSize: 12, color: workerConnected ? "lime" : "salmon" }}
          >
            worker: {workerConnected ? "connected" : "disconnected"}
          </div>
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
            <div className={styles.materials}>
              {burger.materials.map((material, idx) => (
                <div className={styles.wrapper} key={idx}>
                  <div
                    className={classNames(
                      styles.wrapperInner,
                      material.name === EFoodType.meatPatty
                        ? styles.meatPattyWrapper
                        : ""
                    )}
                  >
                    <img
                      className={styles.materialItem}
                      src={`/2D/${material.name}.png`}
                      alt={material.label}
                    />
                  </div>
                  {material.name === EFoodType.meatPatty && (
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
  return (
    <div className={styles.scoreGoal}>
      {/* <img className={styles.coinImg} src="/2D/coin.png" /> */}
      <div className={styles.score}>0</div>
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
