import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaLink, FaWhatsapp, FaXTwitter, FaFacebook, FaEnvelope,
  FaMagnifyingGlass, FaPaperPlane, FaCheck, FaXmark,
} from "react-icons/fa6";
import { thunkAddShare } from "../../redux/posts";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";

export default function ShareSheet({ post, onClose }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sentIds, setSentIds] = useState([]);
  const panelRef = useRef(null);

  const url = `${window.location.origin}/video/${post.id}`;
  const text = `Watch this on Aura — ${post.body?.slice(0, 80) || "Aura"}`;

  // load my friends to send to
  useEffect(() => {
    if (!user) return;
    fetch("/api/friends/", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFriends((d.friends || []).slice(0, 30)))
      .catch(() => {});
  }, [user]);

  // search any creator to send to
  useEffect(() => {
    const q = query.trim();
    if (!q) { setSearchResults([]); return; }
    let alive = true;
    const t = setTimeout(() => {
      fetch(`/api/discover/search?q=${encodeURIComponent(q)}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => alive && setSearchResults((d.users || []).slice(0, 12)))
        .catch(() => {});
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  // close on outside click / Esc
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const countShare = () => dispatch(thunkAddShare(post.id));

  const sendTo = async (u) => {
    if (!user) return setModalContent(<LoginFormModal />);
    if (sentIds.includes(u.id)) return;
    const res = await fetch(`/api/messages/${u.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ post_id: post.id }),
    });
    if (res.ok) {
      setSentIds((prev) => [...prev, u.id]);
      countShare();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      countShare();
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  const external = (href) => {
    countShare();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const people = query.trim() ? searchResults : friends;

  return (
    <div className="sharesheet-overlay" onClick={onClose}>
      <div className="sharesheet-panel fade-in" ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="sharesheet-grip" />
        <div className="sharesheet-head">
          <h3>Share</h3>
          <button className="sharesheet-x" onClick={onClose} aria-label="Close"><FaXmark /></button>
        </div>

        {/* send to friends */}
        <div className="sharesheet-search">
          <FaMagnifyingGlass />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={user ? "Search friends to send to…" : "Log in to send to friends"}
            onFocus={() => !user && setModalContent(<LoginFormModal />)}
          />
        </div>

        {people.length > 0 && (
          <div className="sharesheet-people">
            {people.map((u) => {
              const sent = sentIds.includes(u.id);
              return (
                <button key={u.id} className={`sharesheet-person ${sent ? "sent" : ""}`} onClick={() => sendTo(u)}>
                  <span className="sharesheet-person-av">
                    <img src={u.profile_img || `https://i.pravatar.cc/80?u=${u.id}`} alt="" />
                    <span className="sharesheet-person-badge">{sent ? <FaCheck /> : <FaPaperPlane />}</span>
                  </span>
                  <span className="sharesheet-person-name">{sent ? "Sent" : `@${u.username}`}</span>
                </button>
              );
            })}
          </div>
        )}
        {user && people.length === 0 && !query.trim() && (
          <p className="sharesheet-hint">Add friends to send videos straight to their DMs.</p>
        )}

        {/* classic share options */}
        <div className="sharesheet-options">
          <button onClick={copyLink}><span className="ss-ico"><FaLink /></span>{copied ? "Copied!" : "Copy link"}</button>
          <button onClick={() => external(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)}><span className="ss-ico wa"><FaWhatsapp /></span>WhatsApp</button>
          <button onClick={() => external(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)}><span className="ss-ico x"><FaXTwitter /></span>Share to X</button>
          <button onClick={() => external(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}><span className="ss-ico fb"><FaFacebook /></span>Facebook</button>
          <button onClick={() => external(`mailto:?subject=${encodeURIComponent("Check this Aura video")}&body=${encodeURIComponent(`${text}\n${url}`)}`)}><span className="ss-ico"><FaEnvelope /></span>Email</button>
        </div>
      </div>
    </div>
  );
}
