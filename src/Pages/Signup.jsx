import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from '../assets/kahelogo.png';

const GOOGLE_CLIENT_ID = "195496576009-gtr2g4ggce9meb82n5atq00qdddri6bh.apps.googleusercontent.com";
const SIGNUP_OTP_URL    = "http://134.209.157.195:8000/signup-otp/";
const SIGNUP_URL        = "http://134.209.157.195:8000/signup/";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    phone: "",
    college_name: "",
    password: "",
    confirm_password: "",
    otp: "",
  });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpSent, setIsOtpSent]     = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Helper: merge new values into formData
  const updateField = useCallback((field, value) => {
    setFormData(fd => ({ ...fd, [field]: value }));
    setFieldErrors(fe => ({ ...fe, [field]: "" }));
  }, []);

  // Decode JWT credential from Google
  const decodeJwt = token => {
    const base64Url = token.split('.')[1];
    const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json      = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(json);
  };

  // Google callback
  const handleGoogleResponse = useCallback(res => {
    try {
      const profile = decodeJwt(res.credential);
      updateField("first_name", profile.given_name || "");
      updateField("last_name",  profile.family_name || "");
      updateField("email",      profile.email || "");
      updateField("username",   profile.email?.split("@")[0] || "");
      setIsOtpSent(false);   // force re-send OTP if email changed
    } catch {
      console.warn("Failed to parse Google token");
    }
  }, [updateField]);

  // Load GSI SDK & render button
  useEffect(() => {
    const script = document.createElement("script");
    script.src   = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", text: "continue_with" }
      );
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, [handleGoogleResponse]);

  const validateForm = () => {
    const errs = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.first_name.trim())    errs.first_name    = "First name is required";
    if (!formData.last_name.trim())     errs.last_name     = "Last name is required";
    if (!formData.email.trim())         errs.email         = "Email is required";
    else if (!emailRx.test(formData.email)) errs.email     = "Invalid email format";
    if (!formData.username.trim())      errs.username      = "Username is required";
    if (!formData.phone.trim())         errs.phone         = "Phone number is required";
    if (!formData.college_name.trim())  errs.college_name  = "College name is required";
    if (formData.password.length < 8)   errs.password      = "Password must be at least 8 characters";
    if (formData.password !== formData.confirm_password)
                                         errs.confirm_password = "Passwords don't match";
    if (!isOtpSent)                     errs.otp           = "Please send OTP first";
    else if (!formData.otp.trim())      errs.otp           = "OTP is required";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setFieldErrors({ email: "Email is required" });
      return;
    }
    setIsSendingOtp(true);
    try {
      await axios.post(SIGNUP_OTP_URL, { email: formData.email });
      setIsOtpSent(true);
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        name: `${formData.first_name} ${formData.last_name}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        college_name: formData.college_name,
        password: formData.password,
        otp: formData.otp,
        role: "Staff",
        work_experience: 0.0,
      };
      const { data } = await axios.post(SIGNUP_URL, payload);
      if (data.token) {
        setShowSuccess(true);
        setTimeout(() => navigate("/login"), 5000);
      }
    } catch (e) {
      const srv = e.response?.data || {};
      setFieldErrors(srv);
      setError(srv.non_field_errors?.[0] || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const {
    first_name, last_name, email, username,
    phone, college_name, password, confirm_password, otp
  } = formData;

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col justify-center px-4">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg animate-pulse text-center">
            <h2 className="text-2xl font-semibold mb-2">Registration Successful!</h2>
            <p>Please wait for admin approval and check your email.</p>
          </div>
        </div>
      )}

      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <img className="mx-auto h-16 w-auto" src={kahelogo} alt="Logo" />
          <h1 className="text-2xl font-bold text-green-600 mt-2">Karpagam Alumni</h1>
        </div>

        <div className="bg-white shadow-md rounded-lg px-8 py-6 space-y-4">
          <div id="googleSignInDiv" className="flex justify-center"></div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Account!</h2>
          <p className="text-gray-600">Join the alumni community</p>

          {error && (
            <div className="flex items-center bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Name Pair */}
          <div className="grid grid-cols-2 gap-2">
            <InputField
              value={first_name} onChange={v => updateField("first_name", v)}
              placeholder="First Name" error={fieldErrors.first_name}
            />
            <InputField
              value={last_name}  onChange={v => updateField("last_name", v)}
              placeholder="Last Name"  error={fieldErrors.last_name}
            />
          </div>

          {/* Username */}
          <InputField
            value={username} onChange={v => updateField("username", v)}
            placeholder="Username" error={fieldErrors.username}
          />

          {/* Email + OTP */}
          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <InputField
                  value={email} onChange={v => updateField("email", v)}
                  placeholder="Email" error={fieldErrors.email}
                  type="email"
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp || isOtpSent}
                className="bg-green-600 text-white px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSendingOtp ? "Sending..." : isOtpSent ? "Sent ✓" : "Send OTP"}
              </button>
            </div>
            {isOtpSent && (
              <InputField
                value={otp} onChange={v => updateField("otp", v)}
                placeholder="Enter OTP" error={fieldErrors.otp}
              />
            )}
          </div>

          {/* Phone & College */}
          <div className="space-y-2">
            <InputField
              value={phone} onChange={v => updateField("phone", v)}
              placeholder="Phone Number" error={fieldErrors.phone}
            />
            <InputField
              value={college_name} onChange={v => updateField("college_name", v)}
              placeholder="College Name" error={fieldErrors.college_name}
            />
          </div>

          {/* Password */}
          <PasswordField
            value={password} show={showPassword}
            toggleShow={() => setShowPassword(s => !s)}
            onChange={v => updateField("password", v)}
            placeholder="Password" error={fieldErrors.password}
          />

          {/* Confirm Password */}
          <PasswordField
            value={confirm_password} show={showConfirmPassword}
            toggleShow={() => setShowConfirmPassword(s => !s)}
            onChange={v => updateField("confirm_password", v)}
            placeholder="Confirm Password" error={fieldErrors.confirm_password}
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center">
            <span className="text-gray-600">Already have an account? </span>
            <button onClick={() => navigate("/login")} className="text-green-600 font-bold hover:underline">
              Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          By signing up, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// Reusable text input
function InputField({ value, onChange, placeholder, error, type = "text" }) {
  return (
    <div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

// Reusable password input with toggle
function PasswordField({ value, onChange, show, toggleShow, placeholder, error }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600"
      >
        {show ? "Hide" : "Show"}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
