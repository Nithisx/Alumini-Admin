import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SuggestionInput from "../Components/Shared/SuggestionInput";
import { supabase } from "../lib/supabase";

const api_base = "https://api.karpagamalumni.in/api/v1";

const SIGNUP_OTP_URL = "https://api.karpagamalumni.in/api/v1/signup-otp/";
const SIGNUP_URL = "https://api.karpagamalumni.in/api/v1/signup/";
const SUGGESTIONS_API = "https://api.karpagamalumni.in/api/v1/suggestions";

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
  "country",
  "state",
  "city"
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
const STAFF_ONLY_COLLEGE = "KAHE";

const COURSES = [
  "Bachelor of Architecture",
  "Bachelor of Arts",
  "Bachelor of Business Administration",
  "Bachelor of Commerce",
  "Bachelor of Computer Applications",
  "Bachelor of Design",
  "Bachelor of Engineering",
  "Bachelor of Pharmacy",
  "Bachelor of Philosophy",
  "Bachelor of Science",
  "Bachelor of Technology",
  "Master of Architecture",
  "Master of Building and Engineering Management",
  "Master of Business Administration",
  "Master of Commerce",
  "Master of Computer Applications",
  "Master of Engineering",
  "Master of Pharmacy",
  "Master of Philosophy",
  "Master of Planning",
  "Master of Science",
  "Master of Social Work",
  "Ph.D"
];

const COURSE_BRANCH_MAPPING = {
  "Bachelor of Architecture": ["General"],
  "Bachelor of Arts": ["English Literature", "General"],
  "Bachelor of Business Administration": [
    "BBA",
    "Business Process Services",
    "General"
  ],
  "Bachelor of Commerce": ["FA", "General", "IAF", "Information Technology", "Professional Accounting", "Computer Application", "Computer Science"],
  "Bachelor of Computer Applications": ["Computer Application", "General"],
  "Bachelor of Design": ["General", "Interior Design"],
  "Bachelor of Engineering": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science and Design",
    "Computer Science Engineering",
    "Computer Science Engineering(Cyber)",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Information Technology",
    "Mechanical Engineering"
  ],
  "Bachelor of Pharmacy": ["Pharmacy"],
  "Bachelor of Science": [
    "Artificial Intelligence / Data Science",
    "Bio Chemistry",
    "Bio Informatics",
    "Bio Technology",
    "Catering Science and Hotel Management",
    "Chemistry",
    "Cognitive systems",
    "Computer Science",
    "Computer Technology",
    "General",
    "Mathematics",
    "Microbiology",
    "Physics"
  ],
  "Bachelor of Technology": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Artificial Intelligence / Data Science",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Bio Technology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science Engineering",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Mechanical Engineering"
  ],
  "Master of Architecture": ["General"],
  "Master of Building and Engineering Management": ["General"],
  "Master of Business Administration": ["Business Process Services", "General", "MBA"],
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
    "Water Resources And Environmental Engineering"
  ],
  "Master of Pharmacy": ["Pharmacy"],
  "Master of Planning": ["General"],
  "Master of Science": [
    "Bio Chemistry",
    "Bio Informatics",
    "Bio Technology",
    "Catering Science and Hotel Management",
    "Chemistry",
    "Cognitive Science",
    "Computer Science",
    "Computer Technology",
    "General",
    "Mathematics",
    "Microbiology",
    "Physics"
  ],
  "Ph.D": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Artificial Intelligence/Data Science",
    "Automobile Engineering",
    "Bio Chemistry",
    "Bio Informatics",
    "Bio Medical Engineering",
    "Bio Technology",
    "Business Process Services",
    "Chemical Engineering",
    "Chemistry",
    "Civil Engineering",
    "Cognitive Science",
    "Computer Application",
    "Computer Science",
    "Computer Science Engineering",
    "Computer Science Engineering(Cyber)",
    "Computer Technology",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "English Literature",
    "Food Technology",
    "General",
    "Information Technology",
    "Interior Design",
    "Mathematics",
    "Mechanical Engineering",
    "Microbiology",
    "Pharmacy",
    "Physics",
    "Power Electronics and Drives",
    "Power System Engineering",
    "Professional Accounting",
    "Structural Engineering",
    "Structural Engineering (Part Time)",
    "VLSI",
    "Water Resources And Environmental Engineering"
  ]
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
        className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${error
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
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${error
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

const Signup = () => {
  const navigate = useNavigate();
  const [oauthLoading, setOauthLoading] = useState(false);

  // Handle OAuth redirect callback (when Google redirects back to /signup)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setOauthLoading(true);
      try {
        const res = await fetch(`${api_base}/auth/google/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: session.access_token }),
        });
        const data = await res.json();

        if (data.status === "login" && data.token) {
          // Already registered — log them in
          const roleMap = { Admin: "admin", Staff: "staff", Alumni: "alumni", Student: "student" };
          localStorage.setItem("Token", data.token);
          localStorage.setItem("Role", roleMap[data.role] || "alumni");
          await supabase.auth.signOut();
          navigate(roleMap[data.role] === "admin" ? "/admin/dashboard" : roleMap[data.role] === "staff" ? "/staff/dashboard" : "/alumni/dashboard");
        } else if (data.status === "new_user") {
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
      } catch {
        await supabase.auth.signOut();
      } finally {
        setOauthLoading(false);
      }
    };
    handleOAuthCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleSignup = useCallback(async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/signup` },
      });
      if (error) throw error;
    } catch (err) {
      setOauthLoading(false);
    }
  }, []);

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
    country: "",
    state: "",
    city: "",
    pincode: "",
    // Optional extras — wired to PendingSignup fields
    salutation: "",
    secondary_email: "",
    bio: "",
    home_town: "",
    current_location: "",
    Address: "",
    correspondence_address: "",
    correspondence_city: "",
    correspondence_state: "",
    correspondence_country: "",
    correspondence_pincode: "",
    chapter: "",
    company: "",
    position: "",
    current_work: "",
    work_experience: "",
    facebook_link: "",
    linkedin_link: "",
    twitter_link: "",
    website_link: ""
  });

  const [showOptional, setShowOptional] = useState(false);

  const [signLoading, setSignLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameDebounceTimer, setUsernameDebounceTimer] = useState(null);

  // Suggestions state
  const [apiSuggestions, setApiSuggestions] = useState({
    usernames: [],
    emails: [],
    countryCodes: [],
    countries: [],
    states: [],
    cities: [],
    pincodes: []
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState({});
  const suggestionTimers = useRef({});

  const fetchSuggestions = useCallback(async (type, params) => {
    try {
      setLoadingSuggestions(prev => ({ ...prev, [type]: true }));
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${SUGGESTIONS_API}/signup?${query}`);
      if (res.ok) {
        const json = await res.json();

        setApiSuggestions(prev => ({
          ...prev,
          usernames: json.data?.usernameSuggestions || prev.usernames,
          emails: json.data?.emailSuggestions || prev.emails,
          countryCodes: json.data?.countryCodeSuggestions || prev.countryCodes,
          countries: json.data?.locationSuggestions?.countries || prev.countries,
          states: json.data?.locationSuggestions?.states || prev.states,
          cities: json.data?.locationSuggestions?.cities || prev.cities,
          pincodes: json.data?.locationSuggestions?.pincodes || prev.pincodes,
        }));
      }
    } catch (err) {
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  const debouncedFetch = useCallback((type, params, delay = 300) => {
    if (suggestionTimers.current[type]) {
      clearTimeout(suggestionTimers.current[type]);
    }
    suggestionTimers.current[type] = setTimeout(() => {
      fetchSuggestions(type, params);
    }, delay);
  }, [fetchSuggestions]);

  const availableBranches = useMemo(() => {
    if (!formData.course) return [];
    return COURSE_BRANCH_MAPPING[formData.course] || [];
  }, [formData.course]);

  const availableColleges = useMemo(() => {
    return formData.role === "Staff"
      ? [STAFF_ONLY_COLLEGE]
      : COLLEGE_NAMES.filter((college) => college !== STAFF_ONLY_COLLEGE);
  }, [formData.role]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "course") {
        newData.branch = "";
      }
      if (field === "role" && value !== "Staff" && prev.college_name === STAFF_ONLY_COLLEGE) {
        newData.college_name = "";
      }
      return newData;
    });
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

  const validate = useCallback(() => {
    const errors = {};

    REQUIRED_FIELDS.forEach((field) => {
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

    if (formData.role !== "Staff" && formData.college_name === STAFF_ONLY_COLLEGE) {
      errors.college_name = "Only staff can select this college";
    }

    if (formData.role !== "Staff" && !formData.course?.trim()) {
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

      if (!response.ok) {
        setError(data?.error || data?.message || "Failed to send OTP. Please try again.");
        return;
      }

      setIsOtpSent(true);
      setResendTimer(120);
      setError("");
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
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
        if (key === "profile_photo") return;
        if (key === "pincode") return; // mapped separately to zip_code
        if (formData[key]) {
          payload.append(key, formData[key]);
        }
      });

      // Map frontend `pincode` -> backend `zip_code`
      if (formData.pincode) {
        payload.append("zip_code", formData.pincode);
      }

      payload.append("name", `${formData.first_name} ${formData.last_name}`);

      if (formData.profile_photo) {
        const response = await fetch(formData.profile_photo);
        const blob = await response.blob();
        payload.append("profile_photo", blob, "profile_photo.jpg");
      }

      if (formData.role) {
        payload.set("role", formData.role);
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
        const response = await fetch(`https://api.karpagamalumni.in/api/v1/check-username/?username=${encodeURIComponent(username)}`);
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

  if (oauthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-green-600 font-semibold text-lg">Signing you in with Google...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border w-11/12 max-w-sm shadow-lg rounded-lg bg-white">
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
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-1 text-sm text-gray-500">Join our academic community</p>
        </div>

        <div className="bg-white shadow-lg rounded-2xl border border-gray-100">
          {/* Profile Photo Section */}
          <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-200">
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

          <div className="px-4 sm:px-8 py-6">
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

            {/* Google OAuth Sign Up */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={oauthLoading}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-md transition duration-200 disabled:opacity-50 shadow-sm"
              >
                <GoogleIcon />
                Sign up with Google
              </button>

              <div className="flex items-center my-5">
                <div className="flex-1 border-t border-gray-300" />
                <span className="mx-3 text-gray-400 text-sm">or fill in the form below</span>
                <div className="flex-1 border-t border-gray-300" />
              </div>
            </div>

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
                  <SuggestionInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(v) => {
                      updateField("email", v);
                      if (v.includes("@")) {
                        debouncedFetch("emails", { email: v });
                      }
                    }}
                    placeholder="Enter your email"
                    error={fieldErrors.email}
                    suggestions={apiSuggestions.emails}
                    loading={loadingSuggestions.emails}
                  />
                  <div className="relative">
                    <SuggestionInput
                      label="Username"
                      value={formData.username}
                      onChange={(v) => {
                        updateField("username", v);
                        debouncedFetch("usernames", {
                          firstName: formData.first_name,
                          lastName: formData.last_name
                        });
                        checkUsernameAvailability(v);
                      }}
                      onFocus={() => {
                        if (!apiSuggestions.usernames.length) {
                          fetchSuggestions("usernames", {
                            firstName: formData.first_name,
                            lastName: formData.last_name
                          });
                        }
                      }}
                      placeholder="Choose a username"
                      error={fieldErrors.username}
                      suggestions={apiSuggestions.usernames}
                      loading={loadingSuggestions.usernames}
                      showDropdownConditions={!fieldErrors.username}
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
                  <SuggestionInput
                    label="Country Code"
                    value={formData.country_code}
                    onChange={(v) => {
                      updateField("country_code", v);
                      debouncedFetch("countryCodes", { country: formData.country });
                    }}
                    onFocus={() => fetchSuggestions("countryCodes", { country: formData.country })}
                    placeholder="+91"
                    error={fieldErrors.country_code}
                    suggestions={apiSuggestions.countryCodes.map(c => c.countryCode)}
                    loading={loadingSuggestions.countryCodes}
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${fieldErrors.date_of_birth
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

                {/* Location Fields */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <SuggestionInput
                    label="Country"
                    value={formData.country}
                    onChange={(v) => {
                      updateField("country", v);
                      debouncedFetch("countries", { country: v });
                    }}
                    onFocus={() => fetchSuggestions("countries", { country: formData.country })}
                    placeholder="Enter country"
                    error={fieldErrors.country}
                    suggestions={apiSuggestions.countries}
                    loading={loadingSuggestions.countries}
                  />
                  <SuggestionInput
                    label="State"
                    value={formData.state}
                    onChange={(v) => {
                      updateField("state", v);
                      debouncedFetch("states", { country: formData.country, state: v });
                    }}
                    onFocus={() => fetchSuggestions("states", { country: formData.country, state: formData.state })}
                    placeholder="Enter state"
                    error={fieldErrors.state}
                    suggestions={apiSuggestions.states}
                    loading={loadingSuggestions.states}
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <SuggestionInput
                    label="City"
                    value={formData.city}
                    onChange={(v) => {
                      updateField("city", v);
                      debouncedFetch("cities", { country: formData.country, state: formData.state, city: v });
                    }}
                    onFocus={() => fetchSuggestions("cities", { country: formData.country, state: formData.state, city: formData.city })}
                    placeholder="Enter city"
                    error={fieldErrors.city}
                    suggestions={apiSuggestions.cities}
                    loading={loadingSuggestions.cities}
                  />
                  <SuggestionInput
                    label="Pincode/Zipcode"
                    value={formData.pincode}
                    required={false}
                    onChange={(v) => {
                      updateField("pincode", v);
                      debouncedFetch("pincodes", { country: formData.country, state: formData.state, city: formData.city, pincode: v });
                    }}
                    onFocus={() => fetchSuggestions("pincodes", { country: formData.country, state: formData.state, city: formData.city, pincode: formData.pincode })}
                    placeholder="Enter pincode"
                    error={fieldErrors.pincode}
                    suggestions={apiSuggestions.pincodes}
                    loading={loadingSuggestions.pincodes}
                  />
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
                    options={availableColleges}
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
                    required={formData.role !== "Staff"}
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
                    required={formData.role !== "Staff"}
                  />
                  <InputField
                    label="Passed Out Year"
                    type="number"
                    value={formData.passed_out_year}
                    onChange={(v) => updateField("passed_out_year", v)}
                    placeholder="2024"
                    error={fieldErrors.passed_out_year}
                    required={formData.role !== "Staff"}
                  />
                </div>
              </div>

              {/* Additional Information (Optional) */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowOptional((s) => !s)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Additional Information
                    </h3>
                    <p className="text-sm text-gray-500">
                      All fields below are optional — helps the admin review your profile faster
                    </p>
                  </div>
                  <span className="ml-4 text-green-600 group-hover:text-green-700">
                    {showOptional ? "Hide" : "Show"}
                  </span>
                </button>

                {showOptional && (
                  <div className="mt-5 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <InputField
                        label="Salutation"
                        value={formData.salutation}
                        onChange={(v) => updateField("salutation", v)}
                        placeholder="Mr. / Ms. / Dr."
                        required={false}
                      />
                      <InputField
                        label="Secondary Email"
                        type="email"
                        value={formData.secondary_email}
                        onChange={(v) => updateField("secondary_email", v)}
                        placeholder="alternate@example.com"
                        required={false}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        maxLength={500}
                        value={formData.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        placeholder="Tell us a bit about yourself"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <InputField
                        label="Home Town"
                        value={formData.home_town}
                        onChange={(v) => updateField("home_town", v)}
                        placeholder="Your home town"
                        required={false}
                      />
                      <InputField
                        label="Current Location"
                        value={formData.current_location}
                        onChange={(v) => updateField("current_location", v)}
                        placeholder="City you live in"
                        required={false}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        value={formData.Address}
                        onChange={(e) => updateField("Address", e.target.value)}
                        placeholder="Street / area / landmark"
                      />
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Correspondence Address</h4>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        value={formData.correspondence_address}
                        onChange={(e) => updateField("correspondence_address", e.target.value)}
                        placeholder="Correspondence address (if different)"
                      />
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-4">
                        <InputField
                          label="Correspondence City"
                          value={formData.correspondence_city}
                          onChange={(v) => updateField("correspondence_city", v)}
                          placeholder="City"
                          required={false}
                        />
                        <InputField
                          label="Correspondence State"
                          value={formData.correspondence_state}
                          onChange={(v) => updateField("correspondence_state", v)}
                          placeholder="State"
                          required={false}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                        <InputField
                          label="Correspondence Country"
                          value={formData.correspondence_country}
                          onChange={(v) => updateField("correspondence_country", v)}
                          placeholder="Country"
                          required={false}
                        />
                        <InputField
                          label="Correspondence Pincode"
                          value={formData.correspondence_pincode}
                          onChange={(v) => updateField("correspondence_pincode", v)}
                          placeholder="Pincode"
                          required={false}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Professional</h4>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <InputField
                          label="Chapter"
                          value={formData.chapter}
                          onChange={(v) => updateField("chapter", v)}
                          placeholder="Chapter / region"
                          required={false}
                        />
                        <InputField
                          label="Company"
                          value={formData.company}
                          onChange={(v) => updateField("company", v)}
                          placeholder="Current company"
                          required={false}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                        <InputField
                          label="Position"
                          value={formData.position}
                          onChange={(v) => updateField("position", v)}
                          placeholder="Your position"
                          required={false}
                        />
                        <InputField
                          label="Current Work"
                          value={formData.current_work}
                          onChange={(v) => updateField("current_work", v)}
                          placeholder="What you currently do"
                          required={false}
                        />
                      </div>
                      <div className="mt-6">
                        <InputField
                          label="Work Experience (years)"
                          type="number"
                          value={formData.work_experience}
                          onChange={(v) => updateField("work_experience", v)}
                          placeholder="e.g. 3.5"
                          required={false}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Social Links</h4>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <InputField
                          label="Facebook"
                          value={formData.facebook_link}
                          onChange={(v) => updateField("facebook_link", v)}
                          placeholder="https://facebook.com/…"
                          required={false}
                        />
                        <InputField
                          label="LinkedIn"
                          value={formData.linkedin_link}
                          onChange={(v) => updateField("linkedin_link", v)}
                          placeholder="https://linkedin.com/in/…"
                          required={false}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                        <InputField
                          label="Twitter / X"
                          value={formData.twitter_link}
                          onChange={(v) => updateField("twitter_link", v)}
                          placeholder="https://x.com/…"
                          required={false}
                        />
                        <InputField
                          label="Website"
                          value={formData.website_link}
                          onChange={(v) => updateField("website_link", v)}
                          placeholder="https://…"
                          required={false}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                      className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${resendTimer > 0 || loading
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
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${signLoading
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
