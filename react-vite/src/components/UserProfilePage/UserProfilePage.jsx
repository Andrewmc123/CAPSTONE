import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUserPlus, FaUserCheck, FaShare, FaLock, FaHeart, FaBookmark, FaClapperboard, FaPaperPlane, FaImages, FaBolt, FaPlus, FaGear,
} from "react-icons/fa6";
import {
  fetchUserVideos, fetchLikedVideos, fetchBookmarkedVideos, selectCollection,
} from "../../redux/posts";
import { thunkToggleFollow, selectIsFollowing, fetchUserFollowLists } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import FollowListModal from "./FollowListModal";
import VideoGrid from "../VideoGrid";
import Vault from "../Vault";
import VerifiedAvatar from "../common/VerifiedAvatar";
import AuraCheck from "../common/AuraCheck";
import StoryComposer from "../Stories/StoryComposer";
import StoryViewer from "../Stories/StoryViewer";
import { thunkFetchUserStories } from "../../redux/stories";
import { compact } from "../../utils/format";
import "./UserProfilePage.css";

export default function UserProfilePage() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const sessionUser = useSelector((s) => s.session.user);
  const isFollowing = useSelector(selectIsFollowing(Number(userId)));
  const { setModalContent } = useModal();

  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("videos");
  const [visitors, setVisitors] = useState([]);

  const isOwn = sessionUser && Number(userId) === sessionUser.id;
  const videos = useSelector(selectCollection(`user:${userId}`));
  const liked = useSelector(selectCollection(`liked:${userId}`));
  const favorites = useSelector(selectCollection("bookmarked"));

  useEffect(() => {
    setTab("videos");
    let alive = true;
    fetch(`/api/users/${userId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => alive && setProfile(data))
      .catch(() => {});
    dispatch(fetchUserVideos(userId));
    // privacy: only YOUR own follower/following lists are viewable
    if (sessionUser && Number(userId) === sessionUser.id) {
      dispatch(fetchUserFollowLists(userId));
    }
    return () => { alive = false; };
  }, [dispatch, userId, sessionUser]);

  useEffect(() => {
    if (tab === "liked") dispatch(fetchLikedVideos(userId));
    if (tab === "favorites" && isOwn) dispatch(fetchBookmarkedVideos());
  }, [tab, dispatch, userId, isOwn]);

  // Profile-visitor tracking: log my visit to others; load my own viewers.
  useEffect(() => {
    if (!sessionUser) return;
    if (isOwn) {
      fetch("/api/users/visitors", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setVisitors(d.visitors || []))
        .catch(() => {});
    } else {
      fetch(`/api/users/${userId}/visit`, { method: "POST", credentials: "include" }).catch(() => {});
    }
  }, [sessionUser, isOwn, userId]);

  const onFollow = () => {
    if (!sessionUser) {
      setModalContent(<LoginFormModal />);
      return;
    }
    dispatch(thunkToggleFollow(Number(userId), isFollowing)).then(() => {
      setProfile((p) => p && ({
        ...p,
        followers_count: p.followers_count + (isFollowing ? -1 : 1),
      }));
    });
  };

  const shareProfile = async () => {
    const url = `${window.location.origin}/users/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch { /* ignore */ }
  };

  if (!profile) {
    return (
      <div className="feed-gate">
        <div className="feed-spinner" />
      </div>
    );
  }

  const followerCount = profile.followers_count;
  const displayName = `${profile.firstname || ""} ${profile.lastname || ""}`.trim() || `@${profile.username}`;

  const refreshProfile = () =>
    fetch(`/api/users/${userId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {});

  const openStoryComposer = () => setModalContent(<StoryComposer onPosted={refreshProfile} />);

  const openStoryViewer = async () => {
    const stories = await dispatch(thunkFetchUserStories(Number(userId)));
    if (stories && stories.length) {
      setModalContent(<StoryViewer stories={stories} canDelete={isOwn} onChanged={refreshProfile} />);
    }
  };

  return (
    <div className="page profile-page">
      <header className="profile-head">
        {profile.has_story ? (
          <button className="profile-avatar-btn" onClick={openStoryViewer} aria-label="View story">
            <span className="story-ring">
              <VerifiedAvatar user={profile} size={88} badge className="profile-avatar" />
            </span>
          </button>
        ) : (
          <VerifiedAvatar user={profile} size={96} badge className="profile-avatar" />
        )}

        <h1 className="profile-name-row">
          {displayName}
          <AuraCheck tierKey={profile.tier_key} size={20} />
          {isOwn && (
            <button className="add-story-btn" onClick={openStoryComposer} aria-label="Add to your story" title="Add to your story">
              <FaPlus />
            </button>
          )}
        </h1>
        <p className="profile-handle">
          @{profile.username}{profile.city ? ` · ${profile.city}` : ""}
        </p>

        {profile.tier && (
          <span className={`profile-tier tier-${profile.tier_key || "standard"}`}>
            <FaBolt /> {profile.tier}
          </span>
        )}

        <div className="profile-stats">
          {isOwn ? (
            <>
              <button className="profile-stat" onClick={() => setModalContent(<FollowListModal userId={userId} mode="following" />)}>
                <strong>{compact(profile.following_count)}</strong><span>Following</span>
              </button>
              <button className="profile-stat" onClick={() => setModalContent(<FollowListModal userId={userId} mode="followers" />)}>
                <strong>{compact(followerCount)}</strong><span>Followers</span>
              </button>
            </>
          ) : (
            <>
              <span className="profile-stat"><strong>{compact(profile.following_count)}</strong><span>Following</span></span>
              <span className="profile-stat"><strong>{compact(followerCount)}</strong><span>Followers</span></span>
            </>
          )}
          <span className="profile-stat aura"><strong>{compact(profile.aura ?? profile.likes_received)}</strong><span>Aura</span></span>
        </div>

        <div className="profile-actions">
          {isOwn ? (
            <Link className="btn btn-ghost profile-settings-btn" to="/settings" title="Settings">
              <FaGear /> Settings
            </Link>
          ) : (
            <>
              <button className={`btn ${isFollowing ? "btn-ghost" : "btn-primary"}`} onClick={onFollow}>
                {isFollowing ? <><FaUserCheck /> Following</> : <><FaUserPlus /> Follow</>}
              </button>
              {sessionUser && (
                <Link className="btn btn-ghost" to={`/messages/${userId}`}>
                  <FaPaperPlane /> Message
                </Link>
              )}
            </>
          )}
          <button className="btn btn-ghost" onClick={shareProfile} title="Copy profile link">
            <FaShare /> Share
          </button>
        </div>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        {isOwn && visitors.length > 0 && (
          <div className="profile-visitors">
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
              👀 {visitors.length} recent profile {visitors.length === 1 ? "view" : "views"}
            </span>
            <div style={{ display: "flex" }}>
              {visitors.slice(0, 8).map((v, i) => (
                <Link
                  key={v.id}
                  to={`/users/${v.visitor?.id}`}
                  title={`@${v.visitor?.username}`}
                  style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 8 - i }}
                >
                  <img
                    className="avatar"
                    width={28}
                    height={28}
                    style={{ border: "2px solid var(--bg, #0b0b0f)" }}
                    src={v.visitor?.profile_img || `https://i.pravatar.cc/40?u=${v.visitor?.id}`}
                    alt={v.visitor?.username}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <nav className="profile-tabs">
        <button className={tab === "videos" ? "active" : ""} onClick={() => setTab("videos")}>
          <FaClapperboard /> Videos <em>{profile.video_count}</em>
        </button>
        <button className={tab === "liked" ? "active" : ""} onClick={() => setTab("liked")}>
          <FaHeart /> Liked
        </button>
        {isOwn && (
          <button className={tab === "favorites" ? "active" : ""} onClick={() => setTab("favorites")}>
            <FaBookmark /> Favorites
          </button>
        )}
        {isOwn && (
          <button className={tab === "vault" ? "active" : ""} onClick={() => setTab("vault")}>
            <FaImages /> Vault
          </button>
        )}
      </nav>

      {tab === "videos" && (
        <VideoGrid
          posts={videos}
          emptyText={isOwn ? "You haven't posted yet — your first video awaits 🎬" : "No videos yet"}
        />
      )}
      {tab === "liked" && <VideoGrid posts={liked} emptyText="No liked videos yet" />}
      {tab === "favorites" && isOwn && (
        <VideoGrid posts={favorites} emptyText="Save videos to find them here later 🔖" />
      )}
      {tab === "favorites" && !isOwn && (
        <div className="vgrid-empty"><FaLock /> Favorites are private</div>
      )}
      {tab === "vault" && isOwn && <Vault embedded />}

      {isOwn && (
        <Link to="/upload" className="btn btn-grad profile-upload-cta">+ New video</Link>
      )}
    </div>
  );
}
