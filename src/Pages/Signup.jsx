import React, { useState, useCallback, useEffect, useMemo } from "react";

const SIGNUP_OTP_URL = "https://xyndrix.me/api/signup-otp/";
const SIGNUP_URL = "https://xyndrix.me/api/signup/";

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "username",
  "country_code",
  "phone",
  "college_name",
  "roll_no",
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

const ROLES = ["Student", "Alumni", "Staff"];
const GENDERS = ["Male", "Female", "Other"];

const COLLEGE_NAMES = [
  "FASCM-Faculty of Arts, Science, Commerce and Management",
  "FOADP-Faculty of Architecture, Designing and Planning",
  "FOE-Faculty of Engineering",
  "FOP-Faculty of Pharmacy",
  "KAHE",
];

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
  "Bachelor of Philosophy",
  "Master of Architecture",
  "Master of Building and Engineering Management",
  "Master of Business Administration",
  "Master of Commerce",
  "Master of Computer Applications",
  "Master of Engineering",
  "Master of Planning",
  "Master of Science",
  "Master of Pharmacy",
  "Master of Philosophy"
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
    "Computer Science Engineering(Cyber)"
  ],
  "Bachelor of Pharmacy": ["Pharmacy"],
  "Master of Pharmacy": ["Pharmacy"],
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
    "Artificial Intelligence/Data Science"
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

const InputField = React.memo(
  ({ value, onChange, placeholder, error, type, required = true, label }) => (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type || "text"}
        className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error 
            ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
            : "border-gray-300"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);

const SelectField = React.memo(
  ({ label, options, value, onChange, error, required = true }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error 
            ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
            : "border-gray-300"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameDebounceTimer, setUsernameDebounceTimer] = useState(null);

  const availableBranches = useMemo(() => {
    if (!formData.course) return [];
    return COURSE_BRANCH_MAPPING[formData.course] || [];
  }, [formData.course]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "course") {
        newData.branch = "";
      }
      return newData;
    });
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

  const validate = useCallback(() => {
    const errors = {};
    
    // Use account type instead of role for form validation
    const isStaffAccount = formData.account_type === "staff" || formData.role === "Staff";

    REQUIRED_FIELDS.forEach((field) => {
      if (
        isStaffAccount &&
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

    if (!isStaffAccount && !formData.course?.trim()) {
      errors.course = "This field is required";
    }

    if (formData.course && availableBranches.length > 0 && !formData.branch?.trim()) {
      errors.branch = "This field is required";
    }

    if (formData.username && formData.username.includes('@')) {
      errors.username = "Username cannot contain @ symbol";
    }

    if (isOtpSent && !formData.otp?.trim()) {
      errors.otp = "OTP is required";
    } else if (!isOtpSent) {
      delete errors.otp;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be 10 digits";
    }

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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isOtpSent, availableBranches]);

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
      const response = await fetch(SIGNUP_OTP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();

      setIsOtpSent(true);
      setResendTimer(120);
      setError("");
    } catch (err) {
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
    }
  };

  const handleSignup = useCallback(async () => {
    if (!isOtpSent) {
      setError("Please send and verify OTP first");
      return;
    }

    if (!validate()) {
      setError("Please fill all required fields correctly");
      return;
    }

    setSignLoading(true);
    setError("");

    try {
      const payload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key !== "profile_photo" && formData[key]) {
          payload.append(key, formData[key]);
        }
      });

      payload.append("name", `${formData.first_name} ${formData.last_name}`);

      if (formData.profile_photo) {
        const response = await fetch(formData.profile_photo);
        const blob = await response.blob();
        payload.append("profile_photo", blob, "profile_photo.jpg");
      }
      
      // Use account_type instead of role
      if (formData.role) {
        payload.set("account_type", formData.role);
        
        // Set permission flags based on role selection
        const isAdmin = formData.role === "Admin";
        const isStaff = formData.role === "Staff";
        const isAlumni = formData.role === "Alumni";
        const isStudent = formData.role === "Student";
        
        payload.set("is_admin", isAdmin ? "true" : "false");
        payload.set("is_staff", isStaff ? "true" : "false");
        payload.set("is_alumni", isAlumni ? "true" : "false");
        payload.set("is_student", isStudent ? "true" : "false");
      }

      const response = await fetch(SIGNUP_URL, {
        method: "POST",
        body: payload,
      });
      const data = await response.json();

      if (data.success || data.token || response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          window.location.href = "/login";
        }, 3000);
      } else {
        setError(data.error || data.message || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSignLoading(false);
    }
  }, [formData, validate, isOtpSent]);

  const checkUsernameAvailability = useCallback((username) => {
    if (usernameDebounceTimer) {
      clearTimeout(usernameDebounceTimer);
    }
    
    if (!username.trim()) {
      return;
    }
    
    if (username.includes('@')) {
      setFieldErrors((prev) => ({
        ...prev,
        username: "Username cannot contain @ symbol"
      }));
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await fetch(`https://xyndrix.me/api/check-username/?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        
        if (!response.ok) {
          setFieldErrors((prev) => ({
            ...prev,
            username: "Error checking username"
          }));
        } else if (data.exists || data.available === false) {
          setFieldErrors((prev) => ({
            ...prev,
            username: "This username is already taken"
          }));
        } else if (data.available === true) {
          setFieldErrors((prev) => ({
            ...prev,
            username: ""
          }));
        }
      } catch (err) {
        setFieldErrors((prev) => ({
          ...prev,
          username: "Error checking username"
        }));
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);
    
    setUsernameDebounceTimer(timer);
  }, [usernameDebounceTimer]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border w-96 shadow-lg rounded-lg bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Registration Successful</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your account is pending admin approval. You will receive an email once approved.
              </p>
              <p className="mt-4 text-xs text-gray-400">Redirecting to login...</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Join our academic community</p>
        </div>

        <div className="bg-white shadow-lg rounded-lg">
          {/* Profile Photo Section */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="shrink-0">
                {formData.profile_photo ? (
                  <img
                    className="h-20 w-20 object-cover rounded-full ring-2 ring-gray-200"
                    src={formData.profile_photo}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-500">Upload a professional photo</p>
                <button
                  type="button"
                  onClick={pickProfilePhoto}
                  className="mt-2 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <InputField
                    label="First Name"
                    value={formData.first_name}
                    onChange={(v) => updateField("first_name", v)}
                    placeholder="Enter your first name"
                    error={fieldErrors.first_name}
                  />
                  <InputField
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(v) => updateField("last_name", v)}
                    placeholder="Enter your last name"
                    error={fieldErrors.last_name}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <InputField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(v) => updateField("email", v)}
                    placeholder="Enter your email"
                    error={fieldErrors.email}
                  />
                  <div className="relative">
                    <InputField
                      label="Username"
                      value={formData.username}
                      onChange={(v) => {
                        updateField("username", v);
                        checkUsernameAvailability(v);
                      }}
                      placeholder="Choose a username"
                      error={fieldErrors.username}
                    />
                    {formData.username && (
                      <div className="absolute right-3 top-8">
                        {isCheckingUsername ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        ) : fieldErrors.username ? (
                          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-6">
                  <InputField
                    label="Country Code"
                    value={formData.country_code}
                    onChange={(v) => updateField("country_code", v)}
                    placeholder="+91"
                    error={fieldErrors.country_code}
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      label="Phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(v) => updateField("phone", v)}
                      placeholder="Enter your phone number"
                      error={fieldErrors.phone}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <SelectField
                    label="Gender"
                    options={GENDERS}
                    value={formData.gender}
                    onChange={(v) => updateField("gender", v)}
                    error={fieldErrors.gender}
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.date_of_birth 
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                          : "border-gray-300"
                      }`}
                      value={formData.date_of_birth}
                      onChange={(e) => updateField("date_of_birth", e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    {fieldErrors.date_of_birth && <p className="text-sm text-red-600">{fieldErrors.date_of_birth}</p>}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <SelectField
                    label="Role"
                    options={ROLES}
                    value={formData.role}
                    onChange={(v) => updateField("role", v)}
                    error={fieldErrors.role}
                  />
                  <SelectField
                    label="Faculty"
                    options={COLLEGE_NAMES}
                    value={formData.college_name}
                    onChange={(v) => updateField("college_name", v)}
                    error={fieldErrors.college_name}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <InputField
                    label="Roll Number"
                    value={formData.roll_no}
                    onChange={(v) => updateField("roll_no", v)}
                    placeholder="Enter your roll number"
                    error={fieldErrors.roll_no}
                    required={!isStaffAccount}
                  />
                  <SelectField
                    label="Course"
                    options={COURSES}
                    value={formData.course}
                    onChange={(v) => updateField("course", v)}
                    error={fieldErrors.course}
                    required={formData.role !== "Staff"}
                  />
                </div>

                {formData.course && availableBranches.length > 0 && (
                  <div className="mt-6">
                    <SelectField
                      label="Branch"
                      options={availableBranches}
                      value={formData.branch}
                      onChange={(v) => updateField("branch", v)}
                      error={fieldErrors.branch}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-6">
                  <InputField
                    label="Course Start Year"
                    type="number"
                    value={formData.course_start_year}
                    onChange={(v) => updateField("course_start_year", v)}
                    placeholder="2020"
                    error={fieldErrors.course_start_year}
                  />
                  <InputField
                    label="Course End Year"
                    type="number"
                    value={formData.course_end_year}
                    onChange={(v) => updateField("course_end_year", v)}
                    placeholder="2024"
                    error={fieldErrors.course_end_year}
                    required={!isStaffAccount}
                  />
                  <InputField
                    label="Passed Out Year"
                    type="number"
                    value={formData.passed_out_year}
                    onChange={(v) => updateField("passed_out_year", v)}
                    placeholder="2024"
                    error={fieldErrors.passed_out_year}
                    required={!isStaffAccount}
                  />
                </div>
              </div>

              {/* Email Verification */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Verification</h3>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-green-900">Verify your email address</p>
                      <p className="text-sm text-green-700">We'll send you a verification code</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={resendTimer > 0 || loading}
                      className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                        resendTimer > 0 || loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      }`}
                    >
                      {loading ? "Sending..." : resendTimer > 0 ? `Resend (${resendTimer}s)` : "Send OTP"}
                    </button>
                  </div>
                </div>

                {isOtpSent && (
                  <div className="mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">OTP sent to your email successfully!</p>
                        </div>
                      </div>
                    </div>
                    <InputField
                      label="Verification Code"
                      type="number"
                      value={formData.otp}
                      onChange={(v) => updateField("otp", v)}
                      placeholder="Enter 6-digit code"
                      error={fieldErrors.otp}
                    />
                  </div>
                )}
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <InputField
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(v) => updateField("password", v)}
                    placeholder="Create a strong password"
                    error={fieldErrors.password}
                  />
                  <InputField
                    label="Confirm Password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={(v) => updateField("confirm_password", v)}
                    placeholder="Confirm your password"
                    error={fieldErrors.confirm_password}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={signLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    signLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }`}
                >
                  {signLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;