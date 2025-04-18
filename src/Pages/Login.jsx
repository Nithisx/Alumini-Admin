import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from "../assets/kahelogo.png";

// axios instance with a shared base URL & JSON headers
const api = axios.create({
  baseURL: "http://134.209.157.195:8000",
  headers: { "Content-Type": "application/json" },
});

export default function LoginPage() {
  const navigate = useNavigate();

  // consolidate form data
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "staff",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // generic onChange for all inputs
  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError("");
  }, []);

  // pick the correct endpoint based on role
  const loginUrl = useMemo(
    () => (form.role === "admin" ? "/login/admin/" : "/login/staff/"),
    [form.role]
  );

  const handleLogin = useCallback(
    async e => {
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
          navigate(form.role === "admin" ? "/admin/dashboard" : "/staff/dashboard");
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

          {error && (
            <ErrorBanner message={error} />
          )}

          <div className="space-y-4">
            <Select
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                { value: "admin", label: "Admin" },
                { value: "staff", label: "Staff" },
              ]}
            />

            <Input
              name="username"
              type="text"
              label="Username"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              maxLength={100}
              required
            />

            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
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
      </div>
    </div>
  );
}

// Reusable input with label
function Input({ name, label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        name={name}
        {...props}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
      />
    </div>
  );
}

// Reusable select
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
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Error banner component
function ErrorBanner({ message }) {
  return (
    <div className="flex items-center bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded">
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
      <span>{message}</span>
    </div>
  );
}
