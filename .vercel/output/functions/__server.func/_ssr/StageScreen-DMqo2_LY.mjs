import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/StageScreen-DMqo2_LY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STAGE_STORAGE_KEY = "pisanie-stage-verse";
var STAGE_CHANNEL_NAME = "pisanie-stage";
var STAGE_WINDOW_NAME = "pisanie-stage";
var channel = null;
var stageWindow = null;
function getChannel() {
	if (typeof window === "undefined") return null;
	channel ??= new BroadcastChannel(STAGE_CHANNEL_NAME);
	return channel;
}
function readStageVerse() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STAGE_STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function publishStageVerse(verse) {
	if (typeof window === "undefined") return;
	if (verse) localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(verse));
	else localStorage.removeItem(STAGE_STORAGE_KEY);
	getChannel()?.postMessage(verse);
}
function subscribeStageVerse(onChange) {
	const ch = getChannel();
	const onMessage = (event) => {
		onChange(event.data ?? null);
	};
	const onStorage = (event) => {
		if (event.key !== "pisanie-stage-verse") return;
		onChange(event.newValue ? JSON.parse(event.newValue) : null);
	};
	ch?.addEventListener("message", onMessage);
	window.addEventListener("storage", onStorage);
	return () => {
		ch?.removeEventListener("message", onMessage);
		window.removeEventListener("storage", onStorage);
	};
}
function isStageWindowOpen() {
	return Boolean(stageWindow && !stageWindow.closed);
}
async function placeOnSecondary(win) {
	const getter = window.getScreenDetails;
	if (typeof getter !== "function") return;
	try {
		const details = await getter();
		const secondary = details.screens.find((screen) => !screen.isPrimary) ?? details.screens[0];
		if (!secondary) return;
		win.moveTo(secondary.availLeft, secondary.availTop);
		win.resizeTo(secondary.availWidth, secondary.availHeight);
	} catch {}
}
async function openStageWindow() {
	if (typeof window === "undefined") return null;
	const features = `popup=yes,width=${Math.min(1440, Math.round(window.screen.availWidth * .72))},height=${Math.min(900, Math.round(window.screen.availHeight * .8))}`;
	const win = window.open("/stage", STAGE_WINDOW_NAME, features);
	stageWindow = win;
	if (win) {
		try {
			win.focus();
		} catch {}
		await placeOnSecondary(win);
	}
	return win;
}
function applyThemeToDocument(theme, root) {
	const el = root ?? (typeof document === "undefined" ? null : document.documentElement);
	if (!el) return;
	el.dataset.theme = theme;
}
var GROUP_LABELS = {
	law: "Пятикнижие",
	history: "Исторические",
	wisdom: "Учительные",
	prophets: "Пророки",
	gospels: "Евангелия",
	acts: "Деяния",
	epistles: "Послания",
	revelation: "Откровение"
};
var GROUP_ORDER = [
	"law",
	"history",
	"wisdom",
	"prophets",
	"gospels",
	"acts",
	"epistles",
	"revelation"
];
function citationOf(book, chapter, verse, short = false) {
	return `${short ? book.short.replace(/\.$/, "") : book.name} ${chapter}:${verse}`;
}
function bookmarkKey(b) {
	return `${b.bookId}:${b.chapter}:${b.verse}`;
}
function StageScreen({ verse: verseProp, compact = false }) {
	const [live, setLive] = (0, import_react.useState)(() => verseProp ?? readStageVerse());
	const verse = verseProp !== void 0 ? verseProp : live;
	(0, import_react.useEffect)(() => {
		if (verseProp !== void 0) return;
		setLive(readStageVerse());
		return subscribeStageVerse(setLive);
	}, [verseProp]);
	(0, import_react.useEffect)(() => {
		if (verse?.theme) applyThemeToDocument(verse.theme);
	}, [verse?.theme]);
	if (!verse) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col items-center justify-center px-8 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-serif text-2xl text-balance text-stage-fg",
			children: "Писание"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-sm text-sm leading-relaxed text-stage-muted",
			children: "Выберите стих на основном экране — он появится здесь, на втором дисплее."
		})]
	});
	const citation = citationOf({
		name: verse.bookName,
		short: verse.bookShort
	}, verse.chapter, verse.verse);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: compact ? "flex h-full min-h-0 flex-col justify-center px-7 py-8" : "flex h-full min-h-0 flex-col items-center justify-center px-10 py-12 sm:px-16",
		style: {
			background: "var(--stage-bg)",
			color: "var(--stage-fg)"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "stage-verse mx-auto w-full",
			style: { maxWidth: compact ? "28rem" : "38rem" },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-serif text-pretty",
				style: {
					fontSize: compact ? "1.35rem" : "clamp(1.75rem, 3.4vw, 2.75rem)",
					lineHeight: 1.45,
					fontWeight: 400
				},
				children: verse.text
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-8 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block h-px w-8 shrink-0",
					style: { background: "color-mix(in oklab, var(--stage-fg) 28%, transparent)" }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("cite", {
					className: "not-italic tracking-wide",
					style: {
						color: "var(--stage-muted)",
						fontSize: compact ? "0.75rem" : "0.92rem",
						fontWeight: 500
					},
					children: citation
				})]
			})]
		}, `${verse.bookId}-${verse.chapter}-${verse.verse}`)
	});
}
//#endregion
export { bookmarkKey as a, openStageWindow as c, applyThemeToDocument as i, publishStageVerse as l, GROUP_ORDER as n, citationOf as o, StageScreen as r, isStageWindowOpen as s, GROUP_LABELS as t, readStageVerse as u };
