import { createBrowserRouter } from 'react-router-dom';
import LoginFormPage from '../components/LoginFormPage';
import SignupFormPage from '../components/SignupFormPage';
import Home from '../components/Home/Home';
import Dashboard from '../components/Dashboard/';
import Layout from './Layout';
import Friend from '../components/Friends';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/", // add check for user session? send to dashboard if logged in otherwise landing page
        element: <Home />,
      },
      {
        path: "/Dashboard",
        element: <Dashboard />,
      },
      {
        path: "/Home",
        element: <Home/>,
      },
      {
        path: "/login",
        element: <LoginFormPage />,
      },
      {
        path: "/signup",
        element: <SignupFormPage />,
       
      }, 
      {
        path: "/friend",
        element: <Friend />,
      },
    ],
  },
]);