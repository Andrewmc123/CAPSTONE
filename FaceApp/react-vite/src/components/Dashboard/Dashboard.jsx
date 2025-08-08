import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAllPosts, getFriendsPosts, thunkLikePost, thunkAddComment, thunkCreatePost, thunkDeletePost } from '../../redux/posts';
import { getFriends } from '../../redux/friends';
import FriendsSidebar from '../FriendsSidebar/FriendsSidebar';
import UserLink from '../UserLink/UserLink';
import './Dashboard.css';

function Dashboard() {
  const sessionUser = useSelector(state => state.session.user);
  const dispatch = useDispatch();
  const allPostsObj = useSelector(state => state.posts.posts);
  const friendsState = useSelector(state => state.friends);
  // Sort posts by creation date (newest first)
  const allPosts = Object.values(allPostsObj).sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  const friends = Object.values(friendsState.friends || {});
  const [filterFriendsOnly, setFilterFriendsOnly] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [showComments, setShowComments] = useState({});
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [newPostAdded, setNewPostAdded] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      dispatch(getFriends());
    }
  }, [dispatch, sessionUser]);

  useEffect(() => {
    if (filterFriendsOnly) {
      dispatch(getFriendsPosts());
    } else {
      dispatch(getAllPosts());
    }
    setNewPostAdded(false);
  }, [dispatch, filterFriendsOnly, newPostAdded]);

  const handleLike = (postId) => {
    dispatch(thunkLikePost(postId));
  };

  const handleCommentSubmit = (postId) => {
    if (commentTexts[postId]?.trim()) {
      dispatch(thunkAddComment(postId, commentTexts[postId]));
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
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
      const postData = { body: postContent };
      if (postImage) {
        postData.image_url = postImage;
      }
      
      await dispatch(thunkCreatePost(postData));
      setPostContent('');
      setPostImage(null);
      setNewPostAdded(true); // Trigger refresh of posts
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await dispatch(thunkDeletePost(postId));
        dispatch(filterFriendsOnly ? getFriendsPosts() : getAllPosts());
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const PostList = () => {
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
                  >
                    🗑️
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
              >
                <i className="icon-heart">
                  {post.liked_by_user ? '❤️' : '♡'}
                </i>
              </button>
              <button 
                className="post-action-btn"
                onClick={() => toggleComments(post.id)}
              >
                <i className="icon-comment">🗨</i>
              </button>
              <button className="post-action-btn">
                <i className="icon-share">↗</i>
              </button>
            </div>
            
            <div className="post-caption">
              <span className="caption-username">{post.user?.username || ''}</span>
              <span className="caption-text">{post.body}</span>
            </div>

            {showComments[post.id] && (
              <div className="comments-section">
                {post.comments?.map((comment, index) => (
                  <div key={index} className="comment">
                    <span className="comment-username">{comment.user.username}</span>
                    <span className="comment-text">{comment.text}</span>
                  </div>
                ))}
                <div className="add-comment">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentTexts[post.id] || ''}
                    onChange={(e) => setCommentTexts(prev => ({
                      ...prev,
                      [post.id]: e.target.value
                    }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                  />
                  <button 
                    className="comment-submit-btn"
                    onClick={() => handleCommentSubmit(post.id)}
                  >
                    Post
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

  // Helper function to format post time
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
                    onChange={(e) => setFilterFriendsOnly(e.target.checked)}
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
          />
          {postImage && (
            <div className="post-image-preview">
              <img src={postImage} alt="Preview" />
              <button onClick={() => setPostImage(null)}>Remove</button>
            </div>
          )}
          <div className="post-actions">
            <label className="add-photo-btn">
              <i className="icon-camera">📷</i> Photo
              <input 
                type="file" 
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setPostImage(URL.createObjectURL(file));
                }}
              />
            </label>
            <button 
              className="post-update-btn"
              onClick={handlePostSubmit}
              disabled={!postContent.trim()}
            >
              Post Update
            </button>
          </div>
        </div>

        <div className="posts-container">
          <PostList />
        </div>
      </div>

      <FriendsSidebar 
        friends={friends} 
        sessionUser={sessionUser} 
      />
    </div>
  );
}

export default Dashboard;