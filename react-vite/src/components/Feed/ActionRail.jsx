import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaStar, FaEye, FaCommentDots, FaBookmark, FaShare, FaPlus, FaCheck,
} from "react-icons/fa6";
import { thunkToggleLike, thunkToggleBookmark } from "../../redux/posts";
import { thunkToggleFollow, selectIsFollowing } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import ShareSheet from "./ShareSheet";
import { compact } from "../../utils/format";

export default function ActionRail({ post, onOpenComments }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const isFollowing = useSelector(selectIsFollowing(post.user?.id));
  const { setModalContent } = useModal();
  const [shareOpen, setShareOpen] = useState(false);
  const [likePop, setLikePop] = useState(false);

  const gate = (fn) => () => {
    if (!user) {
      setModalContent(<LoginFormModal />);
      return;
    }
    fn();
  };

  const onLike = gate(() => {
    setLikePop(true);
    setTimeout(() => setLikePop(false), 450);
    dispatch(thunkToggleLike(post));
  });

  const onBookmark = gate(() => dispatch(thunkToggleBookmark(post)));

  const onFollow = gate(() => dispatch(thunkToggleFollow(post.user.id, isFollowing)));

  const isOwnPost = user && post.user && user.id === post.user.id;

  return (
    <aside className="action-rail" onClick={(e) => e.stopPropagation()}>
      <div className="rail-avatar-wrap">
        <Link to={`/users/${post.user?.id}`}>
          <img
            className="avatar rail-avatar"
            src={post.user?.profile_img || `https://i.pravatar.cc/80?u=${post.user?.id}`}
            alt={post.user?.username}
          />
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
        <span className="rail-icon"><FaStar /></span>
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
