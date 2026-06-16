import { useState } from "react";
import { thunkLogin } from "../../redux/session";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import "./LoginForm.css";

function LoginFormPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const serverResponse = await dispatch(thunkLogin({ email, password }));
    setIsLoading(false);
    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      navigate("/");
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const serverResponse = await dispatch(
      thunkLogin({ email: "demo@aa.io", password: "password" })
    );
    setIsLoading(false);
    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      navigate("/");
    }
  };

  const isDisabled = email.length < 4 || password.length < 6 || isLoading;

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <Link to="/home" className="abln-logo auth-logo">Aura</Link>
        <h1 className="auth-title">Log in to Aura</h1>
        <p className="auth-sub">Your feed, your follows, your GIFs — all waiting.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            {errors.email && <span className="auth-error"> · {errors.email}</span>}
          </label>
          <input
            className="input"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@night.club"
            required
            disabled={isLoading}
          />

          <label className="auth-label">
            Password
            {errors.password && <span className="auth-error"> · {errors.password}</span>}
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />

          {errors.general && <p className="auth-error">{errors.general}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={isDisabled}>
            {isLoading ? "Signing in…" : "Log in"}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button
            type="button"
            className="btn btn-orange auth-submit"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            ✨ Try the demo account
          </button>
        </form>

        <p className="auth-footer">
          New to Aura? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginFormPage;
