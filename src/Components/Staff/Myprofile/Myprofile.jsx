"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { toast } from "react-toastify";
import axios from "../../../lib/axiosInstance"
import SuggestionInput from "../../Shared/SuggestionInput"
import ImageViewerModal from "../../Shared/ImageViewerModal"
import ImageCropModal from "../../Shared/ImageCropModal"
import { API_BASE, API_PROFILE, API_FORGOT_PASSWORD, API_CHANGE_PASSWORD, API_SUGGESTIONS, API_USER_COURSES, API_USER_COURSE } from "../../../config/api"
import { COURSES, COURSE_BRANCH_MAPPING, COLLEGE_NAMES } from "../../../constants/academicOptions"
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  FileText,
  Calendar,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Building,
  Phone,
  MapPin,
  Globe,
  Camera,
  AlertCircle,
  Loader,
  Key,
  Lock,
  Eye,
  EyeOff,
  Plus,
  X,
  Trash2,
} from "lucide-react"

// API Configuration
const API_URL = API_PROFILE
const FORGOT_PASSWORD_URL = API_FORGOT_PASSWORD
const CHANGE_PASSWORD_URL = API_CHANGE_PASSWORD
const BASE_URL = API_BASE.replace(/\/api\/v1\/?$/, "")
const DEFAULT_PROFILE_IMAGE = "https://placehold.co/100?text=Profile"
const DEFAULT_COVER_IMAGE = "https://placehold.co/400x150?text=Cover+Photo"
const SUGGESTIONS_API = API_SUGGESTIONS;

const ACADEMIC_COURSES = [
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
  "Ph.D",
]

// Utility functions
const getMediaUrl = (uri) => {
  if (!uri) return ""
  if (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("file://") ||
    uri.startsWith("data:") ||
    uri.startsWith("blob:")
  )
    return uri
  if (uri.startsWith("//")) {
    return `http:${uri}`
  }
  const baseUrlEndsWithSlash = BASE_URL.endsWith("/")
  const uriStartsWithSlash = uri.startsWith("/")

  if (baseUrlEndsWithSlash && uriStartsWithSlash) {
    return `${BASE_URL}${uri.slice(1)}`
  } else if (!baseUrlEndsWithSlash && !uriStartsWithSlash) {
    return `${BASE_URL}/${uri}`
  } else {
    return `${BASE_URL}${uri}`
  }
}

const ProfileScreen = () => {
  const [profile, setProfile] = useState({
    id: null,
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    secondary_email: "",
    social_links: {},
    facebook_link: "",
    linkedin_link: "",
    twitter_link: "",
    website_link: "",
    bio: "",
    phone: "",
    home_phone_no: "",
    office_phone_no: "",
    passed_out_year: "",
    current_work: "",
    company: "",
    position: "",
    work_experience: "",
    professional_skills: [],
    industries_worked_in: [],
    roles_played: [],
    Worked_in: [],
    experience: [],
    salutation: "",
    gender: "",
    date_of_birth: null,
    // Academic
    course: "",
    branch: "",
    stream: "",
    roll_no: "",
    college_name: "",
    course_start_year: "",
    course_end_year: "",
    educational_course: "",
    educational_institute: "",
    // Address
    Address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    // Correspondence address (from old portal seeded data)
    correspondence_address: "",
    correspondence_city: "",
    correspondence_state: "",
    correspondence_country: "",
    correspondence_pincode: "",
    current_location: "",
    home_town: "",
    // Faculty fields (for old seeded data)
    faculty_job_title: "",
    faculty_institute: "",
    faculty_department: "",
    faculty_start_year: "",
    faculty_end_year: "",
    chapter: "",
    is_entrepreneur: false,
    profile_photo: DEFAULT_PROFILE_IMAGE,
    cover_photo: DEFAULT_COVER_IMAGE,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [editPage, setEditPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("")

  // New state for change password modal and functionality
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false)
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)
  const [changePasswordMessage, setChangePasswordMessage] = useState({ text: "", type: "" })
  const [changePasswordForm, setChangePasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Suggestions state
  const [apiSuggestions, setApiSuggestions] = useState({
    usernames: [],
    countries: [],
    states: [],
    cities: [],
    zipcodes: []
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState({});
  const suggestionTimers = useRef({});

  const fetchSuggestions = useCallback(async (type, params) => {
    try {
      setLoadingSuggestions(prev => ({ ...prev, [type]: true }));
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${SUGGESTIONS_API}/profile?${query}`);
      if (res.ok) {
        const json = await res.json();

        setApiSuggestions(prev => ({
          ...prev,
          usernames: json.data?.usernameSuggestions || prev.usernames,
          countries: json.data?.locationSuggestions?.countries || prev.countries,
          states: json.data?.locationSuggestions?.states || prev.states,
          cities: json.data?.locationSuggestions?.cities || prev.cities,
          zipcodes: json.data?.locationSuggestions?.zipcodes || json.data?.locationSuggestions?.pincodes || prev.zipcodes,
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

  // Multi-course state
  const [courses, setCourses] = useState([])
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [addCourseForm, setAddCourseForm] = useState({
    course: "", branch: "", stream: "", roll_no: "",
    college_name: "", course_start_year: "", course_end_year: "", passed_out_year: "",
  })
  const [addCourseLoading, setAddCourseLoading] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState(null)

  // Image viewer modal state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImageUrl, setViewerImageUrl] = useState("")
  const [viewerAltText, setViewerAltText] = useState("")

  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [cropField, setCropField] = useState(null)
  const [cropAspectRatio, setCropAspectRatio] = useState(1)
  const [cropShape, setCropShape] = useState("rect")
  const [cropTitle, setCropTitle] = useState("Crop Image")

  const tabs = ["Personal", "Work", "Contact", "Social"]
  const editTabs = ["Basic Info", "Academic", "Contact & Address", "Work & Social"]

  const handleError = (error, customMessage) => {
    const errorMessage =
      error?.response?.data?.message || error?.response?.data?.error || error?.message || customMessage
    toast.error(errorMessage)
  }

  // Add this function to fetch the profile
  const fetchProfile = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Authentication required.")
      const response = await fetch(API_URL, {
        headers: { Authorization: `Token ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch profile.")
      const data = await response.json()

      // Safe JSON parsing function
      const safeJsonParse = (value, fallback) => {
        if (typeof value === "string" && value.trim()) {
          try {
            return JSON.parse(value)
          } catch (e) {
            return fallback
          }
        }
        return value || fallback
      }

      setProfile((prev) => ({
        ...prev,
        ...data,
        experience: safeJsonParse(data.experience, {}),
        social_links: safeJsonParse(data.social_links, {}),
        Worked_in: safeJsonParse(data.Worked_in, []),
      }))
    } catch (err) {
      setError(err.message || "Failed to fetch profile.")
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password function
  const handleForgotPassword = async () => {
    if (!profile.email) {
      toast.error("Email is required to reset password")
      return
    }

    setForgotPasswordLoading(true)
    setForgotPasswordMessage("")

    try {
      await axios.post(FORGOT_PASSWORD_URL, {
        email: profile.email,
      })

      setForgotPasswordMessage("Check your mail to change the password")

      // Clear message after 5 seconds
      setTimeout(() => {
        setForgotPasswordMessage("")
      }, 5000)
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to send reset email. Please try again."
      toast.error(errorMessage)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("Token")
      if (!token) return
      const res = await fetch(API_USER_COURSES, { headers: { Authorization: `Token ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setCourses(Array.isArray(data) ? data : [])
      }
    } catch (_) {}
  }

  const handleAddCourse = async () => {
    if (!addCourseForm.course) { toast.error("Course is required"); return }
    setAddCourseLoading(true)
    try {
      const token = localStorage.getItem("Token")
      const res = await fetch(API_USER_COURSES, {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(addCourseForm),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.non_field_errors?.[0] || data?.detail || data?.error || "Failed to add course"
        toast.error(msg)
        return
      }
      toast.success("Course added successfully")
      setCourses((prev) => [...prev, data])
      setShowAddCourseModal(false)
      setAddCourseForm({ course: "", branch: "", stream: "", roll_no: "", college_name: "", course_start_year: "", course_end_year: "", passed_out_year: "" })
    } catch (_) {
      toast.error("Failed to add course")
    } finally {
      setAddCourseLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    setDeletingCourseId(courseId)
    try {
      const token = localStorage.getItem("Token")
      const res = await fetch(API_USER_COURSE(courseId), {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok || res.status === 204) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId))
        toast.success("Course removed")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error || "Failed to remove course")
      }
    } catch (_) {
      toast.error("Failed to remove course")
    } finally {
      setDeletingCourseId(null)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchCourses()
  }, [])

  // Opens the image viewer modal
  const openImageViewer = (url, alt) => {
    if (!url || url === DEFAULT_PROFILE_IMAGE || url === DEFAULT_COVER_IMAGE) return
    setViewerImageUrl(url)
    setViewerAltText(alt || "Photo")
    setViewerOpen(true)
  }

  // Opens crop modal instead of directly uploading
  const handleImageUpload = (field, event) => {
    const file = event.target.files[0]
    if (!file) return
    event.target.value = ""

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setCropImageSrc(e.target.result)
      setCropField(field)
      if (field === "profile_photo") {
        setCropAspectRatio(1)
        setCropShape("round")
        setCropTitle("Crop Profile Photo")
      } else {
        setCropAspectRatio(16 / 5)
        setCropShape("rect")
        setCropTitle("Crop Cover Photo")
      }
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  // Called when user confirms the crop
  const handleCropDone = (croppedBlob, croppedPreviewUrl) => {
    const field = cropField
    const croppedFile = new File([croppedBlob], `${field}_cropped.jpg`, { type: "image/jpeg" })

    setProfile((prev) => ({
      ...prev,
      [`${field}_file`]: croppedFile,
      [field]: croppedPreviewUrl,
    }))

    setCropModalOpen(false)
    setCropImageSrc(null)
    setCropField(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem("Token")
      if (!token) {
        setSaving(false)
        throw new Error("Authentication required.")
      }

      if (!profile.first_name?.trim() || !profile.email?.trim()) {
        setSaving(false)
        throw new Error("Name and email are required fields.")
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profile.email)) {
        setSaving(false)
        throw new Error("Please enter a valid email address.")
      }

      // Create FormData for the entire profile update (including text fields)
      const formData = new FormData()

      // Core identity
      formData.append("first_name", profile.first_name || "")
      formData.append("last_name", profile.last_name || "")
      formData.append("username", profile.username || "")
      formData.append("email", profile.email || "")
      formData.append("secondary_email", profile.secondary_email || "")
      formData.append("salutation", profile.salutation || "")
      formData.append("gender", profile.gender || "")
      formData.append("date_of_birth", profile.date_of_birth || "")
      formData.append("bio", profile.bio || "")

      // Contact
      formData.append("phone", profile.phone || "")
      formData.append("home_phone_no", profile.home_phone_no || "")
      formData.append("office_phone_no", profile.office_phone_no || "")

      // Address
      formData.append("Address", profile.Address || "")
      formData.append("city", profile.city || "")
      formData.append("state", profile.state || "")
      formData.append("country", profile.country || "")
      formData.append("zip_code", profile.zip_code || "")
      formData.append("current_location", profile.current_location || "")
      formData.append("home_town", profile.home_town || "")

      // Correspondence address (important for old seeded data)
      formData.append("correspondence_address", profile.correspondence_address || "")
      formData.append("correspondence_city", profile.correspondence_city || "")
      formData.append("correspondence_state", profile.correspondence_state || "")
      formData.append("correspondence_country", profile.correspondence_country || "")
      formData.append("correspondence_pincode", profile.correspondence_pincode || "")

      // Academic
      formData.append("course", profile.course || "")
      formData.append("branch", profile.branch || "")
      formData.append("stream", profile.stream || "")
      formData.append("roll_no", profile.roll_no || "")
      formData.append("college_name", profile.college_name || "")
      formData.append("course_start_year", profile.course_start_year || "")
      formData.append("course_end_year", profile.course_end_year || "")
      formData.append("passed_out_year", profile.passed_out_year || "")
      formData.append("educational_course", profile.educational_course || "")
      formData.append("educational_institute", profile.educational_institute || "")

      // Professional
      formData.append("current_work", profile.current_work || "")
      formData.append("company", profile.company || "")
      formData.append("position", profile.position || "")
      formData.append("work_experience", profile.work_experience || "")
      formData.append("chapter", profile.chapter || "")
      formData.append("is_entrepreneur", profile.is_entrepreneur ? "true" : "false")

      // Faculty fields
      formData.append("faculty_job_title", profile.faculty_job_title || "")
      formData.append("faculty_institute", profile.faculty_institute || "")
      formData.append("faculty_department", profile.faculty_department || "")
      formData.append("faculty_start_year", profile.faculty_start_year || "")
      formData.append("faculty_end_year", profile.faculty_end_year || "")

      // JSON fields
      formData.append("experience", JSON.stringify(profile.experience || {}))
      formData.append("social_links", JSON.stringify(profile.social_links || {}))
      formData.append("Worked_in", JSON.stringify(profile.Worked_in || []))
      formData.append("professional_skills", JSON.stringify(
        Array.isArray(profile.professional_skills) ? profile.professional_skills : []
      ))
      formData.append("industries_worked_in", JSON.stringify(
        Array.isArray(profile.industries_worked_in) ? profile.industries_worked_in : []
      ))
      formData.append("roles_played", JSON.stringify(
        Array.isArray(profile.roles_played) ? profile.roles_played : []
      ))

      // Individual social links
      formData.append("facebook_link", profile.facebook_link || "")
      formData.append("linkedin_link", profile.linkedin_link || "")
      formData.append("twitter_link", profile.twitter_link || "")
      formData.append("website_link", profile.website_link || "")

      // Add image files if they exist
      if (profile.profile_photo_file) {
        formData.append("profile_photo", profile.profile_photo_file)
      }
      if (profile.cover_photo_file) {
        formData.append("cover_photo", profile.cover_photo_file)
      }

      // Send the data to the API using FormData
      await axios.put(API_URL, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setSaving(false)
      setModalVisible(false)
      toast.success("Profile updated successfully!")
      fetchProfile()
    } catch (error) {
      setSaving(false)
      handleError(error, "Failed to update profile.")
    }
  }

  // Handle change password form input changes
  const handleChangePasswordInput = (field, value) => {
    setChangePasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // Handle change password submission
  const handleChangePassword = async () => {
    // Basic validation
    if (!changePasswordForm.current_password) {
      setChangePasswordMessage({ text: "Current password is required", type: "error" })
      return
    }

    if (!changePasswordForm.new_password) {
      setChangePasswordMessage({ text: "New password is required", type: "error" })
      return
    }

    if (changePasswordForm.new_password.length < 8) {
      setChangePasswordMessage({ text: "Password must be at least 8 characters", type: "error" })
      return
    }

    if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
      setChangePasswordMessage({ text: "Passwords don't match", type: "error" })
      return
    }

    setChangePasswordLoading(true)
    setChangePasswordMessage({ text: "", type: "" })

    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Authentication required.")

      await axios.post(
        CHANGE_PASSWORD_URL,
        {
          old_password: changePasswordForm.current_password,
          new_password: changePasswordForm.new_password,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      )

      setChangePasswordMessage({ text: "Password changed successfully", type: "success" })

      // Clear form after successful change
      setChangePasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })

      // Close modal after 2 seconds on success
      setTimeout(() => {
        setChangePasswordModalVisible(false)
        setChangePasswordMessage({ text: "", type: "" })
      }, 2000)
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to change password. Please try again."
      setChangePasswordMessage({ text: errorMessage, type: "error" })
    } finally {
      setChangePasswordLoading(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Personal
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Full Name</p>
                <p className="text-sm sm:text-base text-green-900 break-words">
                  {`${profile.first_name} ${profile.last_name}`}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Username</p>
                <p className="text-sm sm:text-base text-green-900 break-all">{profile.username || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Email</p>
                <p className="text-sm sm:text-base text-green-900 break-all">{profile.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Bio</p>
                <p className="text-sm sm:text-base text-green-900 line-clamp-3 break-words">{profile.bio || "No bio available"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Date of Birth</p>
                <p className="text-sm sm:text-base text-green-900">{profile.date_of_birth || "N/A"}</p>
              </div>
            </div>

            {profile.gender && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Gender</p>
                  <p className="text-sm sm:text-base text-green-900">{profile.gender}</p>
                </div>
              </div>
            )}

            {profile.is_entrepreneur && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Entrepreneur</p>
                  <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                    Yes
                  </span>
                </div>
              </div>
            )}

            {/* Password Management Section */}
            <div className="pt-3 sm:pt-4 border-t border-green-200">
              <div className="flex items-start space-x-3 mb-4">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Password Management</p>
                  <p className="text-xs sm:text-sm text-green-600">Manage your account security settings</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setChangePasswordModalVisible(true)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-green-700 text-white rounded-lg font-medium text-sm hover:bg-green-800 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading || !profile.email}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {forgotPasswordLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>{forgotPasswordLoading ? "Sending..." : "Reset Password"}</span>
                </button>
              </div>

              {/* Success Message for Forgot Password */}
              {forgotPasswordMessage && (
                <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">{forgotPasswordMessage}</p>
                </div>
              )}
            </div>
          </div>
        )

      case 1: // Work
        return (
          <div className="space-y-3 sm:space-y-4">
            {(profile.current_work || profile.company || profile.position) && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Current Position</p>
                  <p className="text-sm sm:text-base text-green-900 break-words font-medium">
                    {profile.position || profile.current_work || "N/A"}
                  </p>
                  {profile.company && (
                    <p className="text-xs text-green-600 mt-0.5">{profile.company}</p>
                  )}
                </div>
              </div>
            )}

            {!!profile.work_experience && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Work Experience</p>
                  <p className="text-sm sm:text-base text-green-900">{profile.work_experience} years</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-green-700 uppercase">Education</p>
                  <button
                    onClick={() => setShowAddCourseModal(true)}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium border border-green-300 rounded-md px-2 py-0.5 hover:bg-green-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Course
                  </button>
                </div>
                {courses.length > 0 ? (
                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div key={c.id} className="bg-green-50 rounded-lg px-3 py-2 relative group">
                        {!c.is_primary && (
                          <button
                            onClick={() => handleDeleteCourse(c.id)}
                            disabled={deletingCourseId === c.id}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                            title="Remove enrollment"
                          >
                            {deletingCourseId === c.id ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        )}
                        <p className="text-sm text-green-900 font-medium break-words">
                          {[c.course, c.branch].filter(Boolean).join(" — ")}
                          {c.is_primary && <span className="ml-2 text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                        </p>
                        {c.college_name && <p className="text-xs text-green-600 mt-0.5">{c.college_name}</p>}
                        {c.passed_out_year && <p className="text-xs text-green-500 mt-0.5">Passed out: {c.passed_out_year}</p>}
                      </div>
                    ))}
                  </div>
                ) : (profile.course || profile.branch || profile.passed_out_year) ? (
                  <div className="bg-green-50 rounded-lg px-3 py-2">
                    <p className="text-sm text-green-900 font-medium break-words">
                      {[profile.course, profile.branch].filter(Boolean).join(" — ")}
                    </p>
                    {profile.college_name && <p className="text-xs text-green-600 mt-0.5">{profile.college_name}</p>}
                    {profile.passed_out_year && <p className="text-xs text-green-500 mt-0.5">Passed out: {profile.passed_out_year}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-green-500 italic">No courses enrolled yet</p>
                )}
              </div>
            </div>

            {Array.isArray(profile.professional_skills) && profile.professional_skills.length > 0 && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Professional Skills</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {profile.professional_skills.map((skill, i) => (
                      <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {Array.isArray(profile.industries_worked_in) && profile.industries_worked_in.length > 0 && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Industries</p>
                  <p className="text-sm sm:text-base text-green-900 break-words">{profile.industries_worked_in.join(", ")}</p>
                </div>
              </div>
            )}

            {profile.experience?.role && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Experience</p>
                  <p className="text-sm sm:text-base text-green-900 break-words">
                    {profile.experience.role}
                    {profile.experience.years ? ` (${profile.experience.years} yrs)` : ""}
                  </p>
                </div>
              </div>
            )}

            {Array.isArray(profile.Worked_in) && profile.Worked_in.length > 0 && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Previous Companies</p>
                  <p className="text-sm sm:text-base text-green-900 break-words">{profile.Worked_in.join(", ")}</p>
                </div>
              </div>
            )}

            {profile.faculty_job_title && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Faculty / Teaching</p>
                  <p className="text-sm sm:text-base text-green-900 break-words">{profile.faculty_job_title}</p>
                  {profile.faculty_department && (
                    <p className="text-xs text-green-600 mt-0.5">{profile.faculty_department}</p>
                  )}
                  {profile.faculty_institute && (
                    <p className="text-xs text-green-600 mt-0.5">{profile.faculty_institute}</p>
                  )}
                </div>
              </div>
            )}

            {!profile.current_work && !profile.company && !profile.position && !profile.work_experience &&
             courses.length === 0 && !profile.course && !profile.branch && !profile.passed_out_year && !profile.faculty_job_title &&
             !(Array.isArray(profile.professional_skills) && profile.professional_skills.length > 0) && (
              <div className="flex flex-col items-center justify-center h-32 sm:h-40">
                <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-green-300 mb-2" />
                <p className="text-sm sm:text-base text-green-600">No work details added</p>
              </div>
            )}
          </div>
        )

      case 2: // Contact
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Phone</p>
                <p className="text-sm sm:text-base text-green-900">{profile.phone || "N/A"}</p>
                {profile.home_phone_no && (
                  <p className="text-xs text-green-600 mt-0.5">Home: {profile.home_phone_no}</p>
                )}
                {profile.office_phone_no && (
                  <p className="text-xs text-green-600 mt-0.5">Office: {profile.office_phone_no}</p>
                )}
              </div>
            </div>

            {profile.secondary_email && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Secondary Email</p>
                  <p className="text-sm sm:text-base text-green-900 break-all">{profile.secondary_email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Current Address</p>
                <p className="text-sm sm:text-base text-green-900 break-words">
                  {[profile.Address, profile.city, profile.state, profile.country, profile.zip_code]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </p>
                {profile.current_location && (
                  <p className="text-xs text-green-600 mt-0.5">Location: {profile.current_location}</p>
                )}
                {profile.home_town && (
                  <p className="text-xs text-green-600 mt-0.5">Home Town: {profile.home_town}</p>
                )}
              </div>
            </div>

            {(profile.correspondence_address || profile.correspondence_city || profile.correspondence_country) && (
              <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-700 uppercase mb-1">Correspondence Address</p>
                  <p className="text-sm sm:text-base text-green-900 break-words">
                    {[
                      profile.correspondence_address,
                      profile.correspondence_city,
                      profile.correspondence_state,
                      profile.correspondence_country,
                      profile.correspondence_pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 3: // Social
        {
          // Merge individual fields with social_links JSON — individual fields take priority
          const socialMap = {
            ...(profile.social_links || {}),
            ...(profile.linkedin_link ? { linkedin_link: profile.linkedin_link } : {}),
            ...(profile.twitter_link ? { twitter_link: profile.twitter_link } : {}),
            ...(profile.facebook_link ? { facebook_link: profile.facebook_link } : {}),
            ...(profile.website_link ? { website_link: profile.website_link } : {}),
          }
          const socialEntries = Object.entries(socialMap).filter(([, v]) => v)
          return (
            <div className="space-y-3 sm:space-y-4">
              {socialEntries.length > 0 ? (
                socialEntries.map(([key, value]) => (
                  <div key={key} className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-green-700 uppercase mb-1">
                        {key.replace(/_link$/, "").replace(/_/g, " ")}
                      </p>
                      <a
                        href={String(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm sm:text-base text-green-700 underline truncate block hover:text-green-900"
                      >
                        {String(value)}
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-32 sm:h-40">
                  <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-green-300 mb-2" />
                  <p className="text-sm sm:text-base text-green-600">No social links added</p>
                </div>
              )}
            </div>
          )
        }

      default:
        return null
    }
  }

  const renderEditContent = () => {
    switch (editPage) {
      case 0: // Basic Info
        return (
          <div className="space-y-4">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <img
                  src={profile.profile_photo ? getMediaUrl(profile.profile_photo) : DEFAULT_PROFILE_IMAGE}
                  alt="Profile"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-green-600 object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-green-600 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer shadow-md hover:bg-green-700 transition-colors">
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload("profile_photo", e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Add Cover Photo Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Cover Photo</label>
              <div className="relative">
                <img
                  src={profile.cover_photo ? getMediaUrl(profile.cover_photo) : DEFAULT_COVER_IMAGE}
                  alt="Cover"
                  className="w-full h-32 sm:h-40 rounded-lg object-cover border-2 border-green-300"
                />
                <label className="absolute bottom-2 right-2 bg-green-600 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-md hover:bg-green-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload("cover_photo", e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Add Salutation Field */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Salutation</label>
              <select
                value={profile.salutation || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, salutation: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              >
                <option value="">Select Salutation</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={profile.first_name || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={profile.last_name || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Username</label>
              <SuggestionInput
                type="text"
                placeholder="Username"
                value={profile.username || ""}
                onChange={(v) => {
                  setProfile((prev) => ({ ...prev, username: v }));
                  debouncedFetch("usernames", { username: v });
                }}
                onFocus={() => {
                  fetchSuggestions("usernames", { username: profile.username });
                }}
                inputClassName="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                suggestions={apiSuggestions.usernames}
                loading={loadingSuggestions.usernames}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={profile.email || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Bio</label>
              <textarea
                placeholder="Tell us about yourself"
                value={profile.bio || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Birth Date</label>
                <input
                  type="date"
                  value={profile.date_of_birth || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Gender</label>
                <select
                  value={profile.gender || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 1: // Academic
        return (
          <div className="space-y-4">
            {/* Enrolled courses list with add/remove */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-green-900">Enrolled Courses</h3>
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(true)}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium border border-green-300 rounded-md px-2 py-1 hover:bg-green-50 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Course
                </button>
              </div>
              {courses.length > 0 ? (
                <div className="space-y-2">
                  {courses.map((c) => (
                    <div key={c.id} className="flex items-start justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm text-green-900 font-medium">
                          {[c.course, c.branch].filter(Boolean).join(" — ")}
                          {c.is_primary && <span className="ml-2 text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                        </p>
                        {c.college_name && <p className="text-xs text-green-600">{c.college_name}</p>}
                        {c.passed_out_year && <p className="text-xs text-green-500">Passed out: {c.passed_out_year}</p>}
                      </div>
                      {!c.is_primary && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c.id)}
                          disabled={deletingCourseId === c.id}
                          className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
                          title="Remove"
                        >
                          {deletingCourseId === c.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-500 italic">No courses enrolled yet</p>
              )}
            </div>

            <div className="border-t border-green-200 pt-4">
              <h3 className="text-sm font-bold text-green-900 mb-3">Higher / Further Education</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Qualification</label>
                  <SuggestionInput
                    type="text"
                    placeholder="e.g. M.Phil, Ph.D, MBA"
                    value={profile.educational_course || ""}
                    onChange={(v) => setProfile((prev) => ({ ...prev, educational_course: v }))}
                    inputClassName="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                    suggestions={ACADEMIC_COURSES}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Institute</label>
                  <input
                    type="text"
                    placeholder="Institute Name"
                    value={profile.educational_institute || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, educational_institute: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-green-200 pt-4 mt-2">
              <h3 className="text-sm font-bold text-green-900 mb-3">Faculty / Teaching Experience</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Assistant Professor"
                    value={profile.faculty_job_title || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, faculty_job_title: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Institute</label>
                  <input
                    type="text"
                    placeholder="Faculty Institute"
                    value={profile.faculty_institute || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, faculty_institute: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Department"
                  value={profile.faculty_department || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, faculty_department: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Start Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2015"
                    value={profile.faculty_start_year || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, faculty_start_year: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">End Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2020"
                    value={profile.faculty_end_year || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, faculty_end_year: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // Contact & Address
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="Mobile / Primary Phone"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Home Phone</label>
                <input
                  type="tel"
                  placeholder="Home Phone Number"
                  value={profile.home_phone_no || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, home_phone_no: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Office Phone</label>
                <input
                  type="tel"
                  placeholder="Office Phone Number"
                  value={profile.office_phone_no || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, office_phone_no: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Secondary Email</label>
                <input
                  type="email"
                  placeholder="Alternative Email"
                  value={profile.secondary_email || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, secondary_email: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div className="border-t border-green-200 pt-4 mt-2">
              <h3 className="text-sm font-bold text-green-900 mb-3">Current Address</h3>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Address</label>
                <textarea
                  placeholder="Full Address"
                  value={profile.Address || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, Address: e.target.value }))}
                  rows={2}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">City</label>
                  <SuggestionInput
                    type="text"
                    placeholder="City"
                    value={profile.city || ""}
                    onChange={(v) => {
                      setProfile((prev) => ({ ...prev, city: v }));
                      debouncedFetch("cities", { country: profile.country, state: profile.state, city: v });
                    }}
                    onFocus={() => {
                      fetchSuggestions("cities", { country: profile.country, state: profile.state, city: profile.city });
                    }}
                    inputClassName="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                    suggestions={apiSuggestions.cities}
                    loading={loadingSuggestions.cities}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">State</label>
                  <SuggestionInput
                    type="text"
                    placeholder="State"
                    value={profile.state || ""}
                    onChange={(v) => {
                      setProfile((prev) => ({ ...prev, state: v }));
                      debouncedFetch("states", { country: profile.country, state: v });
                    }}
                    onFocus={() => {
                      fetchSuggestions("states", { country: profile.country, state: profile.state });
                    }}
                    inputClassName="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                    suggestions={apiSuggestions.states}
                    loading={loadingSuggestions.states}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Country</label>
                  <SuggestionInput
                    type="text"
                    placeholder="Country"
                    value={profile.country || ""}
                    onChange={(v) => {
                      setProfile((prev) => ({ ...prev, country: v }));
                      debouncedFetch("countries", { country: v });
                    }}
                    onFocus={() => {
                      fetchSuggestions("countries", { country: profile.country });
                    }}
                    inputClassName="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                    suggestions={apiSuggestions.countries}
                    loading={loadingSuggestions.countries}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">ZIP Code</label>
                  <SuggestionInput
                    type="text"
                    placeholder="ZIP"
                    value={profile.zip_code || ""}
                    onChange={(v) => {
                      setProfile((prev) => ({ ...prev, zip_code: v }));
                      debouncedFetch("zipcodes", { country: profile.country, state: profile.state, city: profile.city, zipcode: v });
                    }}
                    onFocus={() => {
                      fetchSuggestions("zipcodes", { country: profile.country, state: profile.state, city: profile.city, zipcode: profile.zip_code });
                    }}
                    inputClassName="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                    suggestions={apiSuggestions.zipcodes}
                    loading={loadingSuggestions.zipcodes}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Current Location</label>
                  <input
                    type="text"
                    placeholder="Current City / Region"
                    value={profile.current_location || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, current_location: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Home Town</label>
                  <input
                    type="text"
                    placeholder="Home Town"
                    value={profile.home_town || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, home_town: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-green-200 pt-4 mt-2">
              <h3 className="text-sm font-bold text-green-900 mb-3">Correspondence Address</h3>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Address</label>
                <textarea
                  placeholder="Correspondence Address"
                  value={profile.correspondence_address || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, correspondence_address: e.target.value }))}
                  rows={2}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={profile.correspondence_city || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, correspondence_city: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={profile.correspondence_state || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, correspondence_state: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={profile.correspondence_country || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, correspondence_country: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={profile.correspondence_pincode || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, correspondence_pincode: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Work & Experience & Social
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Current Work / Employer</label>
              <input
                type="text"
                placeholder="Current Work"
                value={profile.current_work || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, current_work: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Company</label>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={profile.company || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, company: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Position / Designation</label>
                <input
                  type="text"
                  placeholder="Your Position"
                  value={profile.position || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Work Experience (years)</label>
              <input
                type="number"
                placeholder="Years of experience"
                min="0"
                value={profile.work_experience || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, work_experience: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="is_entrepreneur"
                checked={!!profile.is_entrepreneur}
                onChange={(e) => setProfile((prev) => ({ ...prev, is_entrepreneur: e.target.checked }))}
                className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_entrepreneur" className="text-xs sm:text-sm font-bold text-green-900 cursor-pointer">
                I am an Entrepreneur
              </label>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Professional Skills</label>
              <textarea
                placeholder="Enter skills separated by commas (e.g., Python, React, Management)"
                value={Array.isArray(profile.professional_skills) ? profile.professional_skills.join(", ") : ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    professional_skills: e.target.value.split(",").map(item => item.trim()).filter(item => item),
                  }))
                }
                rows={2}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Industries Worked In</label>
              <textarea
                placeholder="Enter industries separated by commas (e.g., IT, Finance, Healthcare)"
                value={Array.isArray(profile.industries_worked_in) ? profile.industries_worked_in.join(", ") : ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    industries_worked_in: e.target.value.split(",").map(item => item.trim()).filter(item => item),
                  }))
                }
                rows={2}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Experience Role</label>
                <input
                  type="text"
                  placeholder="Job Role/Position"
                  value={profile.experience?.role || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      experience: { ...prev.experience, role: e.target.value },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Years of Experience</label>
                <input
                  type="number"
                  placeholder="Years"
                  value={profile.experience?.years || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      experience: { ...prev.experience, years: e.target.value },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Previous Companies</label>
              <textarea
                placeholder="Enter companies separated by commas (e.g., Company A, Company B)"
                value={Array.isArray(profile.Worked_in) ? profile.Worked_in.join(", ") : ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    Worked_in: e.target.value.split(",").map(item => item.trim()).filter(item => item),
                  }))
                }
                rows={2}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            {/* Social Links — write to both individual fields and social_links JSON */}
            <div className="border-t border-green-200 pt-4 mt-6">
              <h3 className="text-sm font-bold text-green-900 mb-3">Social Links</h3>

              {[
                { key: "linkedin_link", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
                { key: "twitter_link", label: "Twitter / X", placeholder: "https://twitter.com/..." },
                { key: "facebook_link", label: "Facebook", placeholder: "https://facebook.com/..." },
                { key: "website_link", label: "Website", placeholder: "https://yoursite.com" },
                { key: "instagram_link", label: "Instagram", placeholder: "https://instagram.com/..." },
              ].map(({ key, label, placeholder }, idx) => (
                <div key={key} className={idx > 0 ? "mt-3" : ""}>
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">{label}</label>
                  <input
                    type="url"
                    placeholder={placeholder}
                    value={profile[key] || profile.social_links?.[key] || ""}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                        social_links: { ...prev.social_links, [key]: e.target.value },
                      }))
                    }
                    className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  />
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Change Password Modal
  const renderChangePasswordModal = () => {
    if (!changePasswordModalVisible) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-pwd-title"
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
        >
          <div className="p-5 bg-green-600 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 id="change-pwd-title" className="text-lg font-bold text-white flex items-center">
                <Lock className="w-5 h-5 mr-2" aria-hidden="true" />
                Change Password
              </h3>
              <button
                onClick={() => setChangePasswordModalVisible(false)}
                className="text-white hover:text-green-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  value={changePasswordForm.current_password}
                  onChange={(e) => handleChangePasswordInput("current_password", e.target.value)}
                  className="w-full pr-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPassword.current ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword.new ? "text" : "password"}
                  value={changePasswordForm.new_password}
                  onChange={(e) => handleChangePasswordInput("new_password", e.target.value)}
                  className="w-full pr-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPassword.new ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  value={changePasswordForm.confirm_password}
                  onChange={(e) => handleChangePasswordInput("confirm_password", e.target.value)}
                  className="w-full pr-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPassword.confirm ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Error/Success Message */}
            {changePasswordMessage.text && (
              <div
                className={`p-3 rounded-lg ${changePasswordMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
                  }`}
              >
                <p className="text-sm font-medium">{changePasswordMessage.text}</p>
              </div>
            )}
          </div>

          <div className="px-5 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setChangePasswordModalVisible(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={changePasswordLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center disabled:opacity-50"
            >
              {changePasswordLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-5">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-500 text-center mb-3 text-base">{error}</p>
          <button onClick={fetchProfile} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto">
        {/* ── Instagram-style profile header ── */}
        <div className="bg-white border-b border-gray-100">
          {/* Cover photo */}
          <div
            className="h-36 sm:h-44 bg-gray-200 bg-cover bg-center clickable-cover-photo"
            style={{ backgroundImage: `url(${profile.cover_photo ? getMediaUrl(profile.cover_photo) : DEFAULT_COVER_IMAGE})` }}
            onClick={() => openImageViewer(
              profile.cover_photo ? getMediaUrl(profile.cover_photo) : DEFAULT_COVER_IMAGE,
              "Cover Photo"
            )}
            title="Click to view cover photo"
          />
          {/* Avatar + actions row */}
          <div className="px-4 pb-4">
            <div className="flex items-end justify-between -mt-12 mb-3">
              <div
                className="ring-4 ring-white rounded-full shadow-md clickable-photo"
                onClick={() => openImageViewer(
                  profile.profile_photo ? getMediaUrl(profile.profile_photo) : DEFAULT_PROFILE_IMAGE,
                  `${profile.first_name} ${profile.last_name}`
                )}
                title="Click to view profile photo"
              >
                <img
                  src={profile.profile_photo ? getMediaUrl(profile.profile_photo) : DEFAULT_PROFILE_IMAGE}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                />
              </div>
              <button
                onClick={() => setModalVisible(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                <Edit className="w-4 h-4" />
                Edit profile
              </button>
            </div>
            {/* Name + bio */}
            <h2 className="text-base font-bold text-gray-900">{profile.first_name} {profile.last_name}</h2>
            <p className="text-sm text-gray-400 mb-1">@{profile.username}</p>
            {profile.current_work && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{profile.current_work}</span>
              </div>
            )}
            {profile.bio && <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>}
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-t border-gray-100 scrollbar-hide">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-shrink-0 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === index
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-4 py-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 min-h-[300px]">
            {renderTabContent()}
          </div>
        </div>

        {/* Edit Modal */}
        {modalVisible && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
              className="bg-white w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button
                  onClick={() => setModalVisible(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 id="edit-profile-title" className="text-base font-bold text-gray-900">Edit Profile</h2>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 bg-emerald-600 rounded-xl text-white font-semibold text-sm disabled:opacity-50 hover:bg-emerald-700 transition"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </div>
                  ) : "Save"}
                </button>
              </div>

              {/* Edit Tabs */}
              <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                {editTabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setEditPage(index)}
                    className={`flex-shrink-0 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                      editPage === index
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Edit Content */}
              <div className="p-4 sm:p-5">
                <div className="min-h-[400px]">{renderEditContent()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {renderChangePasswordModal()}

        {/* Add Course Modal */}
        {showAddCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <h2 className="text-base font-bold text-green-900">Add New Course</h2>
                </div>
                <button onClick={() => setShowAddCourseModal(false)} className="text-green-400 hover:text-green-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {/* Course */}
                <div>
                  <label className="block text-xs font-bold text-green-900 mb-1">Course <span className="text-red-500">*</span></label>
                  <select
                    value={addCourseForm.course}
                    onChange={(e) => setAddCourseForm((p) => ({ ...p, course: e.target.value, branch: "" }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 text-sm text-green-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select course</option>
                    {COURSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Branch */}
                {addCourseForm.course && COURSE_BRANCH_MAPPING[addCourseForm.course]?.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-green-900 mb-1">Branch / Specialization</label>
                    <select
                      value={addCourseForm.branch}
                      onChange={(e) => setAddCourseForm((p) => ({ ...p, branch: e.target.value }))}
                      className="w-full border border-green-300 rounded-lg p-2.5 text-sm text-green-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select branch</option>
                      {COURSE_BRANCH_MAPPING[addCourseForm.course].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* College */}
                <div>
                  <label className="block text-xs font-bold text-green-900 mb-1">College</label>
                  <select
                    value={addCourseForm.college_name}
                    onChange={(e) => setAddCourseForm((p) => ({ ...p, college_name: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 text-sm text-green-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select college</option>
                    {COLLEGE_NAMES.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                {/* Roll No */}
                <div>
                  <label className="block text-xs font-bold text-green-900 mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 20BCE001"
                    value={addCourseForm.roll_no}
                    onChange={(e) => setAddCourseForm((p) => ({ ...p, roll_no: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 text-sm text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                {/* Years */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-green-900 mb-1">Start Year</label>
                    <input
                      type="number"
                      placeholder="e.g. 2018"
                      value={addCourseForm.course_start_year}
                      onChange={(e) => setAddCourseForm((p) => ({ ...p, course_start_year: e.target.value }))}
                      className="w-full border border-green-300 rounded-lg p-2.5 text-sm text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-green-900 mb-1">End Year</label>
                    <input
                      type="number"
                      placeholder="e.g. 2022"
                      value={addCourseForm.course_end_year}
                      onChange={(e) => setAddCourseForm((p) => ({ ...p, course_end_year: e.target.value }))}
                      className="w-full border border-green-300 rounded-lg p-2.5 text-sm text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                {/* Passed Out Year */}
                <div>
                  <label className="block text-xs font-bold text-green-900 mb-1">Passed Out Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2022"
                    value={addCourseForm.passed_out_year}
                    onChange={(e) => setAddCourseForm((p) => ({ ...p, passed_out_year: e.target.value }))}
                    className="w-full border border-green-300 rounded-lg p-2.5 text-sm text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button
                  onClick={() => setShowAddCourseModal(false)}
                  className="flex-1 border border-green-300 text-green-700 rounded-lg py-2.5 text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCourse}
                  disabled={addCourseLoading || !addCourseForm.course}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {addCourseLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Enroll
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAB — hidden since edit is in header now, keep as fallback on mobile */}
        <button
          onClick={() => { setEditPage(0); setModalVisible(true); }}
          className="lg:hidden fixed bottom-20 right-4 z-40 flex items-center justify-center w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-colors"
          aria-label="Edit Profile"
        >
          <Edit className="w-5 h-5" />
        </button>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        imageUrl={viewerImageUrl}
        altText={viewerAltText}
        onClose={() => setViewerOpen(false)}
      />

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        aspectRatio={cropAspectRatio}
        cropShape={cropShape}
        title={cropTitle}
        onClose={() => { setCropModalOpen(false); setCropImageSrc(null); }}
        onCropDone={handleCropDone}
      />
    </div>
  )
}

// Inject scrollbar-hide once
if (typeof document !== "undefined" && !document.getElementById("scrollbar-hide-style")) {
  const s = document.createElement("style");
  s.id = "scrollbar-hide-style";
  s.textContent = ".scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}.scrollbar-hide::-webkit-scrollbar{display:none}";
  document.head.appendChild(s);
}

export default ProfileScreen
