import type { StageVerse, ThemeId } from "./types";

export const STAGE_STORAGE_KEY = "pisanie-stage-verse";
export const STAGE_CHANNEL_NAME = "pisanie-stage";
export const STAGE_WINDOW_NAME = "pisanie-stage";

let channel: BroadcastChannel | null = null;
let stageWindow: Window | null = null;

function getChannel() {
  if (typeof window === "undefined") return null;
  channel ??= new BroadcastChannel(STAGE_CHANNEL_NAME);
  return channel;
}

export function readStageVerse(): StageVerse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAGE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StageVerse;
  } catch {
    return null;
  }
}

export function publishStageVerse(verse: StageVerse | null) {
  if (typeof window === "undefined") return;
  if (verse) localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(verse));
  else localStorage.removeItem(STAGE_STORAGE_KEY);
  getChannel()?.postMessage(verse);
}

export function subscribeStageVerse(onChange: (verse: StageVerse | null) => void) {
  const ch = getChannel();
  const onMessage = (event: MessageEvent<StageVerse | null>) => {
    onChange(event.data ?? null);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STAGE_STORAGE_KEY) return;
    onChange(event.newValue ? (JSON.parse(event.newValue) as StageVerse) : null);
  };
  ch?.addEventListener("message", onMessage);
  window.addEventListener("storage", onStorage);
  return () => {
    ch?.removeEventListener("message", onMessage);
    window.removeEventListener("storage", onStorage);
  };
}

export function isStageWindowOpen() {
  return Boolean(stageWindow && !stageWindow.closed);
}

type ScreenLike = {
  isPrimary: boolean;
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
};

async function placeOnSecondary(win: Window) {
  const getter = (
    window as Window & {
      getScreenDetails?: () => Promise<{ screens: ScreenLike[] }>;
    }
  ).getScreenDetails;
  if (typeof getter !== "function") return;
  try {
    const details = await getter();
    const secondary =
      details.screens.find((screen) => !screen.isPrimary) ?? details.screens[0];
    if (!secondary) return;
    win.moveTo(secondary.availLeft, secondary.availTop);
    win.resizeTo(secondary.availWidth, secondary.availHeight);
  } catch {
    // Permission or unsupported — the user can drag the window themselves.
  }
}

export async function openStageWindow(): Promise<Window | null> {
  if (typeof window === "undefined") return null;
  const width = Math.min(1440, Math.round(window.screen.availWidth * 0.72));
  const height = Math.min(900, Math.round(window.screen.availHeight * 0.8));
  const features = `popup=yes,width=${width},height=${height}`;
  const win = window.open("/stage", STAGE_WINDOW_NAME, features);
  stageWindow = win;
  if (win) {
    try {
      win.focus();
    } catch {
      /* ignore */
    }
    await placeOnSecondary(win);
  }
  return win;
}

export function applyThemeToDocument(theme: ThemeId, root?: HTMLElement | null) {
  const el = root ?? (typeof document === "undefined" ? null : document.documentElement);
  if (!el) return;
  el.dataset.theme = theme;
}
