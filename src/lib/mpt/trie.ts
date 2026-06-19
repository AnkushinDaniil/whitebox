import { bytesToNibbles, type Nibbles } from "./nibbles";
import { keccak256 } from "./hash";
import { EMPTY, type TrieNode } from "./node";
import { find, insert, remove } from "./ops";
import { rootHashHex } from "./serialize";
import { toView, type MptNodeView } from "./view";
import { bytesToHex, type Bytes } from "./bytes";

export interface TrieEntry {
  key: Bytes;
  value: Bytes;
}

/**
 * An immutable Merkle-Patricia Trie. Every mutation returns a NEW Trie; the
 * receiver is untouched. This mirrors how clients treat tries as persistent
 * snapshots and makes "before vs after an edit" trivial for the visualizer.
 *
 * Pass `secure: true` to key by keccak256(key) — Ethereum's real "secure trie",
 * where keys are hashed first (this is why production state tries look flat).
 */
export class Trie {
  private constructor(
    private readonly root: TrieNode,
    private readonly secure: boolean,
    private readonly entries: ReadonlyArray<TrieEntry>,
  ) {}

  static empty(secure = false): Trie {
    return new Trie(EMPTY, secure, []);
  }

  static fromEntries(entries: TrieEntry[], secure = false): Trie {
    let t = Trie.empty(secure);
    for (const e of entries) t = t.put(e.key, e.value);
    return t;
  }

  private keyToPath(key: Bytes): Nibbles {
    return bytesToNibbles(this.secure ? keccak256(key) : key);
  }

  put(key: Bytes, value: Bytes): Trie {
    const root = insert(this.root, this.keyToPath(key), value);
    const next = this.entries.filter((e) => bytesToHex(e.key) !== bytesToHex(key));
    return new Trie(root, this.secure, [...next, { key, value }]);
  }

  delete(key: Bytes): Trie {
    const root = remove(this.root, this.keyToPath(key));
    const next = this.entries.filter((e) => bytesToHex(e.key) !== bytesToHex(key));
    return new Trie(root, this.secure, next);
  }

  get(key: Bytes): Bytes | null {
    return find(this.root, this.keyToPath(key));
  }

  /** The state root — keccak256 of the root node's RLP. */
  rootHash(): string {
    return rootHashHex(this.root);
  }

  /** Render-ready snapshot of the whole tree. */
  view(): MptNodeView {
    return toView(this.root);
  }

  /** Current key/value entries (insertion-stable, last-write-wins). */
  list(): ReadonlyArray<TrieEntry> {
    return this.entries;
  }

  isSecure(): boolean {
    return this.secure;
  }

  /** Return a copy of this trie's entries re-keyed under a new secure setting. */
  withSecure(secure: boolean): Trie {
    if (secure === this.secure) return this;
    return Trie.fromEntries([...this.entries], secure);
  }
}
