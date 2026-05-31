import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
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
      await register(formData.fullName, formData.email, formData.password);
      navigate("/login");
    } catch {
      setError("Registration failed. Try another email.");
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", fontFamily: "Arial" }}>
      <h1>Register</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Full Name</label>
          <input
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
          />
        </div>

        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
          />
        </div>

        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          Register
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;