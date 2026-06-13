import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaFire, FaHashtag, FaMusic } from "react-icons/fa6";
import { fetchExplore, selectCollection } from "../../redux/posts";
import VideoGrid from "../VideoGrid";
import { compact } from "../../utils/format";
import "./Explore.css";

const CATEGORY_LABELS = {
  all: "All",
  dance: "Dance 🕺",
  comedy: "Comedy 😂",
  animals: "Animals 🐶",
  food: "Food 🍜",
  sports: "Sports 🏀",
  gaming: "Gaming 🎮",
  music: "Music 🎵",
  films: "Films 🎬",
  travel: "Travel ✈️",
};

export default function Explore() {
  const dispatch = useDispatch();
  const [category, setCategory] = useState("all");
  const [trending, setTrending] = useState(null);
  const posts = useSelector(selectCollection(`explore:${category}`));

  useEffect(() => {
    dispatch(fetchExplore(category));
  }, [dispatch, category]);

  useEffect(() => {
    fetch("/api/discover/trending")
      .then((r) => r.json())
      .then(setTrending)
      .catch(() => {});
  }, []);

  return (
    <div className="page explore-page">
      <header className="explore-head">
        <h1>Explore</h1>
        <p className="text-dim">Trending videos, GIFs and sounds across ABLN tonight</p>
      </header>

      {trending && trending.hashtags?.length > 0 && (
        <div className="explore-trending-rail">
          {trending.hashtags.slice(0, 8).map((h) => (
            <Link to={`/tag/${h.tag}`} key={h.tag} className="trend-card">
              <span className="trend-icon"><FaHashtag /></span>
              <div className="trend-meta">
                <strong>#{h.tag}</strong>
                <span>{compact(h.views)} views · {h.count} videos</span>
              </div>
              <FaFire className="trend-fire" />
            </Link>
          ))}
        </div>
      )}

      <div className="explore-cats">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`chip ${category === key ? "active" : ""}`}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <VideoGrid posts={posts} emptyText="Nothing in this category yet — be the first to post!" />

      {trending && trending.sounds?.length > 0 && (
        <section className="explore-sounds">
          <h2><FaMusic /> Trending sounds</h2>
          <div className="explore-sound-list">
            {trending.sounds.map((s) => (
              <div key={s.name} className="sound-pill">
                <span className="sound-disc spin">♪</span>
                <span className="sound-name">{s.name}</span>
                <span className="sound-count">{s.count} videos</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
