import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Code2, Compass, Search, Sparkles, X, User, ExternalLink, BookOpen } from 'lucide-react';
import {
  LIVE_EDITOR_SNIPPETS,
  NAV_ITEMS,
  STORY_ARCS,
} from '../data/soraContent';
import {
  CommandActionType,
  CommandPaletteItem,
  filterCommandItems,
  getNextHighlightedIndex,
} from '../utils/commandPalette';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onExecute: (action: CommandActionType) => void;
}

const ALL_COMMAND_ITEMS: CommandPaletteItem[] = [
  {
    id: 'route-practice',
    group: 'Platform',
    label: 'Nebula',
    hint: 'AI-based topicwise learning',
    keywords: 'nebula practice learn tutor code ide lesson react python binary search',
    action: { type: 'route', path: '/practice' },
  },
  {
    id: 'route-adaptive',
    group: 'Platform',
    label: 'Zephyr',
    hint: 'Curated problem solver',
    keywords: 'zephyr adaptive problem bank elo dsa algorithm questions interview',
    action: { type: 'route', path: '/adaptive-practice' },
  },
  {
    id: 'route-dashboard',
    group: 'Platform',
    label: 'Candidate Dashboard',
    hint: 'Interviews, tickets, forensic reports & history',
    keywords: 'dashboard candidate meeting loop report tickets schedule',
    action: { type: 'route', path: '/candidate-dashboard' },
  },
  {
    id: 'route-login',
    group: 'Platform',
    label: 'Log In / Sign In',
    hint: 'Access your account',
    keywords: 'login signin auth account session',
    action: { type: 'route', path: '/login' },
  },
  {
    id: 'route-signup',
    group: 'Platform',
    label: 'Create Account / Sign Up',
    hint: 'Join Sora for verified mock loops',
    keywords: 'signup register create account new user',
    action: { type: 'route', path: '/signup' },
  },
  {
    id: 'route-guidelines',
    group: 'Platform',
    label: 'Community & Interview Guidelines',
    hint: 'Honor code, rules & interview etiquette',
    keywords: 'guidelines rules etiquette honor code expectations',
    action: { type: 'route', path: '/guidelines' },
  },
  {
    id: 'route-feedback',
    group: 'Platform',
    label: 'Platform Feedback & Support',
    hint: 'Share feedback or report an issue',
    keywords: 'feedback support review rating bug report',
    action: { type: 'route', path: '/feedback' },
  },
  ...NAV_ITEMS.map((item) => ({
    id: `nav-${item.key}`,
    group: 'Sections' as const,
    label: `Section: ${item.label}`,
    hint: `Jump to #${item.key}`,
    keywords: `${item.key} section navigate scroll features learn upcoming stories`,
    action: { type: 'navigate' as const, section: item.key },
  })),
  ...LIVE_EDITOR_SNIPPETS.map((snippet) => {
    const aliasMap: Record<string, string> = {
      python: 'py python3',
      javascript: 'js node typescript',
      java: 'jvm',
      cpp: 'c++ cpp clang',
      go: 'go golang',
    };
    return {
      id: `lang-${snippet.id}`,
      group: 'Live Simulator' as const,
      label: `Switch Simulator to ${snippet.label}`,
      hint: 'Shared interview editor',
      keywords: `code syntax programming language ${snippet.id} ${snippet.label} ${aliasMap[snippet.id] ?? ''}`,
      action: { type: 'language' as const, lang: snippet.id },
    };
  }),
  ...STORY_ARCS.map((arc) => ({
    id: `arc-${arc.id}`,
    group: 'Story Arcs' as const,
    label: arc.title,
    hint: `${arc.topic} · ${arc.difficulty}`,
    keywords: `${arc.chapter} ${arc.topic} algorithm problem dsa dp bfs binary search`,
    action: { type: 'arc' as const, arcId: arc.id },
  })),
  {
    id: 'action-begin-journey',
    group: 'Actions',
    label: 'Begin Journey — Schedule Mock Loop',
    hint: '60-min live interview with FAANG mentor',
    keywords: 'book schedule start mentor interview waitlist early access',
    action: { type: 'booking' },
  },
];

const GROUP_ORDER: CommandPaletteItem['group'][] = [
  'Platform',
  'Sections',
  'Live Simulator',
  'Story Arcs',
  'Actions',
];

export function CommandPalette({ open, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filteredItems = useMemo(
    () => filterCommandItems(ALL_COMMAND_ITEMS, query),
    [query]
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHighlightedIndex(0);
      return;
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (highlightedIndex >= filteredItems.length && filteredItems.length > 0) {
      setHighlightedIndex(0);
    }
  }, [filteredItems.length, highlightedIndex]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          getNextHighlightedIndex(prev, 'down', filteredItems.length)
        );
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          getNextHighlightedIndex(prev, 'up', filteredItems.length)
        );
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const active = filteredItems[highlightedIndex];
        if (active) {
          onExecute(active.action);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, onExecute, filteredItems, highlightedIndex]);

  if (!open) return null;

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: filteredItems.filter((i) => i.group === group),
  })).filter((g) => g.items.length > 0);

  let flatCounter = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-md sm:p-6 sm:pt-28"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette quick switcher"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-[#041a2a]/95 p-3 text-white shadow-2xl backdrop-blur-2xl sm:p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex items-center border-b border-white/12 px-3 pb-3">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            placeholder="Type a command or search (e.g. practice, python, sliding window, dashboard)..."
            className="w-full bg-transparent px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="rounded-full p-1 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-1 py-2 sm:max-h-96">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-400">
              No matching commands or story arcs found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.group} className="py-2">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-400/80">
                  {g.group}
                </p>
                <div className="space-y-0.5">
                  {g.items.map((item) => {
                    flatCounter += 1;
                    const currentIndex = flatCounter;
                    const isHighlighted = currentIndex === highlightedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onExecute(item.action);
                          onClose();
                        }}
                        onMouseEnter={() => setHighlightedIndex(currentIndex)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          isHighlighted
                            ? 'bg-white/15 text-white'
                            : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.group === 'Platform' && (
                            <ExternalLink className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                          )}
                          {item.group === 'Sections' && (
                            <Compass className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          )}
                          {item.group === 'Live Simulator' && (
                            <Code2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          )}
                          {item.group === 'Story Arcs' && (
                            <Sparkles className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          )}
                          {item.group === 'Actions' && (
                            <ArrowRight className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                          )}
                          <span className="truncate font-medium">{item.label}</span>
                        </div>
                        <span className="ml-2 shrink-0 text-[11px] text-zinc-400">
                          {item.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-3 pt-2.5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Sora Command Engine</span>
        </div>
      </div>
    </div>
  );
}
