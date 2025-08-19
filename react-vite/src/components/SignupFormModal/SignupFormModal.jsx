import { useState } from "react";
import { useDispatch } from "react-redux";
import { useModal } from "../../context/Modal";
import { thunkSignup } from "../../redux/session";
import "./SignupForm.css";

function SignupFormModal() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { closeModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      setIsLoading(false);
      return setErrors({
        confirmPassword: "Passwords do not match",
      });
    }

    const serverResponse = await dispatch(
      thunkSignup({
        email,
        username,
        password,
        firstname: firstName,
        lastname: lastName,
      })
    );

    setIsLoading(false);

    if (serverResponse) {
      setErrors(serverResponse);
    } else {
      closeModal();
    }
  };

  const isDisabled = 
    email.length < 4 || 
    username.length < 3 || 
    password.length < 6 || 
    confirmPassword.length < 6 ||
    isLoading;

  return (
    <div className="modal-container" onClick={() => closeModal()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="signup-header">
          <h1 className="modal-title">Join ABNB</h1>
          <p className="signup-subtitle">Create your account to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="signup-form">
          {errors.server && (
            <div className="error-message general-error">
              {errors.server}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>
                <div className="signup-label-title">First Name
                  {errors.firstname && <span className="error-message"> {errors.firstname}</span>}
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                  disabled={isLoading}
                  className={errors.firstname ? 'input-error' : ''}
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                <div className="signup-label-title">Last Name
                  {errors.lastname && <span className="error-message"> {errors.lastname}</span>}
                </div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                  disabled={isLoading}
                  className={errors.lastname ? 'input-error' : ''}
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              <div className="signup-label-title">Email Address
                {errors.email && <span className="error-message"> {errors.email}</span>}
              </div>
              <input
                type="email"
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
              <div className="signup-label-title">Username
                {errors.username && <span className="error-message"> {errors.username}</span>}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                disabled={isLoading}
                className={errors.username ? 'input-error' : ''}
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <div className="signup-label-title">Password
                  {errors.password && <span className="error-message"> {errors.password}</span>}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                  className={errors.password ? 'input-error' : ''}
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                <div className="signup-label-title">Confirm Password
                  {errors.confirmPassword && <span className="error-message"> {errors.confirmPassword}</span>}
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
              </label>
            </div>
          </div>

          <div className="button-container">
            <button 
              type="submit" 
              className={`signup-button ${isLoading ? 'loading' : ''}`}
              disabled={isDisabled}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="signup-footer">
            <p>Already have an account? <a href="/login" className="login-link">Sign in</a></p>
          </div>

        </form>
      </div>
    </div>
  );
}

export default SignupFormModal;