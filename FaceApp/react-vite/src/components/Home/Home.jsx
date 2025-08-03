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
        <div className="home-container">
            <div className="home-content">
                <div className="hero-container">
                    <div className="hero-left">
                        <h1>ABLN</h1>
                        <p className="tagline">
                          “Where the nights you barely remember live on forever.”
                        </p>
                        {/* This is doing open modal button that launches signup form modal */}
                        <OpenModalButton 
                            className="sign-up-button"
                            buttonText="Sign Up!"
                            modalComponent={<SignupFormModal />}
                        />
                        {/* This is doing open modal button that launches login form modal */}
                        <OpenModalButton 
                            className="login-button"
                            buttonText="Log In"
                            modalComponent={<LoginFormModal />}
                        />
                    </div>
                    <div className="hero-right">
                        {/* I believe this is the video box on the right side of the hero */}
                        <div className="video-box">
                            <video
                                className="party-video"
                                src="https://cdn.pixabay.com/video/2023/06/18/170652-834126365_large.mp4"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;
