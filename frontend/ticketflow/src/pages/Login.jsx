import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import horizontalLogo from "../assets/logo horizontal.png";
import "../App.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <main className="ticket-login-page">
      <div className="ticket-login-bg" aria-hidden="true">
        <span className="ticket-login-orbit ticket-login-orbit-one" />
        <span className="ticket-login-orbit ticket-login-orbit-two" />
        <span className="ticket-login-glow ticket-login-glow-one" />
        <span className="ticket-login-glow ticket-login-glow-two" />
        <span className="ticket-login-dots" />
        <div className="ticket-login-illustration">
          <div className="ticket-illustration-screen">
            <span className="ticket-screen-line ticket-screen-line-one" />
            <span className="ticket-screen-line ticket-screen-line-two" />
            <span className="ticket-screen-line ticket-screen-line-three" />
            <span className="ticket-screen-chart" />
            <span className="ticket-screen-ring" />
          </div>
          <div className="ticket-illustration-base">
            <span className="ticket-base-layer ticket-base-layer-one" />
            <span className="ticket-base-layer ticket-base-layer-two" />
            <span className="ticket-base-layer ticket-base-layer-three" />
          </div>
          <span className="ticket-illustration-node ticket-node-one" />
          <span className="ticket-illustration-node ticket-node-two" />
          <span className="ticket-illustration-node ticket-node-three" />
        </div>
      </div>

      <div className="ticket-login-container">
        <header className="ticket-login-brand">
          <div className="ticket-brand-lockup">
            <span className="ticket-login-horizontal-logo">
              <img src={horizontalLogo} alt="TicketFlow" />
            </span>
          </div>
          <p>IT support, organized from request to resolution</p>
        </header>

        <section className="ticket-login-card">
          <header className="ticket-login-card-header">
            <h1>Welcome back <span aria-hidden="true"></span></h1>
            <p>Sign in to access your IT support console</p>
          </header>

          {error && (
            <p className="ticket-login-error" role="alert">
              {error}
            </p>
          )}

          <form className="ticket-login-form" onSubmit={handleSubmit}>
            <div className="ticket-input-group">
              <label htmlFor="email">Email Address</label>
              <div className="ticket-input-wrapper">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 6.75h16v10.5H4z" />
                  <path d="m4.75 7.5 7.25 5 7.25-5" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="ticket-input-group">
              <label htmlFor="password">Password</label>
              <div className="ticket-input-wrapper">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="5.5" y="10" width="13" height="10" rx="1.5" />
                  <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2.5" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="ticket-password-toggle"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                >
                  {isPasswordVisible ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4.2 9.5 6.1a4 4 0 0 1 0 3.8 13.5 13.5 0 0 1-2.4 3.1M6.6 6.6a13.5 13.5 0 0 0-4.1 3.5 4 4 0 0 0 0 3.8C3.5 15.8 7 20 12 20a10.8 10.8 0 0 0 4.1-.8" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M2.5 10.1a4 4 0 0 0 0 3.8C3.5 15.8 7 20 12 20s8.5-4.2 9.5-6.1a4 4 0 0 0 0-3.8C20.5 8.2 17 4 12 4S3.5 8.2 2.5 10.1Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="ticket-login-options">
              <label>
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <a href="#forgot-password">Forgot password?</a>
            </div>

            <div className="ticket-login-actions">
              <button type="submit" className="ticket-login-button">
                Sign In
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </form>

          <div className="ticket-access-divider">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 3.5 18 6v5.2c0 4.1-2.55 7.35-6 9.3-3.45-1.95-6-5.2-6-9.3V6z" />
              <path d="m9.5 12 1.65 1.65L14.75 10" />
            </svg>
            <span>Authorized access only</span>
          </div>
        </section>

        <p className="ticket-login-security-note">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <rect x="6.5" y="10" width="11" height="10" rx="1.5" />
            <path d="M9 10V7.5a3 3 0 0 1 6 0V10M12 14v2.5" />
          </svg>
          Secure access for approved IT personnel
        </p>
      </div>
    </main>
  );
}

export default Login;
