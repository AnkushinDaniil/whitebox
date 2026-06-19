import { useCallback, useMemo, useState } from "react";
import { Trie, hexToBytes, utf8ToBytes, type MptNodeView } from "@/lib/mpt";
import { DEFAULT_ENTRIES, type PresetEntry } from "./presets";

export interface TrieSnapshot {
  view: MptNodeView;
  rootHash: string;
  /** ids of nodes that changed (or are new) vs the previous snapshot */
  changedIds: Set<string>;
  secure: boolean;
}

function buildTrie(entries: PresetEntry[], secure: boolean): Trie {
  return Trie.fromEntries(
    entries.map((e) => ({ key: hexToBytes(e.key), value: utf8ToBytes(e.value) })),
    secure,
  );
}

/** Collect every node id present in a view tree. */
function collectIds(view: MptNodeView, into: Map<string, string>): void {
  into.set(view.id, view.hashHex);
  for (const c of view.children) if (c) collectIds(c, into);
}

/** Nodes whose hash changed or that newly appeared between two views. */
function diffViews(prev: MptNodeView | null, next: MptNodeView): Set<string> {
  const changed = new Set<string>();
  if (!prev) return changed;
  const prevMap = new Map<string, string>();
  collectIds(prev, prevMap);
  const walk = (n: MptNodeView) => {
    const before = prevMap.get(n.id);
    if (before === undefined || before !== n.hashHex) changed.add(n.id);
    for (const c of n.children) if (c) walk(c);
  };
  walk(next);
  return changed;
}

export function useTrieState() {
  const [entries, setEntries] = useState<PresetEntry[]>(DEFAULT_ENTRIES);
  const [secure, setSecure] = useState(false);
  const [prevView, setPrevView] = useState<MptNodeView | null>(null);
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());

  const snapshot = useMemo<TrieSnapshot>(() => {
    const trie = buildTrie(entries, secure);
    const view = trie.view();
    return { view, rootHash: trie.rootHash(), changedIds, secure };
  }, [entries, secure, changedIds]);

  /** Apply a mutation and record which nodes changed for highlighting. */
  const mutate = useCallback(
    (next: PresetEntry[], nextSecure = secure) => {
      const before = buildTrie(entries, secure).view();
      const after = buildTrie(next, nextSecure).view();
      setPrevView(before);
      setChangedIds(diffViews(before, after));
      setEntries(next);
      if (nextSecure !== secure) setSecure(nextSecure);
    },
    [entries, secure],
  );

  const upsert = useCallback(
    (entry: PresetEntry) => {
      const idx = entries.findIndex((e) => e.key.toLowerCase() === entry.key.toLowerCase());
      const next =
        idx >= 0
          ? entries.map((e, i) => (i === idx ? entry : e))
          : [...entries, entry];
      mutate(next);
    },
    [entries, mutate],
  );

  const remove = useCallback(
    (key: string) => mutate(entries.filter((e) => e.key.toLowerCase() !== key.toLowerCase())),
    [entries, mutate],
  );

  const reset = useCallback(() => {
    setPrevView(null);
    setChangedIds(new Set());
    setEntries(DEFAULT_ENTRIES);
  }, []);

  const toggleSecure = useCallback(
    () => mutate(entries, !secure),
    [entries, mutate, secure],
  );

  return {
    entries,
    snapshot,
    prevRootHash: prevView ? hashOfView(prevView) : null,
    upsert,
    remove,
    reset,
    toggleSecure,
    secure,
  };
}

function hashOfView(view: MptNodeView): string {
  return view.hashHex;
}
