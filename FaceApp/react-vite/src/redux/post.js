// Action Types
const LOAD_POSTS = 'posts/load';
const CREATE_POST = 'posts/create';
const UPDATE_POST = 'posts/update';
const DELETE_POST = 'posts/delete';

// Action Creators
const loadPosts = (posts) => ({
  type: LOAD_POSTS,
  posts,
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

// Thunks
export const getPosts = () => async (dispatch) => {
  try {
    const res = await fetch('/api/posts');
    if (res.ok) {
      const data = await res.json();
      dispatch(loadPosts(data.posts));
    }
  } catch (err) {
    console.error('Error loading posts:', err);
  }
};

export const thunkCreatePost = (formData) => async (dispatch) => {
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      dispatch(createPost(data));
    }
  } catch (err) {
    console.error('Error creating post:', err);
  }
};

export const thunkUpdatePost = (postId, formData) => async (dispatch) => {
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      dispatch(updatePost(data));
    }
  } catch (err) {
    console.error('Error updating post:', err);
  }
};

export const thunkDeletePost = (postId) => async (dispatch) => {
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      dispatch(deletePost(postId));
    }
  } catch (err) {
    console.error('Error deleting post:', err);
  }
};

// Reducer
const initialState = {
  allPosts: {},
};

export default function postReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_POSTS: {
      const newPosts = {};
      action.posts.forEach((post) => {
        newPosts[post.id] = post;
      });
      return { ...state, allPosts: newPosts };
    }

    case CREATE_POST: {
      return {
        ...state,
        allPosts: {
          ...state.allPosts,
          [action.post.id]: action.post,
        },
      };
    }

    case UPDATE_POST: {
      return {
        ...state,
        allPosts: {
          ...state.allPosts,
          [action.post.id]: action.post,
        },
      };
    }

    case DELETE_POST: {
      const newState = {
        ...state,
        allPosts: { ...state.allPosts },
      };
      delete newState.allPosts[action.postId];
      return newState;
    }

    default:
      return state;
  }
}
