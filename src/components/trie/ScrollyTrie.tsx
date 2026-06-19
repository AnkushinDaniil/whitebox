import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Trie, hexToBytes, utf8ToBytes, bytesToNibbles } from "@/lib/mpt";
import { computeLayout, NODE_WIDTH } from "./layout";
import { pathToKey, decodeValue } from "./path";
import { DEFAULT_ENTRIES } from "./presets";
import "./scrolly.css";

type Mode = "path" | "types" | "edit" | "propagate" | "root" | "header";

interface Step {
  mode: Mode;
  title: string;
  body: string;
}

const ALICE_KEY = "0xa7c1";
const NODE_H = 56;
const WAVE_STEP = 130;

const STEPS: Step[] = [
  {
    mode: "path",
    title: "An account is a path",
    body: "Alice's key 0xa7c1 isn't stored in a row somewhere — it's a route. Read it one nibble at a time, a → 7 → c → 1, and each nibble picks the next turn down the tree until you reach her leaf.",
  },
  {
    mode: "types",
    title: "Three kinds of node",
    body: "The route is built from just three parts. A branch is a 16-way fork. An extension is a shortcut that swallows a run of shared nibbles. A leaf is the end of the road, holding the value.",
  },
  {
    mode: "edit",
    title: "Change one balance",
    body: "Alice spends some ETH: 12.0 → 99.0. Only her leaf is touched — its bytes change, so its hash must change. Nothing else in the tree has moved yet.",
  },
  {
    mode: "propagate",
    title: "Re-hash, bottom-up",
    body: "A node's hash is built from its children's hashes. So the new leaf hash forces its parent to re-hash, which forces its parent… a wave of recomputation travels straight up Alice's path — and only her path.",
  },
  {
    mode: "root",
    title: "A brand-new state root",
    body: "The wave reaches the top. The root node emits a fresh 32-byte hash: the new state root. Every node on Earth, fed the same edit, computes this exact same number.",
  },
  {
    mode: "header",
    title: "It lands in the header",
    body: "That root drops into the block header's stateRoot slot. One changed balance has changed the block's identity — this is where state and consensus are welded together.",
  },
];

export default function ScrollyTrie() {
  const scene = useMemo(() => {
    const before = Trie.fromEntries(
      DEFAULT_ENTRIES.map((e) => ({ key: hexToBytes(e.key), value: utf8ToBytes(e.value) })),
    );
    const after = before.put(hexToBytes(ALICE_KEY), utf8ToBytes("Alice · 99.0 ETH"));
    const beforeView = before.view();
    const afterView = after.view();
    return {
      beforeView,
      afterView,
      pathIds: pathToKey(beforeView, ALICE_KEY),
      beforeRoot: before.rootHash(),
      afterRoot: after.rootHash(),
      beforeHashById: collectHashes(beforeView),
    };
  }, []);

  const active = useActiveStep(STEPS.length);
  const mode = STEPS[active].mode;
  const edited = mode === "edit" || mode === "propagate" || mode === "root" || mode === "header";
  const view = edited ? scene.afterView : scene.beforeView;
  const rootHash = edited ? scene.afterRoot : scene.beforeRoot;

  return (
    <div className="scrolly">
      <div className="scrolly-stage">
        <Stage
          view={view}
          mode={mode}
          pathIds={scene.pathIds}
          rootHash={rootHash}
          beforeRoot={scene.beforeRoot}
          beforeHashById={scene.beforeHashById}
          // remount the animated layer when we enter propagate so it replays
          replayKey={mode}
        />
      </div>
      <ol className="scrolly-steps">
        {STEPS.map((s, i) => (
          <Stepblock key={i} step={s} index={i} active={i === active} total={STEPS.length} />
        ))}
      </ol>
    </div>
  );
}

function Stepblock({
  step,
  index,
  active,
  total,
}: {
  step: Step;
  index: number;
  active: boolean;
  total: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.dataset.step = String(index);
  }, [index]);
  return (
    <li ref={ref} data-step={index} className={active ? "step active" : "step"}>
      <span className="step-counter">
        {String(index + 1).padStart(2, "0")} <span className="of">/ {String(total).padStart(2, "0")}</span>
      </span>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
    </li>
  );
}

/** IntersectionObserver that reports which step is centered in the viewport. */
function useActiveStep(count: number): number {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const steps = Array.from(document.querySelectorAll<HTMLElement>(".scrolly-steps .step"));
    if (!steps.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.step);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    steps.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [count]);
  return active;
}

/* --------------------------------------------------------------------- */

function Stage({
  view,
  mode,
  pathIds,
  rootHash,
  beforeRoot,
  beforeHashById,
  replayKey,
}: {
  view: ReturnType<Trie["view"]>;
  mode: Mode;
  pathIds: string[];
  rootHash: string;
  beforeRoot: string;
  beforeHashById: Map<string, string>;
  replayKey: string;
}) {
  const layout = useMemo(() => computeLayout(view), [view]);
  const pathSet = useMemo(() => new Set(pathIds), [pathIds]);
  const leafId = pathIds[pathIds.length - 1];

  const depthOf = (id: string) => pathIds.indexOf(id); // 0=root … n=leaf
  const maxDepth = pathIds.length - 1;
  const aliceNibbles = bytesToNibbles(hexToBytes(ALICE_KEY));

  const dimOthers = mode === "path" || mode === "edit" || mode === "propagate";
  const showHeader = mode === "header" || mode === "root";

  // A path string through the node centers, leaf -> root, for the charge dot to
  // physically travel up via pure-CSS offset-path during the propagate step.
  const chargePath = useMemo(() => {
    const byId = new Map(layout.nodes.map((n) => [n.data.id, n]));
    const centers = pathIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((n) => `${n!.x},${n!.y}`)
      .reverse();
    return centers.length >= 2 ? `M${centers.join(" L")}` : "";
  }, [layout, pathIds]);

  return (
    <div className="stage-inner">
      {/* key reader */}
      <div className={`key-reader ${mode === "path" ? "reading" : ""}`}>
        <span className="kr-label">key</span>
        <code className="kr-key">{ALICE_KEY}</code>
        <span className="kr-arrow">→</span>
        <div className="kr-nibbles">
          {aliceNibbles.map((n, i) => (
            <span key={i} className="kr-nib" style={{ animationDelay: `${i * 180}ms` }}>
              {n.toString(16)}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="stage-svg"
        role="img"
        aria-label={`Trie, step: ${mode}`}
      >
        {/* links */}
        <g key={`links-${replayKey}`}>
          {layout.links.map((l) => {
            const onPath = pathSet.has(l.target.data.id) && pathSet.has(l.source.data.id);
            const delay = (maxDepth - depthOf(l.target.data.id)) * WAVE_STEP;
            return (
              <g key={l.target.data.id}>
                <path
                  d={linkPath(l.source.x, l.source.y, l.target.x, l.target.y)}
                  className={`s-link ${onPath ? "on" : ""} ${dimOthers && !onPath ? "dim" : ""}`}
                  fill="none"
                />
                {mode === "propagate" && onPath && (
                  <path
                    d={linkPath(l.source.x, l.source.y, l.target.x, l.target.y)}
                    className="s-flow"
                    fill="none"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* nodes */}
        <g key={`nodes-${replayKey}`}>
          {layout.nodes.map((n) => {
            const id = n.data.id;
            const onPath = pathSet.has(id);
            const isLeaf = id === leafId;
            const isRoot = id === "root";
            const delay = (maxDepth - depthOf(id)) * WAVE_STEP;
            const cls = [
              "s-node",
              `t-${n.data.type}`,
              onPath ? "on" : "",
              dimOthers && !onPath ? "dim" : "",
              mode === "propagate" && onPath ? "pulse" : "",
              mode === "edit" && isLeaf ? "edited" : "",
              showHeader && isRoot ? "root-focus" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g
                key={id}
                className={cls}
                style={
                  {
                    transform: `translate(${n.x - NODE_WIDTH / 2}px, ${n.y - NODE_H / 2}px)`,
                    "--d": `${delay}ms`,
                  } as CSSProperties
                }
              >
                <rect width={NODE_WIDTH} height={NODE_H} rx="9" className="s-rect" />
                <rect x="9" y="2" width={NODE_WIDTH - 18} height="3" rx="1.5" className="s-bar" />
                <text x="10" y="22" className="s-type">
                  {n.data.type.toUpperCase()}
                </text>
                <text x="10" y="38" className="s-val">
                  {nodeLine(n.data, isLeaf, mode)}
                </text>
                <text
                  x="10"
                  y="50"
                  className={mode === "propagate" && onPath ? "s-hash rehash" : "s-hash"}
                >
                  {mode === "propagate" && onPath ? (
                    <ScrambleHash
                      from={beforeHashById.get(id) ?? n.data.hashHex}
                      to={n.data.hashHex}
                      delay={delay}
                    />
                  ) : (
                    `${n.data.hashHex.slice(0, 10)}…`
                  )}
                </text>
              </g>
            );
          })}
        </g>

        {/* a "charge" that flows up Alice's path to the root (pure CSS offset-path) */}
        {mode === "propagate" && chargePath && (
          <g key={`charge-${replayKey}`}>
            <circle r="9" className="charge" style={{ offsetPath: `path('${chargePath}')` } as CSSProperties} />
            <circle r="4" className="charge-core" style={{ offsetPath: `path('${chargePath}')` } as CSSProperties} />
          </g>
        )}
      </svg>

      {/* the three node types, color-matched to the bars above (no overlap) */}
      {mode === "types" && (
        <div className="types-legend">
          <span className="tl branch">Branch · 16-way fork</span>
          <span className="tl extension">Extension · shared prefix</span>
          <span className="tl leaf">Leaf · the value</span>
        </div>
      )}

      {/* block header */}
      <div className={`stage-header ${showHeader ? "show" : ""}`}>
        <span className="sh-label">block header</span>
        <div className="sh-fields">
          <span className="sh-field">parentHash <em>0x…</em></span>
          <span className="sh-field state">
            stateRoot <em className={mode === "header" ? "land" : ""}>{rootHash.slice(0, 16)}…</em>
          </span>
          <span className="sh-field">receiptsRoot <em>0x…</em></span>
        </div>
        {mode === "header" && beforeRoot !== rootHash && (
          <span className="sh-delta">
            <s>{beforeRoot.slice(0, 10)}…</s> → <b>{rootHash.slice(0, 10)}…</b>
          </span>
        )}
      </div>
    </div>
  );
}

function nodeLine(d: ReturnType<Trie["view"]>, isLeaf: boolean, mode: Mode): string {
  if (d.type === "leaf") {
    if (isLeaf && (mode === "edit")) return "12.0 → 99.0 ETH";
    return decodeValue(d.value).replace("Alice · ", "").replace(" ETH", " ETH");
  }
  if (d.type === "extension") return `shares ${d.partialLabel}`;
  if (d.type === "branch") return `${d.childNibbles.length}-way fork`;
  return "";
}

/** Collect id -> short hash for every node in a view (for old/new hash diffing). */
function collectHashes(
  view: ReturnType<Trie["view"]>,
  map: Map<string, string> = new Map(),
): Map<string, string> {
  map.set(view.id, view.hashHex);
  for (const c of view.children) if (c) collectHashes(c, map);
  return map;
}

const HEX = "0123456789abcdef";

/**
 * Renders a node's short hash and, when `delay` ms have passed, scrambles its
 * hex digits from the old value to the new one — making the bottom-up rehash
 * visibly rewrite each hash on the path. Mounts fresh per step (the nodes group
 * is keyed by mode), so it replays whenever the reader lands on this step.
 */
function ScrambleHash({ from, to, delay }: { from: string; to: string; delay: number }) {
  const target = to.slice(2, 10); // 8 hex chars after 0x
  const start = from.slice(2, 10);
  const [chars, setChars] = useState(start);

  useEffect(() => {
    setChars(start);
    let raf = 0;
    const begin = () => {
      const t0 = performance.now();
      const dur = 520;
      const loop = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const revealed = Math.floor(target.length * p);
        let out = "";
        for (let i = 0; i < target.length; i++) {
          out += i < revealed ? target[i] : HEX[Math.floor(Math.random() * 16)];
        }
        setChars(out);
        if (p < 1) raf = requestAnimationFrame(loop);
        else setChars(target);
      };
      raf = requestAnimationFrame(loop);
    };
    const t = setTimeout(begin, delay);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [from, to, delay]);

  return <>0x{chars}…</>;
}

function linkPath(sx: number, sy: number, tx: number, ty: number): string {
  const a = sy + NODE_H / 2;
  const b = ty - NODE_H / 2;
  const m = (a + b) / 2;
  return `M${sx},${a} C${sx},${m} ${tx},${m} ${tx},${b}`;
}
