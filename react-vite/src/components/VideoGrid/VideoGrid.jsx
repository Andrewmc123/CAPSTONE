import { useRef } from "react";
import { Link } from "react-router-dom";
import { FaPlay, FaHeart } from "react-icons/fa6";
import { compact } from "../../utils/format";
import "./VideoGrid.css";

// Grid of video tiles with hover-to-preview — used on Explore, Profile,
// Search, Hashtag and Friends pages.
export default function VideoGrid({ posts, emptyText = "No videos yet" }) {
  if (!posts || posts.length === 0) {
    return <div className="vgrid-empty">{emptyText}</div>;
  }
  return (
    <div className="vgrid">
      {posts.map((post) => (
        <GridTile key={post.id} post={post} />
      ))}
    </div>
  );
}

function GridTile({ post }) {
  const videoRef = useRef(null);

  const hoverPlay = () => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      const p = v.play();
      if (p) p.catch(() => {});
    }
  };
  const hoverStop = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const isVideo = post.media_type === "video" && post.video_url;

  return (
    <Link
      to={`/video/${post.id}`}
      className="vgrid-tile"
      onMouseEnter={hoverPlay}
      onMouseLeave={hoverStop}
      onFocus={hoverPlay}
      onBlur={hoverStop}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={post.video_url}
          poster={post.image_url || undefined}
          preload="metadata"
          muted
          loop
          playsInline
        />
      ) : (
        <img src={post.image_url} alt={post.body?.slice(0, 50) || "post"} loading="lazy" />
      )}

      {post.media_type === "gif" && <span className="vgrid-gif-badge">GIF</span>}

      <div className="vgrid-overlay">
        <span className="vgrid-views"><FaPlay /> {compact(post.views)}</span>
        <span className="vgrid-likes"><FaHeart /> {compact(post.like_count)}</span>
      </div>
    </Link>
  );
}
