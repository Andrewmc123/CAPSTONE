import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaHouse, FaCompass, FaUserGroup, FaUsers, FaInbox, FaUser,
  FaMagnifyingGlass, FaCirclePlus, FaRightFromBracket, FaVideo, FaPaperPlane, FaImages,
} from "react-icons/fa6";
import { thunkLogout } from "../../redux/session";
import { fetchMyFollows, clearFollows, fetchSuggestions } from "../../redux/follows";
import { thunkGetUserNotifications } from "../../redux/notification";
import { fetchUnreadCount } from "../../redux/messages";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import "./Sidebar.css";

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.session.user);
  const unread = useSelector((s) => s.notifications?.unreadCount || 0);
  const dmUnread = useSelector((s) => s.messages?.unreadTotal || 0);
  const suggestions = useSelector((s) => s.follows.suggestions);
  const { setModalContent } = useModal();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchMyFollows());
      dispatch(thunkGetUserNotifications());
      dispatch(fetchUnreadCount());
    }
    dispatch(fetchSuggestions(5));
  }, [dispatch, user]);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
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

  const logout = async () => {
    await dispatch(thunkLogout());
    dispatch(clearFollows());
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-logo-link">
        <div className="abln-logo sidebar-logo">ABLN</div>
        <div className="abln-logo-sub">About Last Night</div>
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
        <NavLink to="/" end className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
          <FaHouse /> <span>For You</span>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
          <FaCompass /> <span>Explore</span>
        </NavLink>
        <NavLink to="/following" onClick={requireLogin} className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
          <FaUserGroup /> <span>Following</span>
        </NavLink>
        <NavLink to="/friends" onClick={requireLogin} className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
          <FaUsers /> <span>Friends</span>
        </NavLink>
        <NavLink to="/vault" onClick={requireLogin} className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
          <FaImages /> <span>Vault</span>
        </NavLink>
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

      {user && suggestions.length > 0 && (
        <div className="sidebar-suggested">
          <h4>Suggested creators</h4>
          {suggestions.map((u) => (
            <NavLink key={u.id} to={`/users/${u.id}`} className="suggested-row">
              <img src={u.profile_img || `https://i.pravatar.cc/60?u=${u.id}`} alt="" className="avatar" width={32} height={32} />
              <div className="suggested-meta">
                <strong>{u.username}</strong>
                <span>{u.firstname} {u.lastname}</span>
              </div>
            </NavLink>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user" ref={menuRef}>
            <button className="sidebar-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <img src={user.profile_img || "https://i.pravatar.cc/60?u=abln"} alt="" className="avatar" width={34} height={34} />
              <span className="sidebar-username">@{user.username}</span>
            </button>
            {menuOpen && (
              <div className="sidebar-menu fade-in">
                <button onClick={() => { setMenuOpen(false); navigate(`/users/${user.id}`); }}>
                  <FaUser /> View profile
                </button>
                <button onClick={() => { setMenuOpen(false); navigate("/camera"); }}>
                  <FaVideo /> Camera
                </button>
                <button onClick={logout}>
                  <FaRightFromBracket /> Log out
                </button>
              </div>
            )}
          </div>
        )}
        <p className="sidebar-copy">© 2026 ABLN · Share your night ✨</p>
      </div>
    </aside>
  );
}
