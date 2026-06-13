import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaXmark, FaHeart, FaPaperPlane, FaTrash } from "react-icons/fa6";
import { bumpCommentCount } from "../../redux/posts";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import GifPicker from "./GifPicker";
import { compact, timeAgo } from "../../utils/format";
import "./CommentsDrawer.css";

const QUICK_EMOJI = ["😂", "🔥", "😍", "💀", "👏", "😭", "🎉", "💚"];

export default function CommentsDrawer({ post, onClose }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [pendingGif, setPendingGif] = useState(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const listRef = useRef(null);

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
      body: JSON.stringify({ body: text, gif_url: pendingGif?.url || null }),
    });
    setPosting(false);
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setBody("");
      setPendingGif(null);
      setGifOpen(false);
      dispatch(bumpCommentCount(post.id, 1));
      if (listRef.current) listRef.current.scrollTop = 0;
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
      body: JSON.stringify({ body: body.trim(), gif_url: gif.url }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setBody("");
      dispatch(bumpCommentCount(post.id, 1));
    }
  };

  const toggleCommentLike = async (comment) => {
    if (gate()) return;
    setComments((prev) => prev.map((c) =>
      c.id === comment.id
        ? { ...c, liked: !c.liked, like_count: c.like_count + (c.liked ? -1 : 1) }
        : c
    ));
    const res = await fetch(`/api/comments/${comment.id}/like`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const fresh = await res.json();
      setComments((prev) => prev.map((c) => (c.id === fresh.id ? fresh : c)));
    }
  };

  const deleteComment = async (comment) => {
    const res = await fetch(`/api/posts/${post.id}/comments/${comment.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      dispatch(bumpCommentCount(post.id, -1));
    }
  };

  return (
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

        {comments.map((c) => (
          <div className="comment-row" key={c.id}>
            <Link to={`/users/${c.user?.id}`}>
              <img className="avatar" width={36} height={36} src={c.user?.profile_img || `https://i.pravatar.cc/60?u=${c.user?.id}`} alt="" />
            </Link>
            <div className="comment-main">
              <Link to={`/users/${c.user?.id}`} className="comment-username">@{c.user?.username}</Link>
              {c.body && <p className="comment-body">{c.body}</p>}
              {c.gif_url && <img className="comment-gif" src={c.gif_url} alt="GIF comment" loading="lazy" />}
              <div className="comment-meta">
                <span>{timeAgo(c.created_at)}</span>
                {user && (user.id === c.user_id || user.id === post.user_id) && (
                  <button className="comment-delete" onClick={() => deleteComment(c)} aria-label="Delete comment">
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
            <button
              className={`comment-like ${c.liked ? "liked" : ""}`}
              onClick={() => toggleCommentLike(c)}
              aria-label="Like comment"
            >
              <FaHeart />
              <span>{c.like_count > 0 ? compact(c.like_count) : ""}</span>
            </button>
          </div>
        ))}
      </div>

      {gifOpen && (
        <div className="cdrawer-gif-pop">
          <GifPicker onSelect={sendGifNow} onClose={() => setGifOpen(false)} title="Comment with a GIF" />
        </div>
      )}

      <div className="cdrawer-composer">
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
            className={`composer-gif-btn ${gifOpen ? "on" : ""}`}
            onClick={() => (gate() ? null : setGifOpen(!gifOpen))}
          >
            GIF
          </button>
          <input
            className="composer-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={user ? "Add a comment…" : "Log in to comment…"}
            onFocus={gate}
          />
          <button className="composer-send" disabled={posting || (!body.trim() && !pendingGif)} aria-label="Send">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
