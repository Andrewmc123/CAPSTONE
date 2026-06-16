import { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa6";
import { getTheme, toggleTheme } from "../../utils/theme";
import "./ThemeToggle.css";

// Light/dark switch. `variant="icon"` renders a compact round button (for
// toolbars); default renders an icon + label row (for menus).
export default function ThemeToggle({ variant = "row", className = "" }) {
  const [theme, setTheme] = useState(getTheme());
  const onToggle = (e) => {
    e?.stopPropagation();
    setTheme(toggleTheme());
  };

  const isLight = theme === "light";
  const label = isLight ? "Dark mode" : "Light mode";

  return (
    <button
      className={`theme-toggle ${variant} ${className}`}
      onClick={onToggle}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={label}
    >
      {isLight ? <FaMoon /> : <FaSun />}
      {variant === "row" && <span>{label}</span>}
    </button>
  );
}
