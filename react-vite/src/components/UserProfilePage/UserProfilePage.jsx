import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUserPlus, FaUserCheck, FaPen, FaShare, FaLock, FaHeart, FaBookmark, FaClapperboard,
} from "react-icons/fa6";
import {
  fetchUserVideos, fetchLikedVideos, fetchBookmarkedVideos, selectCollection,
} from "../../redux/posts";
import { thunkToggleFollow, selectIsFollowing, fetchUserFollowLists } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import EditProfileModal from "./EditProfileModal";
import VideoGrid from "../VideoGrid";
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
    dispatch(fetchUserFollowLists(userId));
    return () => { alive = false; };
  }, [dispatch, userId]);

  useEffect(() => {
    if (tab === "liked") dispatch(fetchLikedVideos(userId));
    if (tab === "favorites" && isOwn) dispatch(fetchBookmarkedVideos());
  }, [tab, dispatch, userId, isOwn]);

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

  return (
    <div className="page profile-page">
      <header className="profile-head">
        <img
          className="avatar profile-avatar"
          src={profile.profile_img || `https://i.pravatar.cc/200?u=${profile.id}`}
          alt={profile.username}
        />
        <div className="profile-id">
          <h1>@{profile.username}</h1>
          <p className="profile-name">{profile.firstname} {profile.lastname}</p>

          <div className="profile-actions">
            {isOwn ? (
              <button
                className="btn btn-ghost"
                onClick={() => setModalContent(
                  <EditProfileModal profile={profile} onSaved={setProfile} />
                )}
              >
                <FaPen /> Edit profile
              </button>
            ) : (
              <button className={`btn ${isFollowing ? "btn-ghost" : "btn-primary"}`} onClick={onFollow}>
                {isFollowing ? <><FaUserCheck /> Following</> : <><FaUserPlus /> Follow</>}
              </button>
            )}
            <button className="btn btn-ghost" onClick={shareProfile} title="Copy profile link">
              <FaShare /> Share
            </button>
          </div>

          <div className="profile-stats">
            <span><strong>{compact(profile.following_count)}</strong> Following</span>
            <span><strong>{compact(followerCount)}</strong> Followers</span>
            <span><strong>{compact(profile.likes_received)}</strong> Likes</span>
          </div>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>
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

      {isOwn && (
        <Link to="/upload" className="btn btn-grad profile-upload-cta">+ New video</Link>
      )}
    </div>
  );
}
