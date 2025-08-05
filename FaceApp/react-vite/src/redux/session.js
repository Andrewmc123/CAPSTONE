const SET_USER = 'session/setUser';
const REMOVE_USER = 'session/removeUser';

const setUser = (user) => ({
  type: SET_USER,
  payload: user
});

const removeUser = () => ({
  type: REMOVE_USER
});

export const thunkAuthenticate = () => async (dispatch) => {
  const response = await fetch("/api/auth/", {
    credentials: 'include' // CRUCIAL FOR SESSION COOKIES
  });
  
  if (response.ok) {
    const data = await response.json();
    if (data.errors) {
      dispatch(removeUser());
      return data.errors;
    }
    dispatch(setUser(data));
  } else if (response.status === 401) {
    // This is normal when no user is logged in
    dispatch(removeUser());
  } else {
    console.error('Authentication check failed');
    dispatch(removeUser());
  }
};

export const thunkLogin = (credentials) => async dispatch => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: 'include' // NECESSARY FOR COOKIES
  });

  if(response.ok) {
    const data = await response.json();
    dispatch(setUser(data));
    return data;
  } else if (response.status < 500) {
    const errorMessages = await response.json();
    return errorMessages;
  } else {
    return { server: "Something went wrong. Please try again" };
  }
};

export const thunkSignup = (user) => async (dispatch) => {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
    credentials: 'include' // NECESSARY FOR COOKIES
  });

  if(response.ok) {
    const data = await response.json();
    dispatch(setUser(data));
    return data;
  } else if (response.status < 500) {
    const errorMessages = await response.json();
    return errorMessages;
  } else {
    return { server: "Something went wrong. Please try again" };
  }
};

export const thunkLogout = () => async (dispatch) => {
  const response = await fetch("/api/auth/logout", {
    credentials: 'include' // NECESSARY TO CLEAR SESSION
  });
  
  if (response.ok) {
    dispatch(removeUser());
  }
};

const initialState = { user: null };

function sessionReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    case REMOVE_USER:
      return { ...state, user: null };
    default:
      return state;
  }
}

export default sessionReducer;