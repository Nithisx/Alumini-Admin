import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SuggestionInput from "../Components/Shared/SuggestionInput";
import { supabase } from "../lib/supabase";
import {
  COLLEGE_NAMES,
  COURSES,
  COURSE_BRANCH_MAPPING,
  STAFF_ONLY_COLLEGE,
} from "../constants/academicOptions";

const api_base = "https://api.karpagamalumni.in/api/v1";
const SUGGESTIONS_API = "https://api.karpagamalumni.in/api/v1/suggestions";

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
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
  "country",
  "state",
  "city",
];

const ROLES = ["Student", "Alumni", "Staff"];
const GENDERS = ["Male", "Female", "Other"];
const SALUTATIONS = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];

const InputField = React.memo(
  ({ value, onChange, placeholder, error, type, required = true, label, readOnly }) => (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type || "text"}
        className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""
        } ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300"
        }`}
        value={value}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
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

export default function OAuthSignupComplete() {
  const navigate = useNavigate();
  const location = useLocation();

  const prefill = location.state || {};
  const oauthAvatarUrl =
    prefill.avatar_url || sessionStorage.getItem("oauth_avatar_url") || "";

  // Guard: redirect to login if no Google data
  useEffect(() => {
    if (!prefill.email) navigate("/login", { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [formData, setFormData] = useState({
    first_name: prefill.first_name || "",
    last_name: prefill.last_name || "",
    email: prefill.email || "",
    username: "",
    country_code: "+91",
    phone: "",
    college_name: "",
    roll_no: "",
    course: "",
    branch: "",
    role: "Alumni",
    course_start_year: "",
    course_end_year: "",
    passed_out_year: "",
    date_of_birth: "",
    gender: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
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
    company: "",
    position: "",
    current_work: "",
    work_experience: "",
    facebook_link: "",
    linkedin_link: "",
    twitter_link: "",
    website_link: "",
  });

  const [showOptional, setShowOptional] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameDebounceTimer, setUsernameDebounceTimer] = useState(null);

  const [apiSuggestions, setApiSuggestions] = useState({
    usernames: [],
    countryCodes: [],
    countries: [],
    states: [],
    cities: [],
    pincodes: [],
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState({});
  const suggestionTimers = useRef({});

  const fetchSuggestions = useCallback(async (type, params) => {
    try {
      setLoadingSuggestions((prev) => ({ ...prev, [type]: true }));
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${SUGGESTIONS_API}/signup?${query}`);
      if (res.ok) {
        const json = await res.json();
        setApiSuggestions((prev) => ({
          ...prev,
          usernames: json.data?.usernameSuggestions || prev.usernames,
          countryCodes: json.data?.countryCodeSuggestions || prev.countryCodes,
          countries: json.data?.locationSuggestions?.countries || prev.countries,
          states: json.data?.locationSuggestions?.states || prev.states,
          cities: json.data?.locationSuggestions?.cities || prev.cities,
          pincodes: json.data?.locationSuggestions?.pincodes || prev.pincodes,
        }));
      }
    } catch {}
    finally {
      setLoadingSuggestions((prev) => ({ ...prev, [type]: false }));
    }
  }, []);

  const debouncedFetch = useCallback(
    (type, params, delay = 300) => {
      if (suggestionTimers.current[type]) clearTimeout(suggestionTimers.current[type]);
      suggestionTimers.current[type] = setTimeout(
        () => fetchSuggestions(type, params),
        delay
      );
    },
    [fetchSuggestions]
  );

  const availableBranches = useMemo(() => {
    if (!formData.course) return [];
    return COURSE_BRANCH_MAPPING[formData.course] || [];
  }, [formData.course]);

  const availableColleges = useMemo(() => {
    return formData.role === "Staff"
      ? COLLEGE_NAMES
      : COLLEGE_NAMES.filter((c) => c !== STAFF_ONLY_COLLEGE);
  }, [formData.role]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "course") next.branch = "";
      if (field === "role" && value !== "Staff" && prev.college_name === STAFF_ONLY_COLLEGE)
        next.college_name = "";
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

  const validate = useCallback(() => {
    const errors = {};

    REQUIRED_FIELDS.forEach((field) => {
      if (
        formData.role === "Staff" &&
        (field === "roll_no" || field === "course_end_year" || field === "passed_out_year")
      ) return;
      if (!formData[field]?.trim()) errors[field] = "This field is required";
    });

    if (formData.role !== "Staff" && formData.college_name === STAFF_ONLY_COLLEGE)
      errors.college_name = "Only staff can select this college";

    if (formData.role !== "Staff" && !formData.course?.trim())
      errors.course = "This field is required";

    if (formData.course && availableBranches.length > 0 && !formData.branch?.trim())
      errors.branch = "This field is required";

    if (formData.username && formData.username.includes("@"))
      errors.username = "Username cannot contain @ symbol";

    if (formData.phone && !/^\d{10}$/.test(formData.phone))
      errors.phone = "Phone number must be 10 digits";

    const currentYear = new Date().getFullYear();
    if (
      formData.course_start_year &&
      (parseInt(formData.course_start_year) < 1900 ||
        parseInt(formData.course_start_year) > currentYear + 5)
    ) errors.course_start_year = "Please enter a valid start year";

    if (
      formData.course_end_year &&
      (parseInt(formData.course_end_year) < 1900 ||
        parseInt(formData.course_end_year) > currentYear + 10)
    ) errors.course_end_year = "Please enter a valid end year";

    if (
      formData.passed_out_year &&
      (parseInt(formData.passed_out_year) < 1900 ||
        parseInt(formData.passed_out_year) > currentYear + 10)
    ) errors.passed_out_year = "Please enter a valid passed out year";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, availableBranches]);

  // Redirect to login after success
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(async () => {
        sessionStorage.removeItem("oauth_access_token");
        sessionStorage.removeItem("oauth_avatar_url");
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [showSuccess, navigate]);

  const handleSignup = useCallback(async () => {
    if (!validate()) {
      setError("Please fill all required fields correctly");
      return;
    }

    setSignLoading(true);
    setError("");

    try {
      // Try live session first, fall back to stored token
      const { data: sessionData } = await supabase.auth.getSession();
      let accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        const stored = sessionStorage.getItem("oauth_access_token");
        if (stored) {
          accessToken = stored;
        } else {
          sessionStorage.removeItem("oauth_access_token");
          await supabase.auth.signOut();
          navigate("/signup", {
            replace: true,
            state: { message: "Your session expired. Please sign in with Google again." },
          });
          return;
        }
      } else {
        sessionStorage.setItem("oauth_access_token", accessToken);
      }

      const { pincode, ...rest } = formData;
      const payload = {
        access_token: accessToken,
        avatar_url: oauthAvatarUrl,
        ...rest,
        ...(pincode ? { zip_code: pincode } : {}),
      };

      const response = await fetch(`${api_base}/auth/google/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.status === "pending" || data.status === "login") {
        sessionStorage.removeItem("oauth_access_token");
        sessionStorage.removeItem("oauth_avatar_url");
        await supabase.auth.signOut();
        navigate("/login", {
          replace: true,
          state: { message: data.error || "Account already exists. Please log in." },
        });
        return;
      }

      if (data.success || response.ok) {
        setShowSuccess(true);
      } else {
        setError(data.error || data.message || "Registration failed");
      }
    } catch (err) {
      const errData = err?.response?.data;
      if (
        errData?.status === "pending" ||
        errData?.error?.toLowerCase().includes("already registered")
      ) {
        sessionStorage.removeItem("oauth_access_token");
        sessionStorage.removeItem("oauth_avatar_url");
        await supabase.auth.signOut();
        navigate("/login", {
          replace: true,
          state: { message: errData?.error || "Account already exists. Please log in." },
        });
        return;
      }
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSignLoading(false);
    }
  }, [formData, validate, navigate, oauthAvatarUrl]);

  const checkUsernameAvailability = useCallback(
    (username) => {
      if (usernameDebounceTimer) clearTimeout(usernameDebounceTimer);
      if (!username.trim()) return;
      if (username.includes("@")) {
        setFieldErrors((prev) => ({ ...prev, username: "Username cannot contain @ symbol" }));
        return;
      }
      const timer = setTimeout(async () => {
        setIsCheckingUsername(true);
        try {
          const res = await fetch(
            `${api_base}/check-username/?username=${encodeURIComponent(username)}`
          );
          const data = await res.json();
          if (!res.ok) {
            setFieldErrors((prev) => ({ ...prev, username: "Error checking username" }));
          } else if (data.exists || data.available === false) {
            setFieldErrors((prev) => ({ ...prev, username: "This username is already taken" }));
          } else if (data.available === true) {
            setFieldErrors((prev) => ({ ...prev, username: "" }));
          }
        } catch {
          setFieldErrors((prev) => ({ ...prev, username: "Error checking username" }));
        } finally {
          setIsCheckingUsername(false);
        }
      }, 500);
      setUsernameDebounceTimer(timer);
    },
    [usernameDebounceTimer]
  );

  if (!prefill.email) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border w-11/12 max-w-sm shadow-lg rounded-lg bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Registration Submitted!</h3>
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Complete your registration
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Signed in as{" "}
            <span className="font-medium text-green-600">{formData.email}</span> via Google
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-2xl border border-gray-100">
          {/* Google profile photo */}
          <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="shrink-0">
                {oauthAvatarUrl ? (
                  <img
                    className="h-20 w-20 object-cover rounded-full ring-2 ring-green-200"
                    src={oauthAvatarUrl}
                    alt="Google profile"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-500">
                  {oauthAvatarUrl
                    ? "Your Google profile photo will be used"
                    : "No profile photo from Google"}
                </p>
                {oauthAvatarUrl && (
                  <p className="text-xs text-gray-400 mt-1">You can update it later from your profile</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-8 py-6">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  <SelectField
                    label="Salutation"
                    options={SALUTATIONS}
                    value={formData.salutation}
                    onChange={(v) => updateField("salutation", v)}
                    error={fieldErrors.salutation}
                    required={false}
                  />
                </div>

                {/* Email is pre-filled from Google and read-only */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <InputField
                    label="Email (from Google)"
                    type="email"
                    value={formData.email}
                    onChange={() => {}}
                    placeholder="Email"
                    readOnly
                    required={false}
                  />
                  <div className="relative">
                    <SuggestionInput
                      label="Username"
                      value={formData.username}
                      onChange={(v) => {
                        updateField("username", v);
                        debouncedFetch("usernames", {
                          firstName: formData.first_name,
                          lastName: formData.last_name,
                        });
                        checkUsernameAvailability(v);
                      }}
                      onFocus={() => {
                        if (!apiSuggestions.usernames.length) {
                          fetchSuggestions("usernames", {
                            firstName: formData.first_name,
                            lastName: formData.last_name,
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
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        ) : fieldErrors.username ? (
                          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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
                    suggestions={apiSuggestions.countryCodes.map((c) => c.countryCode)}
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.date_of_birth
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300"
                      }`}
                      value={formData.date_of_birth}
                      onChange={(e) => updateField("date_of_birth", e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    {fieldErrors.date_of_birth && (
                      <p className="text-sm text-red-600">{fieldErrors.date_of_birth}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
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
                    onFocus={() =>
                      fetchSuggestions("states", { country: formData.country, state: formData.state })
                    }
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
                      debouncedFetch("cities", {
                        country: formData.country,
                        state: formData.state,
                        city: v,
                      });
                    }}
                    onFocus={() =>
                      fetchSuggestions("cities", {
                        country: formData.country,
                        state: formData.state,
                        city: formData.city,
                      })
                    }
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
                      debouncedFetch("pincodes", {
                        country: formData.country,
                        state: formData.state,
                        city: formData.city,
                        pincode: v,
                      });
                    }}
                    onFocus={() =>
                      fetchSuggestions("pincodes", {
                        country: formData.country,
                        state: formData.state,
                        city: formData.city,
                        pincode: formData.pincode,
                      })
                    }
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
                    <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
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
                      <SuggestionInput
                        label="Home Town"
                        value={formData.home_town}
                        onChange={(v) => {
                          updateField("home_town", v);
                          debouncedFetch("cities", { city: v });
                        }}
                        onFocus={() => fetchSuggestions("cities", { city: formData.home_town })}
                        placeholder="Your home town"
                        required={false}
                        suggestions={apiSuggestions.cities}
                        loading={loadingSuggestions.cities}
                      />
                      <SuggestionInput
                        label="Current Location"
                        value={formData.current_location}
                        onChange={(v) => {
                          updateField("current_location", v);
                          debouncedFetch("cities", { city: v });
                        }}
                        onFocus={() =>
                          fetchSuggestions("cities", { city: formData.current_location })
                        }
                        placeholder="City you live in"
                        required={false}
                        suggestions={apiSuggestions.cities}
                        loading={loadingSuggestions.cities}
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
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">
                        Correspondence Address
                      </h4>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        value={formData.correspondence_address}
                        onChange={(e) => updateField("correspondence_address", e.target.value)}
                        placeholder="Correspondence address (if different)"
                      />
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-4">
                        <SuggestionInput
                          label="Correspondence City"
                          value={formData.correspondence_city}
                          onChange={(v) => {
                            updateField("correspondence_city", v);
                            debouncedFetch("cities", {
                              country: formData.correspondence_country,
                              state: formData.correspondence_state,
                              city: v,
                            });
                          }}
                          onFocus={() =>
                            fetchSuggestions("cities", {
                              country: formData.correspondence_country,
                              state: formData.correspondence_state,
                              city: formData.correspondence_city,
                            })
                          }
                          placeholder="City"
                          required={false}
                          suggestions={apiSuggestions.cities}
                          loading={loadingSuggestions.cities}
                        />
                        <SuggestionInput
                          label="Correspondence State"
                          value={formData.correspondence_state}
                          onChange={(v) => {
                            updateField("correspondence_state", v);
                            debouncedFetch("states", {
                              country: formData.correspondence_country,
                              state: v,
                            });
                          }}
                          onFocus={() =>
                            fetchSuggestions("states", {
                              country: formData.correspondence_country,
                              state: formData.correspondence_state,
                            })
                          }
                          placeholder="State"
                          required={false}
                          suggestions={apiSuggestions.states}
                          loading={loadingSuggestions.states}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                        <SuggestionInput
                          label="Correspondence Country"
                          value={formData.correspondence_country}
                          onChange={(v) => {
                            updateField("correspondence_country", v);
                            debouncedFetch("countries", { country: v });
                          }}
                          onFocus={() =>
                            fetchSuggestions("countries", {
                              country: formData.correspondence_country,
                            })
                          }
                          placeholder="Country"
                          required={false}
                          suggestions={apiSuggestions.countries}
                          loading={loadingSuggestions.countries}
                        />
                        <SuggestionInput
                          label="Correspondence Pincode"
                          value={formData.correspondence_pincode}
                          onChange={(v) => {
                            updateField("correspondence_pincode", v);
                            debouncedFetch("pincodes", {
                              country: formData.correspondence_country,
                              state: formData.correspondence_state,
                              city: formData.correspondence_city,
                              pincode: v,
                            });
                          }}
                          onFocus={() =>
                            fetchSuggestions("pincodes", {
                              country: formData.correspondence_country,
                              state: formData.correspondence_state,
                              city: formData.correspondence_city,
                              pincode: formData.correspondence_pincode,
                            })
                          }
                          placeholder="Pincode"
                          required={false}
                          suggestions={apiSuggestions.pincodes}
                          loading={loadingSuggestions.pincodes}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Professional</h4>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

              {/* Submit */}
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
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Submitting...
                    </div>
                  ) : (
                    "Submit for Approval"
                  )}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Wrong account?{" "}
              <button
                type="button"
                onClick={async () => {
                  sessionStorage.removeItem("oauth_access_token");
                  sessionStorage.removeItem("oauth_avatar_url");
                  await supabase.auth.signOut();
                  navigate("/login");
                }}
                className="font-medium text-green-600 hover:underline"
              >
                Go back to login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
