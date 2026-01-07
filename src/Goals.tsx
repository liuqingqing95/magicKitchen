import styles from "@/style/goals.module.less";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { EFoodType } from "./types/level";

interface Burger {
  label: string;
  materials: Array<{ label: string; name: EFoodType; score: number }>;
  score: number;
  timeLeft: number;
  isActive: boolean;
}

export const MenuGoals = () => {
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

  // 生成单个汉堡的函数
  const generateBurger = (): Burger => {
    const materials = types[Math.floor(Math.random() * types.length)];
    const totalScore = materials.reduce(
      (sum, material) => sum + material.score,
      0
    );

    return {
      label: `汉堡${Date.now()}`, // 使用时间戳确保唯一性
      materials,
      score: totalScore,
      timeLeft: 60,
      isActive: true,
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

  // 设置定时器
  useEffect(() => {
    const interval = setInterval(() => {
      generateMultipleBurgers();
    }, 5000); // 每20秒

    return () => clearInterval(interval);
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    const interval = setInterval(() => {
      setBurgers((prevBurgers) =>
        prevBurgers.map((burger) => {
          if (burger.isActive && burger.timeLeft > 0) {
            return {
              ...burger,
              timeLeft: burger.timeLeft - 1,
              isActive: burger.timeLeft > 1,
            };
          }
          return burger;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.menuGoals}>
      {burgers.map((burger, index) => (
        <div className={styles.burger} key={index}>
          <div className={styles.title}>
            {/* 分数: {burger.score} */}
            <div className={styles.timer}>
              <div className={styles.progress}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${(burger.timeLeft / 60) * 100}%` }}
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
