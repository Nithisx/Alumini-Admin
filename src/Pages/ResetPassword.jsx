import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../lib/axiosInstance";
import kahelogo from "../assets/KAHEAA.svg";
import { API_BASE } from "../config/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.25-2.61A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.965 9.965 0 01-4.293 5.03M15 12a3 3 0 11-6 0 3 3 0 016 0zm-6.364 6.364l12.728-12.728" />
    </svg>
  );
}

function passwordStrength(pw) {
  if (!pw) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Very Weak", color: "bg-red-500", width: "20%" };
  if (score === 2) return { label: "Weak", color: "bg-orange-400", width: "40%" };
  if (score === 3) return { label: "Moderate", color: "bg-yellow-400", width: "60%" };
  if (score === 4) return { label: "Strong", color: "bg-green-500", width: "80%" };
  return { label: "Very Strong", color: "bg-green-600", width: "100%" };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [message, setMessage] = useState("");

  const strength = passwordStrength(newPassword);
  const invalidLink = !uid || !token;

  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => navigate("/login", { replace: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setStatus(null);
    setMessage("");
    try {
      const { data } = await api.post("/reset-password/", { uid, token, new_password: newPassword });
      setStatus("success");
      setMessage(data.message || "Password reset successful! Redirecting to login...");
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.error ||
        err.message ||
        "Failed to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <img src={kahelogo} alt="Logo" className="mx-auto h-20 sm:h-24 w-auto max-w-[260px] object-contain drop-shadow-md" />
        </div>

        <div className="bg-white shadow-lg rounded-2xl px-6 sm:px-8 py-6 space-y-5 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 text-center">Set New Password</h2>

          {invalidLink ? (
            <div className="text-center space-y-3">
              <p className="text-red-600 text-sm">This reset link is invalid or has expired.</p>
              <button
                onClick={() => navigate("/login")}
                className="text-green-600 hover:underline text-sm font-medium"
              >
                Back to Login
              </button>
            </div>
          ) : status === "success" ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-green-700 font-semibold">{message}</p>
              <p className="text-gray-500 text-sm">Redirecting to login in 3 seconds...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === "error" && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                  {message}
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  >
                    <EyeIcon open={showNew} />
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-1.5">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className="text-xs mt-0.5 text-gray-500">Strength: <span className="font-medium">{strength.label}</span></p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-0.5">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition duration-200 disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <p className="text-center text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-green-600 hover:underline"
                >
                  Back to Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
