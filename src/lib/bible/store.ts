import { create } from "zustand";
import { persist } from "zustand/middleware";
import { publishStageVerse } from "./stage-channel";
import {
  bookmarkKey,
  type Bookmark,
  type StageVerse,
  type ThemeId,
} from "./types";

type BibleState = {
  bookId: string;
  chapter: number;
  verse: number;
  theme: ThemeId;
  fontSize: number;
  autoSend: boolean;
  bookmarks: Bookmark[];
  presented: StageVerse | null;
  sidebarOpen: boolean;
  stagePanelOpen: boolean;
  searchOpen: boolean;
  setPlace: (bookId: string, chapter: number, verse?: number) => void;
  setVerse: (verse: number) => void;
  setTheme: (theme: ThemeId) => void;
  cycleTheme: () => void;
  setFontSize: (size: number) => void;
  setAutoSend: (value: boolean) => void;
  toggleBookmark: (bookmark?: Bookmark) => void;
  isBookmarked: (bookmark?: Bookmark) => boolean;
  present: (verse: StageVerse) => void;
  setSidebarOpen: (open: boolean) => void;
  setStagePanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
};

const THEMES: ThemeId[] = ["paper", "sepia", "night"];

function withTheme(verse: StageVerse | null, theme: ThemeId): StageVerse | null {
  if (!verse) return null;
  return { ...verse, theme };
}

export const useBibleStore = create<BibleState>()(
  persist(
    (set, get) => ({
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
      setPlace: (bookId, chapter, verse = 1) =>
        set({ bookId, chapter, verse: Math.max(1, verse) }),
      setVerse: (verse) => set({ verse: Math.max(1, verse) }),
      setTheme: (theme) => {
        set({ theme, presented: withTheme(get().presented, theme) });
        const presented = get().presented;
        if (presented) publishStageVerse({ ...presented, theme });
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
          verse: get().verse,
        };
        const key = bookmarkKey(current);
        const exists = get().bookmarks.some((item) => bookmarkKey(item) === key);
        set({
          bookmarks: exists
            ? get().bookmarks.filter((item) => bookmarkKey(item) !== key)
            : [current, ...get().bookmarks].slice(0, 80),
        });
      },
      isBookmarked: (bookmark) => {
        const current = bookmark ?? {
          bookId: get().bookId,
          chapter: get().chapter,
          verse: get().verse,
        };
        const key = bookmarkKey(current);
        return get().bookmarks.some((item) => bookmarkKey(item) === key);
      },
      present: (verse) => {
        const next = { ...verse, theme: get().theme };
        set({ presented: next });
        publishStageVerse(next);
      },
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setStagePanelOpen: (open) => set({ stagePanelOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
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
        stagePanelOpen: state.stagePanelOpen,
      }),
    },
  ),
);
