// frontend/src/components/Dashboard.jsx
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAllPosts, getFriendsPosts } from '../../redux/posts';
import { getFriends } from '../../redux/friends';
import FriendsSidebar from '../FriendsSidebar/FriendsSidebar';
import './Dashboard.css';

function Dashboard() {
  const sessionUser = useSelector(state => state.session.user);
  const dispatch = useDispatch();
  const allPostsObj = useSelector(state => state.posts);
  const allPosts = Object.values(allPostsObj);
  const friends = useSelector(state => state.friends || {});
  const [filterFriendsOnly, setFilterFriendsOnly] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      dispatch(getFriends(sessionUser.id));
    }
  }, [dispatch, sessionUser]); // ✅ fixed: added missing closing parenthesis

  useEffect(() => {
    if (filterFriendsOnly) {
      dispatch(getFriendsPosts());
    } else {
      dispatch(getAllPosts());
    }
  }, [dispatch, filterFriendsOnly]);

  const PostList = () => {
    if (!allPosts || allPosts.length === 0) {
      return 
    }

    return (
      <ul className="posts-list">
        {allPosts.map((post) => (
          <li key={post.id} className="post-item">
            <div className="post-header">
              <span className="post-author">{post.user?.username || 'Unknown'}</span>
              <span className="post-location">Downtown • 10 minutes ago</span>
            </div>
            <p className="post-content">{post.body}</p>
            {post.image_url && (
              <img src={post.image_url} alt="Post content" className="post-image" />
            )}
            <div className="post-footer">
              <span className="post-likes">{post.like_count || 0}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (!sessionUser) return <Navigate to="/" replace={true} />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-header">
          <h1>Welcome, {sessionUser.firstname}</h1>
        </div>

        <div className="filter-bar">
          <label>
            <input
              type="checkbox"
              checked={filterFriendsOnly}
              onChange={(e) => setFilterFriendsOnly(e.target.checked)}
            />
            Show only me & my friends posts
          </label>
        </div>

        <div className="post-form">
          <textarea placeholder="What's happening in your area?" className="post-textarea"></textarea>
          <div className="post-actions">
            <button className="add-photo-btn">Add Photo</button>
            <button className="post-update-btn">Post</button>
          </div>
        </div>

        <div className="posts-container">
          <PostList />
        </div>
      </div>

      <FriendsSidebar friends={friends} sessionUser={sessionUser} />

      <div className="bottom-nav">
        <button className="nav-btn">Home</button>
        <button className="nav-btn">Camera</button>
        <button className="nav-btn">Notifications</button>
        <button className="nav-btn">Profile</button>
      </div>
    </div>
  );
}

export default Dashboard;
