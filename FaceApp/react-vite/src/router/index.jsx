import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginFormPage from '../components/LoginFormPage';
import SignupFormPage from '../components/SignupFormPage';
import Home from '../components/Home/Home';
import Dashboard from '../components/Dashboard/';
import Layout from './Layout';
import Friends from '../components/Friends/Friends';

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
        { path: "/home", element: <Home /> },
        { path: "/Dashboard", element: <AuthCheck><Dashboard /></AuthCheck> },
        { path: "/friends", element: <AuthCheck><Friends /></AuthCheck> },
        { path: "/login", element: <AuthRedirect><LoginFormPage /></AuthRedirect> },
        { path: "/signup", element: <AuthRedirect><SignupFormPage /></AuthRedirect> },
      ],
    },
  ]);
};

export const router = createAppRouter();