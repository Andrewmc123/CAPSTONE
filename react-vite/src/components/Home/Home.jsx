import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaPlay, FaFire, FaWandMagicSparkles, FaCommentDots } from "react-icons/fa6";
import { thunkLogin } from "../../redux/session";
import "./Home.css";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.session.user);

  const demoLogin = async () => {
    await dispatch(thunkLogin({ email: "demo@aa.io", password: "password" }));
    navigate("/");
  };

  return (
    <div className="landing">
      <div className="landing-orb orb-green" />
      <div className="landing-orb orb-orange" />
      <div className="landing-orb orb-small" />

      <main className="landing-content">
        <h1 className="abln-logo landing-logo">ABLN</h1>
        <p className="landing-sub">ABOUT LAST NIGHT</p>
        <h2 className="landing-tagline">
          Share your night. <span className="text-neon">Watch</span> the world&apos;s.
          <br />Videos, <span className="text-orange">GIFs</span> & the moments worth reliving.
        </h2>

        <div className="landing-features">
          <span><FaPlay /> Endless video feed</span>
          <span><FaWandMagicSparkles /> Built-in video editor</span>
          <span><FaCommentDots /> GIF comments</span>
          <span><FaFire /> Trending hashtags & sounds</span>
        </div>

        <div className="landing-ctas">
          <Link to="/" className="btn btn-grad landing-btn">▶ Start watching</Link>
          {!user && (
            <>
              <Link to="/signup" className="btn btn-primary landing-btn">Sign up free</Link>
              <Link to="/login" className="btn btn-ghost landing-btn">Log in</Link>
              <button onClick={demoLogin} className="btn btn-orange landing-btn">
                Try the demo ✨
              </button>
            </>
          )}
        </div>

        <p className="landing-note">For night owls of all ages 🌙 — family-friendly GIFs powered by Tenor</p>
      </main>
    </div>
  );
}
