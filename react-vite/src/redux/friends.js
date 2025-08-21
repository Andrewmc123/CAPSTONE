// frontend/src/redux/friends.js
const GET_FRIENDS = 'friends/GET_FRIENDS';
const GET_PENDING_FRIENDS = 'friends/GET_PENDING_FRIENDS';
const SET_FRIENDS_LOADING = 'friends/SET_LOADING';
const SET_FRIENDS_ERROR = 'friends/SET_ERROR';
const UPDATE_FRIENDS_COUNT = 'friends/UPDATE_FRIENDS_COUNT';

// Action Creators
const loadFriends = (friends) => ({ type: GET_FRIENDS, friends });
const loadPending = (pending) => ({ type: GET_PENDING_FRIENDS, pending });
const setLoading = (loading) => ({ type: SET_FRIENDS_LOADING, loading });
const setError = (error) => ({ type: SET_FRIENDS_ERROR, error });
export const updateFriendsCount = (change) => ({ type: UPDATE_FRIENDS_COUNT, change });

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
    // Try POST method instead of PUT (based on the 405 error)
    const res = await fetch(`/api/friends/accept/${friendId}`, {
      method: 'POST', // Changed from PUT to POST
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await handleResponse(res, 'Failed to accept friend request');
    
    // Update friends count in session state
    dispatch(updateFriendsCount(1));
    
    // Refresh friends and pending lists
    await Promise.all([dispatch(getFriends()), dispatch(getPendingFriends())]);
    
    return { success: true, data };
  } catch (err) {
    dispatch(setError(err.message));
    return { success: false, error: err.message };
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
    return { success: true };
  } catch (err) {
    dispatch(setError(err.message));
    return { success: false, error: err.message };
  } finally {
    dispatch(setLoading(false));
  }
};

export const sendFriendRequest = (friendId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await fetch(`/api/friends/add`, { // Use the correct endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }), // Keep using friendId as parameter
    });
    
    const data = await handleResponse(res, "Could not send friend request");
    
    // If the response contains specific error information, use it
    if (data.error) {
      throw new Error(data.error);
    }
    
    dispatch(getPendingFriends());
    return { success: true };
  } catch (err) {
    dispatch(setError(err.message));
    return { success: false, error: err.message };
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
    
    // Update friends count in session state
    dispatch(updateFriendsCount(-1));
    
    dispatch(getFriends());
    return { success: true };
  } catch (err) {
    dispatch(setError(err.message));
    return { success: false, error: err.message };
  } finally {
    dispatch(setLoading(false));
  }
};

// Thunk to get friends count (optional)
export const getFriendsCount = () => async (dispatch) => {
  try {
    const res = await fetch('/api/friends/count');
    const data = await handleResponse(res, 'Failed to fetch friends count');
    return data.count || 0;
  } catch (err) {
    dispatch(setError(err.message));
    return 0;
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
    case UPDATE_FRIENDS_COUNT:
      // This action is handled by the session reducer, not here
      return state;
    default:
      return state;
  }
}