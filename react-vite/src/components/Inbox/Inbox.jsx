import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaHeart, FaCommentDots, FaUserPlus, FaUserCheck, FaBell, FaCheckDouble, FaPaperPlane, FaTrash,
} from "react-icons/fa6";
import { thunkGetUserNotifications, thunkMarkAllAsRead, thunkClearNotifications } from "../../redux/notification";
import { fetchUnreadCount } from "../../redux/messages";
import { getPendingFriends, acceptFriendRequest, declineFriendRequest } from "../../redux/friends";
import { timeAgo } from "../../utils/format";
import "./Inbox.css";

const TYPE_META = {
  post_like: { icon: FaHeart, color: "var(--heart)", tab: "likes" },
  comment_like: { icon: FaHeart, color: "var(--heart)", tab: "likes" },
  post_comment: { icon: FaCommentDots, color: "var(--neon)", tab: "comments" },
  comment_reply: { icon: FaCommentDots, color: "var(--neon)", tab: "comments" },
  new_follower: { icon: FaUserPlus, color: "var(--orange)", tab: "followers" },
  friend_request: { icon: FaUserPlus, color: "var(--orange)", tab: "followers" },
  friend_request_accepted: { icon: FaUserCheck, color: "var(--orange)", tab: "followers" },
  video_share: { icon: FaBell, color: "var(--text-dim)", tab: "all" },
};

const TABS = [
  { key: "all", label: "All activity" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "followers", label: "Followers" },
];

export default function Inbox() {
  const dispatch = useDispatch();
  const notifications = useSelector((s) => Object.values(s.notifications?.all || {}));
  const unread = useSelector((s) => s.notifications?.unreadCount || 0);
  const pending = useSelector((s) => Object.values(s.friends?.pending || {}));
  const dmUnread = useSelector((s) => s.messages?.unreadTotal || 0);
  const [tab, setTab] = useState("all");
  const [visible, setVisible] = useState(20); // page in chunks; 219 rows at once is a 20k-px wall

  useEffect(() => {
    dispatch(thunkGetUserNotifications());
    dispatch(getPendingFriends());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // reset the window when switching tabs so a filter never opens fully expanded
  useEffect(() => setVisible(20), [tab]);

  const sorted = useMemo(() => {
    const filtered = tab === "all"
      ? notifications
      : notifications.filter((n) => (TYPE_META[n.notification_type]?.tab || "all") === tab);
    return [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [notifications, tab]);

  return (
    <div className="page inbox-page">
      <header className="inbox-head">
        <h1>Inbox</h1>
        <div className="inbox-actions">
          <Link to="/messages" className="btn btn-ghost inbox-readall">
            <FaPaperPlane /> Messages{dmUnread > 0 ? ` (${dmUnread})` : ""}
          </Link>
          {unread > 0 && (
            <button className="btn btn-ghost inbox-readall" onClick={() => dispatch(thunkMarkAllAsRead())}>
              <FaCheckDouble /> Mark all read ({unread})
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-ghost inbox-readall" onClick={() => dispatch(thunkClearNotifications())}>
              <FaTrash /> Clear
            </button>
          )}
        </div>
      </header>

      <div className="inbox-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`chip ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {pending.length > 0 && tab !== "likes" && tab !== "comments" && (
        <section className="inbox-requests">
          <h3>Friend requests</h3>
          {pending.map((p) => (
            <div className="inbox-row" key={`req-${p.id}`}>
              <Link to={`/users/${p.id}`}>
                <img className="avatar" width={46} height={46} loading="lazy" src={p.profile_img || `https://i.pravatar.cc/70?u=${p.id}`} alt="" />
              </Link>
              <div className="inbox-row-main">
                <p><strong>@{p.username}</strong> wants to be your friend</p>
              </div>
              <div className="inbox-row-actions">
                <button className="btn btn-primary inbox-mini-btn" onClick={() => dispatch(acceptFriendRequest(p.id))}>
                  Accept
                </button>
                <button className="btn btn-ghost inbox-mini-btn" onClick={() => dispatch(declineFriendRequest(p.id))}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="inbox-list">
        {sorted.length === 0 && (
          <div className="inbox-empty">
            <FaBell />
            <p>Nothing here yet — go drop some GIF comments and the love will come back 💚</p>
          </div>
        )}

        {sorted.slice(0, visible).map((n) => {
          const meta = TYPE_META[n.notification_type] || TYPE_META.video_share;
          const Icon = meta.icon;
          return (
            <Link
              to={n.link || "/"}
              className={`inbox-row notif ${n.is_read ? "" : "unread"}`}
              key={n.id}
            >
              <div className="inbox-icon" style={{ color: meta.color }}>
                <Icon />
              </div>
              <img
                className="avatar"
                width={42}
                height={42}
                loading="lazy"
                src={n.sender?.profile_img || `https://i.pravatar.cc/70?u=${n.sender_id}`}
                alt=""
              />
              <div className="inbox-row-main">
                <p>{n.message}</p>
                <span>{timeAgo(n.created_at)}</span>
              </div>
              {!n.is_read && <span className="inbox-dot" />}
            </Link>
          );
        })}

        {sorted.length > visible && (
          <button className="btn btn-ghost inbox-more" onClick={() => setVisible((v) => v + 20)}>
            Show more ({sorted.length - visible})
          </button>
        )}
      </section>
    </div>
  );
}
