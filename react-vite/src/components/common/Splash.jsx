import AuraOrb from "./AuraOrb";
import "./Splash.css";

const WORD = "Aura";

// Launch / boot screen — the camera-lens Aura orb over a deep purple glow,
// with the wordmark assembling in chrome over a synthwave grid.
export default function Splash({ fading = false }) {
  return (
    <div className={`aura-splash ${fading ? "aura-splash--out" : ""}`} aria-hidden={fading}>
      <div className="aura-splash-grid" />

      <div className="aura-splash-rings">
        <AuraOrb size={150} lens />
      </div>

      {/* one span per letter so they can land in sequence */}
      <div className="aura-splash-word" aria-label="Aura">
        {WORD.split("").map((letter, i) => (
          <span key={`${letter}-${i}`} style={{ "--i": i }}>{letter}</span>
        ))}
      </div>

      <div className="aura-splash-tag">Share your aura to the world</div>
      <div className="aura-splash-scan" aria-hidden="true" />
    </div>
  );
}
