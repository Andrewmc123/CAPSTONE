// Action Types
const SET_NOTIFICATIONS = 'notifications/SET_NOTIFICATIONS';
const MARK_ALL_READ = 'notifications/MARK_ALL_READ';

// Action Creators
const setNotifications = (payload) => ({
  type: SET_NOTIFICATIONS,
  payload
});

const markAllRead = () => ({
  type: MARK_ALL_READ
});

// Thunks
export const thunkGetUserNotifications = () => async (dispatch) => {
  const response = await fetch('/api/notifications/', {  // Added trailing slash
    credentials: 'include'
  });
  
  if (response.ok) {
    const data = await response.json();
    dispatch(setNotifications({
      notifications: data.notifications,
      unreadCount: data.unread_count  // Fixed key to match backend
    }));
  }
};

export const thunkMarkAllAsRead = () => async (dispatch) => {
  const response = await fetch('/api/notifications/read/all', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (response.ok) {
    dispatch(markAllRead());
    dispatch(thunkGetUserNotifications());
  }
};

// Reducer
const initialState = { 
  all: {},       // Normalized notifications by id
  unreadCount: 0,
  loaded: false 
};

export default function notificationsReducer(state = initialState, action) {
  switch (action.type) {
    case SET_NOTIFICATIONS:
      return {
        ...state,
        all: action.payload.notifications.reduce((acc, notif) => {
          acc[notif.id] = {
            ...notif,
            // Ensure consistent field names
            is_read: notif.is_read || false,
            type: notif.type || notif.notification_type,
            created_at: notif.created_at || notif.createdAt
          };
          return acc;
        }, {}),
        unreadCount: action.payload.unread_count || action.payload.unreadCount || 0,
        loaded: true
      };
    case MARK_ALL_READ:
      return {
        ...state,
        unreadCount: 0,
        all: Object.fromEntries(
          Object.entries(state.all).map(([id, notif]) => [
            id, 
            { ...notif, is_read: true }
          ])
        )
      };
    default:
      return state;
  }
}