import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from "../assets/kahelogo.png";

const SIGNUP_OTP_URL = "http://134.209.157.195:8000/signup-otp/";
const SIGNUP_URL     = "http://134.209.157.195:8000/signup/";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name:       "",
    last_name:        "",
    email:            "",
    username:         "",
    phone:            "",
    college_name:     "",
    password:         "",
    confirm_password: "",
    otp:              "",
  });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");      // general server/client error
  const [fieldErrors, setFieldErrors] = useState({});      // validation errors
  const [isOtpSent, setIsOtpSent]     = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // merge new values & clear that field’s error
  const updateField = useCallback((field, value) => {
    setFormData(fd => ({ ...fd, [field]: value }));
    setFieldErrors(fe => ({ ...fe, [field]: "" }));
    setError("");
  }, []);

  // client‑side validation
  const validate = () => {
    const errs = {};
    if (!formData.first_name.trim())    errs.first_name    = "First name is required";
    if (!formData.last_name.trim())     errs.last_name     = "Last name is required";
    if (!formData.email.trim())         errs.email         = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                                         errs.email         = "Invalid email format";
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

  // send OTP to email
  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setFieldErrors({ email: "Email is required" });
      return;
    }
    setIsSendingOtp(true);
    try {
      await axios.post(SIGNUP_OTP_URL, { email: formData.email });
      setIsOtpSent(true);
    } catch (e) {
      setError(e.response?.data?.error || "Unable to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // final signup
  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        first_name:            `${formData.first_name} ${formData.last_name}`,
        username:        formData.username,
        email:           formData.email,
        phone:           formData.phone,
        college_name:    formData.college_name,
        password:        formData.password,
        otp:             formData.otp,
        role:            "Staff",
        work_experience: 0.0,
      };
      const { data } = await axios.post(SIGNUP_URL, payload);
      if (data.token) {
        setShowSuccess(true);
        setTimeout(() => navigate("/login"), 5000);
      } else {
        // in case backend returns success=false without token
        setError(data.error || "Registration failed");
      }
    } catch (e) {
      // expect {"error": "Err_Message"}
      setError(e.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const {
    first_name, last_name, email, username,
    phone, college_name, password, confirm_password, otp
  } = formData;

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 bg-gray-100">
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
          <div className="bg-green-100 border-green-400 text-green-700 p-6 rounded shadow text-center animate-pulse">
            <h2 className="text-2xl font-semibold mb-2">Registration Successful!</h2>
            <p>Please wait for admin approval and check your email.</p>
          </div>
        </div>
      )}

      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <img src={kahelogo} alt="Logo" className="h-16 mx-auto" />
          <h1 className="mt-2 text-2xl font-bold text-green-600">Karpagam Alumni</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
          <p className="text-gray-600">Join the alumni community</p>

          {error && (
            <div className="flex items-center bg-red-100 border-red-300 text-red-700 px-3 py-2 rounded">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <InputField
              value={first_name} onChange={v => updateField("first_name", v)}
              placeholder="First Name" error={fieldErrors.first_name}
            />
            <InputField
              value={last_name} onChange={v => updateField("last_name", v)}
              placeholder="Last Name" error={fieldErrors.last_name}
            />
          </div>
          <InputField
            value={username} onChange={v => updateField("username", v)}
            placeholder="Username" error={fieldErrors.username}
          />

          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <InputField
                  type="email"
                  value={email} onChange={v => updateField("email", v)}
                  placeholder="Email" error={fieldErrors.email}
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp || isOtpSent}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
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

          <InputField
            value={phone} onChange={v => updateField("phone", v)}
            placeholder="Phone Number" error={fieldErrors.phone}
          />
          <InputField
            value={college_name} onChange={v => updateField("college_name", v)}
            placeholder="College Name" error={fieldErrors.college_name}
          />

          <PasswordField
            value={password} show={false} toggleShow={() => {}}
            onChange={v => updateField("password", v)}
            placeholder="Password" error={fieldErrors.password}
          />
          <PasswordField
            value={confirm_password} show={false} toggleShow={() => {}}
            onChange={v => updateField("confirm_password", v)}
            placeholder="Confirm Password" error={fieldErrors.confirm_password}
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center">
            <span className="text-gray-600">Already have an account? </span>
            <button onClick={() => navigate("/login")}
                    className="text-green-600 font-bold hover:underline">
              Sign In
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-gray-500 text-sm">
          By signing up, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function InputField({ value, onChange, placeholder, error, type = "text" }) {
  return (
    <div>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function PasswordField({ value, onChange, show, toggleShow, placeholder, error }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      <button
        type="button" onClick={toggleShow}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600"
      >
        {show ? "Hide" : "Show"}
      </button>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
