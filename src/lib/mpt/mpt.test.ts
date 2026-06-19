import { describe, expect, it } from "vitest";
import { MerklePatriciaTrie } from "@ethereumjs/mpt";
import { bytesToHex as ejsHex } from "@ethereumjs/util";
import { Trie } from "./trie";
import { hexToBytes, utf8ToBytes } from "./bytes";
import { hexPrefixEncode } from "./nibbles";
import { rlpEncodeBytes, rlpEncodeList } from "./rlp";
import { keccak256 } from "./hash";
import { bytesToHex } from "./bytes";

/** Reference root from the audited @ethereumjs/mpt implementation. */
async function ejsRoot(entries: [Uint8Array, Uint8Array][]): Promise<string> {
  const t = new MerklePatriciaTrie();
  for (const [k, v] of entries) await t.put(k, v);
  return ejsHex(t.root());
}

describe("RLP", () => {
  it("encodes the empty string as 0x80", () => {
    expect(bytesToHex(rlpEncodeBytes(new Uint8Array(0)))).toBe("0x80");
  });
  it("encodes a single low byte as itself", () => {
    expect(bytesToHex(rlpEncodeBytes(Uint8Array.of(0x2a)))).toBe("0x2a");
  });
  it("encodes 'dog' per the Yellow Paper", () => {
    expect(bytesToHex(rlpEncodeBytes(utf8ToBytes("dog")))).toBe("0x83646f67");
  });
  it("encodes a list of two strings", () => {
    const enc = rlpEncodeList([
      rlpEncodeBytes(utf8ToBytes("cat")),
      rlpEncodeBytes(utf8ToBytes("dog")),
    ]);
    expect(bytesToHex(enc)).toBe("0xc88363617483646f67");
  });
});

describe("hex-prefix (compact) encoding", () => {
  // Vectors from the Ethereum wiki / Yellow Paper.
  it("even extension", () => {
    expect(bytesToHex(hexPrefixEncode([0, 1, 2, 3, 4, 5], false))).toBe("0x00012345");
  });
  it("odd extension", () => {
    expect(bytesToHex(hexPrefixEncode([1, 2, 3, 4, 5], false))).toBe("0x112345");
  });
  it("odd leaf", () => {
    expect(bytesToHex(hexPrefixEncode([0, 15, 1, 12, 11, 8], true))).toBe("0x200f1cb8");
  });
  it("even leaf", () => {
    expect(bytesToHex(hexPrefixEncode([15, 1, 12, 11, 8], true))).toBe("0x3f1cb8");
  });
});

describe("Trie root — empty", () => {
  it("matches keccak256(rlp('')) and the reference impl", async () => {
    const computed = bytesToHex(keccak256(rlpEncodeBytes(new Uint8Array(0))));
    expect(Trie.empty().rootHash()).toBe(computed);
    expect(Trie.empty().rootHash()).toBe(await ejsRoot([]));
  });
});

describe("Trie root — differential vs @ethereumjs/mpt", () => {
  const cases: Record<string, [Uint8Array, Uint8Array][]> = {
    "single leaf": [[utf8ToBytes("do"), utf8ToBytes("verb")]],
    "classic do/dog/doge/horse": [
      [utf8ToBytes("do"), utf8ToBytes("verb")],
      [utf8ToBytes("dog"), utf8ToBytes("puppy")],
      [utf8ToBytes("doge"), utf8ToBytes("coins")],
      [utf8ToBytes("horse"), utf8ToBytes("stallion")],
    ],
    "shared-prefix extension": [
      [hexToBytes("0x1234"), utf8ToBytes("a")],
      [hexToBytes("0x1235"), utf8ToBytes("b")],
      [hexToBytes("0x1245"), utf8ToBytes("c")],
    ],
    "branch-with-value (key is prefix of another)": [
      [hexToBytes("0xabcd"), utf8ToBytes("short")],
      [hexToBytes("0xabcdef"), utf8ToBytes("long")],
    ],
    "32-byte account-like keys": [
      [hexToBytes("0x" + "11".repeat(32)), utf8ToBytes("acct-a")],
      [hexToBytes("0x" + "12".repeat(32)), utf8ToBytes("acct-b")],
      [hexToBytes("0x" + "1f".repeat(32)), utf8ToBytes("acct-c")],
    ],
  };

  for (const [name, entries] of Object.entries(cases)) {
    it(name, async () => {
      const ours = Trie.fromEntries(entries.map(([key, value]) => ({ key, value })));
      expect(ours.rootHash()).toBe(await ejsRoot(entries));
    });
  }

  it("overwrite (last write wins) matches reference", async () => {
    const ours = Trie.empty()
      .put(utf8ToBytes("do"), utf8ToBytes("verb"))
      .put(utf8ToBytes("do"), utf8ToBytes("noun"));
    expect(ours.rootHash()).toBe(
      await ejsRoot([[utf8ToBytes("do"), utf8ToBytes("noun")]]),
    );
  });

  it("delete restores prior root (insert A,B then delete B == insert A)", async () => {
    const a: [Uint8Array, Uint8Array] = [hexToBytes("0x1234"), utf8ToBytes("a")];
    const b: [Uint8Array, Uint8Array] = [hexToBytes("0x1256"), utf8ToBytes("b")];
    const afterDelete = Trie.empty().put(a[0], a[1]).put(b[0], b[1]).delete(b[0]);
    expect(afterDelete.rootHash()).toBe(await ejsRoot([a]));
  });
});

describe("Trie — randomized differential fuzz", () => {
  // Deterministic LCG so the test is reproducible (no Math.random).
  function lcg(seed: number) {
    let s = seed >>> 0;
    return () => ((s = (1103515245 * s + 12345) >>> 0) / 0xffffffff);
  }

  it("100 random key/value sets match the reference root", async () => {
    const rand = lcg(0xc0ffee);
    for (let trial = 0; trial < 100; trial++) {
      const n = 1 + Math.floor(rand() * 8);
      const entries: [Uint8Array, Uint8Array][] = [];
      for (let i = 0; i < n; i++) {
        const klen = 1 + Math.floor(rand() * 6);
        const key = new Uint8Array(klen);
        for (let j = 0; j < klen; j++) key[j] = Math.floor(rand() * 256);
        const vlen = 1 + Math.floor(rand() * 10);
        const val = new Uint8Array(vlen);
        for (let j = 0; j < vlen; j++) val[j] = Math.floor(rand() * 256);
        entries.push([key, val]);
      }
      const ours = Trie.fromEntries(entries.map(([key, value]) => ({ key, value })));
      expect(ours.rootHash(), `trial ${trial}`).toBe(await ejsRoot(entries));
    }
  });
});

describe("Trie — get & secure mode", () => {
  it("reads back inserted values", () => {
    const t = Trie.empty()
      .put(utf8ToBytes("do"), utf8ToBytes("verb"))
      .put(utf8ToBytes("dog"), utf8ToBytes("puppy"));
    expect(t.get(utf8ToBytes("dog"))).toEqual(utf8ToBytes("puppy"));
    expect(t.get(utf8ToBytes("cat"))).toBeNull();
  });

  it("secure trie matches reference secure root", async () => {
    const entries: [Uint8Array, Uint8Array][] = [
      [utf8ToBytes("alpha"), utf8ToBytes("1")],
      [utf8ToBytes("beta"), utf8ToBytes("2")],
    ];
    const ours = Trie.fromEntries(
      entries.map(([key, value]) => ({ key, value })),
      true,
    );
    const ref = new MerklePatriciaTrie({ useKeyHashing: true });
    for (const [k, v] of entries) await ref.put(k, v);
    expect(ours.rootHash()).toBe(ejsHex(ref.root()));
  });
});
