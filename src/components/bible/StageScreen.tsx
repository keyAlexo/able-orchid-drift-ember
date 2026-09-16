import { useEffect, useState } from "react";
import {
  applyThemeToDocument,
  readStageVerse,
  subscribeStageVerse,
} from "@/lib/bible/stage-channel";
import { citationOf, type StageVerse } from "@/lib/bible/types";

export function StageScreen({
  verse: verseProp,
  compact = false,
}: {
  verse?: StageVerse | null;
  compact?: boolean;
}) {
  const [live, setLive] = useState<StageVerse | null>(() => verseProp ?? readStageVerse());
  const verse = verseProp !== undefined ? verseProp : live;

  useEffect(() => {
    if (verseProp !== undefined) return;
    setLive(readStageVerse());
    return subscribeStageVerse(setLive);
  }, [verseProp]);

  useEffect(() => {
    if (verse?.theme) applyThemeToDocument(verse.theme);
  }, [verse?.theme]);

  if (!verse) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center px-8 text-center">
        <p className="font-serif text-2xl text-balance text-stage-fg">Писание</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-stage-muted">
          Выберите стих на основном экране — он появится здесь, на втором дисплее.
        </p>
      </div>
    );
  }

  const citation = citationOf(
    { name: verse.bookName, short: verse.bookShort },
    verse.chapter,
    verse.verse,
  );

  return (
    <div
      className={
        compact
          ? "flex h-full min-h-0 flex-col justify-center px-7 py-8"
          : "flex h-full min-h-0 flex-col items-center justify-center px-10 py-12 sm:px-16"
      }
      style={{ background: "var(--stage-bg)", color: "var(--stage-fg)" }}
    >
      <article
        key={`${verse.bookId}-${verse.chapter}-${verse.verse}`}
        className="stage-verse mx-auto w-full"
        style={{ maxWidth: compact ? "28rem" : "38rem" }}
      >
        <p
          className="font-serif text-pretty"
          style={{
            fontSize: compact ? "1.35rem" : "clamp(1.75rem, 3.4vw, 2.75rem)",
            lineHeight: 1.45,
            fontWeight: 400,
          }}
        >
          {verse.text}
        </p>
        <footer className="mt-8 flex items-center gap-3">
          <span
            className="block h-px w-8 shrink-0"
            style={{ background: "color-mix(in oklab, var(--stage-fg) 28%, transparent)" }}
          />
          <cite
            className="not-italic tracking-wide"
            style={{
              color: "var(--stage-muted)",
              fontSize: compact ? "0.75rem" : "0.92rem",
              fontWeight: 500,
            }}
          >
            {citation}
          </cite>
        </footer>
      </article>
    </div>
  );
}
