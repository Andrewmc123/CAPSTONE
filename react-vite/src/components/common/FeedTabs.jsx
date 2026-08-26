import { NavLink } from "react-router-dom";
import { TOP_TABS } from "./topTabs";
import "./FeedTabs.css";

/**
 * Top navigation shared by the feed and the live page.
 * `variant="solid"` drops the video-overlay treatment for pages that sit on
 * the normal page background.
 */
export default function FeedTabs({ variant = "overlay" }) {
  return (
    <nav className={`feed-tabs feed-tabs-${variant}`} aria-label="Feeds">
      {TOP_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `feed-tab ${isActive ? "active" : ""}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
