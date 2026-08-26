import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaTowerBroadcast, FaUsers, FaClock, FaLock } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import FeedTabs from "../common/FeedTabs";
import "./Live.css";

export default function LiveDiscover() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [sessions, setSessions] = useState([]);
  const [starting, setStarting] = useState(false);
  const [me, setMe] = useState(null);
  const [lockMsg, setLockMsg] = useState("");

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

  // wallet → can_24h_live eligibility for the 24-hour button
  useEffect(() => {
    if (!user) return;
    fetch("/api/wallet/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d))
      .catch(() => {});
  }, [user]);

  const can24 = me?.can_24h_live ?? user?.can_24h_live ?? false;

  const goLive = async (is24 = false) => {
    if (!user) return setModalContent(<LoginFormModal />);
    setLockMsg("");
    setStarting(true);
    const res = await fetch("/api/live/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: "", is_24h: is24 }),
    });
    setStarting(false);
    if (res.ok) {
      const s = await res.json();
      navigate(`/live/${s.id}`);
    } else {
      const d = await res.json().catch(() => ({}));
      setLockMsg(d.error || "Couldn't start the live.");
    }
  };

  return (
    <div className="page live-discover">
      <FeedTabs variant="solid" />
      <header className="live-discover-head">
        <h1><FaTowerBroadcast /> Live</h1>
        <div className="live-go-actions">
          <button className="btn btn-ghost" onClick={() => goLive(false)} disabled={starting}>
            {starting ? "Starting…" : "Go Live"}
          </button>
          <button
            className={`btn ${can24 ? "btn-grad" : "btn-ghost live-24-locked"}`}
            onClick={() => (can24 ? goLive(true) : setLockMsg("24-hour live unlocks at 2,000 followers and 10,000 Aura."))}
            disabled={starting}
            title={can24 ? "Start a 24-hour live" : "Unlock at 2,000 followers + 10,000 Aura"}
          >
            {can24 ? <><FaClock /> 24-Hour Live</> : <><FaLock /> 24-Hour Live</>}
          </button>
        </div>
      </header>
      {lockMsg && <p className="live-lock-msg">{lockMsg}</p>}

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
                <span className="live-badge">{s.is_24h ? "24H LIVE" : "LIVE"}</span>
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
