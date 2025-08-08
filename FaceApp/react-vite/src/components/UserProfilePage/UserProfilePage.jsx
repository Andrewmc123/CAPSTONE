import { useEffect, useState, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserPosts } from '../../redux/posts';
import { 
  getFriends, 
  getPendingFriends, 
  sendFriendRequest, 
  removeFriend, 
  acceptFriendRequest 
} from '../../redux/friends';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.session.user);
  const postsState = useSelector(state => state.posts);
  const friendsState = useSelector(state => state.friends);
  
  const [user, setUser] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [friendStatus, setFriendStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user's posts from Redux store
  const userPosts = postsState.userPosts[userId] 
    ? Object.values(postsState.userPosts[userId]).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
    : [];
  
  // Calculate stats that will be displayed
  const postCount = userPosts.length;
  const likeCount = userPosts.reduce((total, post) => total + (post.like_count || 0), 0);
  const friendCount = Object.values(friendsState.friends || {}).filter(friend => 
  friend.status === 'friends'
).length;

  // Memoized function to check friend status
  const checkFriendStatus = useCallback(() => {
    if (!sessionUser || !user || !friendsState) return;

    const isFriend = Object.values(friendsState.friends || {}).some(f => 
      (f.friend?.id === user.id && f.status === 'accepted') || 
      (f.user?.id === user.id && f.status === 'accepted')
    );

    const hasPendingIncoming = Object.values(friendsState.pending || {}).some(p => 
      p.user?.id === user.id && p.friend?.id === sessionUser.id
    );

    const hasPendingOutgoing = Object.values(friendsState.pending || {}).some(p => 
      p.user?.id === sessionUser.id && p.friend?.id === user.id
    );

    if (isFriend) {
      setFriendStatus('friends');
    } else if (hasPendingIncoming) {
      setFriendStatus('pending_incoming');
    } else if (hasPendingOutgoing) {
      setFriendStatus('pending_outgoing');
    } else {
      setFriendStatus('none');
    }
  }, [sessionUser, user, friendsState]);

  // Format member since date
  const formatMemberSince = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle friend actions
  const handleFriendAction = async () => {
    if (!sessionUser) return;
    
    try {
      if (friendStatus === 'none') {
        await dispatch(sendFriendRequest(user.id));
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        setFriendStatus('pending_outgoing');
      } else if (friendStatus === 'friends') {
        await dispatch(removeFriend(user.id));
        setFriendStatus('none');
      } else if (friendStatus === 'pending_incoming') {
        await dispatch(acceptFriendRequest(user.id));
        setFriendStatus('friends');
      }
      // Refresh friends data
      await dispatch(getFriends());
      await dispatch(getPendingFriends());
    } catch (error) {
      console.error('Error handling friend action:', error);
      setError('Failed to update friend status');
    }
  };

  // Get friend button text based on status
  const getFriendButtonText = () => {
    if (!sessionUser || sessionUser.id === user?.id) return null;
    
    switch (friendStatus) {
      case 'friends': return 'Remove Friend';
      case 'pending_outgoing': return 'Request Sent';
      case 'pending_incoming': return 'Accept Request';
      default: return 'Add Friend';
    }
  };

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user data
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user");
        const userData = await userResponse.json();
        setUser(userData);

        // Fetch user's posts and friends data in parallel
        await Promise.all([
          dispatch(getUserPosts(userId)),
          dispatch(getFriends()),
          dispatch(getPendingFriends())
        ]);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, dispatch]);

  // Update friend status when user or friends data changes
  useEffect(() => {
    checkFriendStatus();
  }, [checkFriendStatus]);

  if (isLoading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!user) return <div className="no-user">User not found</div>;

  return (
    <div className="profile-page-container">
      {showConfirmation && (
        <div className="confirmation-dropdown">
          <p>Friend request sent to {user.firstname}!</p>
          <button 
            className="close-btn" 
            onClick={() => setShowConfirmation(false)}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar">
          {user.profile_img ? (
            <img 
              src={user.profile_img} 
              alt={`${user.firstname} ${user.lastname}`} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <div className="avatar-fallback">
            {user.firstname?.[0]}{user.lastname?.[0]}
          </div>
        </div>

        <div className="profile-main-content">
          <div className="profile-info-wrapper">
            <div className="profile-info">
              <h1>{user.firstname} {user.lastname}</h1>
              <p className="username">@{user.username}</p>
            </div>

            <div className="profile-stats-wrapper">
              <div className="stat-item">
                <span className="stat-number">{postCount}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{likeCount}</span>
                <span className="stat-label">Likes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{friendCount}</span>
                <span className="stat-label">Friends</span>
              </div>
            </div>
          </div>

          <div className="profile-details-wrapper">
            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Member since:</span>
                <span>{formatMemberSince(user.created_at)}</span>
              </div>
            </div>

            {sessionUser?.id !== user.id && (
              <button 
                className={`friend-action-btn ${
                  friendStatus === 'friends' ? 'remove' : 
                  friendStatus === 'pending_outgoing' ? 'pending' : 
                  friendStatus === 'pending_incoming' ? 'accept' : 'add'
                }`}
                onClick={handleFriendAction}
                disabled={friendStatus === 'pending_outgoing'}
              >
                {getFriendButtonText()}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="user-posts-section">
        <h2 className="posts-section-title">{user.firstname}&apos;s Posts</h2>
        {userPosts.length > 0 ? (
          <div className="posts-grid">
            {userPosts.map((post) => (
              <NavLink 
                key={post.id} 
                to={`/posts/${post.id}`} 
                className="post-tile"
                aria-label={`View post by ${user.firstname}`}
              >
                {post.image_url ? (
                  <img 
                    src={post.image_url} 
                    alt="Post content" 
                    className="post-image" 
                    loading="lazy"
                  />
                ) : (
                  <div className="post-text">{post.body}</div>
                )}
                <div className="post-overlay">
                  <span className="post-likes">❤️ {post.like_count || 0}</span>
                  <span className="post-comments">💬 {post.comment_count || 0}</span>
                </div>
              </NavLink>
            ))}
          </div>
        ) : (
          <div className="no-posts">
            <p>No posts yet</p>
            {sessionUser?.id === parseInt(userId) && (
              <NavLink to="/dashboard" className="create-post-link">
                Create your first post
              </NavLink>
            )}
          </div>
        )}
      </div>
    </div>
  );
}