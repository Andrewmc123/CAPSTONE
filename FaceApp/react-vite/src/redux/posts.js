// src/redux/posts.js
// Action Types
const CREATE_POST = "posts/createPost";
const LOAD_POSTS = "posts/loadPosts";
const LOAD_FRIENDS_POSTS = "posts/LOAD_FRIENDS_POSTS";
const LOAD_USER_POSTS = "posts/LOAD_USER_POSTS";
const DELETE_POST = "posts/deletePost";
const UPDATE_POST = "posts/updatePost";
const GET_COMMENTS = "posts/getComments";
const ADD_COMMENT = "posts/addComment";
const LIKE_POST = "posts/likePost";

// Action Creators
export const createPost = (post) => ({
    type: CREATE_POST,
    post
});

export const updatePost = (post) => ({
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

export const deletePost = (postId) => ({
    type: DELETE_POST,
    postId
});

export const getComments = (postId, comments) => ({
    type: GET_COMMENTS,
    postId,
    comments
});

export const addComment = (postId, comment) => ({
    type: ADD_COMMENT,
    postId,
    comment
});

export const likePost = (post) => ({
    type: LIKE_POST,
    post
});

// Thunks
export const getAllPosts = () => async (dispatch) => {
    const res = await fetch('/api/posts/');
    if (res.ok) {
        const data = await res.json();
        const normalized = Object.fromEntries(data.posts.map(post => [post.id, post]));
        dispatch(loadPosts(normalized));
    }
};

export const getFriendsPosts = () => async (dispatch) => {
    const response = await fetch('/api/posts/friends');
    if (response.ok) {
        const data = await response.json();
        const normalized = Object.fromEntries(data.friends_posts.map(post => [post.id, post]));
        dispatch(loadFriendsPosts(normalized));
    }
};

export const getUserPosts = (userId) => async (dispatch) => {
    const response = await fetch(`/api/posts/user/${userId}`);
    if (response.ok) {
        const data = await response.json();
        const normalized = Object.fromEntries(data.posts.map(post => [post.id, post]));
        dispatch(loadUserPosts(userId, normalized));
    }
};

export const thunkCreatePost = (formData) => async (dispatch) => {
    try {
        const res = await fetch('/api/posts/', {
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

export const getPostComments = (postId) => async (dispatch) => {
    const response = await fetch(`/api/posts/${postId}/comments`);
    if (response.ok) {
        const comments = await response.json();
        dispatch(getComments(postId, comments));
        return comments;
    }
    return null;
};

export const thunkAddComment = (postId, text) => async (dispatch) => {
    const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (response.ok) {
        const comment = await response.json();
        dispatch(addComment(postId, comment));
        return comment;
    }
    return null;
};

export const thunkLikePost = (postId) => async (dispatch) => {
    const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
    });
    if (response.ok) {
        const post = await response.json();
        dispatch(likePost(post));
        return post;
    }
    return null;
};

// Initial State
const initialState = {
    posts: {},
    friendsPosts: {},
    userPosts: {},
    comments: {}
};

// Reducer
export default function postsReducer(state = initialState, action) {
    switch (action.type) {
        case LOAD_POSTS:
            return { ...state, posts: action.posts };
        case LOAD_FRIENDS_POSTS:
            return { ...state, friendsPosts: action.posts };
        case LOAD_USER_POSTS:
            return {
                ...state,
                userPosts: {
                    ...state.userPosts,
                    [action.userId]: action.posts
                }
            };
        case CREATE_POST:
            return { 
                ...state, 
                posts: { ...state.posts, [action.post.id]: action.post } 
            };
        case UPDATE_POST: {
            const newState = { ...state };
            newState.posts = { ...state.posts, [action.post.id]: action.post };
            Object.keys(state.userPosts).forEach(userId => {
                if (state.userPosts[userId][action.post.id]) {
                    newState.userPosts = {
                        ...state.userPosts,
                        [userId]: {
                            ...state.userPosts[userId],
                            [action.post.id]: action.post
                        }
                    };
                }
            });
            return newState;
        }
        case DELETE_POST: {
            const newState = { ...state };
            delete newState.posts[action.postId];
            Object.keys(state.userPosts).forEach(userId => {
                if (state.userPosts[userId][action.postId]) {
                    newState.userPosts = {
                        ...state.userPosts,
                        [userId]: { ...state.userPosts[userId] }
                    };
                    delete newState.userPosts[userId][action.postId];
                }
            });
            return newState;
        }
        case GET_COMMENTS: {
            return {
                ...state,
                comments: {
                    ...state.comments,
                    [action.postId]: action.comments
                }
            };
        }
        case ADD_COMMENT: {
            return {
                ...state,
                comments: {
                    ...state.comments,
                    [action.postId]: [...(state.comments[action.postId] || []), action.comment]
                }
            };
        }
        case LIKE_POST: {
            const newState = { ...state };
            newState.posts = { ...state.posts, [action.post.id]: action.post };
            Object.keys(state.userPosts).forEach(userId => {
                if (state.userPosts[userId][action.post.id]) {
                    newState.userPosts = {
                        ...state.userPosts,
                        [userId]: {
                            ...state.userPosts[userId],
                            [action.post.id]: action.post
                        }
                    };
                }
            });
            return newState;
        }
        default:
            return state;
    }
}