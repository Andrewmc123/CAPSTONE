import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaFire, FaHashtag, FaMusic, FaMagnifyingGlass, FaPlus, FaCheck, FaXmark } from "react-icons/fa6";
import { fetchExplore, selectCollection } from "../../redux/posts";
import { thunkToggleFollow, selectIsFollowing } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
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

// Follow / Following pill used on each creator result.
function FollowButton({ targetId }) {
  const dispatch = useDispatch();
  const sessionUser = useSelector((s) => s.session.user);
  const isFollowing = useSelector(selectIsFollowing(targetId));
  const { setModalContent } = useModal();

  if (sessionUser && sessionUser.id === targetId) return null;

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionUser) return setModalContent(<LoginFormModal />);
    dispatch(thunkToggleFollow(targetId, isFollowing));
  };

  return (
    <button
      className={`explore-follow ${isFollowing ? "following" : ""}`}
      onClick={onClick}
    >
      {isFollowing ? (<><FaCheck /> Following</>) : (<><FaPlus /> Follow</>)}
    </button>
  );
}

export default function Explore() {
  const dispatch = useDispatch();
  const [category, setCategory] = useState("all");
  const [trending, setTrending] = useState(null);
  const posts = useSelector(selectCollection(`explore:${category}`));

  // ---- user / content search ----
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
  const [searching, setSearching] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    dispatch(fetchExplore(category));
  }, [dispatch, category]);

  useEffect(() => {
    fetch("/api/discover/trending")
      .then((r) => r.json())
      .then(setTrending)
      .catch(() => {});
  }, []);

  // debounced search as you type
  useEffect(() => {
    if (!trimmed) {
      setResults({ users: [], posts: [], hashtags: [] });
      setSearching(false);
      return;
    }
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/discover/search?q=${encodeURIComponent(trimmed)}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (!alive) return;
          setResults({ users: data.users || [], posts: data.posts || [], hashtags: data.hashtags || [] });
          setSearching(false);
        })
        .catch(() => alive && setSearching(false));
    }, 280);
    return () => { alive = false; clearTimeout(t); };
  }, [trimmed]);

  return (
    <div className="page explore-page">
      <header className="explore-head">
        <h1>Explore</h1>
        <p className="text-dim">Find creators, follow new people and discover videos across Aura</p>
      </header>

      {/* search bar — find users by name and add them */}
      <div className="explore-search">
        <FaMagnifyingGlass className="explore-search-icon" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators, videos or #hashtags…"
          aria-label="Search Aura"
        />
        {query && (
          <button className="explore-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
            <FaXmark />
          </button>
        )}
      </div>

      {trimmed ? (
        /* ---------- search results ---------- */
        <div className="explore-results">
          {searching && <div className="feed-spinner explore-spinner" />}

          {!searching && results.users.length > 0 && (
            <section className="explore-result-section">
              <h2>Creators</h2>
              <div className="explore-users">
                {results.users.map((u) => (
                  <Link to={`/users/${u.id}`} key={u.id} className="explore-user">
                    <img
                      className="avatar"
                      width={48}
                      height={48}
                      src={u.profile_img || `https://i.pravatar.cc/80?u=${u.id}`}
                      alt=""
                    />
                    <div className="explore-user-meta">
                      <strong>@{u.username}</strong>
                      <span>{u.firstname} {u.lastname} · {compact(u.followers_count)} followers</span>
                    </div>
                    <FollowButton targetId={u.id} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!searching && results.hashtags.length > 0 && (
            <section className="explore-result-section">
              <h2>Hashtags</h2>
              <div className="explore-tag-row">
                {results.hashtags.map((h) => (
                  <Link to={`/tag/${h.tag}`} key={h.tag} className="chip">
                    <FaHashtag /> {h.tag} · {h.count}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!searching && (
            <section className="explore-result-section">
              <h2>Videos</h2>
              <VideoGrid posts={results.posts} emptyText={`No videos matching “${trimmed}”`} />
            </section>
          )}

          {!searching && results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0 && (
            <p className="text-dim explore-empty">No results for “{trimmed}”. Try another name or hashtag.</p>
          )}
        </div>
      ) : (
        /* ---------- default explore ---------- */
        <>
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
        </>
      )}
    </div>
  );
}
