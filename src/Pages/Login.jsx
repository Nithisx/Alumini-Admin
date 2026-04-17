import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from "../assets/kahelogo.png";
import { supabase } from "../lib/supabase";

// axios instance
const api = axios.create({
  baseURL: "https://api.karpagamalumni.in/api/v1",
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
  const [oauthLoading, setOauthLoading] = useState(false);

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
      case "student":
        return "/login/user/";
      default:
        return "/login/staff/";
    }
  }, [form.role]);

  // After Supabase OAuth redirect, the hash contains the session.
  // We handle it here on mount.
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // supabase.auth.getSession() reads the hash/cookie automatically
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // A session exists — this is the post-OAuth redirect landing
      setOauthLoading(true);
      setError("");
      try {
        const { data } = await api.post("/auth/google/", {
          access_token: session.access_token,
        });

        if (data.status === "login" && data.token) {
          // Existing approved user
          localStorage.setItem("Token", data.token);
          // Role comes from the server; map it to the localStorage key format
          const roleMap = {
            Admin: "admin",
            Staff: "staff",
            Alumni: "alumni",
            Student: "student",
          };
          const roleKey = roleMap[data.role] || "alumni";
          localStorage.setItem("Role", roleKey);
          // Sign out from Supabase session (we use our own DRF tokens)
          await supabase.auth.signOut();
          switch (roleKey) {
            case "admin":
              navigate("/admin/dashboard");
              break;
            case "staff":
              navigate("/staff/dashboard");
              break;
            default:
              navigate("/alumni/dashboard");
          }
        } else if (data.status === "new_user") {
          // Store the access_token temporarily so the signup page can re-verify with backend
          sessionStorage.setItem("oauth_access_token", session.access_token);
          await supabase.auth.signOut();
          navigate("/oauth-signup", {
            state: {
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              avatar_url: data.avatar_url,
            },
          });
        }
      } catch (err) {
        await supabase.auth.signOut();
        setError(
          err.response?.data?.error ||
          err.message ||
          "Google sign-in failed. Please try again."
        );
      } finally {
        setOauthLoading(false);
      }
    };

    handleOAuthCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            case "student":
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

  const handleGoogleLogin = useCallback(async () => {
    setError("");
    setOauthLoading(true);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
      if (oauthErr) throw oauthErr;
      // Supabase redirects the browser — no further code runs here
    } catch (err) {
      setOauthLoading(false);
      setError(err.message || "Google sign-in failed. Please try again.");
    }
  }, []);

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

  if (oauthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <img src={kahelogo} alt="Logo" className="mx-auto h-16 mb-4" />
          <p className="text-green-600 font-semibold text-lg">Signing you in with Google...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <img src={kahelogo} alt="Logo" className="mx-auto h-20" />
          <h1 className="mt-4 text-3xl font-bold text-green-600">
            Karpagam Alumni
          </h1>
          <p className="text-gray-600">Connect with your college community</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-md rounded-lg px-8 py-6 space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Welcome Back!
          </h2>

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
                { value: "student", label: "Student" },
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="ddmmyyyy"
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
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

          {/* Divider */}
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-gray-300" />
            <span className="mx-3 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 rounded transition duration-200 disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
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
              <div className="text-green-600 text-lg font-semibold mb-2">
                Check your mail
              </div>
              <div className="text-gray-700 mb-4">
                A password reset link has been sent to your email.
              </div>
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

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

function ErrorBanner({ message }) {
  return (
    <div className="bg-red-100 text-red-800 px-4 py-2 rounded text-sm text-center">
      {message}
    </div>
  );
}

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
