import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Navigate, useLocation, NavLink } from 'react-router-dom';
import {
  getAllPosts,
  getFriendsPosts,
  thunkLikePost,
  thunkAddComment,
  thunkCreatePost,
  createPost, // for optimistic post
  thunkDeletePost
} from '../../redux/posts';
import { getFriends } from '../../redux/friends';
import FriendsSidebar from '../FriendsSidebar/FriendsSidebar';
import './Dashboard.css';

function Dashboard() {
  const [filterFriendsOnly, setFilterFriendsOnly] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [showComments, setShowComments] = useState({});
  const [postContent, setPostContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCommenting, setIsCommenting] = useState({});
  const [optimisticComments, setOptimisticComments] = useState({});

  const sessionUser = useSelector((state) => state.session.user);
  const dispatch = useDispatch();
  const friendsState = useSelector((state) => state.friends);
  const { loading, error } = useSelector((state) => state.posts);
  const commentInputRefs = useRef({});
  const location = useLocation();

  const allPosts = useSelector((state) => {
    const posts = filterFriendsOnly
      ? Object.values(state.posts.friendsPosts || {})
      : Object.values(state.posts.posts || {});
    return posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  });

  const friends = Object.values(friendsState.friends || {});

  const loadPosts = useCallback(() => {
    if (filterFriendsOnly) {
      dispatch(getFriendsPosts());
    } else {
      dispatch(getAllPosts());
    }
  }, [dispatch, filterFriendsOnly]);

  useEffect(() => {
    if (sessionUser) {
      dispatch(getFriends());
      loadPosts();
    }
  }, [dispatch, sessionUser, loadPosts]);

  useEffect(() => {
    if (location?.state?.scrollToComments) {
      setTimeout(() => {
        const commentsSection = document.querySelector('.comments-section');
        if (commentsSection) commentsSection.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } else if (location?.state?.scrollToComment) {
      setTimeout(() => {
        const commentElement = document.getElementById(
          `comment-${location.state.scrollToComment}`
        );
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth' });
          commentElement.classList.add('highlight-comment');
          setTimeout(() => commentElement.classList.remove('highlight-comment'), 2000);
        }
      }, 500);
    }
  }, [location]);

  const handleLike = async (postId) => {
    try {
      await dispatch(thunkLikePost(postId));
      loadPosts();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCommentSubmit = async (postId) => {
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;

    setIsCommenting((prev) => ({ ...prev, [postId]: true }));

    const tempComment = {
      id: `temp-${Date.now()}`,
      body: commentText,
      user: {
        id: sessionUser.id,
        username: sessionUser.username,
        profile_img: sessionUser.profile_img
      },
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setOptimisticComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), tempComment]
    }));

    try {
      const scrollPosition = window.scrollY;
      await dispatch(thunkAddComment(postId, { body: commentText }));
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));

      setOptimisticComments((prev) => {
        const newState = { ...prev };
        if (newState[postId]) {
          newState[postId] = newState[postId].filter((c) => c.id !== tempComment.id);
          if (newState[postId].length === 0) delete newState[postId];
        }
        return newState;
      });

      loadPosts();
      window.scrollTo(0, scrollPosition);
    } catch (err) {
      console.error('Error adding comment:', err);
      setOptimisticComments((prev) => {
        const newState = { ...prev };
        if (newState[postId]) {
          newState[postId] = newState[postId].filter((c) => c.id !== tempComment.id);
          if (newState[postId].length === 0) delete newState[postId];
        }
        return newState;
      });
    } finally {
      setIsCommenting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete comment');

      setOptimisticComments((prev) => {
        const newState = { ...prev };
        if (newState[postId]) {
          newState[postId] = newState[postId].filter((c) => c.id !== commentId);
          if (newState[postId].length === 0) delete newState[postId];
        }
        return newState;
      });

      loadPosts();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await dispatch(thunkDeletePost(postId));
      loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
    setTimeout(() => {
      if (commentInputRefs.current[postId]) commentInputRefs.current[postId].focus();
    }, 50);
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() && !imageUrl.trim()) return;

    const optimisticPost = {
      id: `temp-${Date.now()}`,
      body: postContent.trim(),
      image_url: imageUrl.trim() || null,
      user: {
        id: sessionUser.id,
        username: sessionUser.username,
        profile_img: sessionUser.profile_img
      },
      created_at: new Date().toISOString(),
      like_count: 0,
      comment_count: 0,
      liked_by_user: false,
      comments: [],
      isOptimistic: true
    };

    try {
      dispatch(createPost(optimisticPost));

      const payload = {
        body: postContent.trim() || null,
        image_url: imageUrl.trim() || null
      };

      await dispatch(thunkCreatePost(payload, false));

      setPostContent('');
      setImageUrl('');
      loadPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      loadPosts();
      alert(`Failed to create post: ${err.message || 'Unknown error'}`);
    }
  };

  const getCombinedComments = (post) => {
    const realComments = Array.isArray(post.comments) ? post.comments : [];
    const optimistic = optimisticComments[post.id] || [];
    return [...optimistic, ...realComments].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
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

  const autoSize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    const max = 120;
    el.style.height = Math.min(el.scrollHeight, max) + 'px';
  };

  const PostList = () => {
    if (loading && allPosts.length === 0) return <div className="loading-spinner">Loading posts...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!allPosts || allPosts.length === 0) {
      return (
        <div className="no-posts">
          {filterFriendsOnly
            ? "Your friends haven't posted anything yet"
            : 'No posts to display. Be the first to post!'}
        </div>
      );
    }

    return (
      <div className="posts-column">
        {allPosts.map((post) => (
          <div key={post.id} className={`instagram-post ${post.isOptimistic ? 'optimistic-post' : ''}`}>
            <div className="post-header">
              <div className="post-user">
                <div className="post-avatar">
                  {post.user?.profile_img ? (
                    <img
                      src={post.user.profile_img}
                      alt={post.user.username}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="avatar-fallback"
                    style={{ display: post.user?.profile_img ? 'none' : 'flex' }}
                  >
                    {post.user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
                <NavLink to={`/profile/${post.user.id}`} className="clickable-username">
                  {post.user?.username || 'Unknown'}
                </NavLink>
              </div>
              <div>
                <span className="post-time">{formatPostTime(post.created_at)}</span>
                {post.user?.id === sessionUser.id && !post.isOptimistic && (
                  <button className="delete-post-btn" onClick={() => handleDeletePost(post.id)} disabled={loading}>
                    {loading ? '...' : '🗑️'}
                  </button>
                )}
                {post.isOptimistic && <span className="post-time">Posting...</span>}
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
                <i className="icon-heart">{post.liked_by_user ? '❤️' : '♡'}</i>
              </button>
              <button className="post-action-btn" onClick={() => toggleComments(post.id)} disabled={loading}>
                <i className="icon-comment">🗨</i>
              </button>
              <button className="post-action-btn" disabled={loading}>
                <i className="icon-share">↗</i>
              </button>
            </div>

            <div className="post-caption">
              <NavLink to={`/profile/${post.user.id}`} className="caption-username clickable-username">
                {post.user?.username || ''}
              </NavLink>
              <span className="caption-text">{post.body}</span>
            </div>

            {showComments[post.id] && (
              <div className="comments-section" style={{ overflowAnchor: 'none' }}>
                {getCombinedComments(post).map(
                  (comment) =>
                    comment && (
                      <div
                        key={comment.id || `temp-${Math.random()}`}
                        id={`comment-${comment.id}`}
                        className={`comment ${comment.isOptimistic ? 'optimistic-comment' : ''}`}
                      >
                        <NavLink to={`/profile/${comment.user.id}`} className="comment-username clickable-username">
                          {comment.user?.username || sessionUser.username}
                        </NavLink>
                        <span className="comment-text">{comment.body}</span>
                        {comment.user?.id === sessionUser.id && (
                          <button
                            className="delete-comment-btn"
                            onClick={() => handleDeleteComment(post.id, comment.id)}
                            disabled={loading}
                          >
                            {loading ? '...' : '✕'}
                          </button>
                        )}
                      </div>
                    )
                )}
                <div className="add-comment">
                  <textarea
                    ref={(el) => (commentInputRefs.current[post.id] = el)}
                    placeholder="Add a comment..."
                    value={commentTexts[post.id] || ''}
                    onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onInput={(e) => autoSize(e.target)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit(post.id);
                      }
                    }}
                    maxLength={250}
                    disabled={loading}
                    rows={1}
                    className="comment-textarea"
                    style={{ resize: 'none', overflowY: 'auto', lineHeight: '1.25rem' }}
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

            <div className="post-comments" onClick={() => toggleComments(post.id)}>
              {post.comments?.length ? `View all ${post.comments.length} comments` : 'View comments'}
            </div>
            <div className="post-time-full">Posted {formatPostTime(post.created_at)}</div>
          </div>
        ))}
      </div>
    );
  };

  if (!sessionUser) return <Navigate to="/" replace={true} />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header-container">
          <div className="dashboard-header">
            <h1>
              Welcome back, <span className="username-glow">{sessionUser.firstname}</span>
            </h1>
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
          <input
            type="url"
            placeholder="Optional image URL (https://...)"
            className="post-imageurl-input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={loading}
          />
          <button
            className="post-submit-btn"
            onClick={handlePostSubmit}
            disabled={loading || (!postContent.trim() && !imageUrl.trim())}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>

        <PostList />
      </div>

      <FriendsSidebar friends={friends} />
    </div>
  );
}

export default Dashboard;
