import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaUserGroup, FaUserPlus, FaUserMinus, FaCheck, FaXmark } from "react-icons/fa6";
import {
  getFriends, getPendingFriends, acceptFriendRequest,
  declineFriendRequest, removeFriend, sendFriendRequest,
} from "../../redux/friends";
import { upsertPosts } from "../../redux/posts";
import VideoGrid from "../VideoGrid";
import "./Friend.css";

export default function Friends() {
  const dispatch = useDispatch();
  const sessionUser = useSelector((s) => s.session.user);
  const friends = useSelector((s) => Object.values(s.friends?.friends || {}));
  const pending = useSelector((s) => Object.values(s.friends?.pending || {}));
  const [friendPosts, setFriendPosts] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [sentTo, setSentTo] = useState([]);

  useEffect(() => {
    dispatch(getFriends());
    dispatch(getPendingFriends());

    fetch("/api/posts/friends", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((data) => {
        setFriendPosts(data.posts || []);
        dispatch(upsertPosts(data.posts || []));
      })
      .catch(() => {});

    fetch("/api/follows/suggestions?limit=8", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSuggested(d.suggestions || []))
      .catch(() => {});
  }, [dispatch]);

  const addFriend = async (userId) => {
    await dispatch(sendFriendRequest(userId));
    setSentTo((prev) => [...prev, userId]);
  };

  const friendIds = new Set(friends.map((f) => f.id));
  const suggestions = suggested.filter((u) => !friendIds.has(u.id) && u.id !== sessionUser?.id);

  return (
    <div className="page friends-page">
      <header className="friends-head">
        <h1><FaUserGroup /> Friends</h1>
        <p className="text-dim">Your people on Aura — mutuals, requests and their latest drops</p>
      </header>

      {pending.length > 0 && (
        <section className="friends-section">
          <h3>Friend requests ({pending.length})</h3>
          <div className="friends-req-list">
            {pending.map((p) => (
              <div className="friend-req-card" key={p.id}>
                <Link to={`/users/${p.id}`}>
                  <img className="avatar" width={54} height={54} src={p.profile_img || `https://i.pravatar.cc/80?u=${p.id}`} alt="" />
                </Link>
                <strong>@{p.username}</strong>
                <div className="friend-req-actions">
                  <button className="btn btn-primary" onClick={() => dispatch(acceptFriendRequest(p.id))}>
                    <FaCheck /> Accept
                  </button>
                  <button className="btn btn-ghost" onClick={() => dispatch(declineFriendRequest(p.id))}>
                    <FaXmark />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="friends-section">
        <h3>Your friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-dim">No friends yet — send a request below to get the party started 🎉</p>
        ) : (
          <div className="friends-grid">
            {friends.map((f) => (
              <div className="friend-card" key={f.id}>
                <Link to={`/users/${f.id}`} className="friend-card-id">
                  <img className="avatar" width={50} height={50} src={f.profile_img || `https://i.pravatar.cc/80?u=${f.id}`} alt="" />
                  <span>@{f.username}</span>
                </Link>
                <button
                  className="friend-remove"
                  title="Remove friend"
                  onClick={() => dispatch(removeFriend(f.id))}
                >
                  <FaUserMinus />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="friends-section">
          <h3>People you may know</h3>
          <div className="friends-grid">
            {suggestions.map((u) => (
              <div className="friend-card" key={u.id}>
                <Link to={`/users/${u.id}`} className="friend-card-id">
                  <img className="avatar" width={50} height={50} src={u.profile_img || `https://i.pravatar.cc/80?u=${u.id}`} alt="" />
                  <span>@{u.username}</span>
                </Link>
                {sentTo.includes(u.id) ? (
                  <span className="friend-sent">Sent ✓</span>
                ) : (
                  <button className="btn btn-outline-neon friend-add" onClick={() => addFriend(u.id)}>
                    <FaUserPlus /> Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="friends-section">
        <h3>Latest from your circle</h3>
        <VideoGrid posts={friendPosts} emptyText="When your friends post, their videos land here 🎬" />
      </section>
    </div>
  );
}
