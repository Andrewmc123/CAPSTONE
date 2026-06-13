// Video filter presets — applied as CSS filters at playback & edit time
// (the same metadata travels with the post in edit_data.filter)

export const FILTERS = {
  none:  { label: "Original", css: "none" },
  neon:  { label: "Neon",   css: "saturate(1.6) contrast(1.15) brightness(1.05) hue-rotate(-8deg)" },
  vivid: { label: "Vivid",  css: "saturate(1.45) contrast(1.1)" },
  retro: { label: "Retro",  css: "sepia(0.45) contrast(1.05) saturate(1.2)" },
  noir:  { label: "Noir",   css: "grayscale(1) contrast(1.2)" },
  chill: { label: "Chill",  css: "saturate(0.85) brightness(1.08) hue-rotate(12deg)" },
  warm:  { label: "Sunset", css: "sepia(0.25) saturate(1.35) brightness(1.05)" },
  frost: { label: "Frost",  css: "brightness(1.1) contrast(0.95) saturate(0.8) hue-rotate(160deg)" },
  party: { label: "Party",  css: "saturate(1.8) contrast(1.2) hue-rotate(25deg)" },
};

export const TEXT_COLORS = ["#ffffff", "#32ff32", "#ff8c00", "#ff3b5c", "#42c8f5", "#ffd000", "#0a0a0c"];

export const TEXT_FONTS = {
  classic: { label: "Classic", css: "-apple-system, 'Segoe UI', Roboto, sans-serif", weight: 800 },
  typewriter: { label: "Typewriter", css: "'Courier New', monospace", weight: 700 },
  serif: { label: "Serif", css: "Georgia, 'Times New Roman', serif", weight: 700 },
  handwritten: { label: "Marker", css: "'Comic Sans MS', 'Segoe Print', cursive", weight: 700 },
};

export function filterCss(key) {
  return (FILTERS[key] || FILTERS.none).css;
}
