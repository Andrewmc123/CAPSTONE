// ============================================================
// Posts slice — the ABLN video engine.
// Normalized posts + per-tab feed lists with pagination,
// profile/explore/bookmark collections, optimistic likes.
// ============================================================

// Action Types
const UPSERT_POSTS = "posts/upsertPosts";
const SET_FEED_PAGE = "posts/setFeedPage";
const RESET_FEED = "posts/resetFeed";
const SET_FEED_LOADING = "posts/setFeedLoading";
const SET_COLLECTION = "posts/setCollection";
const UPDATE_POST = "posts/updatePost";
const REMOVE_POST = "posts/removePost";
const BUMP_COMMENT_COUNT = "posts/bumpCommentCount";

// ---------- Action creators ----------
export const upsertPosts = (posts) => ({ type: UPSERT_POSTS, posts });
export const updatePost = (post) => ({ type: UPDATE_POST, post });
const setFeedPage = (tab, ids, page, hasMore) => ({ type: SET_FEED_PAGE, tab, ids, page, hasMore });
export const resetFeed = (tab) => ({ type: RESET_FEED, tab });
const setFeedLoading = (tab, loading) => ({ type: SET_FEED_LOADING, tab, loading });
const setCollection = (key, ids) => ({ type: SET_COLLECTION, key, ids });
const removePost = (postId) => ({ type: REMOVE_POST, postId });
export const bumpCommentCount = (postId, delta) => ({ type: BUMP_COMMENT_COUNT, postId, delta });

// ---------- Thunks ----------
export const fetchFeedPage = (tab = "foryou", page = 1) => async (dispatch) => {
  dispatch(setFeedLoading(tab, true));
  try {
    const res = await fetch(`/api/posts/feed?tab=${tab}&page=${page}&per_page=8`, {
      credentials: "include",
    });
    if (!res.ok) {
      dispatch(setFeedLoading(tab, false));
      return { error: res.status };
    }
    const data = await res.json();
    dispatch(upsertPosts(data.posts));
    dispatch(setFeedPage(tab, data.posts.map((p) => p.id), data.page, data.has_more));
    return data;
  } catch (e) {
    dispatch(setFeedLoading(tab, false));
    return { error: String(e) };
  }
};

export const fetchSinglePost = (postId) => async (dispatch) => {
  const res = await fetch(`/api/posts/${postId}`, { credentials: "include" });
  if (res.ok) {
    const post = await res.json();
    dispatch(upsertPosts([post]));
    return post;
  }
  return null;
};

export const fetchUserVideos = (userId) => async (dispatch) => {
  const res = await fetch(`/api/posts/user/${userId}`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(upsertPosts(data.posts));
    dispatch(setCollection(`user:${userId}`, data.posts.map((p) => p.id)));
    return data.posts;
  }
  return [];
};

export const fetchLikedVideos = (userId) => async (dispatch) => {
  const res = await fetch(`/api/posts/liked/${userId}`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(upsertPosts(data.posts));
    dispatch(setCollection(`liked:${userId}`, data.posts.map((p) => p.id)));
    return data.posts;
  }
  return [];
};

export const fetchBookmarkedVideos = () => async (dispatch) => {
  const res = await fetch(`/api/bookmarks/`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(upsertPosts(data.posts));
    dispatch(setCollection("bookmarked", data.posts.map((p) => p.id)));
    return data.posts;
  }
  return [];
};

export const fetchExplore = (category = "all") => async (dispatch) => {
  const res = await fetch(`/api/discover/videos?category=${category}`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(upsertPosts(data.posts));
    dispatch(setCollection(`explore:${category}`, data.posts.map((p) => p.id)));
    return data;
  }
  return null;
};

export const fetchHashtagVideos = (tag) => async (dispatch) => {
  const res = await fetch(`/api/discover/hashtag/${encodeURIComponent(tag)}`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(upsertPosts(data.posts));
    dispatch(setCollection(`tag:${tag.toLowerCase()}`, data.posts.map((p) => p.id)));
    return data;
  }
  return null;
};

export const thunkCreatePost = (payload) => async (dispatch) => {
  const res = await fetch("/api/posts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const post = await res.json();
    dispatch(upsertPosts([post]));
    return { post };
  }
  const err = await res.json().catch(() => ({}));
  return { error: err.error || "Could not create post" };
};

export const thunkDeletePost = (postId) => async (dispatch) => {
  const res = await fetch(`/api/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    dispatch(removePost(postId));
    return true;
  }
  return false;
};

// Optimistic like toggle with server reconciliation
export const thunkToggleLike = (post) => async (dispatch) => {
  dispatch(updatePost({
    ...post,
    liked: !post.liked,
    like_count: post.like_count + (post.liked ? -1 : 1),
  }));
  const res = await fetch(`/api/posts/${post.id}/like`, {
    method: "POST",
    credentials: "include",
  });
  if (res.ok) {
    const fresh = await res.json();
    dispatch(updatePost(fresh));
    return fresh;
  }
  dispatch(updatePost(post)); // revert
  return null;
};

export const thunkToggleBookmark = (post) => async (dispatch) => {
  const adding = !post.bookmarked;
  dispatch(updatePost({
    ...post,
    bookmarked: adding,
    bookmark_count: post.bookmark_count + (adding ? 1 : -1),
  }));
  const res = await fetch(`/api/bookmarks/${post.id}`, {
    method: adding ? "POST" : "DELETE",
    credentials: "include",
  });
  if (!res.ok) dispatch(updatePost(post)); // revert
  return res.ok;
};

export const thunkAddView = (postId) => async (dispatch) => {
  const res = await fetch(`/api/posts/${postId}/view`, {
    method: "POST",
    credentials: "include",
  });
  if (res.ok) {
    const data = await res.json();
    dispatch({ type: UPDATE_POST, post: { id: data.id, views: data.views } });
  }
};

export const thunkAddShare = (postId) => async (dispatch) => {
  const res = await fetch(`/api/posts/${postId}/share`, {
    method: "POST",
    credentials: "include",
  });
  if (res.ok) {
    const data = await res.json();
    dispatch({ type: UPDATE_POST, post: { id: data.id, shares: data.shares } });
  }
};

// ---------- Selectors ----------
export const selectFeed = (tab) => (state) => state.posts.feeds[tab] || EMPTY_FEED;
export const selectFeedPosts = (tab) => (state) => {
  const feed = state.posts.feeds[tab] || EMPTY_FEED;
  return feed.ids.map((id) => state.posts.byId[id]).filter(Boolean);
};
export const selectCollection = (key) => (state) => {
  const ids = state.posts.collections[key] || [];
  return ids.map((id) => state.posts.byId[id]).filter(Boolean);
};

// ---------- Reducer ----------
const EMPTY_FEED = { ids: [], page: 0, hasMore: true, loading: false };

const initialState = {
  byId: {},
  feeds: {
    foryou: { ...EMPTY_FEED },
    following: { ...EMPTY_FEED },
    friends: { ...EMPTY_FEED },
  },
  collections: {},
};

export default function postsReducer(state = initialState, action) {
  switch (action.type) {
    case UPSERT_POSTS: {
      const byId = { ...state.byId };
      for (const post of action.posts) {
        byId[post.id] = { ...byId[post.id], ...post };
      }
      return { ...state, byId };
    }
    case UPDATE_POST: {
      const existing = state.byId[action.post.id] || {};
      return {
        ...state,
        byId: { ...state.byId, [action.post.id]: { ...existing, ...action.post } },
      };
    }
    case BUMP_COMMENT_COUNT: {
      const post = state.byId[action.postId];
      if (!post) return state;
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.postId]: {
            ...post,
            comment_count: Math.max(0, (post.comment_count || 0) + action.delta),
          },
        },
      };
    }
    case SET_FEED_PAGE: {
      const feed = state.feeds[action.tab] || EMPTY_FEED;
      const merged = action.page === 1
        ? action.ids
        : [...feed.ids, ...action.ids.filter((id) => !feed.ids.includes(id))];
      return {
        ...state,
        feeds: {
          ...state.feeds,
          [action.tab]: { ids: merged, page: action.page, hasMore: action.hasMore, loading: false },
        },
      };
    }
    case SET_FEED_LOADING: {
      const feed = state.feeds[action.tab] || EMPTY_FEED;
      return {
        ...state,
        feeds: { ...state.feeds, [action.tab]: { ...feed, loading: action.loading } },
      };
    }
    case RESET_FEED:
      return {
        ...state,
        feeds: { ...state.feeds, [action.tab]: { ...EMPTY_FEED } },
      };
    case SET_COLLECTION:
      return {
        ...state,
        collections: { ...state.collections, [action.key]: action.ids },
      };
    case REMOVE_POST: {
      const byId = { ...state.byId };
      delete byId[action.postId];
      const feeds = {};
      for (const [tab, feed] of Object.entries(state.feeds)) {
        feeds[tab] = { ...feed, ids: feed.ids.filter((id) => id !== action.postId) };
      }
      const collections = {};
      for (const [key, ids] of Object.entries(state.collections)) {
        collections[key] = ids.filter((id) => id !== action.postId);
      }
      return { ...state, byId, feeds, collections };
    }
    default:
      return state;
  }
}
