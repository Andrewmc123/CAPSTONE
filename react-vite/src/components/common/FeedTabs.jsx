import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { TOP_TABS, TOP_TAB_ROUTES } from "./topTabs";
import "./FeedTabs.css";

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Top navigation shared by the feed and the live page.
 *
 * `variant="solid"` drops the video-overlay treatment for pages on the normal
 * page background. `fraction` (-1…1) comes from the swipe gesture and slides
 * the underline toward the tab you are dragging to, so the bar moves with your
 * finger instead of snapping after the fact.
 */
export default function FeedTabs({ variant = "overlay", fraction = 0 }) {
  const { pathname } = useLocation();
  const rowRef = useRef(null);
  const tabRefs = useRef([]);
  const [boxes, setBoxes] = useState([]);

  const activeIndex = Math.max(0, TOP_TAB_ROUTES.indexOf(pathname));

  // Measure the labels so the underline can be positioned (and interpolated)
  // in pixels. Re-measured on resize because the type scales down on phones.
  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      if (!row) return;
      const base = row.getBoundingClientRect().left;
      setBoxes(
        tabRefs.current.filter(Boolean).map((el) => {
          const b = el.getBoundingClientRect();
          return { left: b.left - base, width: b.width };
        })
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Fonts landing late would leave the underline on stale measurements.
  useEffect(() => {
    if (!document.fonts?.ready) return;
    document.fonts.ready.then(() => {
      const row = rowRef.current;
      if (!row) return;
      const base = row.getBoundingClientRect().left;
      setBoxes(
        tabRefs.current.filter(Boolean).map((el) => {
          const b = el.getBoundingClientRect();
          return { left: b.left - base, width: b.width };
        })
      );
    });
  }, []);

  const current = boxes[activeIndex];
  let bar = null;
  if (current) {
    // dragging left (negative) heads for the next tab, right for the previous
    const neighbour = boxes[activeIndex + (fraction < 0 ? 1 : -1)] || current;
    const t = Math.min(1, Math.abs(fraction));
    bar = {
      transform: `translateX(${lerp(current.left, neighbour.left, t)}px)`,
      width: `${lerp(current.width, neighbour.width, t)}px`,
    };
  }

  return (
    <nav
      ref={rowRef}
      className={`feed-tabs feed-tabs-${variant}`}
      aria-label="Feeds"
    >
      {TOP_TABS.map((tab, i) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          ref={(el) => { tabRefs.current[i] = el; }}
          className={({ isActive }) => `feed-tab ${isActive ? "active" : ""}`}
        >
          {tab.label}
        </NavLink>
      ))}
      {bar && (
        <span
          className={`feed-tabs-bar ${fraction ? "dragging" : ""}`}
          style={bar}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
