"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  Trash2,
  User,
  MapPin,
  Building,
  Briefcase,
  DollarSign,
  Clock,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  ImageIcon,
  X,
  Upload,
  Loader2,
} from "lucide-react"

const API_URL = "http://209.38.121.118:8000/api/jobs/"

// Helper to get the token
const getAuthToken = async () => {
  const token = localStorage.getItem("Token")
  return token
}

// Format date to a more readable format
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Image Gallery Component
const ImageGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return ""
    if (imagePath.startsWith("http")) return imagePath
    return `http://209.38.121.118:8000/api${imagePath}`
  }

  return (
    <div className="relative w-full h-48 sm:h-64 bg-gray-100 rounded-lg overflow-hidden my-4">
      <img
        src={getImageUrl(images[currentIndex].image) || "/placeholder.svg"}
        alt={`Job image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 mx-1 rounded-full cursor-pointer ${idx === currentIndex ? "bg-white" : "bg-gray-400"}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Comment Section Component
const CommentSection = ({ comments, totalComments }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!comments || comments.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-700 text-sm">Comments ({totalComments})</h4>
        {totalComments > 2 && (
          <button
            className="text-green-600 text-sm font-medium hover:text-green-700 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "View all"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {(isExpanded ? comments : comments.slice(0, 2)).map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <div className="flex-shrink-0">
              {comment.user.profile_photo ? (
                <img
                  src={comment.user.profile_photo || "/placeholder.svg"}
                  alt={`${comment.user.first_name}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={14} className="text-gray-500" />
                </div>
              )}
            </div>
            <div className="flex-1 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-gray-800 text-sm">
                  {comment.user.first_name} {comment.user.last_name}
                </span>
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-gray-700 text-sm">{comment.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const JobFeed = () => {
  // Posts state
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  // Modal and file upload states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  // Form field states
  const [description, setDescription] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [role, setRole] = useState("")
  const [location, setLocation] = useState("")
  const [salaryRange, setSalaryRange] = useState("")
  const [jobType, setJobType] = useState("")
  const [error, setError] = useState("")

  // Fetch posts from backend
  const fetchJobs = async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Token ${token}` : "",
        },
      })
      const data = await response.json()
      setPosts(data)
    } catch (err) {
      console.error("Error fetching posts", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  // Delete a post
  const deletePost = async (postId) => {
    try {
      const token = await getAuthToken()
      const response = await fetch(`${API_URL}${postId}/`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Token ${token}` : "",
        },
      })
      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId))
      } else {
        console.error("Error deleting post")
      }
    } catch (error) {
      console.error("Error deleting post", error)
    }
  }

  // Handle drop zone events
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    const fileType = file.type
    if (fileType.startsWith("image/")) {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: URL.createObjectURL(file),
        size: (file.size / 1024 / 1024).toFixed(2),
      })
    } else {
      alert("Please upload only image files.")
    }
  }

  const removeFile = () => {
    if (uploadedFile?.preview) URL.revokeObjectURL(uploadedFile.preview)
    setUploadedFile(null)
  }

  // Reset form fields
  const resetForm = () => {
    setDescription("")
    setCompanyName("")
    setRole("")
    setLocation("")
    setSalaryRange("")
    setJobType("")
    removeFile()
    setError("")
  }

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!companyName || !role || !location) {
      setError("Company name, role, and location are required.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const token = await getAuthToken()
      if (!token) throw new Error("Authentication token not found")

      const formData = new FormData()
      formData.append("description", description)
      formData.append("company_name", companyName)
      formData.append("role", role)
      formData.append("location", location)
      formData.append("salary_range", salaryRange)
      formData.append("job_type", jobType)

      if (uploadedFile) {
        formData.append("images", uploadedFile.file)
      }

      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      // Add new post to state
      setPosts([response.data, ...posts])

      // Close modal and reset form
      closeModal()
    } catch (error) {
      console.error("Error creating post:", error)
      setError(error.response?.data?.message || "Failed to create post. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen my-[50px] w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Main Container - Full width with proper centering */}
      <div className="w-full">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header - Centered */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">Jobs Feed</h1>
            <div className="w-16 h-1 bg-green-600 rounded mx-auto"></div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-green-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No job posts yet</h3>
              <p className="text-gray-500 text-sm">Be the first to share a job opportunity!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden w-full"
                >
                  {/* Header with user info and actions */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {post.user?.profile_photo ? (
                        <img
                          src={post.user.profile_photo || "/placeholder.svg"}
                          alt={`${post.user.first_name}'s avatar`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-800 text-sm truncate">
                          {post.user?.first_name} {post.user?.last_name}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatDate(post.posted_on)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-200 flex-shrink-0"
                      title="Delete job post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Green accent line */}
                  <div className="h-1 bg-gradient-to-r from-green-500 to-green-600"></div>

                  {/* Job Content */}
                  <div className="p-4">
                    {/* Company and Role */}
                    <div className="mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-green-600 mb-2 break-words">{post.role}</h2>
                      <div className="flex items-center text-gray-700">
                        <Building className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        <span className="text-sm font-medium break-words">{post.company_name}</span>
                      </div>
                    </div>

                    {/* Job Details Grid */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 break-words">{post.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 break-words">{post.salary_range || "Salary not specified"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 capitalize break-words">
                          {post.job_type?.replace(/([A-Z])/g, " $1").trim() || "Job type not specified"}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {post.description && (
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm leading-relaxed break-words">{post.description}</p>
                      </div>
                    )}

                    {/* Images */}
                    {post.images && post.images.length > 0 && <ImageGallery images={post.images} />}

                    {/* Engagement Section */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors duration-200 group">
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            post.reaction?.like > 0
                              ? "text-red-500 fill-current"
                              : "text-gray-500 group-hover:text-red-400"
                          }`}
                        />
                        <span className="text-sm text-gray-600 font-medium">
                          {post.reaction?.like || 0} {post.reaction?.like === 1 ? "like" : "likes"}
                        </span>
                      </button>

                      <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors duration-200 group">
                        <MessageCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm text-gray-600 font-medium">
                          {post.total_comments || 0} {post.total_comments === 1 ? "comment" : "comments"}
                        </span>
                      </button>
                    </div>

                    {/* Comments */}
                    <CommentSection comments={post.comments} totalComments={post.total_comments} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-green-600">Create Job Post</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 sm:p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                      placeholder="Enter company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                      Role/Position *
                    </label>
                    <input
                      type="text"
                      id="role"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                      placeholder="e.g., Senior Frontend Developer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                      placeholder="e.g., San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="salary" className="block text-sm font-semibold text-gray-700 mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      id="salary"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                      placeholder="e.g., $80K - $120K"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="jobType" className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      id="jobType"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                    >
                      <option value="">Select job type</option>
                      <option value="fulltime">Full Time</option>
                      <option value="parttime">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Description
                    </label>
                    <textarea
                      id="description"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none text-sm"
                      rows="3"
                      placeholder="Describe the role, requirements, and what makes this opportunity great..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Add Image (Optional)</label>
                    {!uploadedFile ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
                                  ${isDragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400 hover:bg-green-50"}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-3 bg-green-100 p-3 rounded-full">
                            <Upload className="w-6 h-6 text-green-600" />
                          </div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Drop image here</h4>
                          <p className="text-xs text-gray-500 mb-3">or click to browse files</p>

                          <div className="flex items-center text-xs text-gray-500">
                            <ImageIcon className="w-3 h-3 text-green-500 mr-1" />
                            <span>PNG, JPG, GIF up to 10MB</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-700 text-sm">Uploaded Image</h4>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center">
                          <div className="relative mr-3">
                            <img
                              src={uploadedFile.preview || "/placeholder.svg"}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded-lg border-2 border-green-200"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate text-sm">{uploadedFile.name}</p>
                            <p className="text-xs text-gray-500">{uploadedFile.size} MB</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-4 sm:p-6 border-t border-gray-200 rounded-b-2xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center min-w-[80px] transition-all ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Posting...
                    </>
                  ) : (
                    "Post Job"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobFeed
