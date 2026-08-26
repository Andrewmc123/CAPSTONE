import { PRESENCE_LABELS } from "./presence";
import "./PresenceDot.css";

/**
 * The status bead that sits on a user's avatar.
 *   online  — green
 *   dnd     — red with a cross-out bar
 *   offline — grey
 */
export default function PresenceDot({ presence = "offline", size = 12, className = "" }) {
  const state = PRESENCE_LABELS[presence] ? presence : "offline";
  return (
    <span
      className={`presence-dot presence-${state} ${className}`}
      style={{ "--dot-size": `${size}px` }}
      title={PRESENCE_LABELS[state]}
      aria-label={PRESENCE_LABELS[state]}
      role="img"
    />
  );
}
