import { thunkAuthenticate } from './session';

// GET /api/settings -> { is_private, allow_comments, allow_messages, show_activity, notif_prefs }
export const thunkFetchSettings = () => async () => {
  try {
    const response = await fetch('/api/settings', {
      credentials: 'include'
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (e) {
    return null;
  }
};

// PATCH /api/settings with a partial patch; refresh session user on success.
export const thunkUpdateSettings = (patch) => async (dispatch) => {
  try {
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });

    if (response.ok) {
      const data = await response.json();
      dispatch(thunkAuthenticate());
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// PUT /api/users/me with a partial profile patch; refresh session user on success.
export const thunkUpdateProfile = (patch) => async (dispatch) => {
  try {
    const response = await fetch('/api/users/me', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });

    if (response.ok) {
      const data = await response.json();
      dispatch(thunkAuthenticate());
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
};
