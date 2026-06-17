import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHouse, FaCompass, FaInbox, FaUser, FaBagShopping } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import "./BottomNav.css";

export default function BottomNav() {
  const user = useSelector((s) => s.session.user);
  const unread = useSelector((s) => s.notifications?.unreadCount || 0);
  const { setModalContent } = useModal();

  const requireLogin = (e) => {
    if (!user) {
      e.preventDefault();
      setModalContent(<LoginFormModal />);
    }
  };

  return (
    <nav className="bottomnav">
      <NavLink to="/" end className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}>
        <FaHouse />
        <span>Home</span>
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}>
        <FaCompass />
        <span>Explore</span>
      </NavLink>
      <NavLink to="/upload" onClick={requireLogin} className="bn-create" aria-label="Upload">
        <span className="bn-create-pill">+</span>
      </NavLink>
      <NavLink to="/shop" className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}>
        <FaBagShopping />
        <span>Shop</span>
      </NavLink>
      <NavLink to="/inbox" onClick={requireLogin} className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}>
        <span className="bn-badge-wrap">
          <FaInbox />
          {user && unread > 0 && <em>{unread > 9 ? "9+" : unread}</em>}
        </span>
        <span>Inbox</span>
      </NavLink>
      {user ? (
        <NavLink to={`/users/${user.id}`} className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}>
          <FaUser />
          <span>Profile</span>
        </NavLink>
      ) : (
        <button className="bn-item as-button" onClick={() => setModalContent(<LoginFormModal />)}>
          <FaUser />
          <span>Log in</span>
        </button>
      )}
    </nav>
  );
}
