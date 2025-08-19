import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { thunkLogin } from "../../redux/session";
import OpenModalButton from '../OpenModalButton/OpenModalButton';
import SignupFormModal from '../SignupFormModal/SignupFormModal';
import LoginFormModal from "../LoginFormModal";
import './Home.css';

const Home = () => {
  const user = useSelector(state => state.session.user);
  const dispatch = useDispatch();

  if (user) return <Navigate to="/Dashboard" />;

  const handleDemoLogin = async () => {
    try {
      await dispatch(thunkLogin({
        email: 'demo@aa.io',
        password: 'password'
      }));
      // Navigation will happen automatically due to the useSelector redirect
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="home-container">
      <div className="color-orb orb1"></div>
      <div className="color-orb orb2"></div>
      <div className="color-orb orb3"></div>
      <div className="color-orb orb4"></div>
      
      <div className="home-content">
        <div className="home-header">
          <h1 className="app-name">ABLN</h1>
        <p className="app-quote">"Where the nights you barely remember live on forever."</p>
        </div>
        
        <div className="home-buttons">
          <OpenModalButton
            className="home-button sign-up-button"
            buttonText="Sign Up!"
            modalComponent={<SignupFormModal />}
          />
          <OpenModalButton
            className="home-button login-button"
            buttonText="Log In"
            modalComponent={<LoginFormModal />}
          />
          
          <button 
            className="home-button demo-button"
            onClick={handleDemoLogin}
          >
            Demo Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;