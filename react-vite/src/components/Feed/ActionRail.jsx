import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaEye, FaCommentDots, FaBookmark, FaShare, FaPlus, FaCheck, FaEllipsisVertical, FaTrash,
} from "react-icons/fa6";
import { thunkToggleLike, thunkToggleBookmark, thunkDeletePost } from "../../redux/posts";
import { thunkToggleFollow, selectIsFollowing } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import ShareSheet from "./ShareSheet";
import AuraOrb from "../common/AuraOrb";
import VerifiedAvatar from "../common/VerifiedAvatar";
import { compact } from "../../utils/format";

export default function ActionRail({ post, onOpenComments }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const isFollowing = useSelector(selectIsFollowing(post.user?.id));
  const { setModalContent } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [shareOpen, setShareOpen] = useState(false);
  const [likePop, setLikePop] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const burstTimer = useRef(null);

  const onDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    await dispatch(thunkDeletePost(post.id));
    // if we're on the standalone video page, the post is gone — head home
    if (location.pathname.startsWith("/video/")) navigate("/");
  };

  const gate = (fn) => () => {
    if (!user) {
      setModalContent(<LoginFormModal />);
      return;
    }
    fn();
  };

  const onLike = gate(() => {
    setLikePop(true);
    setBurstKey((k) => k + 1); // remount the star ring so the animation restarts
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setLikePop(false), 2300);
    dispatch(thunkToggleLike(post));
  });

  const onBookmark = gate(() => dispatch(thunkToggleBookmark(post)));

  const onFollow = gate(() => dispatch(thunkToggleFollow(post.user.id, isFollowing)));

  const isOwnPost = user && post.user && user.id === post.user.id;

  return (
    <aside className="action-rail" onClick={(e) => e.stopPropagation()}>
      {isOwnPost && (
        <div className="rail-more-wrap">
          <button className="rail-btn rail-more-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="More options">
            <span className="rail-icon"><FaEllipsisVertical /></span>
          </button>
          {menuOpen && (
            <>
              <div className="rail-more-overlay" onClick={() => setMenuOpen(false)} />
              <div className="rail-more-menu">
                <button className="rail-more-item danger" onClick={onDelete}>
                  <FaTrash /> Delete post
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="rail-avatar-wrap">
        <Link to={`/users/${post.user?.id}`}>
          <VerifiedAvatar user={post.user} size={48} className="rail-avatar" />
        </Link>
        {!isOwnPost && (
          <button
            className={`rail-follow ${isFollowing ? "following" : ""}`}
            onClick={onFollow}
            aria-label={isFollowing ? "Following" : "Follow"}
          >
            {isFollowing ? <FaCheck /> : <FaPlus />}
          </button>
        )}
      </div>

      <button className={`rail-btn aura-btn ${post.liked ? "aura-on" : ""} ${likePop ? "pop" : ""}`} onClick={onLike} aria-label={post.liked ? "Remove aura" : "Give aura"}>
        <span className="rail-icon aura-orb-icon">
          <AuraOrb size={36} className="rail-aura-orb" />
          <span className="aura-burst" aria-hidden="true" />
          <span className="aura-burst aura-burst-2" aria-hidden="true" />
          {likePop && (
            <span className="aura-stars" key={burstKey} aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => (
                <i key={i} className="aura-star" style={{ "--a": `${i * 30}deg`, "--delay": `${i * 28}ms` }} />
              ))}
            </span>
          )}
        </span>
        <span className="rail-count">{compact(post.like_count)}</span>
        <span className="rail-tag">aura</span>
      </button>

      <button className="rail-btn" onClick={onOpenComments} aria-label="Comments">
        <span className="rail-icon"><FaCommentDots /></span>
        <span className="rail-count">{compact(post.comment_count)}</span>
      </button>

      <button className={`rail-btn ${post.bookmarked ? "bookmarked" : ""}`} onClick={onBookmark} aria-label="Save">
        <span className="rail-icon"><FaBookmark /></span>
        <span className="rail-count">{compact(post.bookmark_count)}</span>
      </button>

      <div className="rail-share-wrap">
        <button className="rail-btn" onClick={() => setShareOpen(!shareOpen)} aria-label="Share">
          <span className="rail-icon"><FaShare /></span>
          <span className="rail-count">{compact(post.shares)}</span>
        </button>
        {shareOpen && <ShareSheet post={post} onClose={() => setShareOpen(false)} />}
      </div>

      <div className="rail-views"><FaEye /> {compact(post.views)} views</div>
    </aside>
  );
}
