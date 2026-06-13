// ============================================================
// Follows slice — TikTok-style follower graph.
// ============================================================

const SET_MY_FOLLOWS = "follows/setMyFollows";
const SET_FOLLOWING_STATE = "follows/setFollowingState";
const SET_USER_LISTS = "follows/setUserLists";
const SET_SUGGESTIONS = "follows/setSuggestions";
const CLEAR_FOLLOWS = "follows/clear";

const setMyFollows = (followingIds, followerIds) => ({
  type: SET_MY_FOLLOWS, followingIds, followerIds,
});
const setFollowingState = (userId, following) => ({
  type: SET_FOLLOWING_STATE, userId, following,
});
const setUserLists = (userId, followers, following) => ({
  type: SET_USER_LISTS, userId, followers, following,
});
const setSuggestions = (users) => ({ type: SET_SUGGESTIONS, users });
export const clearFollows = () => ({ type: CLEAR_FOLLOWS });

// ---------- Thunks ----------
export const fetchMyFollows = () => async (dispatch) => {
  const res = await fetch("/api/follows/me", { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(setMyFollows(data.following_ids, data.follower_ids));
    return data;
  }
  return null;
};

export const thunkToggleFollow = (userId, currentlyFollowing) => async (dispatch) => {
  dispatch(setFollowingState(userId, !currentlyFollowing)); // optimistic
  const res = await fetch(`/api/follows/${userId}`, {
    method: currentlyFollowing ? "DELETE" : "POST",
    credentials: "include",
  });
  if (!res.ok) {
    dispatch(setFollowingState(userId, currentlyFollowing)); // revert
    return null;
  }
  return res.json();
};

export const fetchUserFollowLists = (userId) => async (dispatch) => {
  const [fRes, gRes] = await Promise.all([
    fetch(`/api/follows/${userId}/followers`, { credentials: "include" }),
    fetch(`/api/follows/${userId}/following`, { credentials: "include" }),
  ]);
  if (fRes.ok && gRes.ok) {
    const followers = (await fRes.json()).followers;
    const following = (await gRes.json()).following;
    dispatch(setUserLists(userId, followers, following));
    return { followers, following };
  }
  return null;
};

export const fetchSuggestions = (limit = 6) => async (dispatch) => {
  const res = await fetch(`/api/follows/suggestions?limit=${limit}`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(setSuggestions(data.suggestions));
    return data.suggestions;
  }
  return [];
};

// ---------- Selectors ----------
export const selectIsFollowing = (userId) => (state) =>
  state.follows.followingIds.includes(userId);

// ---------- Reducer ----------
const initialState = {
  followingIds: [],
  followerIds: [],
  byUser: {},
  suggestions: [],
};

export default function followsReducer(state = initialState, action) {
  switch (action.type) {
    case SET_MY_FOLLOWS:
      return { ...state, followingIds: action.followingIds, followerIds: action.followerIds };
    case SET_FOLLOWING_STATE: {
      const has = state.followingIds.includes(action.userId);
      let followingIds = state.followingIds;
      if (action.following && !has) followingIds = [...followingIds, action.userId];
      if (!action.following && has) followingIds = followingIds.filter((id) => id !== action.userId);
      return { ...state, followingIds };
    }
    case SET_USER_LISTS:
      return {
        ...state,
        byUser: {
          ...state.byUser,
          [action.userId]: { followers: action.followers, following: action.following },
        },
      };
    case SET_SUGGESTIONS:
      return { ...state, suggestions: action.users };
    case CLEAR_FOLLOWS:
      return initialState;
    default:
      return state;
  }
}
