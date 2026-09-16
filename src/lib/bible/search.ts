import { loadCatalog, prefetchAll, getCachedBook } from "./load";
import type { BookMeta } from "./types";

export type SearchHit = {
  bookId: string;
  bookName: string;
  bookShort: string;
  chapter: number;
  verse: number;
  text: string;
};

const REF_RE =
  /^([1-4]?\s*[А-Яа-яЁёA-Za-z.]+)\s+(\d+)(?::(\d+))?$/u;

export async function parseReference(query: string): Promise<SearchHit | null> {
  const trimmed = query.trim();
  const match = trimmed.match(REF_RE);
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
  const content = getCachedBook(book.id);
  const text = content?.chapters[chapter - 1]?.[verse - 1];
  if (!text) return null;
  return {
    bookId: book.id,
    bookName: book.name,
    bookShort: book.short,
    chapter,
    verse,
    text,
  };
}

export async function searchBible(query: string, limit = 36): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const ref = await parseReference(q);
  await prefetchAll();
  const catalog = await loadCatalog();
  const needle = q.toLowerCase();
  const hits: SearchHit[] = [];
  if (ref) hits.push(ref);

  const bookMatches = catalog.books.filter(
    (book) =>
      book.name.toLowerCase().includes(needle) ||
      book.short.toLowerCase().includes(needle),
  );
  for (const book of bookMatches.slice(0, 8)) {
    const text = getCachedBook(book.id)?.chapters[0]?.[0] ?? "";
    if (!hits.some((hit) => hit.bookId === book.id && hit.chapter === 1 && hit.verse === 1)) {
      hits.push({
        bookId: book.id,
        bookName: book.name,
        bookShort: book.short,
        chapter: 1,
        verse: 1,
        text,
      });
    }
  }

  for (const book of catalog.books) {
    const content = getCachedBook(book.id);
    if (!content) continue;
    for (let ci = 0; ci < content.chapters.length; ci++) {
      const chapter = content.chapters[ci];
      for (let vi = 0; vi < chapter.length; vi++) {
        const text = chapter[vi];
        if (!text.toLowerCase().includes(needle)) continue;
        if (
          hits.some(
            (hit) =>
              hit.bookId === book.id && hit.chapter === ci + 1 && hit.verse === vi + 1,
          )
        ) {
          continue;
        }
        hits.push({
          bookId: book.id,
          bookName: book.name,
          bookShort: book.short,
          chapter: ci + 1,
          verse: vi + 1,
          text,
        });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

export function booksByGroup(books: BookMeta[]) {
  const map = new Map<BookMeta["group"], BookMeta[]>();
  for (const book of books) {
    const list = map.get(book.group) ?? [];
    list.push(book);
    map.set(book.group, list);
  }
  return map;
}
