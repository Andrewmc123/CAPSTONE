import { useState } from "react";
import { useDispatch } from "react-redux";
import { FaXmark } from "react-icons/fa6";
import { thunkLogin, thunkSignup } from "../../redux/session";
import { useModal } from "../../context/Modal";
import "./LoginForm.css";

// Unified auth modal: toggles Login <-> Sign Up in place, with an exit button.
function LoginFormModal({ onLoginSuccess, initialMode = "login" }) {
  const dispatch = useDispatch();
  const { closeModal } = useModal();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const done = () => {
    closeModal();
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await dispatch(thunkLogin({ email, password }));
    setIsLoading(false);
    if (res) setErrors(res); else done();
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const res = await dispatch(thunkLogin({ email: "demo@aa.io", password: "password" }));
    setIsLoading(false);
    if (res) setErrors(res); else done();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setErrors({ confirmPassword: "Passwords don't match" });
    setIsLoading(true);
    const res = await dispatch(thunkSignup({ email, username, firstname, lastname, password }));
    setIsLoading(false);
    if (res) setErrors(res); else done();
  };

  const switchMode = (m) => { setMode(m); setErrors({}); };
  const loginDisabled = email.length < 4 || password.length < 6 || isLoading;

  return (
    <div className="auth-card auth-card-modal fade-in">
      <button className="auth-close" onClick={closeModal} aria-label="Close">
        <FaXmark />
      </button>
      <span className="abln-logo auth-logo">ABLN</span>

      {mode === "login" ? (
        <>
          <h1 className="auth-title">Log in to continue</h1>
          <p className="auth-sub">Like videos, follow creators and comment with GIFs 🎬</p>

          <form onSubmit={handleLogin} className="auth-form">
            <label className="auth-label">
              Email{errors.email && <span className="auth-error"> · {errors.email}</span>}
            </label>
            <input className="input" type="text" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@night.club" required disabled={isLoading} />

            <label className="auth-label">
              Password{errors.password && <span className="auth-error"> · {errors.password}</span>}
            </label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />

            {errors.general && <p className="auth-error">{errors.general}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loginDisabled}>
              {isLoading ? "Signing in…" : "Log in"}
            </button>

            <div className="auth-divider"><span>or</span></div>

            <button type="button" className="btn btn-orange auth-submit" onClick={handleDemoLogin} disabled={isLoading}>
              ✨ Try the demo account
            </button>
          </form>

          <p className="auth-footer">
            New to ABLN?{" "}
            <button type="button" className="auth-link" onClick={() => switchMode("signup")}>
              Create an account
            </button>
          </p>
        </>
      ) : (
        <>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Join ABLN — post videos &amp; GIFs tonight 🌃</p>

          {errors.server && <p className="auth-error">{errors.server}</p>}

          <form onSubmit={handleSignup} className="auth-form">
            <div className="auth-grid-2">
              <div>
                <label className="auth-label">First name</label>
                <input className="input" type="text" value={firstname}
                  onChange={(e) => setFirstname(e.target.value)} placeholder="Nova" required />
                {errors.firstname && <p className="auth-error">{errors.firstname}</p>}
              </div>
              <div>
                <label className="auth-label">Last name</label>
                <input className="input" type="text" value={lastname}
                  onChange={(e) => setLastname(e.target.value)} placeholder="Knight" required />
                {errors.lastname && <p className="auth-error">{errors.lastname}</p>}
              </div>
            </div>

            <label className="auth-label">Username</label>
            <input className="input" type="text" value={username}
              onChange={(e) => setUsername(e.target.value)} placeholder="@nightowl" required />
            {errors.username && <p className="auth-error">{errors.username}</p>}

            <label className="auth-label">Email</label>
            <input className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@night.club" required />
            {errors.email && <p className="auth-error">{errors.email}</p>}

            <label className="auth-label">Password</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" required />
            {errors.password && <p className="auth-error">{errors.password}</p>}

            <label className="auth-label">Confirm password</label>
            <input className="input" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
            {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
              {isLoading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <button type="button" className="auth-link" onClick={() => switchMode("login")}>
              Log in
            </button>
          </p>
        </>
      )}
    </div>
  );
}

export default LoginFormModal;
