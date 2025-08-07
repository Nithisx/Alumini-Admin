"use client"

import React, { useEffect, useState } from "react"
import { MoreVertical, MapPin, Share2, Trash2, X, Calendar, DollarSign, Users, MessageCircle, Heart, RefreshCw, Edit, Save, Upload, ImageIcon } from 'lucide-react'

const COLORS = {
  primary: "#059669", // green-600
  text: "#1f2937",
}

const BASE_URL = "https://xyndrix.me/api"

// ImageSlider component
const ImageSlider = ({ images, baseUrl }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  
  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length)
  }
  
  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative mb-6">
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        <img
          src={`${baseUrl}${images[activeIndex].image}`}
          alt="Job"
          className="w-full h-80 object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
            >
              →
            </button>
          </>
        )}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-sm font-medium">
              {activeIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                activeIndex === index ? 'bg-green-600 scale-110' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Edit Job Modal Component
const EditJobModal = ({ job, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    role: '',
    description: '',
    company_name: '',
    location: '',
    job_type: '',
    salary_range: '',
    is_active: true
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState([])

  useEffect(() => {
    if (job && isOpen) {
      setFormData({
        role: job.role || '',
        description: job.description || '',
        company_name: job.company_name || '',
        location: job.location || '',
        job_type: job.job_type || '',
        salary_range: job.salary_range || '',
        is_active: job.is_active !== undefined ? job.is_active : true
      })
    }
  }, [job, isOpen])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedImages(files)
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file))
    setPreviewImages(previews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Token not found")

      // If no images are selected, send JSON data
      if (selectedImages.length === 0) {
        const response = await fetch(`${BASE_URL}/jobs/${job.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('Server response:', errorData)
          throw new Error("Failed to update job")
        }

        const updatedJob = await response.json()
        onUpdate(updatedJob)
      } else {
        // If images are selected, use FormData
        const formDataToSend = new FormData()
        
        // Append form fields
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
            formDataToSend.append(key, formData[key])
          }
        })

        // Append each image separately
        selectedImages.forEach((image, index) => {
          formDataToSend.append(`image${index}`, image)
        })

        // Also try the original approach
        selectedImages.forEach((image) => {
          formDataToSend.append('images', image)
        })

        // Debug: Log what we're sending
        console.log('FormData contents:')
        for (let [key, value] of formDataToSend.entries()) {
          console.log(key, value)
        }

        const response = await fetch(`${BASE_URL}/jobs/${job.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Token ${token}`,
          },
          body: formDataToSend
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('Server response:', errorData)
          throw new Error("Failed to update job")
        }

        const updatedJob = await response.json()
        onUpdate(updatedJob)
      }

      onClose()
      
      // Clean up preview URLs
      previewImages.forEach(url => URL.revokeObjectURL(url))
      setPreviewImages([])
      setSelectedImages([])
      
    } catch (error) {
      console.error("Error updating job:", error)
      alert(`Failed to update job: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Job Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Select Job Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Range</label>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleInputChange}
                placeholder="e.g., $50k-80k"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Update Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-500 transition-colors duration-200">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload size={24} className="text-gray-400" />
                  <span className="text-gray-600">Click to upload new images</span>
                  <span className="text-sm text-gray-500">Leave empty to keep existing images</span>
                </label>
              </div>
              
              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-semibold text-gray-700">Job is active</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-semibold"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 font-semibold flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Update Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// JobItem Component with menu and edit functionality
const JobItem = ({ item, onDelete, onUpdate }) => {
  const [showComments, setShowComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  const handleDelete = () => {
    setShowMenu(false)
    setShowDeleteConfirm(true)
  }
  
  const handleEdit = () => {
    setShowMenu(false)
    setShowEditModal(true)
  }
  
  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(item.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }
  
  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Post Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center space-x-4">
            {item.user.profile_photo && (
              <img
                src={item.user.profile_photo.startsWith("http")
                  ? item.user.profile_photo
                  : `${BASE_URL}${item.user.profile_photo}`}
                alt="Profile"
                className="w-12 h-12 rounded-full bg-gray-200 ring-2 ring-green-100"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {item.user.first_name} {item.user.last_name}
              </p>
              <p className="text-gray-500 text-sm flex items-center">
                <Calendar size={14} className="mr-1" />
                {new Date(item.posted_on).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="relative">
            <button 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>
            
            {/* Menu Popup */}
            {showMenu && (
              <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-36 overflow-hidden">
                <button 
                  className="flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600 transition-colors duration-200"
                  onClick={handleEdit}
                >
                  <Edit size={16} className="mr-3" />
                  Edit
                </button>
                <button 
                  className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors duration-200"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} className="mr-3" />
                  Delete
                </button>
                <button 
                  className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-600 transition-colors duration-200"
                  onClick={() => setShowMenu(false)}
                >
                  <X size={16} className="mr-3" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-6">
            <h4 className="text-red-800 font-semibold mb-2">Delete Job Post</h4>
            <p className="text-red-700 mb-4">Are you sure you want to delete this job post? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button 
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 font-medium"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
        
        {/* Job Content */}
        <div className="px-6">
          {/* Company Name & Role */}
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.company_name || item.company}</h3>
            <div className="flex items-center text-green-600 mb-2">
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="font-medium">{item.role || item.title}</span>
              </div>
              <span className="mx-3 text-gray-400">•</span>
              <div className="flex items-center text-gray-600">
                <MapPin size={16} className="mr-1" />
                <span>{item.location}</span>
              </div>
            </div>
          </div>

          {/* Job Images */}
          {item.images && item.images.length > 0 && (
            item.images.length === 1 ? (
              <div className="mb-6">
                <img
                  src={`${BASE_URL}${item.images[0].image}`}
                  alt="Job"
                  className="w-full h-80 object-cover rounded-xl shadow-sm"
                />
              </div>
            ) : (
              <ImageSlider images={item.images} baseUrl={BASE_URL} />
            )
          )}
          
          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed text-base">{item.description}</p>
          </div>
          
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center bg-green-50 p-4 rounded-xl">
              <DollarSign size={20} className="text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Salary Range</p>
                <p className="font-semibold text-gray-900">{item.salary_range}</p>
              </div>
            </div>
            <div className="flex items-center bg-blue-50 p-4 rounded-xl">
              <Users size={20} className="text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Job Type</p>
                <p className="font-semibold text-gray-900">{item.job_type}</p>
              </div>
            </div>
          </div>
          
          {/* Engagement Stats */}
          <div className="flex items-center justify-between py-4 border-t border-gray-100 mb-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-gray-600">
                <Heart size={18} className="mr-2 text-red-500" />
                <span className="font-medium">{item.total_reactions}</span>
                <span className="ml-1 text-sm">likes</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MessageCircle size={18} className="mr-2 text-blue-500" />
                <span className="font-medium">{item.total_comments}</span>
                <span className="ml-1 text-sm">comments</span>
              </div>
            </div>
            <button className="flex items-center text-green-600 hover:text-green-700 transition-colors duration-200 bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100">
              <Share2 size={16} className="mr-2" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="border-t border-gray-100">
          <button 
            className="w-full text-center text-green-700 font-semibold py-4 hover:bg-green-50 transition-colors duration-200 flex items-center justify-center"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={18} className="mr-2" />
            {showComments ? "Hide Comments" : "Show Comments"}
          </button>
          
          {showComments && item.comments && item.comments.length > 0 && (
            <div className="bg-gray-50 p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Comments ({item.comments.length})</h4>
              {item.comments.map((comment) => (
                <div key={comment.id} className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-start space-x-3">
                    {comment.user.profile_photo && (
                      <img
                        src={comment.user.profile_photo.startsWith("http")
                          ? comment.user.profile_photo
                          : `${BASE_URL}${comment.user.profile_photo}`}
                        alt="Commenter"
                        className="w-10 h-10 rounded-full bg-gray-200 ring-2 ring-gray-100"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {comment.user.first_name} {comment.user.last_name}
                        </p>
                        <span className="text-green-600 text-sm">@{comment.user.username}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(comment.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditJobModal 
        job={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={onUpdate}
      />
    </>
  )
}

const Jobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Token not found")
      
      const response = await fetch(`${BASE_URL}/myposts/`, { 
        headers: { Authorization: `Token ${token}` }
      })
      
      if (!response.ok) throw new Error("Failed to fetch")
      
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error("Error fetching jobs", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchJobs()
    setRefreshing(false)
  }

  const deleteJob = async (jobId) => {
    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Token not found")
      
      const response = await fetch(`${BASE_URL}/jobs/${jobId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` }
      })
      
      if (!response.ok) throw new Error("Failed to delete")
      
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId))
    } catch (error) {
      console.error("Error deleting job:", error)
      alert("Failed to delete job. Please try again.")
    }
  }

  const updateJob = (updatedJob) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === updatedJob.id ? { ...job, ...updatedJob } : job
      )
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your job posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Job Posts Yet</h3>
              <p className="text-gray-600">You haven't created any job posts yet. Start contributing to help others find opportunities!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <JobItem key={job.id} item={job} onDelete={deleteJob} onUpdate={updateJob} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Jobs