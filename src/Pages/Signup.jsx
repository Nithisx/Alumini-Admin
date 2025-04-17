import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from '../assets/kahelogo.png';

const SIGNUP_OTP_URL = "http://134.209.157.195:8000/signup-otp/";
const SIGNUP_URL     = "http://134.209.157.195:8000/signup/";

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
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [fieldErrors, setFieldErrors]   = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpSent, setIsOtpSent]       = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // New: show success overlay
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name.trim())    errors.first_name    = "First name is required";
    if (!formData.last_name.trim())     errors.last_name     = "Last name is required";
    if (!formData.email.trim())         errors.email         = "Email is required";
    if (formData.email && !emailRegex.test(formData.email))
      errors.email = "Invalid email format";
    if (!formData.username.trim())      errors.username      = "Username is required";
    if (!formData.phone.trim())         errors.phone         = "Phone number is required";
    if (!formData.college_name.trim())  errors.college_name  = "College name is required";
    if (formData.password.length < 8)   
      errors.password     = "Password must be at least 8 characters";
    if (formData.password !== formData.confirm_password)
      errors.confirm_password = "Passwords don't match";
    if (!isOtpSent)                     errors.otp          = "Please send OTP first";
    if (isOtpSent && !formData.otp.trim())
      errors.otp = "OTP is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setFieldErrors({ email: "Email is required" });
      return;
    }
    try {
      setIsSendingOtp(true);
      const res = await axios.post(SIGNUP_OTP_URL, { email: formData.email });
      if (res.status === 200) {
        setIsOtpSent(true);
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const signupData = {
        name: `${formData.first_name} ${formData.last_name}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        college_name: formData.college_name,
        password: formData.password,
        otp: formData.otp,
        role: "Staff",
        work_experience: 0.0
      };
      const response = await axios.post(SIGNUP_URL, signupData);

      if (response.data?.token) {
        setShowSuccess(true);
        setTimeout(() => navigate("/login"), 5000);
      }
    } catch (err) {
      const srv = err.response?.data || {};
      setFieldErrors(srv);
      setError(srv.non_field_errors?.[0] || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

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

        <div className="bg-white shadow-md rounded-lg px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account!</h2>
          <p className="text-gray-600 mb-4">Join the alumni community</p>

          {error && (
            <div className="flex items-center bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-4">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* First & Last Name */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.first_name}
              onChange={e => handleChange("first_name", e.target.value)}
              className={`w-full border ${fieldErrors.first_name ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 mb-2`}
            />
            {fieldErrors.first_name && <p className="text-red-500 text-sm mb-2">{fieldErrors.first_name}</p>}

            <input
              type="text"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={e => handleChange("last_name", e.target.value)}
              className={`w-full border ${fieldErrors.last_name ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600`}
            />
            {fieldErrors.last_name && <p className="text-red-500 text-sm mb-2">{fieldErrors.last_name}</p>}
          </div>

          {/* Username */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={e => handleChange("username", e.target.value)}
              className={`w-full border ${fieldErrors.username ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600`}
            />
            {fieldErrors.username && <p className="text-red-500 text-sm mb-2">{fieldErrors.username}</p>}
          </div>

          {/* Email + OTP */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={e => handleChange("email", e.target.value)}
                className={`w-full border ${fieldErrors.email ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600`}
              />
              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp || isOtpSent}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                {isSendingOtp ? "Sending..." : isOtpSent ? "Sent ✓" : "Send OTP"}
              </button>
            </div>
            {fieldErrors.email && <p className="text-red-500 text-sm mb-2">{fieldErrors.email}</p>}

            {isOtpSent && (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={e => handleChange("otp", e.target.value)}
                  className={`w-full border ${fieldErrors.otp ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 mt-2`}
                />
                {fieldErrors.otp && <p className="text-red-500 text-sm mb-2">{fieldErrors.otp}</p>}
              </>
            )}
          </div>

          {/* Phone & College */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={e => handleChange("phone", e.target.value)}
              className={`w-full border ${fieldErrors.phone ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 mb-2`}
            />
            {fieldErrors.phone && <p className="text-red-500 text-sm mb-2">{fieldErrors.phone}</p>}

            <input
              type="text"
              placeholder="College Name"
              value={formData.college_name}
              onChange={e => handleChange("college_name", e.target.value)}
              className={`w-full border ${fieldErrors.college_name ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600`}
            />
            {fieldErrors.college_name && <p className="text-red-500 text-sm mb-2">{fieldErrors.college_name}</p>}
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={e => handleChange("password", e.target.value)}
              className={`w-full border ${fieldErrors.password ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {fieldErrors.password && <p className="text-red-500 text-sm mt-2">{fieldErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="mb-6 relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={formData.confirm_password}
              onChange={e => handleChange("confirm_password", e.target.value)}
              className={`w-full border ${fieldErrors.confirm_password ? "border-red-500" : "border-gray-300"} rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
            {fieldErrors.confirm_password && <p className="text-red-500 text-sm mt-2">{fieldErrors.confirm_password}</p>}
          </div>

          {/* Submit */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition duration-200"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="mt-4 text-center">
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
