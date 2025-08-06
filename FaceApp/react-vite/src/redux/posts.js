const CREATE_POST = "posts/createPost";
const LOAD_POSTS = "posts/loadPosts"; 
const DELETE_POST = "posts/deletePost";
const UPDATE_POST = "posts/updatePost"; 

const createPost = (post) => ({
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

const deletePost = (postId) => ({
    type: DELETE_POST,
    postId
});

export const getAllPosts = () => async (dispatch) => {
  const res = await fetch('/api/posts'); 
  if (res.ok) {
    const data = await res.json();
    const normalized = Object.fromEntries(data.posts.map(post => [post.id, post]));
    dispatch(loadPosts(normalized));
  } else if (res.status < 500) {
    const errorMessages = await res.json(); 
    return errorMessages; 
  } else {
    return { server: "Something went wrong. Please try again" };
  }
};

export const thunkCreatePost = (formData) => async (dispatch) => {
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(formData),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
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
      body: JSON.stringify(formData),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
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
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete post');
    dispatch(deletePost(postId));
    return { success: true };
  } catch (err) {
    console.error('Error deleting post:', err);
    return { error: err.message };
  }
};

export const getFriendsPosts = () => async (dispatch) => {
  const response = await fetch('/api/posts/friends');
  if (response.ok) {
    const data = await response.json();
    const normalized = Object.fromEntries(data.posts.map(post => [post.id, post]));
    dispatch(loadPosts(normalized));
  } else {
    console.error('Failed to load friends posts');
  }
};

const initialState = {}; 

const postsReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOAD_POSTS: {
            // Replace all posts in state with the new normalized object
            return { ...action.posts };
        }
        case CREATE_POST: {
            return { ...state, [action.post.id]: action.post };
        }
        case UPDATE_POST: {
            return { ...state, [action.post.id]: action.post };
        }
        case DELETE_POST: {
            const newState = { ...state };
            delete newState[action.postId];
            return newState;
        }
        default:
            return state;
    }
}

export default postsReducer;
