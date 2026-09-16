import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Moon,
  PanelRight,
  Search,
  Sun,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageScreen } from "@/components/bible/StageScreen";
import {
  findBook,
  loadBook,
  loadCatalog,
  neighborBook,
  prefetchAll,
} from "@/lib/bible/load";
import { searchBible, type SearchHit } from "@/lib/bible/search";
import {
  applyThemeToDocument,
  isStageWindowOpen,
  openStageWindow,
  publishStageVerse,
  readStageVerse,
} from "@/lib/bible/stage-channel";
import { useBibleStore } from "@/lib/bible/store";
import {
  citationOf,
  GROUP_LABELS,
  GROUP_ORDER,
  type BookContent,
  type BookMeta,
  type Catalog,
  type StageVerse,
} from "@/lib/bible/types";
import { cn } from "@/lib/utils";

export function PisanieApp() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [book, setBook] = useState<BookContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookQuery, setBookQuery] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"books" | "marks">("books");
  const [stageOpen, setStageOpen] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const verseRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const chapterStripRef = useRef<HTMLDivElement>(null);

  const store = useBibleStore();
  const {
    bookId,
    chapter,
    verse,
    theme,
    fontSize,
    autoSend,
    bookmarks,
    presented,
    sidebarOpen,
    stagePanelOpen,
    searchOpen,
  } = store;

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    const idle = window.setTimeout(() => {
      void prefetchAll();
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    if (!catalog) return;
    const meta = findBook(catalog, bookId) ?? catalog.books[0];
    if (!meta) return;
    if (meta.id !== bookId) {
      store.setPlace(meta.id, 1, 1);
      return;
    }
    let cancelled = false;
    loadBook(meta.id)
      .then((data) => {
        if (cancelled) return;
        setBook(data);
        const maxChapter = data.chapters.length;
        const nextChapter = Math.min(Math.max(1, chapter), maxChapter);
        const maxVerse = data.chapters[nextChapter - 1]?.length ?? 1;
        const nextVerse = Math.min(Math.max(1, verse), maxVerse);
        if (nextChapter !== chapter || nextVerse !== verse) {
          store.setPlace(meta.id, nextChapter, nextVerse);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [catalog, bookId]);

  useEffect(() => {
    if (!presented) {
      const stored = readStageVerse();
      if (stored) useBibleStore.setState({ presented: stored });
    } else {
      publishStageVerse({ ...presented, theme });
    }
  }, []);

  const meta = catalog ? findBook(catalog, bookId) : undefined;
  const verses = book?.chapters[chapter - 1] ?? [];
  const currentText = verses[verse - 1] ?? "";

  const makeStageVerse = useCallback(
    (nextVerse: number, text: string, bookMeta: BookMeta, nextChapter = chapter): StageVerse => ({
      bookId: bookMeta.id,
      bookName: bookMeta.name,
      bookShort: bookMeta.short,
      chapter: nextChapter,
      verse: nextVerse,
      text,
      theme,
    }),
    [chapter, theme],
  );

  const selectVerse = useCallback(
    (next: number, send = autoSend) => {
      store.setVerse(next);
      if (!send || !meta) return;
      const text = verses[next - 1];
      if (!text) return;
      store.present(makeStageVerse(next, text, meta));
    },
    [autoSend, makeStageVerse, meta, store, verses],
  );

  const presentCurrent = useCallback(() => {
    if (!meta || !currentText) return;
    store.present(makeStageVerse(verse, currentText, meta));
  }, [currentText, makeStageVerse, meta, store, verse]);

  const goTo = useCallback(
    (nextBook: string, nextChapter: number, nextVerse = 1, send = false) => {
      store.setPlace(nextBook, nextChapter, nextVerse);
      store.setSidebarOpen(false);
      store.setSearchOpen(false);
      if (!send || !catalog) return;
      const bookMeta = findBook(catalog, nextBook);
      if (!bookMeta) return;
      void loadBook(nextBook).then((data) => {
        const text = data.chapters[nextChapter - 1]?.[nextVerse - 1];
        if (!text) return;
        store.present(makeStageVerse(nextVerse, text, bookMeta, nextChapter));
      });
    },
    [catalog, makeStageVerse, store],
  );

  const turnChapter = useCallback(
    (delta: number) => {
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
    },
    [book, catalog, chapter, goTo, meta],
  );

  const turnVerse = useCallback(
    (delta: number) => {
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
    },
    [autoSend, book, chapter, makeStageVerse, meta, selectVerse, store, turnChapter, verse, verses.length],
  );

  useEffect(() => {
    const node = verseRefs.current[verse];
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [verse, chapter, bookId]);

  useEffect(() => {
    const strip = chapterStripRef.current;
    if (!strip) return;
    const active = strip.querySelector(".is-active");
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [chapter, bookId]);

  useEffect(() => {
    const node = document.querySelector(".book-item.is-active");
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: "center" });
    }
  }, [bookId, catalog]);

  useEffect(() => {
    if (!autoSend || !meta || !currentText || presented) return;
    store.present(makeStageVerse(verse, currentText, meta));
  }, [autoSend, currentText, makeStageVerse, meta, presented, store, verse]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
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
      } else if (event.key.toLowerCase() === "b") {
        store.toggleBookmark();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentCurrent, store, turnChapter, turnVerse]);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [searchOpen]);

  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = window.setTimeout(() => {
      void searchBible(q).then((hits) => {
        setSearchHits(hits);
        setSearching(false);
      });
    }, 180);
    return () => window.clearTimeout(id);
  }, [searchQuery, searchOpen]);

  const filteredBooks = useMemo(() => {
    if (!catalog) return [];
    const q = bookQuery.trim().toLowerCase();
    if (!q) return catalog.books;
    return catalog.books.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.short.toLowerCase().includes(q),
    );
  }, [bookQuery, catalog]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookMeta[]>();
    for (const item of filteredBooks) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return GROUP_ORDER.map((group) => ({ group, books: map.get(group) ?? [] })).filter(
      (entry) => entry.books.length > 0,
    );
  }, [filteredBooks]);

  const citation = meta ? citationOf(meta, chapter, verse) : "Писание";

  const copyCitation = async () => {
    if (!currentText || !meta) return;
    const payload = `${citation}\n${currentText}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const openSecondScreen = async () => {
    if (!presented) presentCurrent();
    const win = await openStageWindow();
    setStageOpen(Boolean(win && !win.closed));
    if (!win) store.setStagePanelOpen(true);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setStageOpen(isStageWindowOpen());
    }, 800);
    return () => window.clearInterval(id);
  }, []);

  const showStage = stagePanelOpen;

  return (
    <div className="app-shell">
      <header className="toolbar">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          aria-label="Книги"
          onClick={() => store.setSidebarOpen(true)}
        >
          <BookOpen />
        </Button>
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="font-serif text-lg tracking-tight">Писание</span>
          <span className="text-subtle">/</span>
          <span className="truncate text-sm text-muted">{catalog?.name ?? "Синодальный перевод"}</span>
        </div>
        <button
          type="button"
          onClick={copyCitation}
          className="mx-auto min-w-0 truncate rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-fill"
          title="Скопировать стих"
        >
          {copyDone ? "Скопировано" : citation}
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Найти"
            onClick={() => store.setSearchOpen(true)}
          >
            <Search />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="Мельче"
            onClick={() => store.setFontSize(fontSize - 1)}
          >
            <Type className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="Крупнее"
            onClick={() => store.setFontSize(fontSize + 1)}
          >
            <Type />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Тема"
            onClick={() => store.cycleTheme()}
          >
            {theme === "night" ? <Moon /> : <Sun />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Закладка"
            onClick={() => store.toggleBookmark()}
          >
            <Bookmark className={store.isBookmarked() ? "fill-current" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden md:inline-flex"
            aria-label="Панель стиха"
            onClick={() => store.setStagePanelOpen(!stagePanelOpen)}
          >
            <PanelRight />
          </Button>
          <Button size="sm" onClick={() => void openSecondScreen()} className="hidden sm:inline-flex">
            <Monitor />
            Второй экран
          </Button>
          <Button
            size="icon-sm"
            className="sm:hidden"
            aria-label="Второй экран"
            onClick={() => void openSecondScreen()}
          >
            <Monitor />
          </Button>
        </div>
      </header>

      <div className={cn("workspace", showStage && "has-stage")}>
        <aside
          className={cn(
            "sidebar",
            sidebarOpen
              ? "fixed inset-0 z-40 flex bg-bg/80 lg:static lg:bg-transparent"
              : "hidden lg:flex",
          )}
        >
          <div
            className={cn(
              "sidebar-drawer flex h-full min-h-0 flex-col bg-bg",
              sidebarOpen && "shadow-border",
            )}
          >
            <div className="flex items-center gap-2 border-b border-line px-3 py-3 lg:hidden">
              <span className="font-serif text-lg">Книги</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label="Закрыть"
                onClick={() => store.setSidebarOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className="flex gap-1 px-3 pt-3">
              <button
                type="button"
                className={cn(
                  "h-8 flex-1 rounded-lg text-sm",
                  sidebarTab === "books" ? "bg-ink text-ink-fg" : "text-muted hover:bg-fill",
                )}
                onClick={() => setSidebarTab("books")}
              >
                Библия
              </button>
              <button
                type="button"
                className={cn(
                  "h-8 flex-1 rounded-lg text-sm",
                  sidebarTab === "marks" ? "bg-ink text-ink-fg" : "text-muted hover:bg-fill",
                )}
                onClick={() => setSidebarTab("marks")}
              >
                Закладки
              </button>
            </div>
            {sidebarTab === "books" ? (
              <>
                <div className="px-3 pt-3">
                  <input
                    value={bookQuery}
                    onChange={(event) => setBookQuery(event.target.value)}
                    placeholder="Книга"
                    className="h-10 w-full rounded-lg bg-fill px-3 text-sm outline-none placeholder:text-subtle"
                  />
                </div>
                <div className="scroll-thin mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-6">
                  {grouped.map(({ group, books }) => (
                    <section key={group} className="mb-4">
                      <h2 className="px-2 pb-1 pt-2 text-xs font-medium tracking-wide text-subtle">
                        {GROUP_LABELS[group]}
                      </h2>
                      {books.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={cn("book-item", item.id === bookId && "is-active")}
                          onClick={() => goTo(item.id, item.id === bookId ? chapter : 1, 1)}
                        >
                          <span className="truncate">{item.name}</span>
                          <span className={cn("text-xs tabular-nums", item.id === bookId ? "opacity-70" : "text-subtle")}>
                            {item.chapters}
                          </span>
                        </button>
                      ))}
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <div className="scroll-thin mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-6">
                {bookmarks.length === 0 ? (
                  <p className="px-3 py-8 text-sm leading-relaxed text-muted">
                    Отметьте стих закладкой — он останется под рукой.
                  </p>
                ) : (
                  bookmarks.map((mark) => {
                    const bookMeta = catalog ? findBook(catalog, mark.bookId) : undefined;
                    return (
                      <button
                        key={`${mark.bookId}-${mark.chapter}-${mark.verse}`}
                        type="button"
                        className="book-item"
                        onClick={() => goTo(mark.bookId, mark.chapter, mark.verse)}
                      >
                        <span>
                          {bookMeta
                            ? citationOf(bookMeta, mark.chapter, mark.verse, true)
                            : `${mark.bookId} ${mark.chapter}:${mark.verse}`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
          {sidebarOpen ? (
            <button
              type="button"
              className="h-full flex-1 lg:hidden"
              aria-label="Закрыть список книг"
              onClick={() => store.setSidebarOpen(false)}
            />
          ) : null}
        </aside>

        <main className="reader flex min-h-0 flex-col">
          <div className="chapter-bar">
            <Button variant="ghost" size="icon-sm" aria-label="Предыдущая глава" onClick={() => turnChapter(-1)}>
              <ChevronLeft />
            </Button>
            <div ref={chapterStripRef} className="scroll-thin flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {meta
                ? Array.from({ length: meta.chapters }, (_, index) => {
                    const n = index + 1;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={cn("chapter-chip", n === chapter && "is-active")}
                        onClick={() => goTo(bookId, n, 1)}
                      >
                        {n}
                      </button>
                    );
                  })
                : null}
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Следующая глава" onClick={() => turnChapter(1)}>
              <ChevronRight />
            </Button>
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            <article
              className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-10"
              style={{ fontSize: `${fontSize}px` }}
            >
              <header className="mb-8">
                <p className="text-xs font-medium tracking-widest text-subtle uppercase">
                  {meta ? (meta.testament === "nt" ? "Новый Завет" : "Ветхий Завет") : "Священное Писание"}
                </p>
                <h1 className="mt-2 font-serif text-3xl tracking-tight text-balance sm:text-4xl">
                  {meta?.name ?? "Писание"}
                </h1>
                <p className="mt-1 font-serif text-xl text-muted">Глава {chapter}</p>
              </header>

              {loadError ? (
                <p className="text-base text-muted">{loadError}</p>
              ) : !book ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="h-5 animate-pulse rounded-md bg-fill" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {verses.map((text, index) => {
                    const n = index + 1;
                    const isSelected = n === verse;
                    const isPresented =
                      presented?.bookId === bookId &&
                      presented.chapter === chapter &&
                      presented.verse === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        ref={(node) => {
                          verseRefs.current[n] = node;
                        }}
                        className={cn(
                          "verse-row",
                          isSelected && "is-selected",
                          isPresented && "is-presented",
                        )}
                        onClick={() => selectVerse(n)}
                        onDoubleClick={() => {
                          if (!meta) return;
                          store.present(makeStageVerse(n, text, meta));
                        }}
                      >
                        <span className="verse-num">{n}</span>
                        <span>
                          {text}
                          {isPresented ? (
                            <span className="ml-2 align-middle font-sans text-xs font-medium tracking-wide text-subtle">
                              на экране
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 sm:hidden">
            <Button variant="ghost" size="sm" onClick={() => turnChapter(-1)}>
              <ChevronLeft />
              Глава
            </Button>
            <Button size="sm" onClick={presentCurrent}>
              Вывести стих
            </Button>
            <Button variant="ghost" size="sm" onClick={() => turnChapter(1)}>
              Глава
              <ChevronRight />
            </Button>
          </div>
        </main>

        {showStage ? (
          <section className="stage-panel relative hidden lg:flex lg:flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs font-medium tracking-widest text-stage-muted uppercase">
                  Второй экран
                </p>
                <p className="mt-0.5 text-sm text-stage-fg">
                  {stageOpen ? "Окно открыто" : autoSend ? "Следит за выбранным стихом" : "Ожидает вывода"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="stage-ghost"
                onClick={() => void openSecondScreen()}
              >
                {stageOpen ? "Показать окно" : "Открыть окно"}
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <StageScreen verse={presented} compact />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-stage-muted">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSend}
                  onChange={(event) => store.setAutoSend(event.target.checked)}
                  className="size-3.5 accent-current"
                />
                Выводить при выборе
              </label>
              <button type="button" className="hover:text-stage-fg" onClick={presentCurrent}>
                Обновить
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {searchOpen ? (
        <div className="search-layer fixed inset-0 z-50 flex items-start justify-center bg-fg/20 px-3">
          <div
            role="dialog"
            aria-label="Поиск"
            className="search-dialog flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-paper shadow-border"
          >
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search className="size-4 text-subtle" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Стих, книга или ссылка — Ин 3:16"
                className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
              />
              <Button variant="ghost" size="icon-sm" aria-label="Закрыть поиск" onClick={() => store.setSearchOpen(false)}>
                <X />
              </Button>
            </div>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2">
              {searching ? (
                <p className="px-3 py-6 text-sm text-muted">Ищем по всей Библии…</p>
              ) : searchQuery.trim().length < 2 ? (
                <p className="px-3 py-6 text-sm leading-relaxed text-muted">
                  Наберите слово или ссылку. Стрелки листают стихи, Enter выводит выбранный на второй экран.
                </p>
              ) : searchHits.length === 0 ? (
                <p className="px-3 py-6 text-sm text-muted">Ничего не найдено.</p>
              ) : (
                searchHits.map((hit) => (
                  <button
                    key={`${hit.bookId}-${hit.chapter}-${hit.verse}-${hit.text.slice(0, 12)}`}
                    type="button"
                    className="w-full rounded-xl px-3 py-3 text-left hover:bg-fill"
                    onClick={() => goTo(hit.bookId, hit.chapter, hit.verse, autoSend)}
                  >
                    <p className="text-xs font-medium text-muted">
                      {citationOf(
                        { name: hit.bookName, short: hit.bookShort },
                        hit.chapter,
                        hit.verse,
                      )}
                    </p>
                    <p className="mt-1 line-clamp-2 font-serif text-base leading-relaxed">{hit.text}</p>
                  </button>
                ))
              )}
            </div>
          </div>
          <button
            type="button"
            className="absolute inset-0 -z-10"
            aria-label="Закрыть поиск"
            onClick={() => store.setSearchOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
