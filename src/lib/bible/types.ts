export type Testament = "ot" | "nt";

export type BookGroup =
  | "law"
  | "history"
  | "wisdom"
  | "prophets"
  | "gospels"
  | "acts"
  | "epistles"
  | "revelation";

export type ThemeId = "paper" | "sepia" | "night";

export type BookMeta = {
  id: string;
  name: string;
  short: string;
  testament: Testament;
  group: BookGroup;
  chapters: number;
  verses: number;
};

export type Catalog = {
  id: string;
  name: string;
  language: string;
  books: BookMeta[];
};

export type BookContent = {
  id: string;
  chapters: string[][];
};

export type Bookmark = {
  bookId: string;
  chapter: number;
  verse: number;
};

export type StageVerse = {
  bookId: string;
  bookName: string;
  bookShort: string;
  chapter: number;
  verse: number;
  text: string;
  theme: ThemeId;
};

export const GROUP_LABELS: Record<BookGroup, string> = {
  law: "Пятикнижие",
  history: "Исторические",
  wisdom: "Учительные",
  prophets: "Пророки",
  gospels: "Евангелия",
  acts: "Деяния",
  epistles: "Послания",
  revelation: "Откровение",
};

export const GROUP_ORDER: BookGroup[] = [
  "law",
  "history",
  "wisdom",
  "prophets",
  "gospels",
  "acts",
  "epistles",
  "revelation",
];

export function citationOf(
  book: Pick<BookMeta, "name" | "short">,
  chapter: number,
  verse: number,
  short = false,
) {
  const title = short ? book.short.replace(/\.$/, "") : book.name;
  return `${title} ${chapter}:${verse}`;
}

export function bookmarkKey(b: Bookmark) {
  return `${b.bookId}:${b.chapter}:${b.verse}`;
}
