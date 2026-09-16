import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Search, c as Monitor, d as Bookmark, f as BookOpen, i as Sun, l as ChevronRight, n as Type, o as PanelRight, s as Moon, t as X, u as ChevronLeft } from "../_libs/lucide-react.mjs";
import { a as bookmarkKey, c as openStageWindow, i as applyThemeToDocument, l as publishStageVerse, n as GROUP_ORDER, o as citationOf, r as StageScreen, s as isStageWindowOpen, t as GROUP_LABELS, u as readStageVerse } from "./StageScreen-DMqo2_LY.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C2KnhowQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("tap-scale inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[opacity,transform,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-ink text-ink-fg shadow-border hover:opacity-90",
			ghost: "text-fg hover:bg-fill",
			outline: "bg-transparent text-fg shadow-border hover:bg-fill",
			quiet: "text-muted hover:text-fg hover:bg-fill",
			accent: "bg-accent text-accent-fg hover:opacity-90"
		},
		size: {
			default: "h-10 px-3.5",
			sm: "h-8 px-2.5 text-sm",
			lg: "h-11 px-4",
			icon: "size-10",
			"icon-sm": "size-8"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var bookCache = /* @__PURE__ */ new Map();
var catalogPromise = null;
var fullPromise = null;
function loadCatalog() {
	catalogPromise ??= fetch("/bible/rst/catalog.json").then((res) => {
		if (!res.ok) throw new Error("Не удалось загрузить каталог Библии");
		return res.json();
	});
	return catalogPromise;
}
async function loadBook(id) {
	const cached = bookCache.get(id);
	if (cached) return cached;
	const res = await fetch(`/bible/rst/books/${id}.json`);
	if (!res.ok) throw new Error("Не удалось загрузить книгу");
	const data = await res.json();
	bookCache.set(id, data);
	return data;
}
function getCachedBook(id) {
	return bookCache.get(id);
}
function prefetchAll() {
	fullPromise ??= (async () => {
		const res = await fetch("/bible/rst/full.json");
		if (!res.ok) return;
		const data = await res.json();
		for (const book of data.books) bookCache.set(book.id, book);
	})();
	return fullPromise;
}
function findBook(catalog, id) {
	return catalog.books.find((book) => book.id === id);
}
function neighborBook(catalog, id, delta) {
	const index = catalog.books.findIndex((book) => book.id === id);
	if (index < 0) return void 0;
	return catalog.books[index + delta];
}
var REF_RE = /^([1-4]?\s*[А-Яа-яЁёA-Za-z.]+)\s+(\d+)(?::(\d+))?$/u;
async function parseReference(query) {
	const match = query.trim().match(REF_RE);
	if (!match) return null;
	const catalog = await loadCatalog();
	const name = match[1].replace(/\s+/g, " ").replace(/\.$/, "").toLowerCase();
	const chapter = Number(match[2]);
	const verse = match[3] ? Number(match[3]) : 1;
	const book = catalog.books.find((item) => {
		const n = item.name.toLowerCase();
		const s = item.short.replace(/\.$/, "").toLowerCase();
		return n === name || s === name || n.endsWith(name) || n.includes(name);
	});
	if (!book) return null;
	if (chapter < 1 || chapter > book.chapters) return null;
	await prefetchAll();
	const text = getCachedBook(book.id)?.chapters[chapter - 1]?.[verse - 1];
	if (!text) return null;
	return {
		bookId: book.id,
		bookName: book.name,
		bookShort: book.short,
		chapter,
		verse,
		text
	};
}
async function searchBible(query, limit = 36) {
	const q = query.trim();
	if (q.length < 2) return [];
	const ref = await parseReference(q);
	await prefetchAll();
	const catalog = await loadCatalog();
	const needle = q.toLowerCase();
	const hits = [];
	if (ref) hits.push(ref);
	const bookMatches = catalog.books.filter((book) => book.name.toLowerCase().includes(needle) || book.short.toLowerCase().includes(needle));
	for (const book of bookMatches.slice(0, 8)) {
		const text = getCachedBook(book.id)?.chapters[0]?.[0] ?? "";
		if (!hits.some((hit) => hit.bookId === book.id && hit.chapter === 1 && hit.verse === 1)) hits.push({
			bookId: book.id,
			bookName: book.name,
			bookShort: book.short,
			chapter: 1,
			verse: 1,
			text
		});
	}
	for (const book of catalog.books) {
		const content = getCachedBook(book.id);
		if (!content) continue;
		for (let ci = 0; ci < content.chapters.length; ci++) {
			const chapter = content.chapters[ci];
			for (let vi = 0; vi < chapter.length; vi++) {
				const text = chapter[vi];
				if (!text.toLowerCase().includes(needle)) continue;
				if (hits.some((hit) => hit.bookId === book.id && hit.chapter === ci + 1 && hit.verse === vi + 1)) continue;
				hits.push({
					bookId: book.id,
					bookName: book.name,
					bookShort: book.short,
					chapter: ci + 1,
					verse: vi + 1,
					text
				});
				if (hits.length >= limit) return hits;
			}
		}
	}
	return hits;
}
var THEMES = [
	"paper",
	"sepia",
	"night"
];
function withTheme(verse, theme) {
	if (!verse) return null;
	return {
		...verse,
		theme
	};
}
var useBibleStore = create()(persist((set, get) => ({
	bookId: "jhn",
	chapter: 1,
	verse: 1,
	theme: "paper",
	fontSize: 21,
	autoSend: true,
	bookmarks: [],
	presented: null,
	sidebarOpen: false,
	stagePanelOpen: true,
	searchOpen: false,
	setPlace: (bookId, chapter, verse = 1) => set({
		bookId,
		chapter,
		verse: Math.max(1, verse)
	}),
	setVerse: (verse) => set({ verse: Math.max(1, verse) }),
	setTheme: (theme) => {
		set({
			theme,
			presented: withTheme(get().presented, theme)
		});
		const presented = get().presented;
		if (presented) publishStageVerse({
			...presented,
			theme
		});
	},
	cycleTheme: () => {
		const current = get().theme;
		const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
		get().setTheme(next);
	},
	setFontSize: (size) => set({ fontSize: Math.min(32, Math.max(16, size)) }),
	setAutoSend: (value) => set({ autoSend: value }),
	toggleBookmark: (bookmark) => {
		const current = bookmark ?? {
			bookId: get().bookId,
			chapter: get().chapter,
			verse: get().verse
		};
		const key = bookmarkKey(current);
		set({ bookmarks: get().bookmarks.some((item) => bookmarkKey(item) === key) ? get().bookmarks.filter((item) => bookmarkKey(item) !== key) : [current, ...get().bookmarks].slice(0, 80) });
	},
	isBookmarked: (bookmark) => {
		const current = bookmark ?? {
			bookId: get().bookId,
			chapter: get().chapter,
			verse: get().verse
		};
		const key = bookmarkKey(current);
		return get().bookmarks.some((item) => bookmarkKey(item) === key);
	},
	present: (verse) => {
		const next = {
			...verse,
			theme: get().theme
		};
		set({ presented: next });
		publishStageVerse(next);
	},
	setSidebarOpen: (open) => set({ sidebarOpen: open }),
	setStagePanelOpen: (open) => set({ stagePanelOpen: open }),
	setSearchOpen: (open) => set({ searchOpen: open })
}), {
	name: "pisanie-v1",
	partialize: (state) => ({
		bookId: state.bookId,
		chapter: state.chapter,
		verse: state.verse,
		theme: state.theme,
		fontSize: state.fontSize,
		autoSend: state.autoSend,
		bookmarks: state.bookmarks,
		presented: state.presented,
		stagePanelOpen: state.stagePanelOpen
	})
}));
function PisanieApp() {
	const [catalog, setCatalog] = (0, import_react.useState)(null);
	const [book, setBook] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [bookQuery, setBookQuery] = (0, import_react.useState)("");
	const [sidebarTab, setSidebarTab] = (0, import_react.useState)("books");
	const [stageOpen, setStageOpen] = (0, import_react.useState)(false);
	const [searchHits, setSearchHits] = (0, import_react.useState)([]);
	const [searching, setSearching] = (0, import_react.useState)(false);
	const [copyDone, setCopyDone] = (0, import_react.useState)(false);
	const searchInputRef = (0, import_react.useRef)(null);
	const verseRefs = (0, import_react.useRef)({});
	const chapterStripRef = (0, import_react.useRef)(null);
	const store = useBibleStore();
	const { bookId, chapter, verse, theme, fontSize, autoSend, bookmarks, presented, sidebarOpen, stagePanelOpen, searchOpen } = store;
	(0, import_react.useEffect)(() => {
		applyThemeToDocument(theme);
	}, [theme]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		loadCatalog().then((data) => {
			if (!cancelled) setCatalog(data);
		}).catch((err) => {
			if (!cancelled) setLoadError(err.message);
		});
		const idle = window.setTimeout(() => {
			prefetchAll();
		}, 1200);
		return () => {
			cancelled = true;
			window.clearTimeout(idle);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!catalog) return;
		const meta = findBook(catalog, bookId) ?? catalog.books[0];
		if (!meta) return;
		if (meta.id !== bookId) {
			store.setPlace(meta.id, 1, 1);
			return;
		}
		let cancelled = false;
		loadBook(meta.id).then((data) => {
			if (cancelled) return;
			setBook(data);
			const maxChapter = data.chapters.length;
			const nextChapter = Math.min(Math.max(1, chapter), maxChapter);
			const maxVerse = data.chapters[nextChapter - 1]?.length ?? 1;
			const nextVerse = Math.min(Math.max(1, verse), maxVerse);
			if (nextChapter !== chapter || nextVerse !== verse) store.setPlace(meta.id, nextChapter, nextVerse);
		}).catch((err) => {
			if (!cancelled) setLoadError(err.message);
		});
		return () => {
			cancelled = true;
		};
	}, [catalog, bookId]);
	(0, import_react.useEffect)(() => {
		if (!presented) {
			const stored = readStageVerse();
			if (stored) useBibleStore.setState({ presented: stored });
		} else publishStageVerse({
			...presented,
			theme
		});
	}, []);
	const meta = catalog ? findBook(catalog, bookId) : void 0;
	const verses = book?.chapters[chapter - 1] ?? [];
	const currentText = verses[verse - 1] ?? "";
	const makeStageVerse = (0, import_react.useCallback)((nextVerse, text, bookMeta, nextChapter = chapter) => ({
		bookId: bookMeta.id,
		bookName: bookMeta.name,
		bookShort: bookMeta.short,
		chapter: nextChapter,
		verse: nextVerse,
		text,
		theme
	}), [chapter, theme]);
	const selectVerse = (0, import_react.useCallback)((next, send = autoSend) => {
		store.setVerse(next);
		if (!send || !meta) return;
		const text = verses[next - 1];
		if (!text) return;
		store.present(makeStageVerse(next, text, meta));
	}, [
		autoSend,
		makeStageVerse,
		meta,
		store,
		verses
	]);
	const presentCurrent = (0, import_react.useCallback)(() => {
		if (!meta || !currentText) return;
		store.present(makeStageVerse(verse, currentText, meta));
	}, [
		currentText,
		makeStageVerse,
		meta,
		store,
		verse
	]);
	const goTo = (0, import_react.useCallback)((nextBook, nextChapter, nextVerse = 1, send = false) => {
		store.setPlace(nextBook, nextChapter, nextVerse);
		store.setSidebarOpen(false);
		store.setSearchOpen(false);
		if (!send || !catalog) return;
		const bookMeta = findBook(catalog, nextBook);
		if (!bookMeta) return;
		loadBook(nextBook).then((data) => {
			const text = data.chapters[nextChapter - 1]?.[nextVerse - 1];
			if (!text) return;
			store.present(makeStageVerse(nextVerse, text, bookMeta, nextChapter));
		});
	}, [
		catalog,
		makeStageVerse,
		store
	]);
	const turnChapter = (0, import_react.useCallback)((delta) => {
		if (!catalog || !meta || !book) return;
		const next = chapter + delta;
		if (next >= 1 && next <= book.chapters.length) {
			goTo(meta.id, next, 1);
			return;
		}
		const neighbor = neighborBook(catalog, meta.id, delta);
		if (!neighbor) return;
		const targetChapter = delta > 0 ? 1 : neighbor.chapters;
		goTo(neighbor.id, targetChapter, 1);
	}, [
		book,
		catalog,
		chapter,
		goTo,
		meta
	]);
	const turnVerse = (0, import_react.useCallback)((delta) => {
		if (!book || !meta) return;
		const next = verse + delta;
		if (next >= 1 && next <= verses.length) {
			selectVerse(next);
			return;
		}
		if (delta > 0) {
			if (chapter < book.chapters.length) {
				const text = book.chapters[chapter]?.[0];
				store.setPlace(meta.id, chapter + 1, 1);
				if (autoSend && text) store.present(makeStageVerse(1, text, meta, chapter + 1));
			} else turnChapter(1);
		} else if (chapter > 1) {
			const prev = book.chapters[chapter - 2];
			const last = prev.length;
			const text = prev[last - 1];
			store.setPlace(meta.id, chapter - 1, last);
			if (autoSend && text) store.present(makeStageVerse(last, text, meta, chapter - 1));
		} else turnChapter(-1);
	}, [
		autoSend,
		book,
		chapter,
		makeStageVerse,
		meta,
		selectVerse,
		store,
		turnChapter,
		verse,
		verses.length
	]);
	(0, import_react.useEffect)(() => {
		verseRefs.current[verse]?.scrollIntoView({
			block: "nearest",
			behavior: "smooth"
		});
	}, [
		verse,
		chapter,
		bookId
	]);
	(0, import_react.useEffect)(() => {
		const strip = chapterStripRef.current;
		if (!strip) return;
		const active = strip.querySelector(".is-active");
		if (active instanceof HTMLElement) active.scrollIntoView({
			inline: "center",
			block: "nearest",
			behavior: "smooth"
		});
	}, [chapter, bookId]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				store.setSearchOpen(true);
				return;
			}
			if (event.key === "Escape") {
				store.setSearchOpen(false);
				store.setSidebarOpen(false);
				return;
			}
			if (typing) return;
			if (event.key === "ArrowRight" || event.key === "]") {
				event.preventDefault();
				turnChapter(1);
			} else if (event.key === "ArrowLeft" || event.key === "[") {
				event.preventDefault();
				turnChapter(-1);
			} else if (event.key === "ArrowDown" || event.key === "j") {
				event.preventDefault();
				turnVerse(1);
			} else if (event.key === "ArrowUp" || event.key === "k") {
				event.preventDefault();
				turnVerse(-1);
			} else if (event.key === "Enter" || event.key.toLowerCase() === "p") {
				event.preventDefault();
				presentCurrent();
			} else if (event.key === "/" || event.key.toLowerCase() === "f") {
				event.preventDefault();
				store.setSearchOpen(true);
			} else if (event.key.toLowerCase() === "b") store.toggleBookmark();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		presentCurrent,
		store,
		turnChapter,
		turnVerse
	]);
	(0, import_react.useEffect)(() => {
		if (!searchOpen) return;
		const id = window.setTimeout(() => searchInputRef.current?.focus(), 40);
		return () => window.clearTimeout(id);
	}, [searchOpen]);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!searchOpen) return;
		const q = searchQuery.trim();
		if (q.length < 2) {
			setSearchHits([]);
			setSearching(false);
			return;
		}
		setSearching(true);
		const id = window.setTimeout(() => {
			searchBible(q).then((hits) => {
				setSearchHits(hits);
				setSearching(false);
			});
		}, 180);
		return () => window.clearTimeout(id);
	}, [searchQuery, searchOpen]);
	const filteredBooks = (0, import_react.useMemo)(() => {
		if (!catalog) return [];
		const q = bookQuery.trim().toLowerCase();
		if (!q) return catalog.books;
		return catalog.books.filter((item) => item.name.toLowerCase().includes(q) || item.short.toLowerCase().includes(q));
	}, [bookQuery, catalog]);
	const grouped = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const item of filteredBooks) {
			const list = map.get(item.group) ?? [];
			list.push(item);
			map.set(item.group, list);
		}
		return GROUP_ORDER.map((group) => ({
			group,
			books: map.get(group) ?? []
		})).filter((entry) => entry.books.length > 0);
	}, [filteredBooks]);
	const citation = meta ? citationOf(meta, chapter, verse) : "Писание";
	const copyCitation = async () => {
		if (!currentText || !meta) return;
		const payload = `${citation}\n${currentText}`;
		try {
			await navigator.clipboard.writeText(payload);
			setCopyDone(true);
			window.setTimeout(() => setCopyDone(false), 1400);
		} catch {}
	};
	const openSecondScreen = async () => {
		if (!presented) presentCurrent();
		const win = await openStageWindow();
		setStageOpen(Boolean(win && !win.closed));
		if (!win) store.setStagePanelOpen(true);
	};
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			setStageOpen(isStageWindowOpen());
		}, 800);
		return () => window.clearInterval(id);
	}, []);
	const showStage = stagePanelOpen;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "toolbar",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						className: "lg:hidden",
						"aria-label": "Книги",
						onClick: () => store.setSidebarOpen(true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden min-w-0 items-center gap-2 sm:flex",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-serif text-lg tracking-tight",
								children: "Писание"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: "/"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm text-muted",
								children: catalog?.name ?? "Синодальный перевод"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: copyCitation,
						className: "mx-auto min-w-0 truncate rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-fill",
						title: "Скопировать стих",
						children: copyDone ? "Скопировано" : citation
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Найти",
								onClick: () => store.setSearchOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Мельче",
								onClick: () => store.setFontSize(fontSize - 1),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Крупнее",
								onClick: () => store.setFontSize(fontSize + 1),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Тема",
								onClick: () => store.cycleTheme(),
								children: theme === "night" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Закладка",
								onClick: () => store.toggleBookmark(),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: store.isBookmarked() ? "fill-current" : "" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								className: "hidden md:inline-flex",
								"aria-label": "Панель стиха",
								onClick: () => store.setStagePanelOpen(!stagePanelOpen),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: () => void openSecondScreen(),
								className: "hidden sm:inline-flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, {}), "Второй экран"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon-sm",
								className: "sm:hidden",
								"aria-label": "Второй экран",
								onClick: () => void openSecondScreen(),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, {})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("workspace", showStage && "has-stage"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: cn("sidebar", sidebarOpen ? "fixed inset-0 z-40 flex bg-bg/80 lg:static lg:bg-transparent" : "hidden lg:flex"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("sidebar-drawer flex h-full min-h-0 flex-col bg-bg", sidebarOpen && "shadow-border"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 border-b border-line px-3 py-3 lg:hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-serif text-lg",
										children: "Книги"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon-sm",
										className: "ml-auto",
										"aria-label": "Закрыть",
										onClick: () => store.setSidebarOpen(false),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-1 px-3 pt-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: cn("h-8 flex-1 rounded-lg text-sm", sidebarTab === "books" ? "bg-ink text-ink-fg" : "text-muted hover:bg-fill"),
										onClick: () => setSidebarTab("books"),
										children: "Библия"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: cn("h-8 flex-1 rounded-lg text-sm", sidebarTab === "marks" ? "bg-ink text-ink-fg" : "text-muted hover:bg-fill"),
										onClick: () => setSidebarTab("marks"),
										children: "Закладки"
									})]
								}),
								sidebarTab === "books" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-3 pt-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: bookQuery,
										onChange: (event) => setBookQuery(event.target.value),
										placeholder: "Книга",
										className: "h-10 w-full rounded-lg bg-fill px-3 text-sm outline-none placeholder:text-subtle"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "scroll-thin mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-6",
									children: grouped.map(({ group, books }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										className: "mb-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "px-2 pb-1 pt-2 text-xs font-medium tracking-wide text-subtle",
											children: GROUP_LABELS[group]
										}), books.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: cn("book-item", item.id === bookId && "is-active"),
											onClick: () => goTo(item.id, item.id === bookId ? chapter : 1, 1),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "truncate",
												children: item.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("text-xs tabular-nums", item.id === bookId ? "opacity-70" : "text-subtle"),
												children: item.chapters
											})]
										}, item.id))]
									}, group))
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "scroll-thin mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-6",
									children: bookmarks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "px-3 py-8 text-sm leading-relaxed text-muted",
										children: "Отметьте стих закладкой — он останется под рукой."
									}) : bookmarks.map((mark) => {
										const bookMeta = catalog ? findBook(catalog, mark.bookId) : void 0;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "book-item",
											onClick: () => goTo(mark.bookId, mark.chapter, mark.verse),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: bookMeta ? citationOf(bookMeta, mark.chapter, mark.verse, true) : `${mark.bookId} ${mark.chapter}:${mark.verse}` })
										}, `${mark.bookId}-${mark.chapter}-${mark.verse}`);
									})
								})
							]
						}), sidebarOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-full flex-1 lg:hidden",
							"aria-label": "Закрыть список книг",
							onClick: () => store.setSidebarOpen(false)
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "reader flex min-h-0 flex-col",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 border-b border-line px-2 py-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon-sm",
										"aria-label": "Предыдущая глава",
										onClick: () => turnChapter(-1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										ref: chapterStripRef,
										className: "scroll-thin flex min-w-0 flex-1 gap-1 overflow-x-auto",
										children: meta ? Array.from({ length: meta.chapters }, (_, index) => {
											const n = index + 1;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: cn("chapter-chip", n === chapter && "is-active"),
												onClick: () => goTo(bookId, n, 1),
												children: n
											}, n);
										}) : null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon-sm",
										"aria-label": "Следующая глава",
										onClick: () => turnChapter(1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "scroll-thin min-h-0 flex-1 overflow-y-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "mx-auto w-full max-w-2xl px-5 py-8 sm:px-10",
									style: { fontSize: `${fontSize}px` },
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
										className: "mb-8",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-medium tracking-widest text-subtle uppercase",
												children: meta ? meta.testament === "nt" ? "Новый Завет" : "Ветхий Завет" : "Священное Писание"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
												className: "mt-2 font-serif text-3xl tracking-tight text-balance sm:text-4xl",
												children: meta?.name ?? "Писание"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 font-serif text-xl text-muted",
												children: ["Глава ", chapter]
											})
										]
									}), loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-base text-muted",
										children: loadError
									}) : !book ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-3",
										children: Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5 animate-pulse rounded-md bg-fill" }, i))
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1",
										children: verses.map((text, index) => {
											const n = index + 1;
											const isSelected = n === verse;
											const isPresented = presented?.bookId === bookId && presented.chapter === chapter && presented.verse === n;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												ref: (node) => {
													verseRefs.current[n] = node;
												},
												className: cn("verse-row", isSelected && "is-selected", isPresented && "is-presented"),
												onClick: () => selectVerse(n),
												onDoubleClick: () => {
													if (!meta) return;
													store.present(makeStageVerse(n, text, meta));
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "verse-num",
													children: n
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [text, isPresented ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-2 align-middle font-sans text-xs font-medium tracking-wide text-subtle",
													children: "на экране"
												}) : null] })]
											}, n);
										})
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2 border-t border-line px-3 py-2 sm:hidden",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => turnChapter(-1),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {}), "Глава"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										onClick: presentCurrent,
										children: "Вывести стих"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => turnChapter(1),
										children: ["Глава", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})]
									})
								]
							})
						]
					}),
					showStage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "stage-panel relative hidden lg:flex lg:flex-col",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium tracking-widest text-stage-muted uppercase",
									children: "Второй экран"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-sm text-stage-fg",
									children: stageOpen ? "Окно открыто" : autoSend ? "Следит за выбранным стихом" : "Ожидает вывода"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									className: "stage-ghost",
									onClick: () => void openSecondScreen(),
									children: stageOpen ? "Показать окно" : "Открыть окно"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-h-0 flex-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StageScreen, {
									verse: presented,
									compact: true
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3 px-4 py-3 text-xs text-stage-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: autoSend,
										onChange: (event) => store.setAutoSend(event.target.checked),
										className: "size-3.5 accent-current"
									}), "Выводить при выборе"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "hover:text-stage-fg",
									onClick: presentCurrent,
									children: "Обновить"
								})]
							})
						]
					}) : null
				]
			}),
			searchOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "search-layer fixed inset-0 z-50 flex items-start justify-center bg-fg/20 px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-label": "Поиск",
					className: "search-dialog flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-paper shadow-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 border-b border-line px-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-subtle" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: searchInputRef,
								value: searchQuery,
								onChange: (event) => setSearchQuery(event.target.value),
								placeholder: "Стих, книга или ссылка — Ин 3:16",
								className: "h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Закрыть поиск",
								onClick: () => store.setSearchOpen(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "scroll-thin min-h-0 flex-1 overflow-y-auto p-2",
						children: searching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-6 text-sm text-muted",
							children: "Ищем по всей Библии…"
						}) : searchQuery.trim().length < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-6 text-sm leading-relaxed text-muted",
							children: "Наберите слово или ссылку. Стрелки листают стихи, Enter выводит выбранный на второй экран."
						}) : searchHits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-6 text-sm text-muted",
							children: "Ничего не найдено."
						}) : searchHits.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "w-full rounded-xl px-3 py-3 text-left hover:bg-fill",
							onClick: () => goTo(hit.bookId, hit.chapter, hit.verse, autoSend),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-muted",
								children: citationOf({
									name: hit.bookName,
									short: hit.bookShort
								}, hit.chapter, hit.verse)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 line-clamp-2 font-serif text-base leading-relaxed",
								children: hit.text
							})]
						}, `${hit.bookId}-${hit.chapter}-${hit.verse}-${hit.text.slice(0, 12)}`))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute inset-0 -z-10",
					"aria-label": "Закрыть поиск",
					onClick: () => store.setSearchOpen(false)
				})]
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PisanieApp, {});
}
//#endregion
export { Home as component };
