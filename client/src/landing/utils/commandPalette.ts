import { NavSectionKey } from '../data/soraContent';

export type CommandActionType =
  | { type: 'navigate'; section: NavSectionKey }
  | { type: 'language'; lang: 'python' | 'javascript' | 'java' | 'cpp' | 'go' }
  | { type: 'arc'; arcId: string }
  | { type: 'route'; path: string }
  | { type: 'booking' };

export interface CommandPaletteItem {
  id: string;
  group: 'Platform' | 'Sections' | 'Live Simulator' | 'Story Arcs' | 'Actions';
  label: string;
  hint: string;
  keywords: string;
  action: CommandActionType;
}

export function filterCommandItems(
  items: CommandPaletteItem[],
  query: string
): CommandPaletteItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((item) => {
    const haystack = `${item.group} ${item.label} ${item.hint} ${item.keywords}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getNextHighlightedIndex(
  currentIndex: number,
  direction: 'up' | 'down',
  total: number
): number {
  if (total <= 0) return -1;
  if (currentIndex < 0 || currentIndex >= total) {
    return direction === 'down' ? 0 : total - 1;
  }
  if (direction === 'down') {
    return (currentIndex + 1) % total;
  }
  return (currentIndex - 1 + total) % total;
}
