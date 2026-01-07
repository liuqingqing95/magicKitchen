import * as Comlink from "comlink";

type BurgerData = { label: string; expiresAt: number };

let burgers: BurgerData[] = [];
let subscribers = new Set<any>();
let intervalId: number | null = null;

function setBurgers(data: BurgerData[]) {
  burgers = data;
  startLoop();
  // log in worker (visible in browser devtools console)
  try {
    // eslint-disable-next-line no-console
    console.log("[progressWorker] setBurgers", burgers.length);
  } catch (e) {}
}

function startLoop() {
  if (intervalId !== null) return;
  const total = 60000;
  intervalId = self.setInterval(
    () => {
      const now = Date.now();
      const updates = burgers.map((b) => {
        const timeLeftMs = b.expiresAt - now;
        const progress = Math.max(0, Math.min(100, (timeLeftMs / total) * 100));
        const timeLeftSec = Math.max(0, Math.ceil(timeLeftMs / 1000));
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
          // ignore
        }
      }
    },
    100 // 100ms updates (10fps) to reduce message overhead
  );
}

function subscribe(cb: any) {
  subscribers.add(cb);
  startLoop();
  try {
    // eslint-disable-next-line no-console
    console.log("[progressWorker] subscriber added, total:", subscribers.size);
  } catch (e) {}
  // Do NOT return a closure/function here — returning functions can cause
  // "Unserializable return value" errors when crossing the worker boundary.
}

function unsubscribe(cb: any) {
  subscribers.delete(cb);
  try {
    // eslint-disable-next-line no-console
    console.log(
      "[progressWorker] subscriber removed, total:",
      subscribers.size
    );
  } catch (e) {}
}

function clear() {
  burgers = [];
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  subscribers.clear();
}

Comlink.expose({ setBurgers, subscribe, unsubscribe, clear });
