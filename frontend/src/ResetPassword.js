import React, { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
        password,
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.message || "Try again later"));
    }
  };

  return (
    <div className="reset-container">
      <h2>🔁 Reset Password</h2>
      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Reset</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ResetPassword;
