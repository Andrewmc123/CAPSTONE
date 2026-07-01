import AuraCheck from "./AuraCheck";
import { verifyLevel } from "../../utils/verify";
import "./Verified.css";

// Avatar wrapped in an "aura" — a glowing tier-coloured ring (purple for Pro,
// animated gold for Icon/celebrity), with an optional corner orb-check badge
// and a celebrity sparkle. Falls back to a plain <img> for unverified users.
export default function VerifiedAvatar({
  user,
  size = 48,
  badge = false,
  sparkle = true,
  className = "",
}) {
  const level = verifyLevel(user?.tier_key);
  const src = user?.profile_img || `https://i.pravatar.cc/160?u=${user?.id}`;

  if (!level) {
    return (
      <img
        className={`avatar ${className}`}
        src={src}
        alt={user?.username || ""}
        style={{ width: size, height: size }}
      />
    );
  }

  const gold = level === 2;
  const ringW = Math.max(2, Math.round(size * 0.07));
  const inner = size - 2 * (ringW + 1);

  return (
    <span
      className={`vavatar ${gold ? "vavatar--icon" : "vavatar--pro"} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="vavatar-ring" />
      <img
        className="vavatar-img"
        src={src}
        alt={user?.username || ""}
        style={{ width: inner, height: inner, top: ringW + 1, left: ringW + 1 }}
      />
      {gold && sparkle && <span className="vavatar-spark" aria-hidden="true" />}
      {badge && (
        <span className="vavatar-badge" style={{ width: size * 0.34, height: size * 0.34 }}>
          <AuraCheck tierKey={user.tier_key} size={size * 0.34} />
        </span>
      )}
    </span>
  );
}
