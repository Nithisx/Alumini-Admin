import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../lib/axiosInstance";
import { storeLoginCredential } from "../lib/authToken";
import { useDispatch } from "react-redux";
import { seedFromLogin } from "../store/permissionsSlice";
import { toast } from "react-toastify";
import kahelogo from "../assets/KAHEAA.svg";
import { API_BASE } from "../config/api";
import { getSupabaseClient } from "../lib/supabaseClient";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

function defaultDashboard() {
  return "/dashboard";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Save the redirect path if it exists in location state
  useEffect(() => {
    if (location.state?.from) {
      const fromPath =
        location.state.from.pathname +
        (location.state.from.search || "") +
        (location.state.from.hash || "");
      const authPaths = ["/login", "/signup", "/oauth-signup"];
      if (location.state.from.isRelative || !authPaths.includes(location.state.from.pathname)) {
        if (location.state.from.isRelative) {
          sessionStorage.setItem("login_redirect_relative", fromPath);
        } else {
          sessionStorage.setItem("login_redirect_to", fromPath);
        }
      }
    }
  }, [location.state]);

  const redirectAfterLogin = useCallback((roleKey) => {
    const redirectTo = sessionStorage.getItem("login_redirect_to");
    const redirectRelative = sessionStorage.getItem("login_redirect_relative");
    
    sessionStorage.removeItem("login_redirect_to");
    sessionStorage.removeItem("login_redirect_relative");

    const targetRolePrefix = (roleKey === "alumni" || roleKey === "student") ? "alumni" : roleKey;

    if (redirectRelative) {
      navigate(`/${targetRolePrefix}${redirectRelative}`, { replace: true });
    } else if (redirectTo) {
      // Check if redirectTo starts with a role prefix
      const match = redirectTo.match(/^\/(admin|staff|alumni|student)(\/.*)?$/);
      if (match) {
        const remainingPath = match[2] || "";
        navigate(`/${targetRolePrefix}${remainingPath}`, { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } else {
      navigate(defaultDashboard(roleKey), { replace: true });
    }
  }, [navigate]);

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  // OAuthComplete (the post-Google-redirect landing page) sends us here with
  // ?oauth=pending or ?oauth=error on non-login outcomes — the "login"
  // outcome redirects straight to a dashboard instead.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthResult = params.get("oauth");
    if (oauthResult === "pending") {
      toast.info("Your account is pending admin approval. You will be notified once approved.");
      navigate("/login", { replace: true });
    } else if (oauthResult === "error") {
      toast.error("Google sign-in failed. Please try again.");
      navigate("/login", { replace: true });
    }
  }, [location.search, navigate]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();

    if (form.username.length > 100) {
      toast.error("Username too long (max 100 characters)");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/login/", {
        username: form.username,
        password: form.password,
      });

      if (data.jwt || data.token) {
        storeLoginCredential(data, data.role_key);
        dispatch(seedFromLogin(data));
        toast.success("Logged in successfully!");
        redirectAfterLogin(data.role_key);
      } else {
        toast.error(data.error || "Login failed: no token received");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.error || err.message || "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [form, redirectAfterLogin]);

  const handleGoogleLogin = useCallback(async () => {
    setOauthLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/oauth/complete` },
      });
      if (error) {
        toast.error(error.message || "Failed to start Google sign-in.");
        setOauthLoading(false);
      }
      // On success the browser navigates away immediately — nothing more to do here.
    } catch (err) {
      toast.error(err.message || "Google sign-in is not available right now.");
      setOauthLoading(false);
    }
  }, []);

  const handleForgotPassword = async () => {
    if (!form.username) {
      toast.warning("Please enter your email to reset password.");
      return;
    }
    setForgotLoading(true);
    try {
      await api.post("/forgot-password/", { email: form.username });
      toast.success("Password reset link sent! Check your email.");
    } catch (err) {
      toast.error(
        err.response?.data?.error || err.message || "Failed to send reset email."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  if (oauthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <img src={kahelogo} alt="Logo" className="mx-auto h-20 sm:h-24 w-auto max-w-[260px] object-contain mb-4" />
          <p className="text-green-600 font-semibold text-lg">Signing you in with Google...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <img src={kahelogo} alt="Logo" className="mx-auto h-20 sm:h-24 w-auto max-w-[260px] object-contain drop-shadow-md" />
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-lg rounded-2xl px-6 sm:px-8 py-6 space-y-4 border border-gray-100"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
            Welcome Back!
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
              <input
                name="username"
                type="text"
                placeholder="Enter your username or email"
                value={form.username}
                onChange={handleChange}
                maxLength={100}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
              onClick={() => navigate("/signup")}
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
