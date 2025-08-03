const LOAD_POSTS = 'posts/load';

const loadPosts = (posts) => ({
  type: LOAD_POSTS,
  posts
});

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

const initialState = {
  allPosts: {}
};

export default function postReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_POSTS: {
      const newPosts = {};
      action.posts.forEach(post => {
        newPosts[post.id] = post;
      });
      return { ...state, allPosts: newPosts };
    }
    default:
      return state;
  }
}
