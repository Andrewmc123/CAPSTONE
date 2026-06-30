import { useId } from "react";

// The Aura symbol — a glowing energy orb gathering an aura into a camera lens.
// Energy streaks spiral inward (as if a person is gathering their aura) into a
// radiant sphere whose core is a small camera lens (bezel + glass + aperture +
// glint) — nodding to video. With `lens` (splash) it shows the full gathering
// streaks, swirl and iris; without it, a compact glowing lens-orb for the header.
export default function AuraOrb({ size = 28, lens = false, className = "" }) {
  const uid = useId().replace(/:/g, "");
  const sphere = `s${uid}`;
  const corona = `o${uid}`;
  const glass = `gl${uid}`;
  const bezel = `b${uid}`;
  const streakG = `k${uid}`;

  // inward-spiralling energy streaks (large/splash mark only)
  const streaks = [];
  if (lens) {
    const N = 12;
    const ro = 48, ri = 31, swirl = 0.45, w = 2.3;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const ox = 50 + ro * Math.cos(a), oy = 50 + ro * Math.sin(a);
      const ix = 50 + ri * Math.cos(a - swirl), iy = 50 + ri * Math.sin(a - swirl);
      const px = -Math.sin(a), py = Math.cos(a);
      streaks.push({
        d: `M${(ox + px * w).toFixed(1)},${(oy + py * w).toFixed(1)} ` +
           `L${(ox - px * w).toFixed(1)},${(oy - py * w).toFixed(1)} ` +
           `L${ix.toFixed(1)},${iy.toFixed(1)} Z`,
        mx: ox, my: oy,
      });
    }
  }

  // camera-lens aperture (hexagonal iris)
  const hex = (rad, rot) => {
    const p = [];
    for (let k = 0; k < 6; k++) {
      const a = ((k * 60 + rot) * Math.PI) / 180;
      p.push([50 + rad * Math.cos(a), 50 + rad * Math.sin(a)]);
    }
    return p;
  };
  const fmt = (arr) => arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const oHex = hex(8.4, 0);
  const iHex = hex(4.4, 0);

  const R = lens ? 30 : 32;   // energy sphere radius
  const bz = lens ? 17 : 19;  // lens bezel radius
  const gr = lens ? 14.2 : 16; // lens glass radius

  return (
    <svg
      className={`aura-orb ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Aura"
    >
      <defs>
        <radialGradient id={corona} cx="50%" cy="50%" r="50%">
          <stop offset="34%" stopColor="#a855f7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={sphere} cx="42%" cy="36%" r="68%">
          <stop offset="0%" stopColor="#ffe9b8" />
          <stop offset="30%" stopColor="#e879f9" />
          <stop offset="66%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        <radialGradient id={glass} cx="46%" cy="40%" r="62%">
          <stop offset="0%" stopColor="#f3b4ff" />
          <stop offset="30%" stopColor="#7c3aed" />
          <stop offset="66%" stopColor="#3b1d6e" />
          <stop offset="100%" stopColor="#160a2e" />
        </radialGradient>
        <linearGradient id={bezel} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9b8" />
          <stop offset="48%" stopColor="#ffc233" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={streakG} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd9a0" />
          <stop offset="100%" stopColor="#c77dff" />
        </linearGradient>
      </defs>

      {/* aura corona */}
      <circle cx="50" cy="50" r="49" fill={`url(#${corona})`} />

      {/* gathering energy streaks + motes */}
      {lens && (
        <g>
          {streaks.map((s, i) => (
            <path key={i} d={s.d} fill={`url(#${streakG})`} fillOpacity="0.6" />
          ))}
          {streaks.map((s, i) => (
            <circle key={`m${i}`} cx={s.mx} cy={s.my} r="1.5" fill="#ffe9b8" />
          ))}
        </g>
      )}

      {/* energy sphere (glowing ring around the lens) */}
      <circle cx="50" cy="50" r={R} fill={`url(#${sphere})`} />

      {/* internal swirl */}
      {lens && (
        <g fill="none" strokeLinecap="round">
          <path d="M31,57 A22,22 0 0 1 65,31" stroke="#ffe9b8" strokeOpacity="0.45" strokeWidth="2" />
          <path d="M70,45 A21,21 0 0 1 39,69" stroke="#ffd9fb" strokeOpacity="0.28" strokeWidth="1.6" />
        </g>
      )}

      {/* ---- camera lens core ---- */}
      <circle cx="50" cy="50" r={bz} fill="none" stroke={`url(#${bezel})`} strokeWidth={lens ? 3 : 3.4} />
      <circle cx="50" cy="50" r={gr} fill={`url(#${glass})`} />
      <circle cx="50" cy="50" r={gr} fill="none" stroke="#c77dff" strokeOpacity="0.4" strokeWidth="1" />

      {/* hexagonal aperture iris (shown on both marks so the lens reads small too) */}
      <g stroke="#ffd9a0" fill="none" strokeLinejoin="round">
        <polygon points={fmt(oHex)} strokeOpacity="0.6" strokeWidth={lens ? 1.1 : 1.6} />
        {oHex.map((p, k) => (
          <line key={k} x1={p[0].toFixed(1)} y1={p[1].toFixed(1)}
                x2={iHex[(k + 1) % 6][0].toFixed(1)} y2={iHex[(k + 1) % 6][1].toFixed(1)}
                strokeOpacity="0.45" strokeWidth={lens ? 0.9 : 1.3} />
        ))}
      </g>

      {/* focal catch-dot + lens glint */}
      <circle cx="50" cy="50" r={lens ? 2.4 : 3} fill="#ffe9b8" />
      <ellipse cx={50 - gr * 0.34} cy={50 - gr * 0.42} rx={gr * 0.3} ry={gr * 0.18}
               fill="#ffffff" fillOpacity="0.55" transform={`rotate(-38 ${50 - gr * 0.34} ${50 - gr * 0.42})`} />
    </svg>
  );
}
