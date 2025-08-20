"use client"

import { useEffect, useState } from "react"
import { MoreVertical, MapPin, Clock, User, Share2, Trash2, X, Heart, MessageCircle, Calendar, Eye, ChevronLeft, ChevronRight, Edit, Upload, Save, Plus } from "lucide-react"

const BASE_URL = "https://xyndrix.me/api"

// Modern Image Slider Component
const ImageSlider = ({ images, baseUrl }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative mb-4 group">
      <div className="relative overflow-hidden rounded-xl shadow-md">
        <img 
          src={`${baseUrl}${images[activeIndex].image}`} 
          alt="Event" 
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
        
        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="flex justify-center mt-3 space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeIndex === index 
                  ? "bg-green-500 scale-125" 
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Edit Event Modal Component (keeping the same as original)
const EditEventModal = ({ event, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    tag: '',
    from_date_time: '',
    end_date_time: ''
  })
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [imagesToDelete, setImagesToDelete] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        venue: event.venue || '',
        tag: event.tag || '',
        from_date_time: event.from_date_time ? event.from_date_time.slice(0, 16) : '',
        end_date_time: event.end_date_time ? event.end_date_time.slice(0, 16) : ''
      })
      setExistingImages(event.images || [])
      setNewImages([])
      setImagesToDelete([])
    }
  }, [event, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNewImageSelect = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
  }

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId])
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Token not found")

      // Create FormData for the request
      const formDataToSend = new FormData()
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })

      // Add new images
      newImages.forEach((image, index) => {
        formDataToSend.append(`images`, image)
      })

      // Add images to delete
      imagesToDelete.forEach(imageId => {
        formDataToSend.append('delete_images', imageId)
      })

      const response = await fetch(`${BASE_URL}/events/${event.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update event")
      }

      const updatedEvent = await response.json()
      onUpdate(updatedEvent)
      onClose()
    } catch (error) {
      console.error("Error updating event:", error)
      alert("Failed to update event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Edit size={24} className="mr-3 text-green-600" />
            Edit Event
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
              required
            />
          </div>

          {/* Venue and Tag */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Tag
              </label>
              <input
                type="text"
                name="tag"
                value={formData.tag}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="from_date_time"
                value={formData.from_date_time}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="end_date_time"
                value={formData.end_date_time}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${BASE_URL}${image.image}`}
                      alt="Event"
                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Add New Images
            </label>
            
            {/* New Images Preview */}
            {newImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {newImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt="New"
                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleNewImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 transition-colors duration-200 cursor-pointer">
                <div className="text-center">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Click to upload images
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 10MB each
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Update Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Enhanced EventItem Component with smaller size
const EventItem = ({ item, onDelete, onUpdate }) => {
  const [showComments, setShowComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-fit">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            {item.user_data?.profile_photo && (
              <div className="relative">
                <img
                  src={
                    item.user_data.profile_photo.startsWith("http")
                      ? item.user_data.profile_photo
                      : `${BASE_URL}${item.user_data.profile_photo}`
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-green-100"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-sm">
                {item.user_data?.first_name} {item.user_data?.last_name}
              </p>
              <p className="text-gray-500 text-xs">
                {formatRelativeTime(item.uploaded_on)}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200" 
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={16} className="text-gray-600" />
            </button>
            
            {/* Menu Popup */}
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-36 py-2 animate-in slide-in-from-top-2 duration-200">
                <button
                  className="flex items-center w-full px-3 py-2 text-left hover:bg-green-50 text-green-600 transition-colors duration-200 text-sm"
                  onClick={handleEdit}
                >
                  <Edit size={14} className="mr-2" />
                  Edit Event
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 transition-colors duration-200 text-sm"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Event
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-200 text-sm"
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
          <div className="mx-4 mb-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="text-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={16} className="text-red-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Delete Event</h3>
              <p className="text-xs text-gray-600 mb-4">Are you sure you want to delete this event? This action cannot be undone.</p>
              <div className="flex space-x-2">
                <button
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors duration-200"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Images */}
        {item.images && item.images.length > 0 && (
          <div className="px-4">
            {item.images.length === 1 ? (
              <div className="relative overflow-hidden rounded-xl shadow-md group">
                <img
                  src={`${BASE_URL}${item.images[0].image}`}
                  alt="Event"
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            ) : (
              <ImageSlider images={item.images} baseUrl={BASE_URL} />
            )}
          </div>
        )}

        <div className="p-4">
          {/* Event Title */}
          <h2 className="text-lg font-bold mb-3 text-gray-900 leading-tight line-clamp-2">{item.title}</h2>

          {/* Event Tag */}
          <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-md">
            <Calendar size={12} className="mr-1.5" />
            {item.tag}
          </div>

          {/* Event Details Grid - Compact */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <MapPin size={14} className="text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium">Venue</p>
                <p className="text-gray-900 font-semibold text-sm truncate">{item.venue}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                <Clock size={14} className="text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium">Start Time</p>
                <p className="text-gray-900 font-semibold text-sm truncate">{formatDate(item.from_date_time)}</p>
              </div>
            </div>
          </div>

          {/* Description - Truncated */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
              <Eye size={16} className="mr-2 text-green-600" />
              About This Event
            </h3>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border-l-4 border-green-500">
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{item.description}</p>
            </div>
          </div>

          {/* Interaction Bar - Compact */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              {item.total_reactions !== undefined && (
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      isLiked ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                  </button>
                  <span className="text-xs font-medium text-gray-600">{item.total_reactions}</span>
                </div>
              )}
              
              {item.total_comments !== undefined && (
                <div className="flex items-center space-x-1">
                  <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-200">
                    <MessageCircle size={16} />
                  </button>
                  <span className="text-xs font-medium text-gray-600">{item.total_comments}</span>
                </div>
              )}
            </div>
            
            {/* <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg">
              <Share2 size={14} />
              <span className="text-xs font-medium">Share</span>
            </button> */}
          </div>

          {/* Comments Section - Compact */}
          {item.comments && item.comments.length > 0 && (
            <div className="mt-4">
              <button
                className="w-full py-2 px-3 bg-gradient-to-r from-gray-50 to-green-50 hover:from-gray-100 hover:to-green-100 text-green-700 font-semibold rounded-lg transition-all duration-200 border border-green-100 text-sm"
                onClick={() => setShowComments(!showComments)}
              >
                {showComments ? "Hide Comments" : `View ${item.comments.length} Comments`}
              </button>

              {showComments && (
                <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-300 max-h-40 overflow-y-auto">
                  {item.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      {comment.user.profile_photo && (
                        <img
                          src={
                            comment.user.profile_photo.startsWith("http")
                              ? comment.user.profile_photo
                              : `${BASE_URL}${comment.user.profile_photo}`
                          }
                          alt="Commenter"
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-2 ring-green-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-xs font-bold text-green-900">
                            {comment.user.first_name} {comment.user.last_name}
                          </p>
                          <span className="text-green-600 text-xs">@{comment.user.username}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{new Date(comment.created_at).toLocaleString()}</p>
                        <p className="text-xs text-gray-800 leading-relaxed">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditEventModal
        event={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={onUpdate}
      />
    </>
  )
}

// Enhanced Main Events Component with Grid Layout
const Events = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Token not found")

      const response = await fetch(`${BASE_URL}/myposts/`, {
        headers: { Authorization: `Token ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      const eventsData = data.events || data.posts || []
      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events", error)
      alert("Failed to fetch events. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchEvents()
    setRefreshing(false)
  }

  const deleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("Token")
      if (!token) throw new Error("Token not found")

      const response = await fetch(`${BASE_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      })

      if (!response.ok) throw new Error("Failed to delete")

      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Failed to delete event. Please try again.")
    }
  }

  const updateEvent = (updatedEvent) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        
      </div>

      {/* Content with Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You haven't created any events yet. Start by creating your first event to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventItem 
                key={event.id} 
                item={event} 
                onDelete={deleteEvent} 
                onUpdate={updateEvent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Events
