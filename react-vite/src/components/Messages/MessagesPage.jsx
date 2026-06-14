import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaPaperPlane } from "react-icons/fa6";
import { fetchConversations } from "../../redux/messages";
import { timeAgo } from "../../utils/format";
import "./Messages.css";

export default function MessagesPage() {
  const dispatch = useDispatch();
  const conversations = useSelector((s) => s.messages.conversations);
  const loaded = useSelector((s) => s.messages.loaded);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  return (
    <div className="page messages-page">
      <header className="messages-head">
        <h1>Messages</h1>
      </header>

      {loaded && conversations.length === 0 && (
        <div className="messages-empty">
          <FaPaperPlane />
          <p>
            No messages yet. Open a creator&apos;s profile and tap{" "}
            <strong>Message</strong> to start a chat.
          </p>
        </div>
      )}

      <ul className="convo-list">
        {conversations.map((c) => {
          const last = c.last_message;
          const preview = last?.content || (last?.post_id ? "📹 Shared a video" : "");
          return (
            <li key={c.user?.id}>
              <Link
                to={`/messages/${c.user?.id}`}
                className={`convo-row ${c.unread_count ? "unread" : ""}`}
              >
                <img
                  className="avatar"
                  width={52}
                  height={52}
                  src={c.user?.profile_img || `https://i.pravatar.cc/80?u=${c.user?.id}`}
                  alt=""
                />
                <div className="convo-main">
                  <div className="convo-top">
                    <strong>@{c.user?.username}</strong>
                    <span className="convo-time">
                      {last?.created_at ? timeAgo(last.created_at) : ""}
                    </span>
                  </div>
                  <p className="convo-preview">{preview}</p>
                </div>
                {c.unread_count > 0 && (
                  <span className="convo-badge">{c.unread_count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
