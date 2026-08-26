import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import PresenceDot from "../common/PresenceDot";
import { PRESENCE_LABELS } from "../common/presence";

const POLL_MS = 60000;

/**
 * Presence rail in the sidebar: profile pictures of the people you follow with
 * a status bead on each. Polls once a minute — the same request also stamps
 * your own last_seen server-side, which is what keeps your dot green.
 */
export default function OnlineUsers({ user }) {
  const [rows, setRows] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setRows([]);
      setOnlineCount(0);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/users/online", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setRows(data.users || []);
        setOnlineCount(data.online_count || 0);
      } catch (e) {
        /* offline or logged out — keep whatever we last showed */
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user]);

  if (!user || rows.length === 0) return null;

  return (
    <div className="sidebar-online">
      <h4>
        Online
        {onlineCount > 0 && <em className="online-count">{onlineCount}</em>}
      </h4>
      <div className="online-list">
        {rows.map((row) => (
          <NavLink
            key={row.id}
            to={`/users/${row.id}`}
            className="online-row"
            title={`${row.username} — ${PRESENCE_LABELS[row.presence] || "Offline"}`}
          >
            <span className={`online-avatar-wrap presence-${row.presence}`}>
              <img
                src={row.profile_img || `https://i.pravatar.cc/60?u=${row.id}`}
                alt=""
                className="avatar"
                width={32}
                height={32}
              />
              <PresenceDot presence={row.presence} size={11} className="online-bead" />
            </span>
            <span className="online-name">{row.username}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
