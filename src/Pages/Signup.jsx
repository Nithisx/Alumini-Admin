import React, { useState, useCallback, useEffect, useMemo } from "react";

const SIGNUP_OTP_URL = "https://xyndrix.me/api/signup-otp/";
const SIGNUP_URL = "https://xyndrix.me/api/signup/";

// Updated REQUIRED_FIELDS with branch instead of course
const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "username",
  "country_code",
  "phone",
  "college_name",
  "roll_no",
  "course",
  "role",
  "course_start_year",
  "course_end_year",
  "passed_out_year",
  "date_of_birth",
  "gender",
  "password",
  "confirm_password",
  "otp",
];

const CHAPTERS = [
  "KAHE CHAPTER CHENNAI",
  "KAHE CHAPTER COIMBATORE",
  "KAHE CHAPTER TRICHY",
];

const ROLES = ["Student", "Alumni", "Staff"];
const GENDERS = ["Male", "Female", "Other"];

// Updated college names
const COLLEGE_NAMES = [
  "FASCM-Faculty of Arts, Science, Commerce and Management",
  "FOADP-Faculty of Architecture, Designing and Planning",
  "FOE-Faculty of Engineering",
  "FOP-Faculty of Pharmacy",
];

// Course and Branch mapping
const COURSES = [
  "Bachelor of Architecture",
  "Bachelor of Arts",
  "Bachelor of Business Administration",
  "Bachelor of Commerce",
  "Bachelor of Computer Applications",
  "Bachelor of Design",
  "Bachelor of Engineering",
  "Bachelor of Pharmacy",
  "Bachelor of Science",
  "Bachelor of Technology",
  "Master of Architecture",
  "Master of Building and Engineering Management",
  "Master of Business Administration",
  "Master of Commerce",
  "Master of Computer Applications",
  "Master of Engineering",
  "Master of Planning",
  "Master of Science",
];

const COURSE_BRANCH_MAPPING = {
  "Bachelor of Architecture": ["General"],
  "Bachelor of Arts": ["English Literature", "General"],
  "Bachelor of Business Administration": [
    "General",
    "Business Process Services",
  ],
  "Bachelor of Commerce": ["General", "Professional Accounting"],
  "Bachelor of Computer Applications": ["Computer Application", "General"],
  "Bachelor of Design": ["Interior Design", "General"],
  "Bachelor of Engineering": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science Engineering",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Information Technology",
    "Mechanical Engineering",
  ],
  "Bachelor of Pharmacy": ["Pharmacy"],
  "Bachelor of Science": [
    "BioTechnology",
    "Biochemistry",
    "Bioinformatics",
    "Chemistry",
    "Cognitive Science",
    "Computer Science",
    "Computer Technology",
    "Mathematics",
    "Microbiology",
    "Physics",
    "General",
  ],
  "Bachelor of Technology": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science Engineering",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Information Technology",
    "Mechanical Engineering",
  ],
  "Master of Architecture": ["General"],
  "Master of Building and Engineering Management": ["General"],
  "Master of Business Administration": ["General", "Business Process Services"],
  "Master of Commerce": ["General", "Professional Accounting"],
  "Master of Computer Applications": ["Computer Application", "General"],
  "Master of Engineering": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science Engineering",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Information Technology",
    "Mechanical Engineering",
    "Power Electronics and Drives",
    "Power System Engineering",
    "Structural Engineering",
    "Structural Engineering (Part Time)",
    "VLSI",
    "Water Resources And Environmental Engineering",
  ],
  "Master of Planning": ["General"],
  "Master of Science": [
    "BioTechnology",
    "Biochemistry",
    "Bioinformatics",
    "Chemistry",
    "Cognitive Science",
    "Computer Science",
    "Computer Technology",
    "Mathematics",
    "Microbiology",
    "Physics",
    "General",
  ],
};

// Remove old courses array and update function
const InputField = React.memo(
  ({ value, onChange, placeholder, error, type, required = true }) => (
    <div className="mb-4">
      <input
        type={
          type === "password"
            ? "password"
            : type === "number"
            ? "number"
            : type === "email"
            ? "email"
            : "text"
        }
        className={`w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${placeholder}${required ? " *" : ""}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
);

const AppDropdown = React.memo(
  ({ label, items, selectedValue, onValueChange, error }) => (
    <div className="mb-4">
      <label className="block text-gray-600 text-sm mb-2">{label} *</label>
      <select
        className={`w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        value={selectedValue}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="">{`Select ${label}`}</option>
        {items.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
);

const Signup = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    country_code: "+91",
    phone: "",
    college_name: "",
    roll_no: "",
    course: "",
    branch: "",
    role: "",
    course_start_year: "",
    course_end_year: "",
    passed_out_year: "",
    date_of_birth: "",
    gender: "",
    password: "",
    confirm_password: "",
    otp: "",
    profile_photo: "",
  });

  const [signLoading, setSignLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Memoized available branches based on selected course
  const availableBranches = useMemo(() => {
    if (!formData.course) return [];
    return COURSE_BRANCH_MAPPING[formData.course] || [];
  }, [formData.course]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // If course changes, reset branch
      if (field === "course") {
        newData.branch = "";
      }
      return newData;
    });
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

  // Update the validation function to skip chapter for Staff
  const validate = useCallback(() => {
    const errors = {};

    // Check required fields
    REQUIRED_FIELDS.forEach((field) => {
      // Skip validation for Staff-specific fields when role is Staff
      if (
        formData.role === "Staff" &&
        (field === "roll_no" ||
          field === "course_end_year" ||
          field === "passed_out_year")
      ) {
        return;
      }

      if (!formData[field]?.trim()) {
        errors[field] = "This field is required";
      }
    });

    // Special validation for OTP - only required if OTP was sent
    if (isOtpSent && !formData.otp?.trim()) {
      errors.otp = "OTP is required";
    } else if (!isOtpSent) {
      delete errors.otp;
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    // Password validation
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    // Phone validation
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be 10 digits";
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (
      formData.course_start_year &&
      (parseInt(formData.course_start_year) < 1900 ||
        parseInt(formData.course_start_year) > currentYear + 5)
    ) {
      errors.course_start_year = "Please enter a valid start year";
    }
    if (
      formData.course_end_year &&
      (parseInt(formData.course_end_year) < 1900 ||
        parseInt(formData.course_end_year) > currentYear + 10)
    ) {
      errors.course_end_year = "Please enter a valid end year";
    }
    if (
      formData.passed_out_year &&
      (parseInt(formData.passed_out_year) < 1900 ||
        parseInt(formData.passed_out_year) > currentYear + 10)
    ) {
      errors.passed_out_year = "Please enter a valid passed out year";
    }

    console.log("Validation errors:", errors);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isOtpSent]);

  const handleSendOtp = useCallback(async () => {
    if (!formData.email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFieldErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      return;
    }

    setLoading(true);
    try {
      console.log("Sending OTP to:", formData.email);
      const response = await fetch(SIGNUP_OTP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      console.log("OTP Response:", data);

      setIsOtpSent(true);
      setResendTimer(120);
      setError("");
      alert("OTP sent to your email address");
    } catch (err) {
      console.error("OTP Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }, [formData.email]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const pickProfilePhoto = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            updateField("profile_photo", event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } catch (error) {
      console.error("Image picker error:", error);
      alert("Failed to pick image");
    }
  };

  const handleSignup = useCallback(async () => {
    console.log("=== SIGNUP ATTEMPT ===");
    console.log("Form data:", formData);
    console.log("Is OTP sent:", isOtpSent);

    // Check if OTP is sent first
    if (!isOtpSent) {
      setError("Please send and verify OTP first");
      alert("Please send OTP to your email first");
      return;
    }

    // Validate form
    if (!validate()) {
      console.log("Validation failed, errors:", fieldErrors);
      setError("Please fill all required fields correctly");
      return;
    }

    setSignLoading(true);
    setError("");

    try {
      // Prepare form data for multipart upload
      const payload = new FormData();

      // Add all text fields
      Object.keys(formData).forEach((key) => {
        if (key !== "profile_photo" && formData[key]) {
          payload.append(key, formData[key]);
        }
      });

      // Add full name
      payload.append("name", `${formData.first_name} ${formData.last_name}`);

      // Handle profile photo if selected
      if (formData.profile_photo) {
        // Convert base64 to blob for form data
        const response = await fetch(formData.profile_photo);
        const blob = await response.blob();
        payload.append("profile_photo", blob, "profile_photo.jpg");
      }
      // Always send the role field, even if it's 'Student'
      if (formData.role) {
        payload.set("role", formData.role);
      }

      console.log("Sending signup request...");
      const response = await fetch(SIGNUP_URL, {
        method: "POST",
        body: payload,
      });
      const data = await response.json();
      console.log("Signup response:", data);

      if (data.success || data.token || response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Handle navigation to login page here
          window.location.href = "/login";
        }, 9000);
      } else {
        setError(data.error || data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSignLoading(false);
    }
  }, [formData, validate, isOtpSent, fieldErrors]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-bold text-green-600 mb-4">
              Registration Successful!
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Your account is pending admin approval. We will review your
              request shortly. You will receive an email once your account is
              approved.
            </p>
            <p className="text-gray-500 text-sm italic">
              Redirecting to login page...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Profile Photo Section */}
        <div className="text-center mb-8">
          {formData.profile_photo ? (
            <img
              src={formData.profile_photo}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto flex items-center justify-center">
              <span className="text-gray-600 text-sm">No Photo</span>
            </div>
          )}
          <button
            onClick={pickProfilePhoto}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Upload Profile Photo
          </button>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
            Sign Up
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              value={formData.first_name}
              onChange={(v) => updateField("first_name", v)}
              placeholder="First Name"
              error={fieldErrors.first_name}
            />
            <InputField
              value={formData.last_name}
              onChange={(v) => updateField("last_name", v)}
              placeholder="Last Name"
              error={fieldErrors.last_name}
            />
          </div>

          <InputField
            value={formData.email}
            onChange={(v) => updateField("email", v)}
            placeholder="Email"
            error={fieldErrors.email}
            type="email"
          />

          <InputField
            value={formData.username}
            onChange={(v) => updateField("username", v)}
            placeholder="Username"
            error={fieldErrors.username}
          />

          <div className="grid grid-cols-3 gap-4">
            <InputField
              value={formData.country_code}
              onChange={(v) => updateField("country_code", v)}
              placeholder="Code"
              error={fieldErrors.country_code}
            />
            <div className="col-span-2">
              <InputField
                value={formData.phone}
                onChange={(v) => updateField("phone", v)}
                placeholder="Phone"
                error={fieldErrors.phone}
                type="number"
              />
            </div>
          </div>
          <AppDropdown
            label="Role"
            items={ROLES}
            selectedValue={formData.role}
            onValueChange={(v) => updateField("role", v)}
            error={fieldErrors.role}
          />
          <AppDropdown
            label="College Name"
            items={COLLEGE_NAMES}
            selectedValue={formData.college_name}
            onValueChange={(v) => updateField("college_name", v)}
            error={fieldErrors.college_name}
          />

          {/* Only show Roll Number if not Staff */}
          {formData.role !== "Staff" && (
            <InputField
              value={formData.roll_no}
              onChange={(v) => updateField("roll_no", v)}
              placeholder="Roll Number"
              error={fieldErrors.roll_no}
            />
          )}

          <AppDropdown
            label="Gender"
            items={GENDERS}
            selectedValue={formData.gender}
            onValueChange={(v) => updateField("gender", v)}
            error={fieldErrors.gender}
          />

          {/* Course Selection */}
          <AppDropdown
            label="Course"
            items={COURSES}
            selectedValue={formData.course}
            onValueChange={(v) => updateField("course", v)}
            error={fieldErrors.course}
          />

          {/* Branch Selection - Only show if course is selected */}
          {formData.course && availableBranches.length > 0 && (
            <AppDropdown
              label="Branch"
              items={availableBranches}
              selectedValue={formData.branch}
              onValueChange={(v) => updateField("branch", v)}
              error={fieldErrors.branch}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              value={formData.course_start_year}
              onChange={(v) => updateField("course_start_year", v)}
              placeholder="Start Year"
              error={fieldErrors.course_start_year}
              type="number"
            />
            {formData.role !== "Staff" && (
              <InputField
                value={formData.course_end_year}
                onChange={(v) => updateField("course_end_year", v)}
                placeholder="End Year"
                error={fieldErrors.course_end_year}
                type="number"
              />
            )}
          </div>

          {/* Only show Passed Out Year if not Staff */}
          {formData.role !== "Staff" && (
            <InputField
              value={formData.passed_out_year}
              onChange={(v) => updateField("passed_out_year", v)}
              placeholder="Passed Out Year"
              error={fieldErrors.passed_out_year}
              type="number"
            />
          )}

          <div className="mb-4">
            <input
              type="date"
              className={`w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                fieldErrors.date_of_birth ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.date_of_birth}
              onChange={(e) => updateField("date_of_birth", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            {fieldErrors.date_of_birth && (
              <p className="text-red-500 text-sm mt-1">
                {fieldErrors.date_of_birth}
              </p>
            )}
          </div>

          <button
            onClick={handleSendOtp}
            disabled={resendTimer > 0 || loading}
            className={`w-full py-3 rounded-lg font-bold text-white mb-4 transition-colors ${
              resendTimer > 0 || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "Sending..."
              : resendTimer > 0
              ? `Resend OTP in ${resendTimer}s`
              : "Send OTP"}
          </button>

          {isOtpSent && (
            <InputField
              value={formData.otp}
              onChange={(v) => updateField("otp", v)}
              placeholder="Enter OTP"
              error={fieldErrors.otp}
              type="number"
            />
          )}

          <InputField
            value={formData.password}
            onChange={(v) => updateField("password", v)}
            placeholder="Password"
            error={fieldErrors.password}
            type="password"
          />

          <InputField
            value={formData.confirm_password}
            onChange={(v) => updateField("confirm_password", v)}
            placeholder="Confirm Password"
            error={fieldErrors.confirm_password}
            type="password"
          />

          <button
            onClick={handleSignup}
            disabled={signLoading}
            className={`w-full py-3 rounded-lg font-bold text-white mt-6 transition-colors ${
              signLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {signLoading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 font-bold hover:underline"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
