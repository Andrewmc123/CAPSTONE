const LOAD_POSTS = 'posts/load';
const CREATE_POST = 'posts/create';
const UPDATE_POST = 'posts/update';
const DELETE_POST = 'posts/delete';

const loadPosts = (Posts) => ({
  type: LOAD_POSTS,
  Posts,
});

const createPost = (post) => ({
  type: CREATE_POST,
  post,
});

const updatePost = (post) => ({
  type: UPDATE_POST,
  post,
});

const deletePost = (postId) => ({
  type: DELETE_POST,
  postId,
});

export const getPosts = () => async (dispatch) => {
  try {
    const res = await fetch('/api/posts', {
      credentials: 'include',  // Added this line
    });
    if (!res.ok) throw new Error('Failed to fetch posts');
    const { posts } = await res.json();
    dispatch(loadPosts(posts || []));
  } catch (err) {
    console.error('Error loading posts:', err);
    return { error: err.message };
  }
};

export const thunkCreatePost = (formData) => async (dispatch) => {
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
      credentials: 'include',  // Added this line
    });
    if (!res.ok) throw new Error('Failed to create post');
    const data = await res.json();
    dispatch(createPost(data));
    return data;
  } catch (err) {
    console.error('Error creating post:', err);
    return { error: err.message };
  }
};

export const thunkUpdatePost = (postId, formData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',  // Added this line
    });
    if (!res.ok) throw new Error('Failed to update post');
    const data = await res.json();
    dispatch(updatePost(data));
    return data;
  } catch (err) {
    console.error('Error updating post:', err);
    return { error: err.message };
  }
};

export const thunkDeletePost = (postId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      credentials: 'include',  // Added this line
    });
    if (!res.ok) throw new Error('Failed to delete post');
    dispatch(deletePost(postId));
    return { success: true };
  } catch (err) {
    console.error('Error deleting post:', err);
    return { error: err.message };
  }
};

const initialState = {
  allPosts: {},
  status: 'idle',
  error: null
};

export default function postReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_POSTS: {
      const newPosts = {};
      (action.posts || []).forEach(post => {
        newPosts[post.id] = post;
      });
      return { ...state, allPosts: newPosts, error: null };
    }
    case CREATE_POST: {
      return {
        ...state,
        allPosts: { ...state.allPosts, [action.post.id]: action.post },
        error: null
      };
    }
    case UPDATE_POST: {
      return {
        ...state,
        allPosts: { ...state.allPosts, [action.post.id]: action.post },
        error: null
      };
    }
    case DELETE_POST: {
      const newPosts = { ...state.allPosts };
      delete newPosts[action.postId];
      return { ...state, allPosts: newPosts, error: null };
    }
    default:
      return state;
  }
}
