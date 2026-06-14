import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaArrowLeft } from "react-icons/fa6";
import { fetchSinglePost } from "../../redux/posts";
import VideoCard from "../Feed/VideoCard";
import CommentsDrawer from "../Feed/CommentsDrawer";
import "./SingleVideo.css";

export default function SingleVideo() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const targetCommentId = searchParams.get("comment");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const post = useSelector((s) => s.posts.byId[Number(postId)]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    dispatch(fetchSinglePost(postId)).then((p) => {
      if (!p) setNotFound(true);
    });
  }, [dispatch, postId]);

  // Deep-link from a notification: open comments straight to the target comment.
  useEffect(() => {
    if (targetCommentId) setCommentsOpen(true);
  }, [targetCommentId]);

  if (notFound) {
    return (
      <div className="feed-gate">
        <div className="feed-gate-card">
          <h2>Video not found 😢</h2>
          <p>It may have been removed by its creator.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>Back to For You</button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="feed-gate">
        <div className="feed-spinner" />
      </div>
    );
  }

  return (
    <div className="single-video">
      <button className="single-back" onClick={() => navigate(-1)} aria-label="Back">
        <FaArrowLeft />
      </button>
      <div className="single-stage">
        <VideoCard post={post} active onOpenComments={() => setCommentsOpen(true)} />
      </div>
      {commentsOpen && (
        <CommentsDrawer
          post={post}
          targetCommentId={targetCommentId ? Number(targetCommentId) : null}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </div>
  );
}
