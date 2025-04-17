import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from "../assets/kahelogo.png";

// API Endpoints
const SIGNUP_OTP_URL = "http://134.209.157.195:8000/signup-otp/";
const SIGNUP_URL = "http://134.209.157.195:8000/signup/";

// Required fields for validation
const REQUIRED_FIELDS = [
  "first_name", "last_name", "email", "username", "phone",
  "college_name", "roll_no", "course", "stream", "course_start_year",
  "course_end_year", "current_work", "experience_role", "experience_years",
  "passed_out_year"
];

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", username: "", phone: "", college_name: "",
    roll_no: "", course: "", stream: "", course_start_year: "", course_end_year: "",
    passed_out_year: "", current_work: "", experience_role: "", experience_years: "",
    password: "", confirm_password: "", otp: ""
  });

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

  // Validation
  const validate = () => {
    const errors = {};

    REQUIRED_FIELDS.forEach(field => {
      if (!formData[field]?.trim()) {
        errors[field] = "This field is required";
      }
    });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Invalid email format";

    if (formData.password.length < 8)
      errors.password = "Password must be at least 8 characters";

    if (formData.password !== formData.confirm_password)
      errors.confirm_password = "Passwords do not match";

    if (!isOtpSent)
      errors.otp = "Please send the OTP to verify your email";
    else if (!formData.otp.trim())
      errors.otp = "OTP is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }

    setIsSendingOtp(true);
    try {
      await axios.post(SIGNUP_OTP_URL, { email: formData.email });
      setIsOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Signup Handler
  const handleSignup = async () => {
    if (!validate()) return;
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
        role: "Student",
        roll_no: formData.roll_no,
        course: formData.course,
        stream: formData.stream,
        course_start_year: formData.course_start_year,
        course_end_year: formData.course_end_year,
        passed_out_year: formData.passed_out_year,
        current_work: formData.current_work,
        experience: {
          role: formData.experience_role,
          years: formData.experience_years
        }
      };

      const { data } = await axios.post(SIGNUP_URL, payload);

      if (data.token) {
        setShowSuccess(true);
        setTimeout(() => navigate("/login"), 5000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Signup error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 bg-gray-100">
      {showSuccess && (
        <SuccessMessage />
      )}

      <div className="max-w-xl w-full mx-auto">
        <div className="text-center mb-8">
          <img src={kahelogo} alt="Logo" className="h-16 mx-auto" />
          <h1 className="mt-2 text-2xl font-bold text-green-600">Karpagam Alumni</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
          {error && <Alert message={error} />}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-2">
            <InputField {...inputProps("first_name")} />
            <InputField {...inputProps("last_name")} />
          </div>

          {[
            "username", "email", "phone", "college_name", "roll_no", "course",
            "stream", "course_start_year", "course_end_year", "passed_out_year",
            "current_work", "experience_role", "experience_years"
          ].map(field => (
            <InputField key={field} {...inputProps(field)} />
          ))}

          <button
            onClick={handleSendOtp}
            disabled={isSendingOtp || isOtpSent}
            className="btn"
          >
            {isSendingOtp ? "Sending..." : isOtpSent ? "OTP Sent ✓" : "Send OTP"}
          </button>

          {isOtpSent && <InputField {...inputProps("otp")} />}

          <PasswordField
            value={formData.password}
            onChange={v => updateField("password", v)}
            placeholder="Password"
            error={fieldErrors.password}
            show={showPassword}
            toggleShow={() => setShowPassword(prev => !prev)}
          />
          <PasswordField
            value={formData.confirm_password}
            onChange={v => updateField("confirm_password", v)}
            placeholder="Confirm Password"
            error={fieldErrors.confirm_password}
            show={showConfirmPassword}
            toggleShow={() => setShowConfirmPassword(prev => !prev)}
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-green-600 hover:underline font-medium">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  function inputProps(field) {
    return {
      value: formData[field],
      onChange: v => updateField(field, v),
      placeholder: field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      error: fieldErrors[field]
    };
  }
}

// ----------------------
// Helper Components
// ----------------------

function InputField({ value, onChange, placeholder, error, type = "text" }) {
  return (
    <div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

function PasswordField({ value, onChange, placeholder, error, show, toggleShow }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600 ${
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

function Alert({ message }) {
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded">
      {message}
    </div>
  );
}

function SuccessMessage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <div className="bg-green-100 border-green-400 text-green-700 p-6 rounded shadow text-center animate-pulse">
        <h2 className="text-2xl font-semibold mb-2">Registration Successful!</h2>
        <p>Please wait for admin approval and check your email.</p>
      </div>
    </div>
  );
}
