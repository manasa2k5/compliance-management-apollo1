import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // Or "./Login.css" if using separate CSS
import { useNavigate } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        onLoginSuccess(res.data.user); // Notify App.js
        navigate("/dashboard"); // Redirect to dashboard
      } else {
        alert("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      alert("❌ Invalid credentials or server error.");
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Enter your registered email:");
    if (!email) return;

    const newPass = prompt("Enter new password:");
    if (!newPass) return;

    try {
      await axios.put("http://localhost:5000/api/auth/reset-password-by-email", {
        email,
        password: newPass,
      });
      alert("✅ Password reset successfully!");
    } catch (err) {
      console.error("Reset error:", err.response?.data || err.message);
      alert("❌ Failed to reset password. Check your email or server.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-title">The Apollo University</div>
        <div style={{ fontSize: "1.2rem", color: "#555", marginBottom: "20px" }}>
          Compliance Management Login
        </div>

        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
        />

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        <button
          onClick={handleForgotPassword}
          style={{
            marginTop: "10px",
            background: "none",
            border: "none",
            color: "#007BFF",
            cursor: "pointer",
          }}
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
}

export default Login;
