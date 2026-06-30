import AuraOrb from "./AuraOrb";
import "./Splash.css";

// Launch / boot screen — the camera-lens Aura orb over a deep purple glow.
export default function Splash({ fading = false }) {
  return (
    <div className={`aura-splash ${fading ? "aura-splash--out" : ""}`} aria-hidden={fading}>
      <div className="aura-splash-rings">
        <AuraOrb size={150} lens />
      </div>
      <div className="aura-splash-word">Aura</div>
      <div className="aura-splash-tag">Share your aura to the world</div>
    </div>
  );
}
