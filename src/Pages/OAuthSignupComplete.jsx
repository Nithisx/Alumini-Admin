import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import kahelogo from "../assets/kahelogo.png";
import SuggestionInput from "../Components/Shared/SuggestionInput";
import { supabase } from "../lib/supabase";

const SUGGESTIONS_API = "https://api.karpagamalumni.in/api/v1/suggestions";

const api = axios.create({
  baseURL: "https://api.karpagamalumni.in/api/v1",
  headers: { "Content-Type": "application/json" },
});

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
  "Bachelor of Architecture", "Bachelor of Arts", "Bachelor of Business Administration",
  "Bachelor of Commerce", "Bachelor of Computer Applications", "Bachelor of Design",
  "Bachelor of Engineering", "Bachelor of Pharmacy", "Bachelor of Philosophy",
  "Bachelor of Science", "Bachelor of Technology", "Master of Architecture",
  "Master of Building and Engineering Management", "Master of Business Administration",
  "Master of Commerce", "Master of Computer Applications", "Master of Engineering",
  "Master of Pharmacy", "Master of Philosophy", "Master of Planning",
  "Master of Science", "Master of Social Work", "Ph.D",
];

const COURSE_BRANCH_MAPPING = {
  "Bachelor of Architecture": ["General"],
  "Bachelor of Arts": ["English Literature", "General"],
  "Bachelor of Business Administration": ["BBA", "Business Process Services", "General"],
  "Bachelor of Commerce": ["FA", "General", "IAF", "Information Technology", "Professional Accounting", "Computer Application", "Computer Science"],
  "Bachelor of Computer Applications": ["Computer Application", "General"],
  "Bachelor of Design": ["General", "Interior Design"],
  "Bachelor of Engineering": ["Aeronautical Engineering", "Aerospace Engineering", "Automobile Engineering", "Bio Medical Engineering", "Chemical Engineering", "Civil Engineering", "Computer Science and Design", "Computer Science Engineering", "Computer Science Engineering(Cyber)", "Electrical & Electronics Engineering", "Electronics & Communication Engineering", "Food Technology", "Information Technology", "Mechanical Engineering"],
  "Bachelor of Pharmacy": ["Pharmacy"],
  "Bachelor of Science": ["Artificial Intelligence / Data Science", "Bio Chemistry", "Bio Informatics", "Bio Technology", "Catering Science and Hotel Management", "Chemistry", "Cognitive systems", "Computer Science", "Computer Technology", "General", "Mathematics", "Microbiology", "Physics"],
  "Bachelor of Technology": ["Aeronautical Engineering", "Aerospace Engineering", "Artificial Intelligence / Data Science", "Automobile Engineering", "Bio Medical Engineering", "Bio Technology", "Chemical Engineering", "Civil Engineering", "Computer Science Engineering", "Electrical & Electronics Engineering", "Electronics & Communication Engineering", "Food Technology", "Mechanical Engineering"],
  "Master of Architecture": ["General"], "Master of Building and Engineering Management": ["General"],
  "Master of Business Administration": ["Business Process Services", "General", "MBA"],
  "Master of Commerce": ["General"], "Master of Computer Applications": ["General"],
  "Master of Engineering": ["General"], "Master of Pharmacy": ["General"],
  "Master of Philosophy": ["General"], "Master of Planning": ["General"],
  "Master of Science": ["General"], "Master of Social Work": ["General"],
  "Ph.D": ["General"],
};

const currentYear = new Date().getFullYear();

export default function OAuthSignupComplete() {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill data comes from Login.jsx via navigation state
  const prefill = location.state || {};

  const [form, setForm] = useState({
    first_name: prefill.first_name || "",
    last_name: prefill.last_name || "",
    email: prefill.email || "",
    username: "",
    gender: "",
    date_of_birth: "",
    role: "Alumni",
    college_name: "",
    course: "",
    branch: "",
    roll_no: "",
    course_start_year: "",
    course_end_year: "",
    passed_out_year: "",
    phone: "",
    country: "",
    state: "",
    city: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(""); // "checking" | "available" | "taken" | ""
  const [usernameTimer, setUsernameTimer] = useState(null);

  const [locationSuggestions, setLocationSuggestions] = useState({ countries: [], states: [], cities: [] });
  const [loadingLoc, setLoadingLoc] = useState({});
  const locTimers = useRef({});

  const fetchLocationSuggestions = useCallback(async (type, params) => {
    try {
      setLoadingLoc(prev => ({ ...prev, [type]: true }));
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${SUGGESTIONS_API}/signup?${query}`);
      if (res.ok) {
        const json = await res.json();
        const loc = json.data?.locationSuggestions || {};
        setLocationSuggestions(prev => ({
          countries: loc.countries ?? prev.countries,
          states: loc.states ?? prev.states,
          cities: loc.cities ?? prev.cities,
        }));
      }
    } catch {}
    finally { setLoadingLoc(prev => ({ ...prev, [type]: false })); }
  }, []);

  const debouncedLocFetch = useCallback((type, params, delay = 300) => {
    if (locTimers.current[type]) clearTimeout(locTimers.current[type]);
    locTimers.current[type] = setTimeout(() => fetchLocationSuggestions(type, params), delay);
  }, [fetchLocationSuggestions]);

  // Guard: if no prefill data, redirect to login
  useEffect(() => {
    if (!prefill.email) {
      navigate("/login", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to login after success
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(async () => {
        sessionStorage.removeItem("oauth_access_token");
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [showSuccess, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      // Reset branch when course changes
      if (name === "course") updated.branch = "";
      // Staff must select KAHE
      if (name === "role" && value === "Staff") updated.college_name = STAFF_ONLY_COLLEGE;
      if (name === "role" && value !== "Staff" && updated.college_name === STAFF_ONLY_COLLEGE) updated.college_name = "";
      return updated;
    });
    setError("");
  }, []);

  // Username availability check with debounce
  const handleUsernameChange = useCallback((e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, username: value }));
    setError("");

    if (usernameTimer) clearTimeout(usernameTimer);
    if (!value || value.length < 3) {
      setUsernameStatus("");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/check-username/?username=${encodeURIComponent(value)}`);
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("");
      }
    }, 500);
    setUsernameTimer(timer);
  }, [usernameTimer]);

  const branches = COURSE_BRANCH_MAPPING[form.course] || [];
  const isStaff = form.role === "Staff";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (usernameStatus === "taken") {
      setError("Username is already taken. Please choose another.");
      return;
    }

    if (!isStaff && !form.roll_no) {
      setError("Roll number is required.");
      return;
    }

    setLoading(true);
    try {
      // Try to get a live Supabase session first
      const { data: sessionData } = await supabase.auth.getSession();
      let accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        // Session expired — check if this email is already in the system before asking to re-auth
        const storedToken = sessionStorage.getItem("oauth_access_token");
        if (storedToken) {
          // Try with the stored token; backend will reject if it's expired too
          accessToken = storedToken;
        } else {
          // No token at all — send back to signup to re-authenticate with Google
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

      const res = await api.post("/auth/google/signup/", {
        access_token: accessToken,
        ...form,
      });

      // Backend says this email is already pending or approved → go to login
      if (res.data?.status === "pending" || res.data?.status === "login") {
        sessionStorage.removeItem("oauth_access_token");
        await supabase.auth.signOut();
        navigate("/login", {
          replace: true,
          state: { message: res.data?.error || "Account already exists. Please log in." },
        });
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      const errData = err.response?.data;
      // If backend rejected with "pending" status (old 401 path) or email-already-registered
      if (errData?.status === "pending" || errData?.error?.toLowerCase().includes("already registered")) {
        sessionStorage.removeItem("oauth_access_token");
        await supabase.auth.signOut();
        navigate("/login", {
          replace: true,
          state: { message: errData?.error || "Account already exists. Please log in." },
        });
        return;
      }
      // Token expired (401 from Supabase verify) — redirect to signup to re-auth
      if (err.response?.status === 401) {
        sessionStorage.removeItem("oauth_access_token");
        await supabase.auth.signOut();
        navigate("/signup", {
          replace: true,
          state: { message: "Your session expired. Please sign in with Google again." },
        });
        return;
      }
      setError(errData?.error || err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!prefill.email) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-6 sm:py-10 px-3 sm:px-4">
      {showSuccess && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Registration Submitted!</h3>
            <p className="mt-2 text-sm text-gray-500">Your account is pending admin approval. You will be notified once approved.</p>
            <p className="mt-4 text-xs text-gray-400">Redirecting to login...</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src={kahelogo} alt="Logo" className="mx-auto h-16 mb-3" />
          <h2 className="text-2xl font-bold text-gray-900">Complete your registration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Signed in as <span className="font-medium text-green-600">{form.email}</span> via Google
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl px-4 sm:px-8 py-6 sm:py-8 space-y-6 border border-gray-100">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
          )}

          {/* Google avatar preview if available */}
          {prefill.avatar_url && (
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <img src={prefill.avatar_url} alt="Profile" className="h-16 w-16 rounded-full object-cover ring-2 ring-green-200" />
              <div>
                <p className="text-sm font-medium text-gray-700">Your Google profile photo will be used</p>
                <p className="text-xs text-gray-400">You can update it later from your profile</p>
              </div>
            </div>
          )}

          {/* Personal Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name *">
                <input name="first_name" value={form.first_name} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="First name" />
              </Field>
              <Field label="Last Name">
                <input name="last_name" value={form.last_name} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="Last name" />
              </Field>
              <Field label="Email (from Google)" fullWidth>
                <input value={form.email} readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </Field>
              <Field label="Username *">
                <input name="username" value={form.username} onChange={handleUsernameChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="Choose a username" />
                {usernameStatus === "checking" && <p className="text-xs text-gray-400 mt-1">Checking...</p>}
                {usernameStatus === "available" && <p className="text-xs text-green-600 mt-1">Username available</p>}
                {usernameStatus === "taken" && <p className="text-xs text-red-600 mt-1">Username already taken</p>}
              </Field>
              <Field label="Gender *">
                <select name="gender" value={form.gender} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm">
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Date of Birth *">
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
                  required max={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" />
              </Field>
              <Field label="Phone">
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="Phone number" maxLength={15} />
              </Field>
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Country">
                <SuggestionInput
                  value={form.country}
                  onChange={(v) => { setForm(f => ({ ...f, country: v })); debouncedLocFetch("countries", { country: v }); }}
                  onFocus={() => fetchLocationSuggestions("countries", { country: form.country })}
                  placeholder="Country"
                  required={false}
                  suggestions={locationSuggestions.countries}
                  loading={loadingLoc.countries}
                  inputClassName="focus:ring-green-600"
                />
              </Field>
              <Field label="State">
                <SuggestionInput
                  value={form.state}
                  onChange={(v) => { setForm(f => ({ ...f, state: v })); debouncedLocFetch("states", { country: form.country, state: v }); }}
                  onFocus={() => fetchLocationSuggestions("states", { country: form.country, state: form.state })}
                  placeholder="State"
                  required={false}
                  suggestions={locationSuggestions.states}
                  loading={loadingLoc.states}
                  inputClassName="focus:ring-green-600"
                />
              </Field>
              <Field label="City">
                <SuggestionInput
                  value={form.city}
                  onChange={(v) => { setForm(f => ({ ...f, city: v })); debouncedLocFetch("cities", { country: form.country, state: form.state, city: v }); }}
                  onFocus={() => fetchLocationSuggestions("cities", { country: form.country, state: form.state, city: form.city })}
                  placeholder="City"
                  required={false}
                  suggestions={locationSuggestions.cities}
                  loading={loadingLoc.cities}
                  inputClassName="focus:ring-green-600"
                />
              </Field>
            </div>
          </section>

          {/* Academic Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Role *">
                <select name="role" value={form.role} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="College *">
                <select name="college_name" value={form.college_name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                  disabled={isStaff}>
                  <option value="">Select college</option>
                  {(isStaff ? [STAFF_ONLY_COLLEGE] : COLLEGE_NAMES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              {!isStaff && (
                <Field label="Roll Number *">
                  <input name="roll_no" value={form.roll_no} onChange={handleChange}
                    required={!isStaff} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="Roll number" />
                </Field>
              )}
              <Field label="Course">
                <select name="course" value={form.course} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm">
                  <option value="">Select course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              {form.course && branches.length > 0 && (
                <Field label="Branch">
                  <select name="branch" value={form.branch} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm">
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Course Start Year">
                <input type="number" name="course_start_year" value={form.course_start_year} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="e.g. 2019" min={1900} max={currentYear + 10} />
              </Field>
              <Field label="Course End Year">
                <input type="number" name="course_end_year" value={form.course_end_year} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="e.g. 2023" min={1900} max={currentYear + 10} />
              </Field>
              <Field label="Passed Out Year">
                <input type="number" name="passed_out_year" value={form.passed_out_year} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 text-sm" placeholder="e.g. 2023" min={1900} max={currentYear + 10} />
              </Field>
            </div>
          </section>

          <button type="submit" disabled={loading || usernameStatus === "taken"}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded transition duration-200 disabled:opacity-50">
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Wrong account?{" "}
            <button type="button" onClick={() => { sessionStorage.removeItem("oauth_access_token"); navigate("/login"); }}
              className="text-green-600 hover:underline">
              Go back to login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, fullWidth }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
