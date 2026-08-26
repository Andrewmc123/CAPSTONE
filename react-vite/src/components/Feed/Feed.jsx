import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { fetchFeedPage, selectFeedPosts, selectFeed } from "../../redux/posts";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import FeedTabs from "../common/FeedTabs";
import { TOP_TAB_ROUTES } from "../common/topTabs";
import VideoCard from "./VideoCard";
import CommentsDrawer from "./CommentsDrawer";
import "./Feed.css";

export default function Feed({ tab = "foryou" }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const posts = useSelector(selectFeedPosts(tab));
  const feed = useSelector(selectFeed(tab));
  const { setModalContent } = useModal();

  const containerRef = useRef(null);
  const navigate = useNavigate();
  const touchStart = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsPostId, setCommentsPostId] = useState(null);

  // TikTok-style swipe between the top tabs (Live · Following · Aura Worldwide)
  const SWIPE_ROUTES = TOP_TAB_ROUTES;
  const curIdx = tab === "following" ? 1 : 2;
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, target: e.target };
  };
  const onTouchEnd = (e) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s) return;
    // leave horizontally-interactive elements alone (photo carousel, seek bar, rail)
    if (s.target?.closest?.(".vcarousel-track, .vcard-progress, .action-rail, input")) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      const next = dx < 0 ? curIdx + 1 : curIdx - 1;
      if (next >= 0 && next < SWIPE_ROUTES.length) navigate(SWIPE_ROUTES[next]);
    }
  };

  const needsAuth = tab !== "foryou" && !user;

  // initial page
  useEffect(() => {
    if (!needsAuth && feed.ids.length === 0 && feed.hasMore && !feed.loading) {
      dispatch(fetchFeedPage(tab, 1));
    }
  }, [dispatch, tab, needsAuth, feed.ids.length, feed.hasMore, feed.loading]);

  // infinite scroll: pull the next page as the viewer nears the end
  useEffect(() => {
    if (!needsAuth && feed.hasMore && !feed.loading && posts.length > 0 && activeIndex >= posts.length - 3) {
      dispatch(fetchFeedPage(tab, feed.page + 1));
    }
  }, [activeIndex, dispatch, tab, needsAuth, feed.hasMore, feed.loading, feed.page, posts.length]);

  // track which card is on screen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cards = Array.from(container.querySelectorAll("[data-feed-index]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.feedIndex));
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [posts.length]);

  const scrollToIndex = useCallback((index) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-feed-index="${index}"]`);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  }, []);

  // keyboard navigation like TikTok web
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollToIndex(Math.min(activeIndex + 1, posts.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToIndex(Math.max(activeIndex - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, posts.length, scrollToIndex]);

  const activeCommentsPost = useMemo(
    () => posts.find((p) => p.id === commentsPostId),
    [posts, commentsPostId]
  );

  if (needsAuth) {
    return (
      <div className="feed-gate">
        <div className="feed-gate-card fade-in">
          <div className="abln-logo feed-gate-logo">Aura</div>
          <h2>{tab === "following" ? "Videos from creators you follow" : "Your friends' videos"}</h2>
          <p>Log in to unlock your {tab === "following" ? "Following" : "Friends"} feed, like videos and comment with GIFs.</p>
          <button className="btn btn-primary" onClick={() => setModalContent(<LoginFormModal />)}>
            Log in to Aura
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-wrap">
      <FeedTabs />

      <div
        className={`feed-scroller ${commentsPostId ? "with-drawer" : ""}`}
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {posts.map((post, i) => (
          <section className="feed-slide" data-feed-index={i} key={post.id}>
            <VideoCard
              post={post}
              active={i === activeIndex}
              onOpenComments={() => setCommentsPostId(post.id)}
            />
          </section>
        ))}

        {feed.loading && (
          <section className="feed-slide feed-loading-slide">
            <div className="feed-spinner" aria-label="Loading more videos" />
          </section>
        )}

        {!feed.loading && posts.length === 0 && (
          <section className="feed-slide">
            <div className="feed-gate-card">
              <h2>It&apos;s quiet in here 🌙</h2>
              <p>{tab === "friends" ? "Add some friends to fill this feed." : "Follow creators to fill this feed."}</p>
              <NavLink to="/explore" className="btn btn-primary">Explore videos</NavLink>
            </div>
          </section>
        )}
      </div>

      {activeCommentsPost && (
        <CommentsDrawer
          post={activeCommentsPost}
          onClose={() => setCommentsPostId(null)}
        />
      )}
    </div>
  );
}
