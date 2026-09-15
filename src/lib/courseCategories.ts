/**
 * Course categories. The chip row used to be a fixed list of three ids, so a
 * course created with any other categoryId could never be filtered to — and
 * courses with no category were silently labelled 「戦略・思考」.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  strategy: '戦略・思考',
  traffic: '集客・リスト',
  content: 'コンテンツ',
  other: 'その他',
};

export const UNCATEGORIZED = 'other';

export function categoryLabel(id: string): string {
  return CATEGORY_LABELS[id] ?? id;
}

/** The chips to show, derived from the courses actually in the catalogue. */
export function categoriesFrom(courses: { cat: string }[]): { id: string; label: string }[] {
  const ids = [...new Set(courses.map(c => c.cat))];
  const known = Object.keys(CATEGORY_LABELS).filter(id => ids.includes(id));
  const extra = ids.filter(id => !(id in CATEGORY_LABELS)).sort();
  return [{ id: 'all', label: 'すべて' }, ...[...known, ...extra].map(id => ({ id, label: categoryLabel(id) }))];
}
