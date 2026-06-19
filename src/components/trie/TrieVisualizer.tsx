import { useState } from "react";
import { useTrieState } from "./useTrieState";
import TrieControls from "./TrieControls";
import TrieSvg from "./TrieSvg";
import NodeInspector, { findNode } from "./NodeInspector";
import BlockHeader from "./BlockHeader";
import "./trie.css";

export default function TrieVisualizer() {
  const {
    entries,
    snapshot,
    prevRootHash,
    upsert,
    remove,
    reset,
    toggleSecure,
    secure,
  } = useTrieState();
  const [selectedId, setSelectedId] = useState<string | null>("root");

  const selected = findNode(snapshot.view, selectedId);
  const rootChanged = snapshot.changedIds.has(snapshot.view.id);

  return (
    <div className="trie-viz">
      <TrieControls
        entries={entries}
        secure={secure}
        onUpsert={upsert}
        onRemove={remove}
        onReset={reset}
        onToggleSecure={toggleSecure}
      />

      <div className="tv-stage">
        <TrieSvg
          view={snapshot.view}
          changedIds={snapshot.changedIds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="tv-legend">
        <span className="lg branch">Branch (16-way)</span>
        <span className="lg extension">Extension (shared prefix)</span>
        <span className="lg leaf">Leaf (value)</span>
        <span className="lg changed">Rewritten by last edit</span>
      </div>

      <div className="tv-readouts">
        <BlockHeader
          stateRoot={snapshot.rootHash}
          prevRoot={prevRootHash}
          changed={rootChanged}
        />
        <NodeInspector node={selected} />
      </div>

      {secure && (
        <p className="tv-secure-note">
          Secure trie on: keys are now <code>keccak256(key)</code>, so they're
          uniformly spread across all 16 branches and almost never share a
          prefix. That's why real Ethereum state tries are wide and shallow —
          and why witness sizes became the problem statelessness has to solve.
        </p>
      )}
    </div>
  );
}
