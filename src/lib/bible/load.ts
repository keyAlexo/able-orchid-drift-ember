import type { BookContent, BookMeta, Catalog } from "./types";

const bookCache = new Map<string, BookContent>();
let catalogPromise: Promise<Catalog> | null = null;
let fullPromise: Promise<void> | null = null;

export function loadCatalog(): Promise<Catalog> {
  catalogPromise ??= fetch("/bible/rst/catalog.json").then((res) => {
    if (!res.ok) throw new Error("Не удалось загрузить каталог Библии");
    return res.json() as Promise<Catalog>;
  });
  return catalogPromise;
}

export async function loadBook(id: string): Promise<BookContent> {
  const cached = bookCache.get(id);
  if (cached) return cached;
  const res = await fetch(`/bible/rst/books/${id}.json`);
  if (!res.ok) throw new Error("Не удалось загрузить книгу");
  const data = (await res.json()) as BookContent;
  bookCache.set(id, data);
  return data;
}

export function getCachedBook(id: string): BookContent | undefined {
  return bookCache.get(id);
}

export function prefetchAll(): Promise<void> {
  fullPromise ??= (async () => {
    const res = await fetch("/bible/rst/full.json");
    if (!res.ok) return;
    const data = (await res.json()) as { books: BookContent[] };
    for (const book of data.books) bookCache.set(book.id, book);
  })();
  return fullPromise;
}

export function findBook(catalog: Catalog, id: string): BookMeta | undefined {
  return catalog.books.find((book) => book.id === id);
}

export function neighborBook(
  catalog: Catalog,
  id: string,
  delta: number,
): BookMeta | undefined {
  const index = catalog.books.findIndex((book) => book.id === id);
  if (index < 0) return undefined;
  return catalog.books[index + delta];
}
