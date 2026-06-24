import { Link, NavLink } from "react-router-dom";
import { FaBagShopping, FaUsers } from "react-icons/fa6";
import "./MobileTopBar.css";

// Slim mobile-only app bar: brand on the left, quick access to Network + Shop on
// the right (they were moved off the bottom nav). Going live now lives inside the
// camera (Upload → slide to Live). Hidden on desktop via CSS and not rendered on
// the immersive feed / single-video screens.
export default function MobileTopBar() {
  return (
    <header className="mtopbar">
      <Link to="/" className="mtopbar-brand abln-logo">Aura</Link>
      <nav className="mtopbar-actions">
        <NavLink to="/network" className={({ isActive }) => `mtopbar-btn ${isActive ? "active" : ""}`} aria-label="Network" title="Network">
          <FaUsers />
        </NavLink>
        <NavLink to="/shop" className={({ isActive }) => `mtopbar-btn ${isActive ? "active" : ""}`} aria-label="Shop" title="Shop">
          <FaBagShopping />
        </NavLink>
      </nav>
    </header>
  );
}
