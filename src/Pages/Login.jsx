import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from "../assets/kahelogo.png";

// axios instance
const api = axios.create({
  baseURL: "http://134.209.157.195",
  headers: { "Content-Type": "application/json" },
});

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "alumni",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  }, []);

  const loginUrl = useMemo(() => {
    switch (form.role) {
      case "admin":
        return "/login/admin/";
      case "alumni":
        return "/login/user/";
      default:
        return "/login/staff/";
    }
  }, [form.role]);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (form.username.length > 100) {
        return setError("Username too long (max 100 characters)");
      }

      setLoading(true);
      try {
        const { data } = await api.post(loginUrl, {
          username: form.username,
          password: form.password,
        });

        if (data.token) {
          localStorage.setItem("Token", data.token);
          localStorage.setItem("Role", form.role);
          switch (form.role) {
            case "admin":
              navigate("/admin/dashboard");
              break;
            case "alumni":
              navigate("/alumni/dashboard");
              break;
            default:
              navigate("/staff/dashboard");
          }
        } else {
          setError(data.error || "Login failed: no token received");
        }
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    },
    [form, loginUrl, navigate]
  );

  // Forgot password handler
  const handleForgotPassword = async () => {
    setError("");
    if (!form.username) {
      setError("Please enter your email to reset password.");
      return;
    }
    setForgotLoading(true);
    try {
      await api.post("/forgot-password/", { email: form.username });
      setShowForgotPopup(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to send reset email."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <img src={kahelogo} alt="Logo" className="mx-auto h-20" />
          <h1 className="mt-4 text-3xl font-bold text-green-600">Karpagam Alumni</h1>
          <p className="text-gray-600">Connect with your college community</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-md rounded-lg px-8 py-6 space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center">Welcome Back!</h2>

          {error && <ErrorBanner message={error} />}

          <div className="space-y-4">
            <Select
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                { value: "admin", label: "Admin" },
                { value: "staff", label: "Staff" },
                { value: "alumni", label: "Alumni" },
              ]}
            />

            <Input
              name="username"
              type="text"
              label="Email"
              placeholder="Enter your username or email"
              value={form.username}
              onChange={handleChange}
              maxLength={100}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye Open SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    // Eye Closed SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.25-2.61A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.965 9.965 0 01-4.293 5.03M15 12a3 3 0 11-6 0 3 3 0 016 0zm-6.364 6.364l12.728-12.728" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              className="text-green-600 hover:underline text-sm"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading ? "Sending..." : "Forgot password?"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition duration-200 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Login"}
          </button>

          <p className="text-center text-sm text-gray-600">
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
        {showForgotPopup && (
          <Popup onClose={() => setShowForgotPopup(false)}>
            <div className="text-center">
              <div className="text-green-600 text-lg font-semibold mb-2">Check your mail</div>
              <div className="text-gray-700 mb-4">A password reset link has been sent to your email.</div>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => setShowForgotPopup(false)}
              >
                OK
              </button>
            </div>
          </Popup>
        )}
      </div>
    </div>
  );
}

// Input component
function Input({ name, label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        {...props}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
      />
    </div>
  );
}

// Select component
function Select({ name, label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label || "Role"}
      </label>
      <select
        name={name}
        {...props}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Error Banner
function ErrorBanner({ message }) {
  return (
    <div className="bg-red-100 text-red-800 px-4 py-2 rounded text-sm text-center">
      {message}
    </div>
  );
}

// Popup component
function Popup({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
