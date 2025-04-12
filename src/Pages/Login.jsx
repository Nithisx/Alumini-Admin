import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import kahelogo from '../assets/kahelogo.png'

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    // Prevent long usernames that may break the backend
    if (username.length > 100) {
      setError("Username too long (max 100 characters)");
      return;
    }

    const userData = { username, password };
    const loginUrl =
      role === "admin"
        ? "https://wearing-contains-aluminum-caring.trycloudflare.com/login/admin/"
        : "https://wearing-contains-aluminum-caring.trycloudflare.com/login/staff/";

    try {
      setLoading(true);
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        const text = await response.text();
        setError(`Login failed: ${text}`);
        return;
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        setError(`Expected JSON response but got: ${text}`);
        return;
      }

      const data = await response.json();
      const token = data?.token;

      if (token) {
        localStorage.setItem("Token", token);
        localStorage.setItem("Role", role);
        navigate(role === "admin" ? "/admin/dashboard" : "/staff/dashboard");
      } else {
        setError("Token not found in response");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login failed (exception):", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("Role");
    console.log("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center px-4">
      <div className="max-w-md w-full mx-auto">
        {/* Header / Logo Section */}
        <div className="text-center mb-8">
          <img
            className="mx-auto h-20 w-auto"
            src={kahelogo} 
            alt="Logo"
          />
          <h1 className="text-3xl font-bold text-green-600 mt-4">Karpagam Alumni</h1>
          <p className="text-gray-600">Connect with your college community</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-md rounded-lg px-8 py-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Welcome Back !
          </h2>

          {error && (
            <div className="flex items-center bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-4">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Role Dropdown */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>

          {/* Username Input */}
          <input
            type="text"
            placeholder="Username"
            maxLength={100}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition duration-200"
          >
            {loading ? "Signing In..." : "Login"}
          </button>

          {/* Sign Up Navigation */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/Signup")}
              className="text-green-600 hover:underline font-medium"
            >
              Sign Up
            </button>
          </p>
        </form>

        
      </div>
    </div>
  );
};

export default LoginPage;
