import { useEffect, useState } from "react";
import "./journeynav.css";

export interface JourneyStep {
  id: string;
  label: string;
}

/**
 * A fixed progress rail for a long sequenced explorable. Tracks the active
 * section via IntersectionObserver and jumps to a step on click — so the reader
 * always sees where they are in the build, like chapter markers on the video.
 */
export default function JourneyNav({ steps }: { steps: JourneyStep[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Active = the last section whose top has crossed the reading line. Simple
    // and deterministic for tall sections (unlike an IntersectionObserver band).
    const onScroll = () => {
      const line = window.innerHeight * 0.28;
      let cur = 0;
      steps.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) cur = i;
      });
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [steps]);

  return (
    <nav className="jn" aria-label="Journey progress">
      <span className="jn-line" aria-hidden="true" />
      <ol>
        {steps.map((s, i) => (
          <li key={s.id} className={i === active ? "active" : i < active ? "done" : ""}>
            <a
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="jn-dot">{i + 1}</span>
              <span className="jn-label">{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
