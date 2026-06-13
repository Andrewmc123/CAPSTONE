import { useState } from "react";
import { thunkLogin } from "../../redux/session";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useModal } from "../../context/Modal";
import "./LoginForm.css";

function LoginFormModal({ onLoginSuccess }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { closeModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const serverResponse = await dispatch(thunkLogin({ email, password }));
    setIsLoading(false);
    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      closeModal();
      if (onLoginSuccess) onLoginSuccess();
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
      closeModal();
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  const isDisabled = email.length < 4 || password.length < 6 || isLoading;

  return (
    <div className="auth-card auth-card-modal fade-in">
      <span className="abln-logo auth-logo">ABLN</span>
      <h1 className="auth-title">Log in to continue</h1>
      <p className="auth-sub">Like videos, follow creators and comment with GIFs 🎬</p>

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
        New to ABLN? <Link to="/signup" onClick={closeModal}>Create an account</Link>
      </p>
    </div>
  );
}

export default LoginFormModal;
