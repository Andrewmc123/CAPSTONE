import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaHouse, FaCompass, FaUsers, FaInbox, FaUser,
  FaMagnifyingGlass, FaCirclePlus, FaRightFromBracket, FaVideo, FaPaperPlane,
  FaSun, FaMoon, FaBagShopping, FaChevronDown,
} from "react-icons/fa6";
import { thunkLogout } from "../../redux/session";
import { getTheme, toggleTheme } from "../../utils/theme";
import { fetchMyFollows, clearFollows } from "../../redux/follows";
import { thunkGetUserNotifications } from "../../redux/notification";
import { fetchUnreadCount } from "../../redux/messages";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import AuraOrb from "../common/AuraOrb";
import OnlineUsers from "./OnlineUsers";
import PresenceDot from "../common/PresenceDot";
import { PRESENCE_LABELS } from "../common/presence";
import "./Sidebar.css";

// The four browsing destinations, collapsed into one dropdown group.
const BROWSE_ITEMS = [
  { to: "/", label: "For You", icon: FaHouse, end: true },
  { to: "/explore", label: "Explore", icon: FaCompass },
  { to: "/network", label: "Network", icon: FaUsers },
  { to: "/shop", label: "Shop", icon: FaBagShopping },
];

const BROWSE_ROUTES = BROWSE_ITEMS.map((i) => i.to);

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.session.user);
  const unread = useSelector((s) => s.notifications?.unreadCount || 0);
  const dmUnread = useSelector((s) => s.messages?.unreadTotal || 0);
  const { setModalContent } = useModal();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  // The collapsed "Browse" group. Starts open when the current page lives
  // inside it, so the active link is never hidden behind a closed dropdown.
  const [browseOpen, setBrowseOpen] = useState(() =>
    BROWSE_ROUTES.includes(location.pathname)
  );
  const [theme, setTheme] = useState(getTheme());
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchMyFollows());
      dispatch(thunkGetUserNotifications());
      dispatch(fetchUnreadCount());
    }
  }, [dispatch, user]);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const requireLogin = (e) => {
    if (!user) {
      e.preventDefault();
      setModalContent(<LoginFormModal />);
    }
  };

  // Your own bead. The server only reports 'online' while it has seen a recent
  // request from you, so a stale tab correctly reads as offline.
  const myPresence = user?.presence || "offline";

  const logout = async () => {
    await dispatch(thunkLogout());
    dispatch(clearFollows());
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-logo-link">
        <div className="aura-mark">
          <AuraOrb size={36} />
          <span className="aura-word sidebar-logo">Aura</span>
        </div>
        <div className="abln-logo-sub">Share your aura to the world</div>
      </NavLink>

      <form className="sidebar-search" onSubmit={submitSearch}>
        <FaMagnifyingGlass className="sidebar-search-icon" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, creators…"
          aria-label="Search"
        />
      </form>

      <nav className="sidebar-nav">
        <div className={`side-group ${browseOpen ? "open" : ""}`}>
          <button
            type="button"
            className="side-item side-group-toggle"
            aria-expanded={browseOpen}
            onClick={() => setBrowseOpen((v) => !v)}
          >
            <FaCompass />
            <span>Browse</span>
            <FaChevronDown className="side-group-caret" />
          </button>
          <div className="side-group-items" hidden={!browseOpen}>
            {BROWSE_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `side-item side-sub-item ${isActive ? "active" : ""}`}
              >
                <Icon /> <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
        <NavLink to="/upload" onClick={requireLogin} className={({ isActive }) => `side-item upload ${isActive ? "active" : ""}`}>
          <FaCirclePlus /> <span>Upload</span>
        </NavLink>
        <NavLink to="/inbox" onClick={requireLogin} className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
          <span className="side-icon-badge">
            <FaInbox />
            {user && unread > 0 && <em className="badge">{unread > 99 ? "99+" : unread}</em>}
          </span>
          <span>Inbox</span>
        </NavLink>
        <NavLink to="/messages" onClick={requireLogin} className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
          <span className="side-icon-badge">
            <FaPaperPlane />
            {user && dmUnread > 0 && <em className="badge">{dmUnread > 99 ? "99+" : dmUnread}</em>}
          </span>
          <span>Messages</span>
        </NavLink>
        {user ? (
          <NavLink to={`/users/${user.id}`} className={({ isActive }) => `side-item ${isActive && location.pathname === `/users/${user.id}` ? "active" : ""}`}>
            <img src={user.profile_img || "https://i.pravatar.cc/60?u=abln"} alt="" className="avatar side-avatar" />
            <span>Profile</span>
          </NavLink>
        ) : (
          <button className="side-item as-button" onClick={() => setModalContent(<LoginFormModal />)}>
            <FaUser /> <span>Profile</span>
          </button>
        )}
      </nav>

      {!user && (
        <div className="sidebar-login-card">
          <p>Log in to follow creators, like videos, and drop GIF comments.</p>
          <button className="btn btn-primary sidebar-login-btn" onClick={() => setModalContent(<LoginFormModal />)}>
            Log in
          </button>
        </div>
      )}

      <OnlineUsers user={user} />

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user" ref={menuRef}>
            <button className="sidebar-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <span className="online-avatar-wrap">
                <img src={user.profile_img || "https://i.pravatar.cc/60?u=abln"} alt="" className="avatar" width={34} height={34} />
                <PresenceDot presence={myPresence} size={11} className="online-bead" />
              </span>
              <span className="sidebar-username">
                @{user.username}
                <em className="sidebar-presence-label">{PRESENCE_LABELS[myPresence]}</em>
              </span>
            </button>
            {menuOpen && (
              <div className="sidebar-menu fade-in">
                <button onClick={() => { setMenuOpen(false); navigate(`/users/${user.id}`); }}>
                  <FaUser /> View profile
                </button>
                <button onClick={() => { setMenuOpen(false); navigate("/camera"); }}>
                  <FaVideo /> Camera
                </button>
                <button onClick={() => setTheme(toggleTheme())}>
                  {theme === "light" ? <FaMoon /> : <FaSun />} {theme === "light" ? "Dark mode" : "Light mode"}
                </button>
                <button onClick={logout}>
                  <FaRightFromBracket /> Log out
                </button>
              </div>
            )}
          </div>
        )}
        <p className="sidebar-copy">© 2026 Aura · Share your night ✨</p>
      </div>
    </aside>
  );
}
