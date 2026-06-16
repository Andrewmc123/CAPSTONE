import { useEffect, useRef, useState } from "react";
import { FaMagnifyingGlass, FaXmark, FaStar } from "react-icons/fa6";
import "./GifPicker.css";

const QUICK_CATEGORIES = ["trending", "reactions", "laughing", "love", "fire", "dance", "omg", "cat", "dog", "party", "mood", "yes", "no"];

// Saved GIFs persist on-device so they're one tap away in future comments.
const SAVED_KEY = "abln_saved_gifs";
const readSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
};

// Reusable GIF picker — powers GIF comments, GIF posts and GIF stickers.
export default function GifPicker({ onSelect, onClose, title = "Pick a GIF" }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("trending");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(readSaved);
  const debounceRef = useRef(null);

  const showingSaved = activeCat === "saved";

  const load = async (term) => {
    setLoading(true);
    try {
      const url = term && term !== "trending"
        ? `/api/gifs/search?q=${encodeURIComponent(term)}&limit=30`
        : "/api/gifs/trending?limit=30";
      const res = await fetch(url);
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch {
      setGifs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load("trending");
  }, []);

  const onQueryChange = (value) => {
    setQuery(value);
    setActiveCat("");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value.trim() || "trending"), 350);
  };

  const pickCategory = (cat) => {
    setActiveCat(cat);
    setQuery("");
    if (cat !== "saved") load(cat);
  };

  const isSaved = (gif) => saved.some((g) => g.id === gif.id);

  const toggleSave = (e, gif) => {
    e.stopPropagation();
    setSaved((prev) => {
      const next = prev.some((g) => g.id === gif.id)
        ? prev.filter((g) => g.id !== gif.id)
        : [{ id: gif.id, url: gif.url, preview: gif.preview, title: gif.title }, ...prev].slice(0, 60);
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const display = showingSaved ? saved : gifs;

  return (
    <div className="gifpicker fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="gifpicker-head">
        <strong>{title}</strong>
        <span className="gifpicker-power">GIFs via Tenor</span>
        <button className="gifpicker-close" onClick={onClose} aria-label="Close"><FaXmark /></button>
      </div>

      <div className="gifpicker-search">
        <FaMagnifyingGlass />
        <input
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search GIFs…"
        />
      </div>

      <div className="gifpicker-cats">
        <button
          className={`chip ${showingSaved ? "active" : ""}`}
          onClick={() => pickCategory("saved")}
        >
          ⭐ Saved{saved.length ? ` (${saved.length})` : ""}
        </button>
        {QUICK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip ${activeCat === cat ? "active" : ""}`}
            onClick={() => pickCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="gifpicker-grid">
        {!showingSaved && loading
          ? Array.from({ length: 9 }).map((_, i) => <div key={i} className="gif-cell skeleton" />)
          : display.map((gif) => (
              <div key={gif.id} className="gif-cell-wrap">
                <button className="gif-cell" onClick={() => onSelect(gif)} title={gif.title}>
                  <img src={gif.preview} alt={gif.title} loading="lazy" />
                </button>
                <button
                  className={`gif-save ${isSaved(gif) ? "on" : ""}`}
                  onClick={(e) => toggleSave(e, gif)}
                  aria-label={isSaved(gif) ? "Unsave GIF" : "Save GIF"}
                >
                  <FaStar />
                </button>
              </div>
            ))}

        {showingSaved && saved.length === 0 && (
          <p className="gifpicker-empty">No saved GIFs yet — tap the ⭐ on any GIF to save it for later.</p>
        )}
        {!showingSaved && !loading && gifs.length === 0 && (
          <p className="gifpicker-empty">No GIFs found — try another word 🤔</p>
        )}
      </div>
    </div>
  );
}
