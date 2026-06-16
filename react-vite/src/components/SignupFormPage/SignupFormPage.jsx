import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { thunkSignup } from "../../redux/session";
import "./SignupForm.css";

function SignupFormPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setErrors({ confirmPassword: "Passwords don't match" });
    }

    setIsLoading(true);
    const serverResponse = await dispatch(
      thunkSignup({ email, username, firstname, lastname, password })
    );
    setIsLoading(false);

    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <Link to="/home" className="abln-logo auth-logo">Aura</Link>
        <h1 className="auth-title">Sign up for Aura</h1>
        <p className="auth-sub">Create your account — start posting videos & GIFs tonight 🌃</p>

        {errors.server && <p className="auth-error">{errors.server}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
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
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupFormPage;
