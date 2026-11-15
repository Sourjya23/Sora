import { NavSectionKey } from '../data/soraContent';

export interface SectionQuickOption {
  id: string;
  label: string;
}

export interface SectionQuickConfig {
  section: NavSectionKey;
  promptLabel: string;
  options: SectionQuickOption[];
}

export function getSectionQuickConfig(section: NavSectionKey): SectionQuickConfig {
  switch (section) {
    case 'features':
      return {
        section: 'features',
        promptLabel: 'Editor Language',
        options: [
          { id: 'python', label: 'Python' },
          { id: 'javascript', label: 'JavaScript' },
          { id: 'java', label: 'Java' },
          { id: 'cpp', label: 'C++' },
          { id: 'go', label: 'Go' },
        ],
      };
    case 'learn':
      return {
        section: 'learn',
        promptLabel: 'Story Arc',
        options: [
          { id: 'kingdom-search', label: '01. Kingdom Search' },
          { id: 'enchanted-maze', label: '02. Enchanted Maze' },
          { id: 'dragons-coin', label: '03. Dragon’s Coin' },
        ],
      };
    case 'upcoming':
      return {
        section: 'upcoming',
        promptLabel: 'Release Window',
        options: [
          { id: 'all', label: 'All Releases' },
          { id: 'Q3 2025', label: 'Q3 2025' },
          { id: 'Q4 2025', label: 'Q4 2025' },
        ],
      };
    case 'stories':
      return {
        section: 'stories',
        promptLabel: 'Engineer Loop',
        options: [
          { id: 'all', label: 'All Loops' },
          { id: 'Google', label: 'Google' },
          { id: 'Amazon', label: 'Amazon' },
          { id: 'Meta', label: 'Meta' },
        ],
      };
  }
}

export function resolveActiveSectionFromScroll(
  sectionBounds: Array<{ id: NavSectionKey; top: number; bottom: number }>,
  viewportPivotY: number
): NavSectionKey | null {
  for (const bound of sectionBounds) {
    if (bound.top <= viewportPivotY && bound.bottom >= viewportPivotY) {
      return bound.id;
    }
  }
  return null;
}
