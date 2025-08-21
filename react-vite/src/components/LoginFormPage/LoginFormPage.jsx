// LoginFormPage.jsx
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

    const serverResponse = await dispatch(
      thunkLogin({
        email,
        password,
      })
    );

    setIsLoading(false);
    
    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      navigate("/dashboard");
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    
    try {
      const serverResponse = await dispatch(thunkLogin({
        email: 'demo@aa.io',
        password: 'password'
      }));
      
      if (serverResponse) {
        setErrors(serverResponse);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setErrors({ general: "Failed to login as demo user" });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = email.length < 4 || password.length < 6 || isLoading;

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="login-header">
          <h1 className="modal-title">Welcome to ABNB</h1>
          <p className="login-subtitle">Sign in to continue your journey</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="form-group">
            <label>
              <div className="signup-label-title">Email Address
                {errors.email && <span className="error-message"> {errors.email}</span>}
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className={errors.email ? 'input-error' : ''}
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>
              <div className="signup-label-title">Password
                {errors.password && <span className="error-message"> {errors.password}</span>}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className={errors.password ? 'input-error' : ''}
              />
            </label>
          </div>

          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="button-container">
            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isDisabled}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button 
              type="button"
              className={`demo-login-button ${isLoading ? 'loading' : ''}`}
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : 'Try Demo Account'}
            </button>
          </div>

          <div className="login-footer">
            <p>New to ABNB? <Link to="/signup" className="signup-link">Create an account</Link></p>
          </div>

        </form>
      </div>
    </div>
  );
}

export default LoginFormPage;