import { useState } from "react";
import { Link } from "react-router-dom";
import horizontalLogo from "../assets/logo horizontal.png";
import "../App.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5215/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "An error occurred. Please try again.");
        setIsLoading(false);
        return;
      }

      setSubmittedEmail(email.trim());
      setEmailSent(true);
      setEmail("");
    } catch (err) {
      setError("Failed to connect to the server. Please check your internet connection.");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleTryAnother() {
    setEmailSent(false);
    setSubmittedEmail("");
    setError("");
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
          <p>Recover your account with a secure reset link.</p>
        </header>

        <section className="ticket-login-card">
          <header className="ticket-login-card-header">
            <h1>Reset your password</h1>
            <p>
              {emailSent
                ? "Check your email for a password reset link."
                : "Enter your email address and we'll send you a secure reset link."}
            </p>
          </header>

          {error && (
            <p className="ticket-login-error" role="alert">
              {error}
            </p>
          )}

          {emailSent ? (
            <div className="ticket-forgot-success-message">
              <p>
                We've sent a password reset link to <strong>{submittedEmail}</strong>.
              </p>
              <p>Click the link in the email to reset your password. The link will expire in 15 minutes.</p>
            </div>
          ) : null}

          <form className="ticket-login-form" onSubmit={handleSubmit}>
            {!emailSent && (
              <div className="ticket-input-group">
                <label htmlFor="forgot-email">Email Address</label>
                <div className="ticket-input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M4 6.75h16v10.5H4z" />
                    <path d="m4.75 7.5 7.25 5 7.25-5" />
                  </svg>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {!emailSent && (
              <button type="submit" className="ticket-login-button" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </button>
            )}

            {emailSent && (
              <button type="button" className="ticket-login-button" onClick={handleTryAnother}>
                Try another email
              </button>
            )}
          </form>

          <div className="ticket-login-options ticket-forgot-back">
            <Link to="/login">Back to login</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ForgotPassword;
