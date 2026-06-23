const STORAGE_KEY = "speakright_practice_history";

interface PracticeHistory {
  [slug: string]: {
    words: string[];
    lastUpdated: number;
  };
}

function getHistory(): PracticeHistory {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setHistory(history: PracticeHistory): boolean {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch {
    return false;
  }
}

export function getPracticedWords(slug: string): string[] {
  const history = getHistory();
  return history[slug]?.words ?? [];
}

export function markWordPracticed(slug: string, word: string): boolean {
  const history = getHistory();
  const entry = history[slug] ?? { words: [], lastUpdated: 0 };
  const lower = word.toLowerCase();
  if (!entry.words.includes(lower)) {
    entry.words.push(lower);
  }
  entry.lastUpdated = Date.now();
  history[slug] = entry;
  return setHistory(history);
}

export function practiceHistoryKey(languageId: string, slug: string): string {
  return `${languageId}:${slug}`;
}

export function getPracticedWordsForLanguage(
  languageId: string,
  slug: string,
): string[] {
  const scoped = getPracticedWords(practiceHistoryKey(languageId, slug));
  if (scoped.length === 0 && languageId === "en-US") {
    return getPracticedWords(slug);
  }
  return scoped;
}

export function markWordPracticedForLanguage(
  languageId: string,
  slug: string,
  word: string,
): boolean {
  return markWordPracticed(practiceHistoryKey(languageId, slug), word);
}
