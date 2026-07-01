import { useId } from "react";
import { verifyLevel } from "../../utils/verify";
import "./Verified.css";

// The Aura verified badge — an orb-check. Purple for verified (Pro),
// gold for a celebrity (Icon). Renders nothing for unverified tiers.
export default function AuraCheck({ tierKey, size = 16, className = "" }) {
  const uid = useId().replace(/:/g, "");
  const gid = `vc${uid}`;
  const level = verifyLevel(tierKey);
  if (!level) return null;
  const gold = level === 2;

  return (
    <svg
      className={`aura-check ${gold ? "is-gold" : "is-pur"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={gold ? "Celebrity — verified" : "Verified"}
    >
      <defs>
        <radialGradient id={gid} cx="42%" cy="36%" r="70%">
          {gold ? (
            <>
              <stop offset="0%" stopColor="#fff7e0" />
              <stop offset="45%" stopColor="#ffc233" />
              <stop offset="100%" stopColor="#b9791a" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#f3e6ff" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6d28d9" />
            </>
          )}
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#${gid})`} />
      <circle cx="12" cy="12" r="11" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="0.7" />
      <ellipse cx="8.6" cy="7.7" rx="2.5" ry="1.5" fill="#ffffff" fillOpacity="0.5" />
      <path d="M6.9 12.4 L10.4 15.7 L17 8.6" fill="none" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
