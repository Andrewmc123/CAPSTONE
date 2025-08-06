// frontend/src/redux/friends.js

const LOAD_FRIENDS = 'friends/loadFriends';

// This is doing: creating the action to store friends in Redux
const loadFriends = (friends, currentUserId) => ({
  type: LOAD_FRIENDS,
  friends,
  currentUserId
});

// This is doing: fetching friends from backend and dispatching the action
// redux/friends.js
export const getFriends = () => async (dispatch) => {
  const res = await fetch('/api/friends/', {
    method: 'GET',
    credentials: 'include' // ✅ this ensures cookie/session is sent
  });

  if (res.ok) {
    const data = await res.json();
    dispatch(loadFriends(data.accepted));
  }
};


const initialState = {};

// This is doing: reducer logic to process the loaded friends and store them by user ID
const friendsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_FRIENDS: {
      const newState = {};
      action.friends.forEach(friend => {
        // Store both requester and receiver with proper structure
        newState[friend.id] = {
          ...friend,
          requester: friend.requester,
          receiver: friend.receiver,
          status: friend.status
        };
      });
      return newState;
    }
    default:
      return state;
  }
};

export default friendsReducer;
