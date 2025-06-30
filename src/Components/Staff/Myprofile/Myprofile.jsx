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
} from "lucide-react"

// API Configuration
const API_URL = "http://209.38.121.118/api/profile/"
const FORGOT_PASSWORD_URL = "http://209.38.121.118/api/forgot-password/"
const BASE_URL = "http://209.38.121.118/api"
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

  const tabs = ["Personal", "Work", "Contact", "Social"]
  const editTabs = ["Basic Info", "Address", "Experience"]

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
      setProfile((prev) => ({
        ...prev,
        ...data,
        experience: typeof data.experience === "string" ? JSON.parse(data.experience) : data.experience || {},
        social_links: typeof data.social_links === "string" ? JSON.parse(data.social_links) : data.social_links || {},
        Worked_in: typeof data.Worked_in === "string" ? JSON.parse(data.Worked_in) : data.Worked_in || [],
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Personal
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <User className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Full Name</p>
                <p className="text-base text-green-900">
                  {`${profile.first_name} ${profile.last_name}`}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <Mail className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Email</p>
                <p className="text-base text-green-900">{profile.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <FileText className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Bio</p>
                <p className="text-base text-green-900 line-clamp-3">{profile.bio || "No bio available"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <Calendar className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Date of Birth</p>
                <p className="text-base text-green-900">{profile.date_of_birth || "N/A"}</p>
              </div>
            </div>

            {/* Forgot Password Section */}
            <div className="pt-4 border-t border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Password Reset</p>
                    <p className="text-sm text-green-600">Reset your account password</p>
                  </div>
                </div>
                <button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading || !profile.email}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {forgotPasswordLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>{forgotPasswordLoading ? "Sending..." : "Reset Password"}</span>
                </button>
              </div>

              {/* Success Message */}
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
          <div className="space-y-4">
            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <Briefcase className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Current Work</p>
                <p className="text-base text-green-900">{profile.current_work || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <GraduationCap className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Passed Out Year</p>
                <p className="text-base text-green-900">{profile.passed_out_year || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <TrendingUp className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Experience</p>
                <p className="text-base text-green-900">
                  {profile.experience?.role
                    ? `${profile.experience.role} (${profile.experience.years} years)`
                    : "No experience details"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <Building className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Previous Work</p>
                <p className="text-base text-green-900 line-clamp-2">{profile.Worked_in?.join(", ") || "N/A"}</p>
              </div>
            </div>
          </div>
        )

      case 2: // Contact
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <Phone className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Phone</p>
                <p className="text-base text-green-900">{profile.phone || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pb-4 border-b border-green-200">
              <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Address</p>
                <p className="text-base text-green-900 line-clamp-3">
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
          <div className="space-y-4">
            {profile.social_links && Object.keys(profile.social_links).length > 0 ? (
              Object.entries(profile.social_links).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-3 pb-4 border-b border-green-200">
                  <Globe className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">{key.replace("_link", "")}</p>
                    <p className="text-base text-green-900 truncate">{String(value) || "N/A"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <Globe className="w-10 h-10 text-green-300 mb-2" />
                <p className="text-green-600">No social links added</p>
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
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img
                  src={profile.profile_photo ? getMediaUrl(profile.profile_photo) : DEFAULT_PROFILE_IMAGE}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-3 border-green-600 object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-green-600 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-md hover:bg-green-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload("profile_photo", e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-green-900 mb-1">First Name</label>
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
                  className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-green-900 mb-1">Last Name</label>
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
                  className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-green-900 mb-1 mt-3">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={profile.email || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-green-900 mb-1 mt-3">Bio</label>
              <textarea
                placeholder="Tell us about yourself"
                value={profile.bio || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>
          </div>
        )

      case 1: // Address
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-green-900 mb-1">Phone</label>
              <input
                type="tel"
                placeholder="Phone Number"
                value={profile.phone || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-green-900 mb-1 mt-3">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={profile.city || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-green-900 mb-1 mt-3">State</label>
                <input
                  type="text"
                  placeholder="State"
                  value={profile.state || ""}
                  onChange={(e) => setProfile((prev) => ({ ...prev, state: e.target.value }))}
                  className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-green-900 mb-1 mt-3">Country</label>
              <input
                type="text"
                placeholder="Country"
                value={profile.country || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, country: e.target.value }))}
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-green-900 mb-1 mt-3">ZIP Code</label>
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
                  className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-green-900 mb-1 mt-3">Birth Date</label>
                <input
                  type="date"
                  value={profile.date_of_birth || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }))
                  }
                  className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                />
              </div>
            </div>
          </div>
        )

      case 2: // Experience
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-green-900 mb-1">Current Work</label>
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
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-green-900 mb-1 mt-3">Passed Out Year</label>
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
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-green-900 mb-1 mt-3">LinkedIn</label>
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
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-green-900 mb-1 mt-3">Website</label>
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
                className="w-full border border-green-300 rounded-lg p-3 bg-white text-base text-green-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
              />
            </div>
          </div>
        )

      default:
        return null
    }
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
    <div className="min-h-screen my-15 w-[117rem] bg-green-50">
   

      {/* Profile Header */}
      <div className="bg-white text-center py-5 mb-3 shadow-sm">
        <div className="relative inline-block">
          <img
            src={profile.profile_photo ? getMediaUrl(profile.profile_photo) : DEFAULT_PROFILE_IMAGE}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-green-600 object-cover shadow-md"
          />
        </div>
        <h2 className="text-xl font-bold text-green-900 mb-1">
          {`${profile.first_name } ${profile.last_name }`}
        </h2>
        <p className="text-sm text-green-700">{profile.email || "No email"}</p>
        {profile.current_work && (
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <Briefcase className="w-3 h-3 mr-1" />
            {profile.current_work}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white mx-3 rounded-lg p-1 shadow-md mb-3">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-1 py-3 text-center rounded text-sm font-medium ${
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
      <div className="mx-3 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-md min-h-[400px]">{renderTabContent()}</div>
      </div>

      {/* Edit Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-green-50 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-green-600 rounded-t-lg">
              <button 
                onClick={() => setModalVisible(false)} 
                className="p-1 hover:bg-green-700 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <h2 className="text-lg font-bold text-white">Edit Profile</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-800 rounded-lg text-white font-medium disabled:opacity-50 hover:bg-green-900 transition-colors shadow-sm"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save"
                )}
              </button>
            </div>

            {/* Edit Tabs */}
            <div className="flex bg-white mx-3 mt-3 rounded-lg p-1 shadow-sm">
              {editTabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setEditPage(index)}
                  className={`flex-1 py-3 text-center rounded text-xs font-medium ${
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
            <div className="mx-3 mt-3 mb-3">
              <div className="bg-white rounded-lg p-5 shadow-md min-h-[500px]">{renderEditContent()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed floating action button (as a backup in case the header button isn't visible) */}
      <button
        onClick={() => {
          setEditPage(0)
          setModalVisible(true)
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-colors"
        aria-label="Edit Profile"
      >
        <Edit className="w-6 h-6" />
      </button>
    </div>
  )
}

export default ProfileScreen