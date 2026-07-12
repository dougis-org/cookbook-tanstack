export function titleSortKey(title: string): string {
  const lower = title.toLowerCase();
  const match = lower.match(/^(a|an|the)\s+/);
  if (match) {
    return lower.substring(match[0].length);
  }
  return lower;
}

export function compareByTitle(a: string, b: string): number {
  return titleSortKey(a).localeCompare(titleSortKey(b));
}

export function sortIdsByTitle<T>(
  items: T[],
  getId: (item: T) => string,
  getTitle: (item: T) => string
): string[] {
  const mapped = items.map((item, index) => ({
    id: getId(item),
    sortKey: titleSortKey(getTitle(item)),
    index,
  }));

  mapped.sort((a, b) => {
    const cmp = a.sortKey.localeCompare(b.sortKey);
    if (cmp !== 0) {
      return cmp;
    }
    return a.index - b.index;
  });

  return mapped.map((item) => item.id);
}
