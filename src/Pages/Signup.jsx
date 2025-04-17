import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import kahelogo from "../assets/kahelogo.png";

const SIGNUP_OTP_URL = "http://134.209.157.195:8000/signup-otp/";
const SIGNUP_URL = "http://134.209.157.195:8000/signup/";
const COLLEGE_LIST_URL = "http://134.209.157.195:8000/colleges/";

const REQUIRED_FIELDS = [
  "first_name", "last_name", "email", "username", "phone",
  "faculty_institute", "faculty_department", "gender"
];

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", username: "", phone: "",
    faculty_institute: "", faculty_department: "", gender: "",
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
  const [resendTimer, setResendTimer] = useState(0);
  const [colleges, setColleges] = useState([]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

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

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }

    setIsSendingOtp(true);
    try {
      await axios.post(SIGNUP_OTP_URL, { email: formData.email });
      setIsOtpSent(true);
      setResendTimer(120);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const { data } = await axios.get(COLLEGE_LIST_URL);
        setColleges(data);
      } catch (err) {
        console.error("Failed to fetch colleges", err);
      }
    };
    fetchColleges();
  }, []);

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const payload = {
        first_name: `${formData.first_name} ${formData.last_name}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        college_name: formData.faculty_institute,
        faculty_institute: formData.faculty_institute,
        faculty_department: formData.faculty_department,
        gender: formData.gender,
        password: formData.password,
        otp: formData.otp,
        role: "Staff"
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
      {showSuccess && <SuccessMessage />}

      <div className="max-w-xl w-full mx-auto">
        <div className="text-center mb-8">
          <img src={kahelogo} alt="Logo" className="h-16 mx-auto" />
          <h1 className="mt-2 text-2xl font-bold text-green-600">Karpagam Alumni</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Faculty Sign Up</h2>
          {error && <Alert message={error} />}

          <div className="grid grid-cols-2 gap-2">
            <InputField {...inputProps("first_name")} />
            <InputField {...inputProps("last_name")} />
          </div>

          <InputField {...inputProps("username")} />
          <InputField {...inputProps("email")} />
          <InputField {...inputProps("phone")} />

          {/* College Dropdown */}
          <div>
            <label className="block mb-1">Faculty Institute</label>
            <select
              value={formData.faculty_institute}
              onChange={e => updateField("faculty_institute", e.target.value)}
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Select Institute</option>
              {colleges.map(college => (
                <option key={college.id} value={college.name}>{college.name}</option>
              ))}
            </select>
            {fieldErrors.faculty_institute && <p className="text-red-500 text-sm">{fieldErrors.faculty_institute}</p>}
          </div>

          <InputField {...inputProps("faculty_department")} />

          <div>
            <label className="block mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={e => updateField("gender", e.target.value)}
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {fieldErrors.gender && <p className="text-red-500 text-sm">{fieldErrors.gender}</p>}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSendOtp}
              disabled={isSendingOtp || resendTimer > 0}
              className={`btn ${isOtpSent && resendTimer === 0 ? "bg-blue-500" : "bg-green-600"}`}
            >
              {isSendingOtp
                ? "Sending..."
                : isOtpSent && resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Send OTP"}
            </button>
          </div>

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
