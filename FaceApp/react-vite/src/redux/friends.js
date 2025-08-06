// frontend/src/redux/friends.js

const LOAD_FRIENDS = 'friends/loadFriends';

// This is doing: creating the action to store friends in Redux
const loadFriends = (friends, currentUserId) => ({
  type: LOAD_FRIENDS,
  friends,
  currentUserId
});

// This is doing: fetching friends from backend and dispatching the action
export const getFriends = (currentUserId) => async (dispatch) => {
  const res = await fetch('/api/friends/');
  if (res.ok) {
    const data = await res.json();
    dispatch(loadFriends(data.accepted, currentUserId));
  }
};

const initialState = {};

// This is doing: reducer logic to process the loaded friends and store them by user ID
const friendsReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_FRIENDS: {
      const newState = {};

      action.friends.forEach(friend => {
        const { requester, receiver } = friend;

        // This is doing: identifying the "other" user in the friendship
        const otherUser =
          requester.id === action.currentUserId ? receiver : requester;

        newState[otherUser.id] = {
          ...otherUser,
          isOnline: Math.random() > 0.5 // simulate online status
        };
      });

      return newState;
    }
    default:
      return state;
  }
};

export default friendsReducer;
