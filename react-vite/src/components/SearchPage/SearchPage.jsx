import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaMagnifyingGlass, FaHashtag } from "react-icons/fa6";
import { upsertPosts } from "../../redux/posts";
import VideoGrid from "../VideoGrid";
import { compact } from "../../utils/format";
import "./SearchPage.css";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const dispatch = useDispatch();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [tab, setTab] = useState("top");
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(q);
    if (!q) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/discover/search?q=${encodeURIComponent(q)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setResults(data);
        dispatch(upsertPosts(data.posts || []));
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, dispatch]);

  const submit = (e) => {
    e.preventDefault();
    if (input.trim()) setParams({ q: input.trim() });
  };

  return (
    <div className="page search-page">
      <form className="search-bar" onSubmit={submit}>
        <FaMagnifyingGlass />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search videos, creators, hashtags…"
        />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {!q && <p className="text-dim search-hint">Try “dance”, “cat”, “#aboutlastnight” or a creator&apos;s name 🔎</p>}

      {q && (
        <>
          <div className="search-tabs">
            {["top", "videos", "creators"].map((t) => (
              <button key={t} className={`chip ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {loading && <div className="feed-spinner search-spinner" />}

          {!loading && (tab === "top" || tab === "creators") && results.users.length > 0 && (
            <section className="search-section">
              <h3>Creators</h3>
              <div className="search-users">
                {results.users.map((u) => (
                  <Link to={`/users/${u.id}`} key={u.id} className="search-user-card">
                    <img className="avatar" width={52} height={52} src={u.profile_img || `https://i.pravatar.cc/80?u=${u.id}`} alt="" />
                    <div>
                      <strong>@{u.username}</strong>
                      <p>{u.firstname} {u.lastname} · {compact(u.followers_count)} followers</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!loading && tab === "top" && results.hashtags.length > 0 && (
            <section className="search-section">
              <h3>Hashtags</h3>
              <div className="search-tags">
                {results.hashtags.map((h) => (
                  <Link to={`/tag/${h.tag}`} key={h.tag} className="chip">
                    <FaHashtag /> {h.tag} · {h.count}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!loading && (tab === "top" || tab === "videos") && (
            <section className="search-section">
              <h3>Videos</h3>
              <VideoGrid posts={results.posts} emptyText={`No videos matching “${q}”`} />
            </section>
          )}

          {!loading && tab === "creators" && results.users.length === 0 && (
            <p className="text-dim">No creators matching “{q}”</p>
          )}
        </>
      )}
    </div>
  );
}
