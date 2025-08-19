// frontend/src/redux/friends.js
const GET_FRIENDS = 'friends/GET_FRIENDS';
const GET_PENDING_FRIENDS = 'friends/GET_PENDING_FRIENDS';
const SET_FRIENDS_LOADING = 'friends/SET_LOADING';
const SET_FRIENDS_ERROR = 'friends/SET_ERROR';

// Action Creators
const loadFriends = (friends) => ({ type: GET_FRIENDS, friends });
const loadPending = (pending) => ({ type: GET_PENDING_FRIENDS, pending });
const setLoading = (loading) => ({ type: SET_FRIENDS_LOADING, loading });
const setError = (error) => ({ type: SET_FRIENDS_ERROR, error });

// Helper function to handle fetch errors safely
const handleResponse = async (res, errorMessage) => {
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data.message || errorMessage);
  return data;
};

// Thunks
export const getFriends = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch('/api/friends/');
    const data = await handleResponse(res, 'Failed to fetch friends');
    dispatch(loadFriends(data.friends || []));
  } catch (err) {
    dispatch(setError(err.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const getPendingFriends = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch('/api/friends/pending');
    const data = await handleResponse(res, 'Failed to fetch pending requests');
    dispatch(loadPending(data.pending || []));
  } catch (err) {
    dispatch(setError(err.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const acceptFriendRequest = (friendId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/friends/accept/${friendId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    await handleResponse(res, 'Failed to accept friend request');
    await Promise.all([dispatch(getFriends()), dispatch(getPendingFriends())]);
    return true;
  } catch (err) {
    dispatch(setError(err.message));
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

export const declineFriendRequest = (friendId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/friends/decline/${friendId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    await handleResponse(res, 'Failed to decline friend request');
    dispatch(getPendingFriends());
    return true;
  } catch (err) {
    dispatch(setError(err.message));
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

export const sendFriendRequest = (friendId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/friends/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    await handleResponse(res, "Could not send friend request");
    dispatch(getPendingFriends());
    return true;
  } catch (err) {
    dispatch(setError(err.message));
    return err.message;
  } finally {
    dispatch(setLoading(false));
  }
};

export const removeFriend = (friendId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/friends/delete/${friendId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    await handleResponse(res, "Could not remove friend");
    dispatch(getFriends());
    return true;
  } catch (err) {
    dispatch(setError(err.message));
    return err.message;
  } finally {
    dispatch(setLoading(false));
  }
};

const initialState = {
  friends: {},
  pending: {},
  loading: false,
  error: null
};

export default function friendsReducer(state = initialState, action) {
  switch (action.type) {
    case GET_FRIENDS:
      return {
        ...state,
        friends: action.friends.reduce((acc, friend) => {
          acc[friend.id] = friend;
          return acc;
        }, {}),
        error: null
      };
    case GET_PENDING_FRIENDS:
      return {
        ...state,
        pending: action.pending.reduce((acc, pending) => {
          acc[pending.id] = pending;
          return acc;
        }, {}),
        error: null
      };
    case SET_FRIENDS_LOADING:
      return { ...state, loading: action.loading };
    case SET_FRIENDS_ERROR:
      return { ...state, error: action.error };
    default:
      return state;
  }
}
