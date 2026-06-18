import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchUserFollowLists } from "../../redux/follows";
import { useModal } from "../../context/Modal";
import "./FollowListModal.css";

// Followers / Following list — opened from the profile stat counts. This is how
// users reach "friends" now (the people they follow / who follow them).
export default function FollowListModal({ userId, mode = "followers" }) {
  const dispatch = useDispatch();
  const { closeModal } = useModal();
  const lists = useSelector((s) => s.follows.byUser[userId]);
  const [tab, setTab] = useState(mode);

  useEffect(() => {
    if (!lists) dispatch(fetchUserFollowLists(userId));
  }, [dispatch, userId, lists]);

  const users = (tab === "followers" ? lists?.followers : lists?.following) || [];

  return (
    <div className="follow-modal">
      <div className="follow-modal-tabs">
        <button className={tab === "followers" ? "active" : ""} onClick={() => setTab("followers")}>
          Followers
        </button>
        <button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")}>
          Following
        </button>
      </div>

      <div className="follow-modal-list">
        {!lists ? (
          <div className="feed-spinner" style={{ margin: "30px auto" }} />
        ) : users.length === 0 ? (
          <p className="follow-modal-empty">
            {tab === "followers" ? "No followers yet." : "Not following anyone yet."}
          </p>
        ) : (
          users.map((u) => (
            <Link key={u.id} to={`/users/${u.id}`} className="follow-row" onClick={closeModal}>
              <img className="avatar" width={44} height={44} src={u.profile_img || `https://i.pravatar.cc/80?u=${u.id}`} alt="" />
              <div className="follow-row-meta">
                <strong>@{u.username}</strong>
                <span>{u.firstname} {u.lastname}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
