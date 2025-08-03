import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getPosts } from '../../redux/post';
import {getFriends}  from '../../redux/friends';
import './Dashboard.css';

function Dashboard() {
  const sessionUser = useSelector(state => state.session.user);
  const dispatch = useDispatch();
  const posts = useSelector(state => Object.values(state.post.allPosts || {}));
  const friends = useSelector(state => Object.values(state.friends.allFriends || {}));

  useEffect(() => {
    if (sessionUser) {
      dispatch(getPosts());
      dispatch(getFriends());
    }
  }, [dispatch, sessionUser]);

  if (!sessionUser) return <Navigate to="/" replace={true} />;

  return (
    <div className="dashboard" style={{ position: 'fixed', bottom: 0, width: '100%' }}>
      <div className="dashboard-header">
        <h1>Welcome back, {sessionUser.firstname}!</h1>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-title">Friends</div>
          <div className="summary-count">{friends.length}</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Posts Shared</div>
          <div className="summary-count">{posts.length}</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Notifications</div>
          <div className="summary-count">
            {sessionUser.notifications ? sessionUser.notifications.length : 0}
          </div>
        </div>

        {/* This is doing: placeholder for Vault route */}
        {/* <div className="summary-card">
          <div className="summary-title">Vault</div>
          <div className="summary-count">Coming Soon</div>
        </div> */}
      </div>

      <div className="dashboard-posts">
        <h2>Recent Party Posts</h2>
        {posts.length === 0 && <p>No posts to show. Start sharing your nights!</p>}
        <ul>
          {posts.map(post => (
            <li key={post.id} className="post-item">
              <img src={post.mediaUrl} alt={post.caption || "Party photo"} className="post-image" />
              <p>{post.caption}</p>
              <small>By {post.user?.username || 'Unknown'}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
