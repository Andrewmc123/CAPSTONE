// frontend/src/redux/friends.js

const GET_FRIENDS = 'friends/GET_FRIENDS';
const GET_PENDING_FRIENDS = 'friends/GET_PENDING_FRIENDS';

const loadFriends = (friends) => ({ 
    type: GET_FRIENDS, 
    friends 
});

const loadPending = (pending) => ({ 
    type: GET_PENDING_FRIENDS, 
    pending 
});

// Get All Friends
export const getFriends = () => async (dispatch) => {
  const res = await fetch('/api/friends/');
  if (res.ok) {
    const data = await res.json();
    dispatch(loadFriends(data.friends));
  }
};

// Get All Pending Friends
export const getPendingFriends = () => async (dispatch) => {
  const res = await fetch('/api/friends/pending');
  if (res.ok) {
    const data = await res.json();
    dispatch(loadPending(data.pending));
  }
};

// Accept a Pending Friend Request
export const acceptFriendRequest = (friendId) => async (dispatch) => {
  const res = await fetch(`/api/friends/accept/${friendId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  });

  if (res.ok) {
    dispatch(getPendingFriends());
    dispatch(getFriends());
    return true;
  }
  return false;
};

// Decline a Pending Friend Request
export const declineFriendRequest = (friendId) => async (dispatch) => {
  const res = await fetch(`/api/friends/decline/${friendId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });

  if (res.ok) {
    dispatch(getPendingFriends());
    return true;
  }
  return false;
};

// Add a Friend
export const sendFriendRequest = (friendId) => async (dispatch) => {
  const res = await fetch(`/api/friends/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friendId }),
  });

  if (res.ok) {
    dispatch(getPendingFriends());
    return true;
  } else {
    const data = await res.json();
    return data.message || "Could not send request";
  }
};

// Remove a Friend
export const removeFriend = (friendId) => async (dispatch) => {
  const res = await fetch(`/api/friends/delete/${friendId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    dispatch(getFriends());
    return true;
  } else {
    const data = await res.json();
    return data.message || "Could not remove friend";
  }
};

const initialState = {
  friends: {},
  pending: {}
};

export default function friendsReducer(state = initialState, action) {
  switch (action.type) {
    case GET_FRIENDS: {
      const newFriends = {};
      action.friends.forEach((friend) => {
        newFriends[friend.id] = friend;
      });
      return { ...state, friends: newFriends };
    }

    case GET_PENDING_FRIENDS: {
      const newPending = {};
      action.pending.forEach((friend) => {
        newPending[friend.id] = friend;
      });
      return { ...state, pending: newPending };
    }

    default:
      return state;
  }
}