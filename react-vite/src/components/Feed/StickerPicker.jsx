import { useState } from "react";
import { FaMagnifyingGlass, FaXmark, FaStar } from "react-icons/fa6";
import "./GifPicker.css";
import "./StickerPicker.css";

// Crisp, transparent, always-available sticker pack (Twemoji SVGs via jsDelivr —
// no API key needed, so it works on the live demo). id = unicode codepoint.
const TW = (id) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${id}.svg`;

const PACK = [
  ["1f602", "laughing", "reactions"], ["1f62d", "sobbing", "reactions"], ["1f480", "skull", "reactions"],
  ["1f525", "fire", "reactions"], ["1f4af", "hundred", "reactions"], ["1f440", "eyes", "reactions"],
  ["1f60d", "heart eyes", "reactions"], ["1f923", "rofl", "reactions"], ["1f60e", "cool", "reactions"],
  ["1f92f", "mind blown", "reactions"], ["1f624", "steam", "reactions"], ["1f976", "freezing", "reactions"],
  ["1f921", "clown", "reactions"], ["1f644", "eye roll", "reactions"], ["1f97a", "pleading", "reactions"],
  ["2764", "red heart", "love"], ["1f49c", "purple heart", "love"], ["1f49b", "gold heart", "love"],
  ["1f496", "sparkle heart", "love"], ["1f618", "kiss", "love"], ["1f970", "smiling hearts", "love"],
  ["1f48b", "kiss mark", "love"],
  ["1f44d", "thumbs up", "hands"], ["1f44f", "clap", "hands"], ["1f64c", "raised hands", "hands"],
  ["1f64f", "pray", "hands"], ["1f91d", "handshake", "hands"], ["1f4aa", "muscle", "hands"],
  ["270c", "peace", "hands"], ["1f919", "call me", "hands"], ["1f44c", "ok", "hands"], ["1faf6", "heart hands", "hands"],
  ["1f389", "party", "hype"], ["1faa9", "disco", "hype"], ["1f973", "partying", "hype"], ["2728", "sparkles", "hype"],
  ["2b50", "star", "hype"], ["1f48e", "gem", "hype"], ["1f680", "rocket", "hype"], ["1f3c6", "trophy", "hype"],
  ["1f451", "crown", "hype"], ["1f4b0", "money bag", "hype"],
  ["1f410", "goat", "animals"], ["1f431", "cat", "animals"], ["1f436", "dog", "animals"],
  ["1f98b", "butterfly", "animals"], ["1f40d", "snake", "animals"], ["1f981", "lion", "animals"],
].map(([id, title, cat]) => ({ id, title, cat, url: TW(id) }));

const CATS = [
  { key: "all", label: "All" },
  { key: "reactions", label: "Reactions" },
  { key: "love", label: "Love" },
  { key: "hands", label: "Hands" },
  { key: "hype", label: "Hype" },
  { key: "animals", label: "Animals" },
];

const SAVED_KEY = "aura_saved_stickers";
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
};

// detect a sticker url so comments can render it cleanly (no GIF box)
export const isStickerUrl = (url) => !!url && url.includes("twemoji");

export default function StickerPicker({ onSelect, onClose, title = "Send a sticker" }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [saved, setSaved] = useState(readSaved);

  const isSaved = (s) => saved.some((x) => x.id === s.id);
  const toggleSave = (e, s) => {
    e.stopPropagation();
    setSaved((prev) => {
      const next = prev.some((x) => x.id === s.id)
        ? prev.filter((x) => x.id !== s.id)
        : [{ id: s.id, url: s.url, title: s.title }, ...prev].slice(0, 60);
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const q = query.trim().toLowerCase();
  const display = cat === "saved"
    ? saved
    : PACK.filter((s) => (cat === "all" || s.cat === cat) && (!q || s.title.includes(q)));

  return (
    <div className="gifpicker sticker-picker fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="gifpicker-head">
        <strong>{title}</strong>
        <span className="gifpicker-power">Stickers</span>
        <button className="gifpicker-close" onClick={onClose} aria-label="Close"><FaXmark /></button>
      </div>

      <div className="gifpicker-search">
        <FaMagnifyingGlass />
        <input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setCat("all"); }} placeholder="Search stickers…" />
      </div>

      <div className="gifpicker-cats">
        <button className={`chip ${cat === "saved" ? "active" : ""}`} onClick={() => setCat("saved")}>
          ⭐ Saved{saved.length ? ` (${saved.length})` : ""}
        </button>
        {CATS.map((c) => (
          <button key={c.key} className={`chip ${cat === c.key ? "active" : ""}`} onClick={() => { setCat(c.key); setQuery(""); }}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="gifpicker-grid">
        {display.map((s) => (
          <div key={s.id} className="gif-cell-wrap">
            <button className="gif-cell" onClick={() => onSelect(s)} title={s.title}>
              <img src={s.url} alt={s.title} loading="lazy" />
            </button>
            <button className={`gif-save ${isSaved(s) ? "on" : ""}`} onClick={(e) => toggleSave(e, s)} aria-label={isSaved(s) ? "Unsave sticker" : "Save sticker"}>
              <FaStar />
            </button>
          </div>
        ))}
        {cat === "saved" && saved.length === 0 && (
          <p className="gifpicker-empty">No saved stickers yet — tap the ⭐ on any sticker to keep it one tap away.</p>
        )}
        {cat !== "saved" && display.length === 0 && (
          <p className="gifpicker-empty">No stickers match “{query}”.</p>
        )}
      </div>
    </div>
  );
}
