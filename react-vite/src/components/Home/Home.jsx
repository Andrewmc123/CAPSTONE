import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import OpenModalButton from '../OpenModalButton/OpenModalButton';
import SignupFormModal from '../SignupFormModal/SignupFormModal';
import LoginFormModal from "../LoginFormModal";
import './Home.css';

const Home = () => {
  // I believe this grabs the current user from the Redux store session slice
  const user = useSelector(state => state.session.user);

  // This is doing redirect to dashboard if user is already logged in
  if (user) return <Navigate to="/Dashboard" />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-2">ABLN</h1>
        <p className="text-gray-600 text-center mb-6">
          “Where the nights you barely remember live on forever.”
        </p>
        {/* This is doing open modal button that launches signup form modal */}
        <OpenModalButton
          className="sign-up-button w-full mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          buttonText="Sign Up!"
          modalComponent={<SignupFormModal />}
        />
        {/* This is doing open modal button that launches login form modal */}
        <OpenModalButton
          className="login-button w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          buttonText="Log In"
          modalComponent={<LoginFormModal />}
        />
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            For demo purposes, you can use any login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
