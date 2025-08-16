import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  getAllPosts, 
  getFriendsPosts, 
  thunkLikePost, 
  thunkAddComment, 
  thunkCreatePost, 
  thunkDeletePost
} from '../../redux/posts';
import { getFriends } from '../../redux/friends';
import FriendsSidebar from '../FriendsSidebar/FriendsSidebar';
import UserLink from '../UserLink/UserLink';
import './Dashboard.css';

function Dashboard() {
  const [filterFriendsOnly, setFilterFriendsOnly] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [showComments, setShowComments] = useState({});
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [isCommenting, setIsCommenting] = useState({});

  const sessionUser = useSelector(state => state.session.user);
  const dispatch = useDispatch();
  const friendsState = useSelector(state => state.friends);
  const { loading, error } = useSelector(state => state.posts);
  const commentInputRefs = useRef({});
  
  const allPosts = useSelector(state => {
    const posts = filterFriendsOnly 
      ? Object.values(state.posts.friendsPosts || {})
      : Object.values(state.posts.posts || {});
    
    return posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  });
  
  const friends = Object.values(friendsState.friends || {});

  useEffect(() => {
    if (sessionUser) {
      dispatch(getFriends());
      loadPosts();
    }
  }, [dispatch, sessionUser]);

  const loadPosts = () => {
    if (filterFriendsOnly) {
      dispatch(getFriendsPosts());
    } else {
      dispatch(getAllPosts());
    }
  };

  const handleLike = async (postId) => {
    try {
      await dispatch(thunkLikePost(postId));
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentTexts[postId]?.trim()) return;
    
    setIsCommenting(prev => ({ ...prev, [postId]: true }));
    try {
      const scrollPosition = window.scrollY;
      await dispatch(thunkAddComment(postId, { body: commentTexts[postId] }));
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      loadPosts();
      window.scrollTo(0, scrollPosition);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;
    
    try {
      const postData = { 
        body: postContent,
        image_url: postImage,
        friendsOnly: filterFriendsOnly
      };
      
      await dispatch(thunkCreatePost(postData));
      setPostContent('');
      setPostImage(null);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await dispatch(thunkDeletePost(postId));
        loadPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const PostList = () => {
    if (loading && allPosts.length === 0) {
      return <div className="loading-spinner">Loading posts...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (!allPosts || allPosts.length === 0) {
      return <div className="no-posts">No posts to display</div>;
    }

    return (
      <div className="posts-column">
        {allPosts.map((post) => (
          <div key={post.id} className="instagram-post">
            <div className="post-header">
              <div className="post-user">
                <div className="post-avatar">
                  {post.user?.profile_img ? (
                    <img src={post.user.profile_img} alt={post.user.username} />
                  ) : (
                    <div className="avatar-fallback">
                      {post.user?.username?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <UserLink user={post.user}>
                  <span className="post-username">{post.user?.username || 'Unknown'}</span>
                </UserLink>
              </div>
              <div>
                <span className="post-time">
                  {formatPostTime(post.created_at)}
                </span>
                {post.user?.id === sessionUser.id && (
                  <button 
                    className="delete-post-btn"
                    onClick={() => handleDeletePost(post.id)}
                    disabled={loading}
                  >
                    {loading ? '...' : '🗑️'}
                  </button>
                )}
              </div>
            </div>
            
            {post.image_url && (
              <div className="post-image-container">
                <img src={post.image_url} alt="Post content" className="post-image" />
              </div>
            )}
            
            <div className="post-likes">{post.like_count || 0} likes</div>
            
            <div className="post-actions">
              <button 
                className={`post-action-btn ${post.liked_by_user ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
                disabled={loading}
              >
                <i className="icon-heart">
                  {post.liked_by_user ? '❤️' : '♡'}
                </i>
              </button>
              <button 
                className="post-action-btn"
                onClick={() => toggleComments(post.id)}
                disabled={loading}
              >
                <i className="icon-comment">🗨</i>
              </button>
              <button className="post-action-btn" disabled={loading}>
                <i className="icon-share">↗</i>
              </button>
            </div>
            
            <div className="post-caption">
              <span className="caption-username">{post.user?.username || ''}</span>
              <span className="caption-text">{post.body}</span>
            </div>

            {showComments[post.id] && (
              <div className="comments-section">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="comment">
                    <span className="comment-username">{comment.user?.username}</span>
                    <span className="comment-text">{comment.body}</span>
                  </div>
                ))}
                <div className="add-comment">
                  <input
                    ref={el => commentInputRefs.current[post.id] = el}
                    type="text"
                    placeholder="Add a comment..."
                    value={commentTexts[post.id] || ''}
                    onChange={(e) => setCommentTexts(prev => ({
                      ...prev,
                      [post.id]: e.target.value
                    }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                    maxLength={250}
                    disabled={loading}
                  />
                  <button 
                    className="comment-submit-btn"
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={loading || isCommenting[post.id] || !commentTexts[post.id]?.trim()}
                  >
                    {isCommenting[post.id] ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}

            <div 
              className="post-comments" 
              onClick={() => toggleComments(post.id)}
            >
              {post.comments?.length ? `View all ${post.comments.length} comments` : 'View comments'}
            </div>
            <div className="post-time-full">
              Posted {formatPostTime(post.created_at)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatPostTime = (dateString) => {
    if (!dateString) return 'recently';
    
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!sessionUser) return <Navigate to="/" replace={true} />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header-container">
          <div className="dashboard-header">
            <h1>Welcome back, <span className="username-glow">{sessionUser.firstname}</span></h1>
            <div className="header-divider"></div>
            <div className="filter-bar-container">
              <div className="filter-bar">
                <label className="filter-toggle">
                  <input
                    type="checkbox"
                    checked={filterFriendsOnly}
                    onChange={(e) => {
                      setFilterFriendsOnly(e.target.checked);
                      loadPosts();
                    }}
                    disabled={loading}
                  />
                  <span className="toggle-slider"></span>
                  <span className="filter-text">Friends Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="post-form">
          <textarea 
            placeholder="What's happening in your area?" 
            className="post-textarea"
            rows="3"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={loading}
          />
          {postImage && (
            <div className="post-image-preview">
              <img src={postImage} alt="Preview" />
              <button onClick={() => setPostImage(null)} disabled={loading}>
                Remove
              </button>
            </div>
          )}
          <div className="post-actions">
            <label className="add-photo-btn" style={loading ? { opacity: 0.5 } : {}}>
              <i className="icon-camera">📷</i> Photo
              <input 
                type="file" 
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  if (loading) return;
                  const file = e.target.files[0];
                  if (file) setPostImage(URL.createObjectURL(file));
                }}
                disabled={loading}
              />
            </label>
            <button 
              className="post-update-btn"
              onClick={handlePostSubmit}
              disabled={loading || !postContent.trim()}
            >
              {loading ? 'Posting...' : 'Post Update'}
            </button>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="posts-container">
          <PostList />
        </div>
      </div>

      <FriendsSidebar 
        friends={friends} 
        sessionUser={sessionUser} 
        loading={loading}
      />
    </div>
  );
}

export default Dashboard;