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
    <div className="relative mb-4">
      <div className="relative overflow-hidden rounded-lg shadow-sm">
        <img
          src={`${baseUrl}${images[activeIndex].image}`}
          alt="Job"
          className="w-full h-48 object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
            >
              →
            </button>
          </>
        )}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-white text-xs font-medium">
              {activeIndex + 1} / {images.length}
            </span>
          </div>
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex justify-center mt-2 space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
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
  const [existingImages, setExistingImages] = useState([])

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
      
      setExistingImages(job.images || [])
      setSelectedImages([])
      setPreviewImages([])
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
    
    previewImages.forEach(url => URL.revokeObjectURL(url))
    
    const previews = files.map(file => URL.createObjectURL(file))
    setPreviewImages(previews)
  }

  const removeExistingImage = (imageId) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  const removeNewImage = (index) => {
    URL.revokeObjectURL(previewImages[index])
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Token not found")

      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key])
          console.log(`Added field: ${key} = ${formData[key]}`)
        }
      })

      selectedImages.forEach((image, index) => {
        formDataToSend.append('images', image)
        console.log(`Added image ${index}:`, image.name, image.size)
      })

      existingImages.forEach((image) => {
        formDataToSend.append('existing_image_ids', image.id)
        console.log(`Keeping existing image: ${image.id}`)
      })

      console.log('Complete FormData contents:')
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

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      const responseText = await response.text()
      console.log('Raw response:', responseText)

      if (!response.ok) {
        throw new Error(`Failed to update job: ${responseText}`)
      }

      const updatedJob = JSON.parse(responseText)
      console.log('Updated job:', updatedJob)
      
      onUpdate(updatedJob)
      onClose()
      
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

  useEffect(() => {
    return () => {
      previewImages.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Edit Job Post</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Job Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Job Type</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Salary Range</label>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleInputChange}
                placeholder="e.g., $50k-80k"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Images</label>
              
              {existingImages.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">Current Images</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {existingImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={`${BASE_URL}${image.image}`}
                          alt={`Current ${index + 1}`}
                          className="w-full h-16 object-cover rounded border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors duration-200">
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
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1"
                >
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload new images</span>
                  <span className="text-xs text-gray-500">These will be added to existing images</span>
                </label>
              </div>
              
              {previewImages.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">New Images to Add</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-16 object-cover rounded border border-green-200"
                        />
                        <div className="absolute top-0 left-0 bg-green-500 text-white rounded px-1">
                          <span className="text-xs font-medium">New</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-semibold text-gray-700">Job is active</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 font-semibold flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])
  
  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            {item.user.profile_photo && (
              <img
                src={item.user.profile_photo.startsWith("http")
                  ? item.user.profile_photo
                  : `${BASE_URL}${item.user.profile_photo}`}
                alt="Profile"
                className="w-10 h-10 rounded-full bg-gray-200 ring-2 ring-green-100"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {item.user.first_name} {item.user.last_name}
              </p>
              <p className="text-gray-500 text-xs flex items-center">
                <Calendar size={12} className="mr-1" />
                {new Date(item.posted_on).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="relative menu-container">
            <button 
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={18} className="text-gray-600" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32 overflow-hidden">
                <button 
                  className="flex items-center w-full px-3 py-2 text-left hover:bg-blue-50 text-blue-600 transition-colors duration-200"
                  onClick={handleEdit}
                >
                  <Edit size={14} className="mr-2" />
                  Edit
                </button>
                <button 
                  className="flex items-center w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 transition-colors duration-200"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </button>
                <button 
                  className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-50 text-gray-600 transition-colors duration-200"
                  onClick={() => setShowMenu(false)}
                >
                  <X size={14} className="mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-semibold mb-1 text-sm">Delete Job Post</h4>
            <p className="text-red-700 mb-3 text-sm">Are you sure you want to delete this job post? This action cannot be undone.</p>
            <div className="flex space-x-2">
              <button 
                className="flex-1 py-1.5 px-3 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors duration-200 font-medium"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-1.5 px-3 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 font-medium"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
        
        {/* Job Content */}
        <div className="px-4">
          {/* Company Name & Role */}
          <div className="mb-3">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{item.company_name || item.company}</h3>
            <div className="flex items-center text-green-600 mb-2">
              <div className="bg-green-100 px-2 py-1 rounded-full">
                <span className="font-medium text-sm">{item.role || item.title}</span>
              </div>
              <span className="mx-2 text-gray-400 text-sm">•</span>
              <div className="flex items-center text-gray-600">
                <MapPin size={14} className="mr-1" />
                <span className="text-sm">{item.location}</span>
              </div>
            </div>
          </div>

          {/* Job Images */}
          {item.images && item.images.length > 0 && (
            item.images.length === 1 ? (
              <div className="mb-4">
                <img
                  src={`${BASE_URL}${item.images[0].image}`}
                  alt="Job"
                  className="w-full h-48 object-cover rounded-lg shadow-sm"
                />
              </div>
            ) : (
              <ImageSlider images={item.images} baseUrl={BASE_URL} />
            )
          )}
          
          {/* Description */}
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed text-sm">{item.description}</p>
          </div>
          
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center bg-green-50 p-3 rounded-lg">
              <DollarSign size={16} className="text-green-600 mr-2" />
              <div>
                <p className="text-xs text-gray-600">Salary Range</p>
                <p className="font-semibold text-gray-900 text-sm">{item.salary_range}</p>
              </div>
            </div>
            <div className="flex items-center bg-blue-50 p-3 rounded-lg">
              <Users size={16} className="text-blue-600 mr-2" />
              <div>
                <p className="text-xs text-gray-600">Job Type</p>
                <p className="font-semibold text-gray-900 text-sm">{item.job_type}</p>
              </div>
            </div>
          </div>
          
          {/* Engagement Stats */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <Heart size={16} className="mr-1 text-red-500" />
                <span className="font-medium text-sm">{item.total_reactions}</span>
                <span className="ml-1 text-xs">likes</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MessageCircle size={16} className="mr-1 text-blue-500" />
                <span className="font-medium text-sm">{item.total_comments}</span>
                <span className="ml-1 text-xs">comments</span>
              </div>
            </div>
            <button className="flex items-center text-green-600 hover:text-green-700 transition-colors duration-200 bg-green-50 px-3 py-1.5 rounded hover:bg-green-100">
              <Share2 size={14} className="mr-1" />
              <span className="font-medium text-sm">Share</span>
            </button>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="border-t border-gray-100">
          <button 
            className="w-full text-center text-green-700 font-semibold py-3 hover:bg-green-50 transition-colors duration-200 flex items-center justify-center text-sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={16} className="mr-2" />
            {showComments ? "Hide Comments" : "Show Comments"}
          </button>
          
          {showComments && item.comments && item.comments.length > 0 && (
            <div className="bg-gray-50 p-4 space-y-3">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Comments ({item.comments.length})</h4>
              {item.comments.map((comment) => (
                <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-2">
                    {comment.user.profile_photo && (
                      <img
                        src={comment.user.profile_photo.startsWith("http")
                          ? comment.user.profile_photo
                          : `${BASE_URL}${comment.user.profile_photo}`}
                        alt="Commenter"
                        className="w-8 h-8 rounded-full bg-gray-200 ring-2 ring-gray-100"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {comment.user.first_name} {comment.user.last_name}
                        </p>
                        <span className="text-green-600 text-xs">@{comment.user.username}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {new Date(comment.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm">
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
      <div className="flex justify-center items-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Loading your job posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-md p-8 max-w-sm mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Posts Yet</h3>
              <p className="text-gray-600 text-sm">You haven't created any job posts yet. Start contributing to help others find opportunities!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
