import { useEffect, useRef, useState } from "react";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import "./GifPicker.css";

const QUICK_CATEGORIES = ["trending", "reactions", "laughing", "love", "fire", "dance", "omg", "cat", "dog", "party", "mood", "yes", "no"];

// Reusable GIF picker — powers GIF comments, GIF posts and GIF stickers.
export default function GifPicker({ onSelect, onClose, title = "Pick a GIF" }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("trending");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

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
    load(cat);
  };

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
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <div key={i} className="gif-cell skeleton" />)
          : gifs.map((gif) => (
              <button key={gif.id} className="gif-cell" onClick={() => onSelect(gif)} title={gif.title}>
                <img src={gif.preview} alt={gif.title} loading="lazy" />
              </button>
            ))}
        {!loading && gifs.length === 0 && (
          <p className="gifpicker-empty">No GIFs found — try another word 🤔</p>
        )}
      </div>
    </div>
  );
}
