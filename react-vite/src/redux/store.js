// store.js
import {
  legacy_createStore as createStore,
  applyMiddleware,
  compose,
  combineReducers,
} from "redux";
import thunk from "redux-thunk";
import sessionReducer from "./session";
import postReducer from "./posts";
import FriendsReducer from "./friends";
import notificationsReducer from "./notification";
import followsReducer from "./follows";
import messagesReducer from "./messages";
import vaultReducer from "./vault";

const rootReducer = combineReducers({
  session: sessionReducer,
  posts: postReducer,
  friends: FriendsReducer,
  notifications: notificationsReducer,
  follows: followsReducer,
  messages: messagesReducer,
  vault: vaultReducer,
});

let enhancer;
if (import.meta.env.MODE === "production") {
  enhancer = applyMiddleware(thunk);
} else {
  const logger = (await import("redux-logger")).default;
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  enhancer = composeEnhancers(applyMiddleware(thunk, logger));
}

const configureStore = (preloadedState) => {
  return createStore(rootReducer, preloadedState, enhancer);
};

export default configureStore;