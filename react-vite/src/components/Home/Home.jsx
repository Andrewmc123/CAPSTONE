import { useSelector } from "react-redux";
import { Navigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { thunkLogin } from "../../redux/session";
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
           <p className="app-slogan">ABLN — About Last Night</p>
           <p className="app-tagline">Connect. Share. Remember.</p>
         
          <p className="app-quote">Because every night has a story worth telling.</p>
        </div>
        
        <div className="home-buttons">
          <Link to="/signup" className="home-button sign-up-button">
            Sign Up!
          </Link>
          
          <Link to="/login" className="home-button login-button">
            Log In
          </Link>
          
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
