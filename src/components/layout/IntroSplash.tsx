"use client";

import { useEffect, useId, useRef, useState } from "react";

/** sessionStorage flag: the intro plays once per visit (tab), not on reloads or navigation. */
export const INTRO_SEEN_KEY = "cv:intro-seen";

/**
 * Runs in <head> before first paint. Returning visitors (same tab) and anyone
 * who prefers reduced motion get `data-intro="skip"`, which hides the overlay
 * in CSS before it can ever flash.
 */
export const INTRO_GATE_SCRIPT = `try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="skip"}catch(e){}`;

const LETTERS = "CINEVIDE".split("");

/**
 * Branded opening sequence (~2.4s): the gold ring draws itself, the play
 * triangle pushes out through its opening, the wordmark rises letter by
 * letter, then the stage drifts forward and dissolves into the app.
 *
 * All motion is CSS keyframes (see `.intro` in globals.css), so it stays
 * smooth while the page hydrates underneath and still exits without JS.
 * Click or any key skips it.
 */
export function IntroSplash() {
  const [done, setDone] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const gradientId = `intro-gold-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    // Already hidden by CSS (returning visitor / reduced motion): nothing to run.
    if (document.documentElement.dataset.intro === "skip") return;
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Storage blocked (private mode): the intro simply plays again next time.
    }
    const skip = () => setSkipping(true);
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="intro"
      data-skipping={skipping || undefined}
      onAnimationEnd={(event) => {
        if (event.target === ref.current && event.animationName.startsWith("intro-out")) setDone(true);
      }}
    >
      <div className="intro-stage">
        <div className="intro-glow" />
        <svg viewBox="8.5 8.5 47 47" className="intro-mark" focusable="false">
          <defs>
            <linearGradient id={gradientId} x1="10" y1="54" x2="54" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#E89A2C" />
              <stop offset=".55" stopColor="#F2B544" />
              <stop offset="1" stopColor="#FFD88A" />
            </linearGradient>
          </defs>
          <path
            className="intro-ring"
            pathLength={100}
            d="M46.97 20.30A19 19 0 1 0 46.97 43.70"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            className="intro-play"
            d="M25 22L25 42L49 32Z"
            fill="#F5F5F7"
            stroke="#F5F5F7"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
        <p className="intro-word font-display">
          {LETTERS.map((letter, i) => (
            <span key={i} style={{ animationDelay: `${980 + i * 45}ms` }}>
              {letter}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
