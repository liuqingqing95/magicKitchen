import * as Comlink from "comlink";

type BurgerData = { label: string; expiresAt: number };

type ProgressUpdate = {
  label: string;
  progress: number;
  timeLeftSec: number;
  isActive: boolean;
};

type Subscriber = (updates: ProgressUpdate[]) => void;

let burgers: BurgerData[] = [];
let subscribers = new Set<Subscriber>();
let intervalId: number | null = null;

function setBurgers(data: BurgerData[]): void {
  burgers = data;
  // log in worker (visible in browser devtools console)
  try {
    // eslint-disable-next-line no-console
    console.log("[progressWorker] setBurgers", burgers.length);
  } catch (e) {}
}

function startLoop(): void {
  if (intervalId !== null) return;
  const total = 60000;
  intervalId = self.setInterval(
    () => {
      const now = Date.now();
      const updates: ProgressUpdate[] = burgers.map((b) => {
        const timeLeftMs = b.expiresAt - now;
        const progress = Math.max(0, Math.min(100, (timeLeftMs / total) * 100));
        const timeLeftSec = Math.max(0, Math.floor(timeLeftMs / 1000));
        return {
          label: b.label,
          progress,
          timeLeftSec,
          isActive: timeLeftMs > 0,
        };
      });

      for (const cb of subscribers) {
        try {
          cb(updates);
        } catch (e) {
          // ignore subscriber errors
        }
      }
    },
    1000 // 100ms updates (10fps) to reduce message overhead
  );
}

function subscribe(cb: Subscriber): void {
  subscribers.add(cb);
  startLoop();
  try {
    // eslint-disable-next-line no-console
    console.log("[progressWorker] subscriber added, total:", subscribers.size);
  } catch (e) {}
}

function unsubscribe(cb: Subscriber): void {
  subscribers.delete(cb);
  try {
    // eslint-disable-next-line no-console
    console.log(
      "[progressWorker] subscriber removed, total:",
      subscribers.size
    );
  } catch (e) {}
  // If no subscribers remain, stop the update loop to avoid unnecessary work.
  if (subscribers.size === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function clear(): void {
  burgers = [];
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  subscribers.clear();
}

export type ProgressWorkerAPI = {
  setBurgers(data: BurgerData[]): Promise<void>;
  subscribe(cb: Subscriber): Promise<void>;
  unsubscribe(cb: Subscriber): Promise<void>;
  clear(): Promise<void>;
};

Comlink.expose({
  setBurgers,
  subscribe,
  unsubscribe,
  clear,
});
