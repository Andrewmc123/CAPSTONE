import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaXmark, FaPaperPlane, FaUsers, FaComment, FaCommentSlash,
  FaUserSlash, FaFlag, FaTowerBroadcast,
} from "react-icons/fa6";
import "./Live.css";

const POLL_MS = 1500;
const FRAME_MS = 2500;

export default function LiveRoom() {
  const { id } = useParams();
  const sid = Number(id);
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [chatText, setChatText] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const chatEndRef = useRef(null);

  const isHost = session?.is_host;
  const chatOff = !session?.chat_enabled;

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
    await fetch(`/api/live/${sid}/end`, { method: "POST", credentials: "include" });
    navigate("/live");
  };

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
      <div className="live-stage">
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

        <div className="live-topbar">
          <Link to={`/users/${session.host_id}`} className="live-host-chip">
            <img className="avatar" width={34} height={34} src={session.host?.profile_img || `https://i.pravatar.cc/60?u=${session.host_id}`} alt="" />
            <span>@{session.host?.username}</span>
          </Link>
          <span className="live-badge">LIVE</span>
          <span className="live-viewers"><FaUsers /> {session.viewer_count}/{session.max_viewers}</span>
          <button className="live-x" onClick={isHost ? endLive : () => navigate("/live")} aria-label="Close">
            <FaXmark />
          </button>
        </div>

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
            {session.messages?.map((m) => (
              <div className="live-msg" key={m.id}>
                <strong>@{m.user?.username}</strong> {m.content}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="live-chat-bar" onSubmit={sendChat}>
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={chatOff && !isHost ? "Chat is turned off" : "Say something…"}
              disabled={chatOff && !isHost}
            />
            <button type="submit" disabled={!chatText.trim()} aria-label="Send"><FaPaperPlane /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
