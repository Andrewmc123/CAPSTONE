// index.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginFormPage from '../components/LoginFormPage';
import SignupFormPage from '../components/SignupFormPage';
import Home from '../components/Home/Home';
import Dashboard from '../components/Dashboard/';
import Layout from './Layout';
import UserProfilePage from '../components/UserProfilePage'; 
import Friends from '../components/Friend/Friend';
import NotificationsPage from '../components/NotificationPage/NotificationsPage';

const createAppRouter = () => {
  const AuthRedirect = ({ children }) => {
    const sessionUser = useSelector(state => state.session.user);
    return sessionUser ? <Navigate to="/dashboard" replace /> : children;
  };

  const AuthCheck = ({ children }) => {
    const sessionUser = useSelector(state => state.session.user);
    return sessionUser ? children : <Navigate to="/login" replace />;
  };

  return createBrowserRouter([
    {
      element: <Layout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/dashboard", element: <AuthCheck><Dashboard /></AuthCheck> },
        {path: "/home",element: <Home />,},
        { path: "/friends", element: <AuthCheck><Friends /></AuthCheck> },
        { path: "/login", element: <AuthRedirect><LoginFormPage /></AuthRedirect> },
        { path: "/signup", element: <AuthRedirect><SignupFormPage /></AuthRedirect> },
        { path: "/users/:userId", element: <AuthCheck><UserProfilePage /></AuthCheck> },
        { path: "/notifications", element: <AuthCheck><NotificationsPage /></AuthCheck> },
      ],
    },
  ]);
};

export const router = createAppRouter();