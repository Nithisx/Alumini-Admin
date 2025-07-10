"use client"

import { useEffect, useState } from "react"
import { MoreVertical, MapPin, Clock, User, Share2, Trash2, X, Heart, MessageCircle, Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react"

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
    <div className="relative mb-6 group">
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <img 
          src={`${baseUrl}${images[activeIndex].image}`} 
          alt="Event" 
          className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
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

// Enhanced EventItem Component
const EventItem = ({ item, onDelete }) => {
  const [showComments, setShowComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const handleDelete = () => {
    setShowMenu(false)
    setShowDeleteConfirm(true)
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
    <div className="bg-white rounded-3xl mb-8 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-4">
          {item.user_data?.profile_photo && (
            <div className="relative">
              <img
                src={
                  item.user_data.profile_photo.startsWith("http")
                    ? item.user_data.profile_photo
                    : `${BASE_URL}${item.user_data.profile_photo}`
                }
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-green-100"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {item.user_data?.first_name} {item.user_data?.last_name}
            </p>
            <p className="text-gray-500 text-sm">
              {formatRelativeTime(item.uploaded_on)}
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
          
          {/* Improved Menu Popup */}
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-40 py-2 animate-in slide-in-from-top-2 duration-200">
              <button
                className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors duration-200"
                onClick={handleDelete}
              >
                <Trash2 size={16} className="mr-3" />
                Delete Event
              </button>
              <button
                className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setShowMenu(false)}
              >
                <X size={16} className="mr-3" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mx-6 mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-50"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Event Images */}
      {item.images && item.images.length > 0 && (
        <div className="px-6">
          {item.images.length === 1 ? (
            <div className="relative overflow-hidden rounded-2xl shadow-lg group">
              <img
                src={`${BASE_URL}${item.images[0].image}`}
                alt="Event"
                className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          ) : (
            <ImageSlider images={item.images} baseUrl={BASE_URL} />
          )}
        </div>
      )}

      <div className="p-6">
        {/* Event Title with Enhanced Styling */}
        <h2 className="text-2xl font-bold mb-4 text-gray-900 leading-tight">{item.title}</h2>

        {/* Enhanced Event Tag */}
        <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
          <Calendar size={16} className="mr-2" />
          {item.tag}
        </div>

        {/* Enhanced Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <MapPin size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Venue</p>
              <p className="text-gray-900 font-semibold">{item.venue}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
              <Clock size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Start Time</p>
              <p className="text-gray-900 font-semibold">{formatDate(item.from_date_time)}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-4">
              <Clock size={18} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">End Time</p>
              <p className="text-gray-900 font-semibold">{formatDate(item.end_date_time)}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center mr-4">
              <User size={18} className="text-lime-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Organizer</p>
              <p className="text-gray-900 font-semibold">{item.uploaded_by}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Description */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Eye size={20} className="mr-2 text-green-600" />
            About This Event
          </h3>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-green-500">
            <p className="text-gray-700 leading-relaxed">{item.description}</p>
          </div>
        </div>

        {/* Enhanced Interaction Bar */}
        <div className="flex items-center justify-between py-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            {item.total_reactions !== undefined && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isLiked ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                </button>
                <span className="text-sm font-medium text-gray-600">{item.total_reactions}</span>
              </div>
            )}
            
            {item.total_comments !== undefined && (
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-200">
                  <MessageCircle size={20} />
                </button>
                <span className="text-sm font-medium text-gray-600">{item.total_comments}</span>
              </div>
            )}
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Share2 size={16} />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>

        {/* Enhanced Comments Section */}
        {item.comments && item.comments.length > 0 && (
          <div className="mt-6">
            <button
              className="w-full py-3 px-4 bg-gradient-to-r from-gray-50 to-green-50 hover:from-gray-100 hover:to-green-100 text-green-700 font-semibold rounded-xl transition-all duration-200 border border-green-100"
              onClick={() => setShowComments(!showComments)}
            >
              {showComments ? "Hide Comments" : `View ${item.comments.length} Comments`}
            </button>

            {showComments && (
              <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                {item.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    {comment.user.profile_photo && (
                      <img
                        src={
                          comment.user.profile_photo.startsWith("http")
                            ? comment.user.profile_photo
                            : `${BASE_URL}${comment.user.profile_photo}`
                        }
                        alt="Commenter"
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-green-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-bold text-green-900">
                          {comment.user.first_name} {comment.user.last_name}
                        </p>
                        <span className="text-green-600 text-xs">@{comment.user.username}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{new Date(comment.created_at).toLocaleString()}</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{comment.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Main Events Component
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
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        
      </div>

      {/* Enhanced Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
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
          <div className="space-y-8">
            {events.map((event) => (
              <EventItem key={event.id} item={event} onDelete={deleteEvent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Events