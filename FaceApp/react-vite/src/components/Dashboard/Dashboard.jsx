import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getPosts, thunkCreatePost } from '../../redux/posts';
import { fetchFriends } from '../../redux/friends';
import RightPanel from '../RightPanel/RightPanel';
import './Dashboard.css';

function Dashboard() {
  const sessionUser = useSelector(state => state.session.user);
  const dispatch = useDispatch();
  const posts = useSelector(state => Object.values(state.posts?.allPosts || {}));
  const friends = useSelector(state => Object.values(state.friends.allFriends || {}));

  const [newPostBody, setNewPostBody] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      dispatch(getPosts());
      dispatch(fetchFriends());
    }
  }, [dispatch, sessionUser]);

  if (!sessionUser) return <Navigate to="/" replace={true} />;

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostBody.trim()) return;
    setLoading(true);

    // Create post expects JSON with body (adjust if backend expects different)
    const postPayload = { body: newPostBody };
    
    const result = await dispatch(thunkCreatePost(JSON.stringify(postPayload)));
    setLoading(false);

    if (!result.error) {
      setNewPostBody('');
    }
  };

  const handleLikeToggle = (post) => {
    // Implement your like toggle thunk here when ready
    alert(`Toggle like for post id ${post.id}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-header">
            <h1>Welcome, {sessionUser.firstname}</h1>
          </div>

          <form onSubmit={handlePostSubmit} className="post-form">
            <h3>Yerr</h3>
            <textarea
              placeholder="What's happening in your area?"
              className="post-textarea"
              value={newPostBody}
              onChange={e => setNewPostBody(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <div className="post-actions">
              <button type="button" className="add-photo-btn" disabled>
                Add Photo
              </button>
              <button type="submit" className="post-update-btn" disabled={loading}>
                {loading ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </form>

          <div className="posts-list">
            {posts.length === 0 ? (
              <p>No posts to show. Start sharing updates!</p>
            ) : (
              posts.map(post => (
                <div key={post.id} className="post-item">
                  <div className="post-header">
                    <span className="post-author">{post.user?.username || 'Unknown'}</span>
                    <span className="post-location">Downtown • 10 minutes ago</span>
                  </div>
                  <p className="post-content">{post.body}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="post media" className="post-image" />
                  )}
                  <div className="post-footer">
                    <button
                      onClick={() => handleLikeToggle(post)}
                      className="post-like-btn"
                    >
                      {post.like_count || 0} Likes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <RightPanel friends={friends} />
      </div>

    </div>
  );
}

export default Dashboard;
