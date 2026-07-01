// ABLN router — TikTok-style route map
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginFormPage from "../components/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
import Home from "../components/Home/Home";
import Feed from "../components/Feed";
import SingleVideo from "../components/SingleVideo";
import Explore from "../components/Explore";
import HashtagPage from "../components/HashtagPage";
import UploadStudio from "../components/Upload";
import SearchPage from "../components/SearchPage";
import Inbox from "../components/Inbox";
import { MessagesPage, MessageThread } from "../components/Messages";
import { LiveDiscover, LiveRoom } from "../components/Live";
import Layout from "./Layout";
import UserProfilePage from "../components/UserProfilePage";
import SettingsPage from "../components/Settings/SettingsPage";
import Network from "../components/Network";
import Camera from "../components/Camera/Camera";
import Vault from "../components/Vault/Vault";
import Shop from "../components/Shop";

const createAppRouter = () => {
  const AuthRedirect = ({ children }) => {
    const sessionUser = useSelector((state) => state.session.user);
    return sessionUser ? <Navigate to="/" replace /> : children;
  };

  const AuthCheck = ({ children }) => {
    const sessionUser = useSelector((state) => state.session.user);
    return sessionUser ? children : <Navigate to="/login" replace />;
  };

  return createBrowserRouter([
    {
      element: <Layout />,
      children: [
        { path: "/", element: <Feed tab="foryou" /> },
        { path: "/following", element: <Feed tab="following" /> },
        { path: "/network", element: <Network /> },
        { path: "/video/:postId", element: <SingleVideo /> },
        { path: "/explore", element: <Explore /> },
        { path: "/shop", element: <Shop /> },
        { path: "/tag/:tag", element: <HashtagPage /> },
        { path: "/search", element: <SearchPage /> },
        { path: "/upload", element: <AuthCheck><UploadStudio /></AuthCheck> },
        { path: "/inbox", element: <AuthCheck><Inbox /></AuthCheck> },
        { path: "/messages", element: <AuthCheck><MessagesPage /></AuthCheck> },
        { path: "/messages/:userId", element: <AuthCheck><MessageThread /></AuthCheck> },
        { path: "/live", element: <AuthCheck><LiveDiscover /></AuthCheck> },
        { path: "/live/:id", element: <AuthCheck><LiveRoom /></AuthCheck> },
        { path: "/users/:userId", element: <UserProfilePage /> },
        { path: "/settings", element: <SettingsPage /> },
        { path: "/home", element: <Home /> },
        { path: "/login", element: <AuthRedirect><LoginFormPage /></AuthRedirect> },
        { path: "/signup", element: <AuthRedirect><SignupFormPage /></AuthRedirect> },
        { path: "/camera", element: <AuthCheck><Camera /></AuthCheck> },
        { path: "/vault", element: <AuthCheck><Vault /></AuthCheck> },
        { path: "/dashboard", element: <Navigate to="/" replace /> },
        { path: "/notifications", element: <Navigate to="/inbox" replace /> },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);
};

export const router = createAppRouter();
