import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaXmark, FaHeart, FaPaperPlane, FaTrash } from "react-icons/fa6";
import { bumpCommentCount } from "../../redux/posts";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import GifPicker from "./GifPicker";
import EmojiPicker from "./EmojiPicker";
import { compact, timeAgo } from "../../utils/format";
import "./CommentsDrawer.css";

const QUICK_EMOJI = ["😂", "🔥", "😍", "💀", "👏", "😭", "🎉", "💚"];

export default function CommentsDrawer({ post, onClose, targetCommentId }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [pendingGif, setPendingGif] = useState(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, username } of the comment being replied to
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const startReply = (c) => {
    setReplyTo({ id: c.id, username: c.user?.username });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // route a freshly-created comment into the thread (top-level prepend or
  // nested under its parent)
  const insertComment = (comment) => {
    if (comment.parent_id) {
      setComments((prev) => prev.map((c) =>
        c.id === comment.parent_id
          ? { ...c, replies: [...(c.replies || []), comment], reply_count: (c.reply_count || 0) + 1 }
          : c
      ));
    } else {
      setComments((prev) => [comment, ...prev]);
      if (listRef.current) listRef.current.scrollTop = 0;
    }
    dispatch(bumpCommentCount(post.id, 1));
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/posts/${post.id}/comments`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (alive) {
          setComments(data.comments || []);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [post.id]);

  // Opened from a notification: scroll to + highlight the target comment.
  useEffect(() => {
    if (!targetCommentId || loading || !comments.length) return;
    const el = listRef.current?.querySelector(`[data-comment-id="${targetCommentId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetCommentId, loading, comments]);

  const gate = () => {
    if (!user) {
      setModalContent(<LoginFormModal />);
      return true;
    }
    return false;
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (gate()) return;
    const text = body.trim();
    if (!text && !pendingGif) return;
    setPosting(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: text, gif_url: pendingGif?.url || null, parent_id: replyTo?.id || null }),
    });
    setPosting(false);
    if (res.ok) {
      const comment = await res.json();
      insertComment(comment);
      setBody("");
      setPendingGif(null);
      setGifOpen(false);
      setReplyTo(null);
    }
  };

  // GIFs can be sent instantly — pure TikTok energy
  const sendGifNow = async (gif) => {
    if (gate()) return;
    setGifOpen(false);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: body.trim(), gif_url: gif.url, parent_id: replyTo?.id || null }),
    });
    if (res.ok) {
      const comment = await res.json();
      insertComment(comment);
      setBody("");
      setReplyTo(null);
    }
  };

  // apply `fn` to a comment whether it's top-level or a nested reply
  const mutateComment = (id, fn) => setComments((prev) => prev.map((c) => {
    if (c.id === id) return fn(c);
    if (c.replies?.length) return { ...c, replies: c.replies.map((r) => (r.id === id ? fn(r) : r)) };
    return c;
  }));

  const removeComment = (comment) => setComments((prev) => {
    if (comment.parent_id) {
      return prev.map((c) => c.id === comment.parent_id
        ? { ...c, replies: (c.replies || []).filter((r) => r.id !== comment.id), reply_count: Math.max(0, (c.reply_count || 1) - 1) }
        : c);
    }
    return prev.filter((c) => c.id !== comment.id);
  });

  const toggleCommentLike = async (comment) => {
    if (gate()) return;
    mutateComment(comment.id, (c) => ({ ...c, liked: !c.liked, like_count: (c.like_count || 0) + (c.liked ? -1 : 1) }));
    fetch(`/api/comments/${comment.id}/like`, { method: "POST", credentials: "include" }).catch(() => {});
  };

  const deleteComment = async (comment) => {
    const res = await fetch(`/api/posts/${post.id}/comments/${comment.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      removeComment(comment);
      dispatch(bumpCommentCount(post.id, -1));
    }
  };

  return (
    <>
      <div className="cdrawer-backdrop" onClick={onClose} />
      <div className="cdrawer fade-in">
      <div className="cdrawer-head">
        <h3>Comments <span className="text-dim">({compact(post.comment_count)})</span></h3>
        <button className="cdrawer-close" onClick={onClose} aria-label="Close comments"><FaXmark /></button>
      </div>

      <div className="cdrawer-list" ref={listRef}>
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="comment-skel">
            <div className="avatar skeleton" style={{ width: 36, height: 36 }} />
            <div className="comment-skel-lines">
              <div className="skeleton" style={{ height: 12, width: "40%" }} />
              <div className="skeleton" style={{ height: 12, width: "75%" }} />
            </div>
          </div>
        ))}

        {!loading && comments.length === 0 && (
          <div className="cdrawer-empty">
            <p>No comments yet.</p>
            <p className="text-dim">Be the first — bonus points for a GIF 😎</p>
          </div>
        )}

        {comments.map((c) => {
          const Row = (cm, isReply, replyTarget) => (
            <div
              className={`comment-row ${isReply ? "is-reply" : ""}`}
              data-comment-id={cm.id}
              style={cm.id === targetCommentId ? { background: "rgba(168, 85, 247,0.12)", borderRadius: 12, transition: "background .3s" } : undefined}
              key={cm.id}
            >
              <Link to={`/users/${cm.user?.id}`}>
                <img className="avatar" width={isReply ? 28 : 36} height={isReply ? 28 : 36} src={cm.user?.profile_img || `https://i.pravatar.cc/60?u=${cm.user?.id}`} alt="" />
              </Link>
              <div className="comment-main">
                <Link to={`/users/${cm.user?.id}`} className="comment-username">@{cm.user?.username}</Link>
                {cm.body && <p className="comment-body">{cm.body}</p>}
                {cm.gif_url && <img className="comment-gif" src={cm.gif_url} alt="GIF comment" loading="lazy" />}
                <div className="comment-meta">
                  <span>{timeAgo(cm.created_at)}</span>
                  <button className="comment-reply-btn" onClick={() => startReply(replyTarget)}>Reply</button>
                  {user && (user.id === cm.user_id || user.id === post.user_id) && (
                    <button className="comment-delete" onClick={() => deleteComment(cm)} aria-label="Delete comment">
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
              <button
                className={`comment-like ${cm.liked ? "liked" : ""}`}
                onClick={() => toggleCommentLike(cm)}
                aria-label="Like comment"
              >
                <FaHeart />
                <span>{cm.like_count > 0 ? compact(cm.like_count) : ""}</span>
              </button>
            </div>
          );
          return (
            <div className="comment-thread" key={c.id}>
              {Row(c, false, c)}
              {c.replies?.length > 0 && (
                <div className="comment-replies">
                  {c.replies.map((r) => Row(r, true, c))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {gifOpen && (
        <div className="cdrawer-gif-pop">
          <GifPicker onSelect={sendGifNow} onClose={() => setGifOpen(false)} title="Comment with a GIF" />
        </div>
      )}
      {emojiOpen && (
        <div className="cdrawer-gif-pop">
          <EmojiPicker onPick={(em) => setBody((b) => b + em)} onClose={() => setEmojiOpen(false)} />
        </div>
      )}

      <div className="cdrawer-composer">
        {replyTo && (
          <div className="composer-replying">
            <span>Replying to <strong>@{replyTo.username}</strong></span>
            <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"><FaXmark /></button>
          </div>
        )}
        {pendingGif && (
          <div className="composer-gif-preview">
            <img src={pendingGif.preview} alt="Selected GIF" />
            <button onClick={() => setPendingGif(null)} aria-label="Remove GIF"><FaXmark /></button>
          </div>
        )}
        <div className="composer-emoji-row">
          {QUICK_EMOJI.map((em) => (
            <button key={em} onClick={() => setBody((b) => b + em)}>{em}</button>
          ))}
        </div>
        <form className="composer-bar" onSubmit={submit}>
          <button
            type="button"
            className={`composer-gif-btn ${emojiOpen ? "on" : ""}`}
            onClick={() => { setGifOpen(false); setEmojiOpen(!emojiOpen); }}
            aria-label="Emoji"
          >
            😀
          </button>
          <button
            type="button"
            className={`composer-gif-btn ${gifOpen ? "on" : ""}`}
            onClick={() => (gate() ? null : (setEmojiOpen(false), setGifOpen(!gifOpen)))}
          >
            GIF
          </button>
          <input
            ref={inputRef}
            className="composer-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={!user ? "Log in to comment…" : replyTo ? `Reply to @${replyTo.username}…` : "Add a comment…"}
            onFocus={gate}
          />
          <button className="composer-send" disabled={posting || (!body.trim() && !pendingGif)} aria-label="Send">
            <FaPaperPlane />
          </button>
        </form>
      </div>
      </div>
    </>
  );
}
