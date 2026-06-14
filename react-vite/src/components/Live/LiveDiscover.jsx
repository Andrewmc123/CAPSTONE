import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaTowerBroadcast, FaUsers } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import "./Live.css";

export default function LiveDiscover() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [sessions, setSessions] = useState([]);
  const [starting, setStarting] = useState(false);

  const load = useCallback(() => {
    fetch("/api/live/active", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSessions(d.sessions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const goLive = async () => {
    if (!user) return setModalContent(<LoginFormModal />);
    setStarting(true);
    const res = await fetch("/api/live/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: "" }),
    });
    setStarting(false);
    if (res.ok) {
      const s = await res.json();
      navigate(`/live/${s.id}`);
    }
  };

  return (
    <div className="page live-discover">
      <header className="live-discover-head">
        <h1><FaTowerBroadcast /> Live</h1>
        <button className="btn btn-primary" onClick={goLive} disabled={starting}>
          {starting ? "Starting…" : "Go Live"}
        </button>
      </header>

      {sessions.length === 0 ? (
        <div className="live-empty">
          <FaTowerBroadcast />
          <p>No one&apos;s live right now. Be the first — tap <strong>Go Live</strong>!</p>
        </div>
      ) : (
        <div className="live-grid">
          {sessions.map((s) => (
            <Link key={s.id} to={`/live/${s.id}`} className="live-card">
              <div className="live-card-top">
                <span className="live-badge">LIVE</span>
                <span className="live-viewers"><FaUsers /> {s.viewer_count}/{s.max_viewers}</span>
              </div>
              <img
                className="live-card-avatar"
                src={s.host?.profile_img || `https://i.pravatar.cc/200?u=${s.host_id}`}
                alt=""
              />
              <div className="live-card-info">
                <strong>@{s.host?.username}</strong>
                <span>{s.title}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
