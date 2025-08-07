"use client"

import { useEffect, useState } from "react"
import axios from "axios"
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
} from "lucide-react"

// API Configuration
const API_URL = "https://xyndrix.me/api/profile/"
const FORGOT_PASSWORD_URL = "https://xyndrix.me/api/forgot-password/"
const CHANGE_PASSWORD_URL = "https://xyndrix.me/api/change-password/"
const BASE_URL = "https://xyndrix.me/api"
const DEFAULT_PROFILE_IMAGE = "https://placehold.co/100?text=Profile"
const DEFAULT_COVER_IMAGE = "https://placehold.co/400x150?text=Cover+Photo"

// Utility functions
const getMediaUrl = (uri) => {
  if (!uri) return ""
  if (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("file://")) return uri
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
    email: "",
    social_links: {},
    bio: "",
    phone: "",
    passed_out_year: "",
    current_work: "",
    Worked_in: [],
    experience: [],
    salutation: "",
    Address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    date_of_birth: null,
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

  const tabs = ["Personal", "Work", "Contact", "Social"]
  const editTabs = ["Basic Info", "Contact & Address", "Work & Social"]

  const handleError = (error, customMessage) => {
    console.error(customMessage, error)
    const errorMessage =
      error?.response?.data?.message || error?.response?.data?.error || error?.message || customMessage
    alert(errorMessage)
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
            console.warn("Failed to parse JSON:", value, e)
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
      alert("Email is required to reset password")
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
      console.error("Forgot password error:", error)
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to send reset email. Please try again."
      alert(errorMessage)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleImageUpload = (field, event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    // Store the actual file for later upload
    setProfile((prev) => ({
      ...prev,
      [`${field}_file`]: file,
    }))

    // Also set the preview image
    const reader = new FileReader()
    reader.onload = (e) => {
      setProfile((prev) => ({
        ...prev,
        [field]: e.target.result,
      }))
    }
    reader.readAsDataURL(file)
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

      // Add text data
      formData.append("bio", profile.bio || "")
      formData.append("email", profile.email || "")
      formData.append("passed_out_year", profile.passed_out_year || "")
      formData.append("phone", profile.phone || "")
      formData.append("first_name", profile.first_name || "")
      formData.append("last_name", profile.last_name || "")
      formData.append("experience", JSON.stringify(profile.experience || {}))
      formData.append("social_links", JSON.stringify(profile.social_links || {}))
      formData.append("current_work", profile.current_work || "")
      formData.append("Worked_in", JSON.stringify(profile.Worked_in || []))
      formData.append("Address", profile.Address || "")
      formData.append("city", profile.city || "")
      formData.append("state", profile.state || "")
      formData.append("country", profile.country || "")
      formData.append("zip_code", profile.zip_code || "")
      formData.append("date_of_birth", profile.date_of_birth || "")

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
      alert("Profile updated successfully!")
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
      console.error("Change password error:", error)
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
            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Current Work</p>
                <p className="text-sm sm:text-base text-green-900 break-words">{profile.current_work || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Passed Out Year</p>
                <p className="text-sm sm:text-base text-green-900">{profile.passed_out_year || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Experience</p>
                <p className="text-sm sm:text-base text-green-900 break-words">
                  {profile.experience?.role
                    ? `${profile.experience.role} (${profile.experience.years} years)`
                    : "No experience details"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Previous Work</p>
                <p className="text-sm sm:text-base text-green-900 line-clamp-2 break-words">{profile.Worked_in?.join(", ") || "N/A"}</p>
              </div>
            </div>
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
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Address</p>
                <p className="text-sm sm:text-base text-green-900 line-clamp-3 break-words">
                  {[profile.Address, profile.city, profile.state, profile.country, profile.zip_code]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )

      case 3: // Social
        return (
          <div className="space-y-3 sm:space-y-4">
            {profile.social_links && Object.keys(profile.social_links).length > 0 ? (
              Object.entries(profile.social_links).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-3 pb-3 sm:pb-4 border-b border-green-200">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">{key.replace("_link", "")}</p>
                    <p className="text-sm sm:text-base text-green-900 truncate">{String(value) || "N/A"}</p>
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
          </div>
        )

      case 1: // Contact & Address
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Phone</label>
              <input
                type="tel"
                placeholder="Phone Number"
                value={profile.phone || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            {/* Add Address Field */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={profile.city || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={profile.state || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, state: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Country</label>
                <input
                  type="text"
                  placeholder="Country"
                  value={profile.country || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">ZIP Code</label>
                <input
                  type="text"
                  placeholder="ZIP"
                  value={profile.zip_code || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      zip_code: e.target.value,
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>
          </div>
        )

      case 2: // Work & Experience & Social
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">Current Work</label>
              <input
                type="text"
                placeholder="Current Work"
                value={profile.current_work || ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    current_work: e.target.value,
                  }))
                }
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Passed Out Year</label>
              <input
                type="number"
                placeholder="Year"
                value={profile.passed_out_year ? String(profile.passed_out_year) : ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    passed_out_year: e.target.value,
                  }))
                }
                className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            {/* Add Experience Role and Years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Experience Role</label>
                <input
                  type="text"
                  placeholder="Job Role/Position"
                  value={profile.experience?.role || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      experience: {
                        ...prev.experience,
                        role: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Years of Experience</label>
                <input
                  type="number"
                  placeholder="Years"
                  value={profile.experience?.years || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      experience: {
                        ...prev.experience,
                        years: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            {/* Add Previous Work Companies - Make it editable */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Previous Companies</label>
              <textarea
                placeholder="Enter companies separated by commas (e.g., Company A, Company B, Company C)"
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

            {/* Social Links Section */}
            <div className="border-t border-green-200 pt-4 mt-6">
              <h3 className="text-sm font-bold text-green-900 mb-3">Social Links</h3>
              
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1">LinkedIn</label>
                <input
                  type="url"
                  placeholder="LinkedIn URL"
                  value={profile.social_links?.linkedin_link || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      social_links: {
                        ...prev.social_links,
                        linkedin_link: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Website</label>
                <input
                  type="url"
                  placeholder="Website URL"
                  value={profile.social_links?.website_link || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      social_links: {
                        ...prev.social_links,
                        website_link: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>

              {/* Add more social links */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Twitter</label>
                <input
                  type="url"
                  placeholder="Twitter URL"
                  value={profile.social_links?.twitter_link || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      social_links: {
                        ...prev.social_links,
                        twitter_link: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Facebook</label>
                <input
                  type="url"
                  placeholder="Facebook URL"
                  value={profile.social_links?.facebook_link || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      social_links: {
                        ...prev.social_links,
                        facebook_link: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 mt-3">Instagram</label>
                <input
                  type="url"
                  placeholder="Instagram URL"
                  value={profile.social_links?.instagram_link || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      social_links: {
                        ...prev.social_links,
                        instagram_link: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-2.5 sm:p-3 bg-white text-sm sm:text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-5 bg-green-600 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Lock className="w-5 h-5 mr-2" />
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
                className={`p-3 rounded-lg ${
                  changePasswordMessage.type === "success"
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
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto mb-3" />
          <p className="text-green-600 text-lg">Loading profile...</p>
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
    <div className="min-h-screen bg-green-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-full lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white text-center py-4 sm:py-5 mb-3 sm:mb-4 shadow-sm rounded-lg">
          <div className="relative inline-block">
            <img
              src={profile.profile_photo ? getMediaUrl(profile.profile_photo) : DEFAULT_PROFILE_IMAGE}
              alt="Profile"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-3 border-4 border-green-600 object-cover shadow-md"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-1">
            {`${profile.first_name} ${profile.last_name}`}
          </h2>
          <p className="text-xs sm:text-sm text-green-700 break-all px-4">{profile.email || "No email"}</p>
          {profile.current_work && (
            <div className="mt-2 inline-flex items-center px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              <Briefcase className="w-3 h-3 mr-1" />
              <span className="truncate max-w-xs">{profile.current_work}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-white mx-2 sm:mx-3 rounded-lg p-1 shadow-md mb-3 sm:mb-4 overflow-x-auto">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex-1 min-w-0 py-2.5 sm:py-3 text-center rounded text-xs sm:text-sm font-medium whitespace-nowrap px-2 ${
                activeTab === index
                  ? "bg-green-600 text-white font-bold shadow-sm"
                  : "text-green-700 hover:bg-green-50 transition-colors"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mx-2 sm:mx-3 mb-6">
          <div className="bg-white rounded-lg p-4 sm:p-5 shadow-md min-h-[300px] sm:min-h-[400px]">{renderTabContent()}</div>
        </div>

        {/* Edit Modal */}
        {modalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-green-50 rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-green-600 rounded-t-lg">
                <button
                  onClick={() => setModalVisible(false)}
                  className="p-1 hover:bg-green-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-white">Edit Profile</h2>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-800 rounded-lg text-white font-medium text-sm disabled:opacity-50 hover:bg-green-900 transition-colors shadow-sm"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                    </div>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>

              {/* Edit Tabs */}
              <div className="flex bg-white mx-2 sm:mx-3 mt-2 sm:mt-3 rounded-lg p-1 shadow-sm overflow-x-auto">
                {editTabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => setEditPage(index)}
                    className={`flex-1 min-w-0 py-2 sm:py-3 text-center rounded text-xs font-medium whitespace-nowrap px-1 ${
                      editPage === index
                        ? "bg-green-600 text-white font-bold"
                        : "text-green-700 hover:bg-green-50 transition-colors"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Edit Content */}
              <div className="mx-2 sm:mx-3 mt-2 sm:mt-3 mb-2 sm:mb-3">
                <div className="bg-white rounded-lg p-3 sm:p-5 shadow-md min-h-[400px] sm:min-h-[500px]">{renderEditContent()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {renderChangePasswordModal()}

        {/* Fixed floating action button */}
        <button
          onClick={() => {
            setEditPage(0)
            setModalVisible(true)
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-colors"
          aria-label="Edit Profile"
        >
          <Edit className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  )
}

export default ProfileScreen