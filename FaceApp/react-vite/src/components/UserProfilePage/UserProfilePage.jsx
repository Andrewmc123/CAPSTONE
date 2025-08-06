import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getAllPosts } from '../../redux/posts';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.session.user);
  const posts = useSelector((state) => Object.values(state.posts));
  const [user, setUser] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const userPosts = posts.filter((post) => post.user_id === parseInt(userId));

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    };

    fetchUser();
    dispatch(getAllPosts());
  }, [userId, dispatch]);

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleAddFriend = () => {
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-stats">
            <div className="stat-card">
              <h4>Posts</h4>
              <p>{user.post_count}</p>
            </div>
            <div className="stat-card">
              <h4>Likes</h4>
              <p>{user.total_likes}</p>
            </div>
            <div className="stat-card">
              <h4>Friends</h4>
              <p>{user.friend_count}</p>
            </div>
          </div>

          <div className="profile-avatar">
            {user.profile_img ? (
              <img src={user.profile_img} alt={`${user.firstname} ${user.lastname}`} />
            ) : (
              `${user.firstname?.[0]}${user.lastname?.[0]}`
            )}
          </div>

          <div className="profile-info">
            <h2>
              {user.firstname} {user.lastname}
            </h2>
            <div className="info-box">
              <p>
                <span>Username:</span> {user.username}
              </p>
              <p>
                <span>Email:</span> {user.email}
              </p>
              <p>
                <span>Member since:</span> {formatMemberSince(user.created_at)}
              </p>
            </div>
          </div>

          {sessionUser?.id !== user.id && (
            <button className="add-friend-btn" onClick={handleAddFriend}>
              Add Friend
            </button>
          )}
        </div>
      </div>

      {showConfirmation && (
        <div className="confirmation-dropdown">
          <p>Friend request sent to {user.firstname}!</p>
          <button className="close-btn" onClick={() => setShowConfirmation(false)}>
            x
          </button>
        </div>
      )}

      {userPosts.length > 0 && (
        <div className="user-posts-section">
          {userPosts.map((post) => (
            <div key={post.id} className="user-post-tile">
              {post.image_url ? (
                <img src={post.image_url} alt="User Post" />
              ) : (
                <div className="post-fallback">
                  <p>{post.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
