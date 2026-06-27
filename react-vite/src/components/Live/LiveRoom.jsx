import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaXmark, FaPaperPlane, FaUsers, FaComment, FaCommentSlash,
  FaUserSlash, FaFlag, FaTowerBroadcast, FaGift, FaBolt, FaGem, FaLock, FaPlus,
  FaFire, FaLink, FaCrown, FaWandMagicSparkles, FaFeather, FaGlobe, FaStar,
  FaGuitar, FaHandFist, FaRocket, FaClock, FaUserPlus, FaTrophy,
} from "react-icons/fa6";
import "./Live.css";

const POLL_MS = 1500;
const FRAME_MS = 2500;

// Aura gift icon set — keyed by the catalog's `icon` field.
const GIFT_ICONS = {
  bolt: FaBolt, flame: FaFire, link: FaLink, crown: FaCrown,
  sparkles: FaWandMagicSparkles, feather: FaFeather, planet: FaGlobe,
  star: FaStar, guitar: FaGuitar, fist: FaHandFist, rocket: FaRocket,
};
function GiftIcon({ k }) {
  const Ico = GIFT_ICONS[k] || FaGift;
  return <Ico />;
}

// ends_at comes from the server as naive UTC ISO — treat it as UTC.
function msUntil(iso, nowTs) {
  if (!iso) return null;
  const t = new Date(iso.endsWith("Z") ? iso : `${iso}Z`).getTime();
  return t - nowTs;
}
function fmtCountdown(ms) {
  if (ms == null) return null;
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

export default function LiveRoom() {
  const { id } = useParams();
  const sid = Number(id);
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [chatText, setChatText] = useState("");

  // Aura economy
  const [catalog, setCatalog] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftErr, setGiftErr] = useState("");
  const [flying, setFlying] = useState([]);
  const [takeover, setTakeover] = useState(null);
  const [recap, setRecap] = useState(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const seenGifts = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const chatEndRef = useRef(null);

  const isHost = session?.is_host;
  const chatOff = !session?.chat_enabled;
  const is24h = session?.is_24h;
  const giftMap = useMemo(
    () => Object.fromEntries((catalog?.gifts || []).map((g) => [g.key, g])),
    [catalog]
  );
  const countdown = useMemo(() => {
    if (!is24h) return null;
    const ms = msUntil(session?.ends_at, nowTs);
    if (ms == null) return null;
    return ms <= 0 ? "Ending…" : fmtCountdown(ms);
  }, [is24h, session?.ends_at, nowTs]);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/live/${sid}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setSession(data);
      if (!data.is_live) setError("This live has ended.");
    } else if (res.status === 404) {
      setError("This live has ended.");
    }
  }, [sid]);

  const loadWallet = useCallback(() => {
    fetch("/api/wallet/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setWallet(d))
      .catch(() => {});
  }, []);

  // gift catalog (public) + my wallet
  useEffect(() => {
    fetch("/api/wallet/gifts").then((r) => r.json()).then(setCatalog).catch(() => {});
    loadWallet();
  }, [loadWallet]);

  // tick once a second so the countdown and the daily-free-gift readiness stay live
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // join + poll room state
  useEffect(() => {
    let alive = true;
    fetch(`/api/live/${sid}/join`, { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.error && alive) setError(d.error); })
      .catch(() => {});
    fetchState();
    const t = setInterval(() => { if (alive) fetchState(); }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
      navigator.sendBeacon?.(`/api/live/${sid}/leave`);
    };
  }, [sid, fetchState]);

  // host: stream camera + push frames for viewers
  useEffect(() => {
    if (!isHost) return;
    let frameTimer;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        frameTimer = setInterval(() => {
          const v = videoRef.current, c = canvasRef.current;
          if (!v || !c || !v.videoWidth) return;
          c.width = 320;
          c.height = Math.round(320 * (v.videoHeight / v.videoWidth));
          c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
          const frame = c.toDataURL("image/jpeg", 0.5);
          fetch(`/api/live/${sid}/frame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ frame }),
          }).catch(() => {});
        }, FRAME_MS);
      } catch {
        setError("Camera access is needed to broadcast a live.");
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(frameTimer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isHost, sid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages?.length]);

  // animate gifts as they land — skip the ones already in the room on first load
  useEffect(() => {
    const msgs = session?.messages;
    if (!msgs) return;
    const giftMsgs = msgs.filter((m) => m.gift_key);
    if (seenGifts.current === null) {
      seenGifts.current = new Set(giftMsgs.map((m) => m.id));
      return;
    }
    giftMsgs.forEach((m) => {
      if (seenGifts.current.has(m.id)) return;
      seenGifts.current.add(m.id);
      const g = giftMap[m.gift_key];
      if (!g) return;
      setFlying((f) => [...f, { fid: m.id, g, user: m.user }]);
      setTimeout(() => setFlying((f) => f.filter((x) => x.fid !== m.id)), 2600);
      if (g.takeover) {
        setTakeover({ id: m.id, g, user: m.user });
        setTimeout(() => setTakeover((t) => (t && t.id === m.id ? null : t)), 2800);
      }
    });
  }, [session?.messages, giftMap]);

  const sendChat = async (e) => {
    e.preventDefault();
    const content = chatText.trim();
    if (!content) return;
    setChatText("");
    await fetch(`/api/live/${sid}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
    fetchState();
  };

  const sendGift = async (g) => {
    setGiftErr("");
    const res = await fetch(`/api/live/${sid}/gift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ gift_key: g.key }),
    });
    if (res.ok) {
      const d = await res.json();
      setWallet((w) => (w ? {
        ...w,
        bolts: d.bolts,
        free_gift_ready: d.free_gift_ready ?? w.free_gift_ready,
        free_gift_resets_at: d.free_gift_resets_at ?? w.free_gift_resets_at,
      } : w));
      fetchState();
    } else {
      const d = await res.json().catch(() => ({}));
      setGiftErr(res.status === 402 ? "Not enough Bolts — top up below." : (d.error || "Couldn't send that gift."));
    }
  };

  const topUp = async (pack = "pro") => {
    const res = await fetch("/api/wallet/bolts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pack }),
    });
    if (res.ok) { setWallet(await res.json()); setGiftErr(""); }
  };

  const action = async (path, body) => {
    await fetch(`/api/live/${sid}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    fetchState();
  };

  const endLive = async () => {
    const res = await fetch(`/api/live/${sid}/end`, { method: "POST", credentials: "include" });
    const d = await res.json().catch(() => ({}));
    if (d.recap) setRecap(d.recap);   // 24h: show the recap, then navigate on close
    else navigate("/live");
  };

  const freeGiftKey = catalog?.free_gift_key;
  // recompute readiness client-side so the free gift flips on when the cooldown
  // elapses while the room stays open (wallet snapshot may be stale)
  const freeReady = useMemo(() => {
    if (!wallet) return false;
    if (wallet.free_gift_ready) return true;
    if (!wallet.free_gift_resets_at) return false;
    const resetMs = new Date(
      wallet.free_gift_resets_at.endsWith("Z") ? wallet.free_gift_resets_at : `${wallet.free_gift_resets_at}Z`
    ).getTime();
    return nowTs >= resetMs;
  }, [wallet, nowTs]);

  if (error) {
    return (
      <div className="feed-gate">
        <div className="feed-gate-card">
          <h2>{error}</h2>
          <button className="btn btn-primary" onClick={() => navigate("/live")}>Back to Live</button>
        </div>
      </div>
    );
  }
  if (!session) {
    return <div className="feed-gate"><div className="feed-spinner" /></div>;
  }

  return (
    <div className="live-room">
      <div className={`live-stage ${is24h ? "is24" : ""}`}>
        {isHost ? (
          <video ref={videoRef} autoPlay playsInline muted className="live-video" />
        ) : session.current_frame ? (
          <img src={session.current_frame} alt="live" className="live-video" />
        ) : (
          <div className="live-waiting">
            <FaTowerBroadcast />
            <p>Connecting to @{session.host?.username}…</p>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* gift animations */}
        {flying.map((f) => (
          <div className={`gift-fly r-${f.g.rarity}`} key={f.fid}>
            <span className="gf-ic"><GiftIcon k={f.g.icon} /></span>
            <span className="gf-txt"><strong>@{f.user?.username}</strong> · {f.g.name}</span>
          </div>
        ))}
        {takeover && (
          <div className={`gift-takeover r-${takeover.g.rarity}`}>
            <div className="gt-ic"><GiftIcon k={takeover.g.icon} /></div>
            <div className="gt-name">{takeover.g.name}</div>
            <div className="gt-user">from @{takeover.user?.username}</div>
          </div>
        )}

        <div className="live-topbar">
          <Link to={`/users/${session.host_id}`} className="live-host-chip">
            <img className="avatar" width={34} height={34} src={session.host?.profile_img || `https://i.pravatar.cc/60?u=${session.host_id}`} alt="" />
            <span>@{session.host?.username}</span>
          </Link>
          <span className={`live-badge ${is24h ? "badge-24" : ""}`}>{is24h ? "24H LIVE" : "LIVE"}</span>
          {is24h && countdown && <span className="live-countdown"><FaClock /> {countdown}</span>}
          <span className="live-viewers"><FaUsers /> {session.viewer_count}/{session.max_viewers}</span>
          <button className="live-x" onClick={isHost ? endLive : () => navigate("/live")} aria-label="Close">
            <FaXmark />
          </button>
        </div>

        {/* 24-hour live stats */}
        {is24h && (
          <div className="live-24-stats">
            <div className="l24"><FaBolt /><b>{(session.aura_gained || 0).toLocaleString()}</b><span>Aura</span></div>
            <div className="l24"><FaUserPlus /><b>{(session.followers_gained || 0).toLocaleString()}</b><span>Followers</span></div>
            <div className="l24"><FaUsers /><b>{session.peak_viewers || 0}</b><span>Peak</span></div>
            {session.top_supporters?.[0] && (
              <div className="l24 l24-top"><FaTrophy /><b>@{session.top_supporters[0].user?.username}</b><span>Top sub</span></div>
            )}
          </div>
        )}

        {isHost && (
          <div className="live-earn">
            <span><FaGem /> {(wallet?.glow ?? 0).toLocaleString()} Glow</span>
            <span><FaBolt /> {(wallet?.aura ?? session.host_aura ?? 0).toLocaleString()} Aura · {wallet?.tier || session.host_tier}</span>
          </div>
        )}

        {isHost ? (
          <div className="live-host-controls">
            <button className="btn btn-ghost live-ctrl" onClick={() => action("chat/toggle")}>
              {chatOff ? <><FaCommentSlash /> Chat off</> : <><FaComment /> Chat on</>}
            </button>
            <button className="btn btn-danger live-ctrl" onClick={endLive}>End live</button>
          </div>
        ) : (
          <div className="live-host-controls">
            <button className="btn btn-ghost live-ctrl" onClick={() => action("report", { user_id: session.host_id })}>
              <FaFlag /> Report
            </button>
            <button className="btn btn-ghost live-ctrl" onClick={() => navigate("/live")}>Leave</button>
          </div>
        )}

        {isHost && session.viewers?.length > 0 && (
          <div className="live-viewer-list">
            {session.viewers.map((v) => (
              <div className="live-viewer-row" key={v.user_id}>
                <span>@{v.user?.username}</span>
                <button onClick={() => action("kick", { user_id: v.user_id })} title="Kick"><FaUserSlash /></button>
                <button onClick={() => action("report", { user_id: v.user_id })} title="Report"><FaFlag /></button>
              </div>
            ))}
          </div>
        )}

        <div className="live-chat">
          <div className="live-chat-msgs">
            {session.messages?.map((m) => {
              const g = m.gift_key ? giftMap[m.gift_key] : null;
              return (
                <div className={`live-msg ${g ? "gift" : ""}`} key={m.id}>
                  <strong>@{m.user?.username}</strong>{" "}
                  {g ? (
                    <span className="live-gift-tag"><GiftIcon k={g.icon} /> sent {g.name}</span>
                  ) : m.content}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <form className="live-chat-bar" onSubmit={sendChat}>
            {!isHost && (
              <button type="button" className={`live-gift-btn ${freeReady ? "has-free" : ""}`} onClick={() => setGiftOpen(true)} aria-label="Send a gift">
                <FaGift />
              </button>
            )}
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={chatOff && !isHost ? "Chat is turned off" : "Say something…"}
              disabled={chatOff && !isHost}
            />
            <button type="submit" disabled={!chatText.trim()} aria-label="Send"><FaPaperPlane /></button>
          </form>
        </div>

        {/* gift drawer */}
        {giftOpen && (
          <div className="gift-sheet" onClick={() => setGiftOpen(false)}>
            <div className="gift-sheet-inner" onClick={(e) => e.stopPropagation()}>
              <div className="gift-sheet-head">
                <span className="gift-bal"><FaBolt /> {(wallet?.bolts ?? 0).toLocaleString()} Bolts</span>
                <button className="gift-topup" onClick={() => topUp("pro")}><FaPlus /> Get Bolts</button>
                <button className="gift-close" onClick={() => setGiftOpen(false)} aria-label="Close"><FaXmark /></button>
              </div>
              {freeReady && <p className="gift-free-hint"><FaGift /> Your daily free gift is ready — send it on the house</p>}
              {giftErr && <p className="gift-err">{giftErr}</p>}

              {session.gifts_unlocked ? (
                <div className="gift-grid">
                  {(catalog?.gifts || []).map((g) => {
                    const free = g.key === freeGiftKey && freeReady;
                    const disabled = !free && (wallet?.bolts ?? 0) < g.bolts;
                    return (
                      <button
                        key={g.key}
                        className={`gift-card r-${g.rarity} ${free ? "free" : ""}`}
                        onClick={() => sendGift(g)}
                        disabled={disabled}
                      >
                        {free ? <span className="gc-free">FREE</span> : (g.takeover && <span className="gc-tk">★</span>)}
                        <span className="gc-ic"><GiftIcon k={g.icon} /></span>
                        <span className="gc-name">{g.name}</span>
                        <span className="gc-cost">{free ? "Daily free" : <><FaBolt /> {g.bolts.toLocaleString()}</>}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="gift-locked">
                  <FaLock />
                  <p>Gifts unlock once <strong>@{session.host?.username}</strong> reaches the <strong>Rising</strong> tier.</p>
                  <p className="gift-locked-prog">
                    {(session.host_aura || 0).toLocaleString()} / {(catalog?.unlock_aura || 10000).toLocaleString()} Aura
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 24-hour live recap (host, on end) */}
        {recap && (
          <div className="gift-sheet" onClick={() => navigate("/live")}>
            <div className="recap-card" onClick={(e) => e.stopPropagation()}>
              <h2><FaClock /> 24-hour live complete</h2>
              <div className="recap-stats">
                <div><b>{(recap.aura_gained || 0).toLocaleString()}</b><span>Aura gained</span></div>
                <div><b>{(recap.followers_gained || 0).toLocaleString()}</b><span>Followers</span></div>
                <div><b>{recap.peak_viewers || 0}</b><span>Peak viewers</span></div>
              </div>
              {recap.rewarded?.length > 0 && (
                <div className="recap-rewards">
                  <h3><FaTrophy /> Top supporters — Aura thanks you</h3>
                  {recap.rewarded.map((r, i) => (
                    <div className="recap-row" key={i}>
                      <span className="recap-rank">{["🥇", "🥈", "🥉"][i] || "🎁"} @{r.user?.username}</span>
                      <span className="recap-aura"><FaBolt /> {(r.aura || 0).toLocaleString()}</span>
                      <span className="recap-reward">+{r.reward} Bolts</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-grad" onClick={() => navigate("/live")}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
