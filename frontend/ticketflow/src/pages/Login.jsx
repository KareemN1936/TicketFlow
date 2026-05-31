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
    <main className="login-page">
      <div className="login-container">
        <header className="login-brand">
          <div className="brand-lockup">
            <span className="login-horizontal-logo">
              <img src={horizontalLogo} alt="TicketFlow" />
            </span>
          </div>
          <p>IT support, organized from request to resolution</p>
        </header>

        <section className="card login-card">
          <header className="login-card-header">
            <h2>Sign In</h2>
            <p>Enter your corporate credentials to access the console.</p>
          </header>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
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

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="login-actions">
              <button type="submit" className="btn btn-primary">
                Sign In
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </form>

          <div className="access-divider">
            <span>Authorized access only</span>
          </div>
        </section>

        <p className="login-footer">
          Secure access for approved IT personnel
        </p>
      </div>
    </main>
  );
}

export default Login;
