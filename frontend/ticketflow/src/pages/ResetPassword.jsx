import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import horizontalLogo from "../assets/logo horizontal.png";
import "../App.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email || !token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [email, token]);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter both passwords.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    resetPassword();
  }

  async function resetPassword() {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5215/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reset password.");
        return;
      }

      setStatusMessage(data.message);
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  if (!email || !token) {
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
          <section className="ticket-login-card">
            <header className="ticket-login-card-header">
              <h1>Invalid Reset Link</h1>
              <p>The password reset link is invalid or has expired.</p>
            </header>

            <p className="ticket-login-error">
              {error || "Please request a new password reset from the login page."}
            </p>

            <div className="ticket-login-options ticket-forgot-back">
              <Link to="/login">Back to login</Link>
            </div>
          </section>
        </div>
      </main>
    );
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
          <p>Create your new password to regain access to your account.</p>
        </header>

        <section className="ticket-login-card">
          <header className="ticket-login-card-header">
            <h1>Create New Password</h1>
            <p>Enter a secure password to reset your account.</p>
          </header>

          {statusMessage && (
            <div className="ticket-forgot-code-toast" role="status">
              {statusMessage}
              <div style={{ marginTop: "8px", fontSize: "13px" }}>
                Redirecting to login...
              </div>
            </div>
          )}

          {error && (
            <p className="ticket-login-error" role="alert">
              {error}
            </p>
          )}

          <form className="ticket-login-form" onSubmit={handleSubmit}>
            <div className="ticket-input-group">
              <label htmlFor="new-password">New password</label>
              <div className="ticket-input-wrapper">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="5.5" y="10" width="13" height="10" rx="1.5" />
                  <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2.5" />
                </svg>
                <input
                  id="new-password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Create a new password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="ticket-password-toggle"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  disabled={isLoading}
                >
                  {isPasswordVisible ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M2.5 10.1a4 4 0 0 0 0 3.8C3.5 15.8 7 20 12 20s8.5-4.2 9.5-6.1a4 4 0 0 0 0-3.8C20.5 8.2 17 4 12 4S3.5 8.2 2.5 10.1Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4.2 9.5 6.1a4 4 0 0 1 0 3.8 13.5 13.5 0 0 1-2.4 3.1M6.6 6.6a13.5 13.5 0 0 0-4.1 3.5 4 4 0 0 0 0 3.8C3.5 15.8 7 20 12 20a10.8 10.8 0 0 0 4.1-.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="ticket-input-group">
              <label htmlFor="confirm-password">Confirm password</label>
              <div className="ticket-input-wrapper">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="5.5" y="10" width="13" height="10" rx="1.5" />
                  <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2.5" />
                </svg>
                <input
                  id="confirm-password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="ticket-login-actions">
              <button type="submit" className="ticket-login-button" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset password"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>

          <div className="ticket-login-options ticket-forgot-back">
            <Link to="/login">Back to login</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ResetPassword;
