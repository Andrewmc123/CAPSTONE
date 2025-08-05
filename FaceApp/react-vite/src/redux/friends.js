// Action Types
const GET_FRIENDS = 'friends/GET_FRIENDS';
const GET_PENDING_FRIENDS = 'friends/GET_PENDING_FRIENDS';
const SET_STATUS = 'friends/SET_STATUS';

// Action Creators
const loadFriends = (friends) => ({ 
  type: GET_FRIENDS, 
  payload: friends 
});

const loadPending = (pending) => ({ 
  type: GET_PENDING_FRIENDS, 
  payload: pending 
});

const setStatus = (status) => ({
  type: SET_STATUS,
  payload: status
});

// Thunks
export const fetchFriends = () => async (dispatch) => {
  dispatch(setStatus('loading'));
  try {
    const res = await fetch('/api/friends/');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch friends');
    }
    const data = await res.json();
    dispatch(loadFriends(data.friends));
    dispatch(setStatus('succeeded'));
    return data.friends;
  } catch (err) {
    dispatch(setStatus('failed'));
    return { error: err.message };
  }
};

// Add this alias export
export const getFriends = fetchFriends;

export const fetchPendingFriends = () => async (dispatch) => {
  dispatch(setStatus('loading'));
  try {
    const res = await fetch('/api/friends/pending');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch pending friends');
    }
    const data = await res.json();
    dispatch(loadPending(data.pending));
    dispatch(setStatus('succeeded'));
    return data.pending;
  } catch (err) {
    dispatch(setStatus('failed'));
    return { error: err.message };
  }
};

export const acceptFriend = (friendId) => async (dispatch) => {
  dispatch(setStatus('loading'));
  try {
    const res = await fetch(`/api/friends/accept/${friendId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to accept friend request');
    }
    
    await dispatch(fetchPendingFriends());
    await dispatch(fetchFriends());
    dispatch(setStatus('succeeded'));
    return true;
  } catch (err) {
    dispatch(setStatus('failed'));
    return { error: err.message };
  }
};

export const declineFriend = (friendId) => async (dispatch) => {
  dispatch(setStatus('loading'));
  try {
    const res = await fetch(`/api/friends/decline/${friendId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to decline friend request');
    }
    
    await dispatch(fetchPendingFriends());
    dispatch(setStatus('succeeded'));
    return true;
  } catch (err) {
    dispatch(setStatus('failed'));
    return { error: err.message };
  }
};

export const sendFriendRequest = (friendId) => async (dispatch) => {
  dispatch(setStatus('loading'));
  try {
    const res = await fetch('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send friend request');
    }
    
    await dispatch(fetchPendingFriends());
    dispatch(setStatus('succeeded'));
    return true;
  } catch (err) {
    dispatch(setStatus('failed'));
    return { error: err.message };
  }
};

export const removeFriend = (friendId) => async (dispatch) => {
  dispatch(setStatus('loading'));
  try {
    const res = await fetch(`/api/friends/delete/${friendId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to remove friend');
    }
    
    await dispatch(fetchFriends());
    dispatch(setStatus('succeeded'));
    return true;
  } catch (err) {
    dispatch(setStatus('failed'));
    return { error: err.message };
  }
};

// Initial State
const initialState = {
  allFriends: {},  // Changed from 'friends' to match component expectations
  pending: {},
  status: 'idle',
  error: null
};

// Reducer
export default function friendsReducer(state = initialState, action) {
  switch (action.type) {
    case GET_FRIENDS: {
      const friendsNormalized = {};
      action.payload.forEach(friend => {
        friendsNormalized[friend.id] = friend;
      });
      return {
        ...state,
        allFriends: friendsNormalized,
        error: null
      };
    }

    case GET_PENDING_FRIENDS: {
      const pendingNormalized = {};
      action.payload.forEach(friend => {
        pendingNormalized[friend.id] = friend;
      });
      return {
        ...state,
        pending: pendingNormalized,
        error: null
      };
    }

    case SET_STATUS: {
      return {
        ...state,
        status: action.payload,
        error: action.payload === 'failed' ? state.error : null
      };
    }

    default:
      return state;
  }
}