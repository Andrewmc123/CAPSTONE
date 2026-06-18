import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlay, FaStar } from "react-icons/fa6";
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
  const tileRef = useRef(null);
  const videoRef = useRef(null);
  const [near, setNear] = useState(false);

  // Only load media once the tile scrolls near the viewport. Without this a
  // 24-video profile opens 24 video connections at once, which thrashes the
  // network and janks the scroll on phones. Once loaded the tile stays loaded.
  // Uses IntersectionObserver where available, with a mount check + scroll
  // fallback (capture phase catches inner scrollers) so it works everywhere.
  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    let done = false;
    let raf = 0;
    let io;

    const promote = () => {
      if (done) return;
      done = true;
      setNear(true);
      cleanup();
    };
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom > -400 && r.top < window.innerHeight + 400) promote();
    };
    // direct (not rAF-gated) so it also works where rAF is throttled; the
    // listener removes itself the moment the tile is promoted.
    const onScroll = () => check();
    function cleanup() {
      cancelAnimationFrame(raf);
      if (io) io.disconnect();
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    }

    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) promote();
        },
        { rootMargin: "400px 0px" }
      );
      io.observe(el);
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    check(); // catch tiles already on screen at mount

    return cleanup;
  }, []);

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
      {/* sentinel: a stable element we own so the observer never depends on
          Link forwarding its ref */}
      <span ref={tileRef} className="vgrid-sentinel" aria-hidden="true" />
      {isVideo ? (
        near ? (
          <video
            ref={videoRef}
            src={post.video_url}
            poster={post.image_url || undefined}
            preload="metadata"
            muted
            loop
            playsInline
          />
        ) : post.image_url ? (
          <img src={post.image_url} alt={post.body?.slice(0, 50) || "post"} loading="lazy" />
        ) : (
          <div className="vgrid-ph skeleton" aria-hidden="true" />
        )
      ) : (
        <img src={post.image_url} alt={post.body?.slice(0, 50) || "post"} loading="lazy" />
      )}

      {post.media_type === "gif" && <span className="vgrid-gif-badge">GIF</span>}

      <div className="vgrid-overlay">
        <span className="vgrid-views"><FaPlay /> {compact(post.views)}</span>
        <span className="vgrid-likes"><FaStar /> {compact(post.like_count)}</span>
      </div>
    </Link>
  );
}
