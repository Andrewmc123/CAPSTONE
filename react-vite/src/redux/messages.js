// ============================================================
// Messages slice — TikTok-style 1:1 direct messages (DMs).
// ============================================================

const SET_CONVERSATIONS = "messages/setConversations";
const SET_THREAD = "messages/setThread";
const ADD_MESSAGE = "messages/addMessage";
const SET_UNREAD = "messages/setUnread";
const MARK_THREAD_READ = "messages/markThreadRead";
const CLEAR_MESSAGES = "messages/clear";

const setConversations = (conversations, unreadTotal) => ({
  type: SET_CONVERSATIONS, conversations, unreadTotal,
});
const setThread = (userId, user, messages) => ({
  type: SET_THREAD, userId, user, messages,
});
const addMessage = (userId, message) => ({ type: ADD_MESSAGE, userId, message });
const setUnread = (unreadTotal) => ({ type: SET_UNREAD, unreadTotal });
const markThreadRead = (userId) => ({ type: MARK_THREAD_READ, userId });
export const clearMessages = () => ({ type: CLEAR_MESSAGES });

// ---------- Thunks ----------
export const fetchConversations = () => async (dispatch) => {
  const res = await fetch("/api/messages/conversations", { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(setConversations(data.conversations, data.unread_total));
    return data.conversations;
  }
  return null;
};

export const fetchUnreadCount = () => async (dispatch) => {
  const res = await fetch("/api/messages/unread_count", { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(setUnread(data.unread_total));
    return data.unread_total;
  }
  return 0;
};

export const fetchThread = (userId) => async (dispatch) => {
  const res = await fetch(`/api/messages/${userId}`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(setThread(userId, data.user, data.messages));
    dispatch(markThreadRead(userId));
    return data;
  }
  return null;
};

export const sendMessage = (userId, { content, postId } = {}) => async (dispatch) => {
  const res = await fetch(`/api/messages/${userId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, post_id: postId }),
  });
  if (res.ok) {
    const message = await res.json();
    dispatch(addMessage(userId, message));
    return message;
  }
  return null;
};

// ---------- Selectors ----------
export const selectConversations = (state) => state.messages.conversations;
export const selectDmUnread = (state) => state.messages.unreadTotal;
export const selectThread = (userId) => (state) => state.messages.threads[userId];

// ---------- Reducer ----------
const initialState = {
  conversations: [],
  threads: {},      // userId -> { user, messages: [] }
  unreadTotal: 0,
  loaded: false,
};

function bumpConversation(conversations, userId, message) {
  const idx = conversations.findIndex((c) => c.user?.id === userId);
  if (idx === -1) return conversations; // brand-new convo shows up on next fetch
  const updated = { ...conversations[idx], last_message: message };
  return [updated, ...conversations.slice(0, idx), ...conversations.slice(idx + 1)];
}

export default function messagesReducer(state = initialState, action) {
  switch (action.type) {
    case SET_CONVERSATIONS:
      return {
        ...state,
        conversations: action.conversations,
        unreadTotal: action.unreadTotal ?? state.unreadTotal,
        loaded: true,
      };
    case SET_THREAD:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.userId]: { user: action.user, messages: action.messages },
        },
      };
    case ADD_MESSAGE: {
      const existing = state.threads[action.userId] || { user: null, messages: [] };
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.userId]: { ...existing, messages: [...existing.messages, action.message] },
        },
        conversations: bumpConversation(state.conversations, action.userId, action.message),
      };
    }
    case SET_UNREAD:
      return { ...state, unreadTotal: action.unreadTotal };
    case MARK_THREAD_READ: {
      const conversations = state.conversations.map((c) =>
        c.user?.id === action.userId ? { ...c, unread_count: 0 } : c
      );
      const unreadTotal = conversations.reduce((n, c) => n + (c.unread_count || 0), 0);
      return { ...state, conversations, unreadTotal };
    }
    case CLEAR_MESSAGES:
      return initialState;
    default:
      return state;
  }
}
