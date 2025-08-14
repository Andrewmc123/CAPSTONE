// src/redux/posts.js
// Action Types
const CREATE_POST = "posts/createPost";
const LOAD_POSTS = "posts/loadPosts";
const LOAD_FRIENDS_POSTS = "posts/loadFriendsPosts";
const LOAD_USER_POSTS = "posts/loadUserPosts";
const DELETE_POST = "posts/deletePost";
const UPDATE_POST = "posts/updatePost";
const GET_COMMENTS = "posts/getComments";
const ADD_COMMENT = "posts/addComment";
const LIKE_POST = "posts/likePost";
const SET_LOADING = "posts/setLoading";
const SET_ERROR = "posts/setError";

// Action Creators
const setLoading = (loading) => ({
  type: SET_LOADING,
  loading
});

const setError = (error) => ({
  type: SET_ERROR,
  error
});

export const createPost = (post) => ({
  type: CREATE_POST,
  post
});

const updatePost = (post) => ({
  type: UPDATE_POST,
  post
});

const loadPosts = (posts) => ({
  type: LOAD_POSTS,
  posts
});

const loadFriendsPosts = (posts) => ({
  type: LOAD_FRIENDS_POSTS,
  posts
});

const loadUserPosts = (userId, posts) => ({
  type: LOAD_USER_POSTS,
  userId,
  posts
});

const deletePost = (postId) => ({
  type: DELETE_POST,
  postId
});

const getComments = (postId, comments) => ({
  type: GET_COMMENTS,
  postId,
  comments
});

const addComment = (postId, comment) => ({
  type: ADD_COMMENT,
  postId,
  comment
});

const likePost = (post) => ({
  type: LIKE_POST,
  post
});

// Helper function for normalizing posts
const normalizePosts = (postsArray) => {
  return postsArray.reduce((acc, post) => {
    acc[post.id] = post;
    return acc;
  }, {});
};

// Thunks
export const getAllPosts = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch('/api/posts/', {
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch posts');
    }

    const { posts } = await res.json();
    const normalized = normalizePosts(posts);
    dispatch(loadPosts(normalized));
    return normalized;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getFriendsPosts = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch('/api/posts/friends', {
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch friends posts');
    }

    const { posts } = await res.json();
    const normalized = normalizePosts(posts);
    dispatch(loadFriendsPosts(normalized));
    return normalized;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getUserPosts = (userId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/posts/user/${userId}`, {
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || `Failed to fetch user ${userId} posts`);
    }

    const { posts } = await res.json();
    const normalized = normalizePosts(posts);
    dispatch(loadUserPosts(userId, normalized));
    return normalized;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const thunkCreatePost = (postData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch('/api/posts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create post');
    }

    const post = await res.json();
    dispatch(createPost(post));
    
    // Refresh the appropriate post list
    if (postData.friendsOnly) {
      await dispatch(getFriendsPosts());
    } else {
      await dispatch(getAllPosts());
    }
    
    return post;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const thunkUpdatePost = (postId, postData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update post');
    }

    const post = await res.json();
    dispatch(updatePost(post));
    return post;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const thunkDeletePost = (postId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete post');
    }

    dispatch(deletePost(postId));
    return { success: true };
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const getPostComments = (postId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch comments');
    }

    const { comments } = await res.json();
    dispatch(getComments(postId, comments));
    return comments;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const thunkAddComment = (postId, commentData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to add comment');
    }

    const comment = await res.json();
    dispatch(addComment(postId, comment));
    return comment;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const thunkLikePost = (postId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to like post');
    }

    const post = await res.json();
    dispatch(likePost(post));
    return post;
  } catch (err) {
    dispatch(setError(err.message));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

// Initial State
const initialState = {
  posts: {},
  friendsPosts: {},
  userPosts: {},
  comments: {},
  loading: false,
  error: null
};

// Reducer
export default function postsReducer(state = initialState, action) {
  switch (action.type) {
    case SET_LOADING:
      return { ...state, loading: action.loading };
    case SET_ERROR:
      return { ...state, error: action.error };
    case LOAD_POSTS:
      return { ...state, posts: action.posts, error: null };
    case LOAD_FRIENDS_POSTS:
      return { ...state, friendsPosts: action.posts, error: null };
    case LOAD_USER_POSTS:
      return {
        ...state,
        userPosts: {
          ...state.userPosts,
          [action.userId]: action.posts
        },
        error: null
      };
    case CREATE_POST:
      return {
        ...state,
        posts: { ...state.posts, [action.post.id]: action.post },
        error: null
      };
    case UPDATE_POST:
      return {
        ...state,
        posts: { ...state.posts, [action.post.id]: action.post },
        userPosts: {
          ...state.userPosts,
          [action.post.user_id]: {
            ...state.userPosts[action.post.user_id],
            [action.post.id]: action.post
          }
        },
        error: null
      };
     case DELETE_POST: {
      const newState = { ...state, error: null };
        newState.posts = Object.fromEntries(
        Object.entries(newState.posts).filter(([id]) => id !== action.postId)
      );
      
    newState.userPosts = Object.fromEntries(
    Object.entries(newState.userPosts).map(([userId, posts]) => [
      userId,
      Object.fromEntries(
        Object.entries(posts).filter(([id]) => id !== action.postId)
      )
    ])
  );
  
  return newState;
}
    case GET_COMMENTS:
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.postId]: action.comments
        },
        error: null
      };
    case ADD_COMMENT:
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.postId]: [...(state.comments[action.postId] || []), action.comment]
        },
        error: null
      };
    case LIKE_POST:
      return {
        ...state,
        posts: { ...state.posts, [action.post.id]: action.post },
        userPosts: {
          ...state.userPosts,
          [action.post.user_id]: {
            ...state.userPosts[action.post.user_id],
            [action.post.id]: action.post
          }
        },
        error: null
      };
    default:
      return state;
  }
}