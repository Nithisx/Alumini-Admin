import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Tag, User } from 'lucide-react';

const SingleEvents = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const token = localStorage.getItem('Token');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://209.38.121.118/api/events/${id}`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, token]);

  const openFullScreen = (index) => {
    setCurrentImageIndex(index);
    setShowFullScreen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeFullScreen = () => {
    setShowFullScreen(false);
    document.body.style.overflow = 'auto';
  };

  const goToNextImage = (e) => {
    e.stopPropagation();
    if (event?.images?.length) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === event.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const goToPrevImage = (e) => {
    e.stopPropagation();
    if (event?.images?.length) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? event.images.length - 1 : prevIndex - 1
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showFullScreen) return;
      
      if (event.keyCode === 27) { // ESC key
        closeFullScreen();
      } else if (event.keyCode === 37) { // Left arrow
        goToPrevImage(event);
      } else if (event.keyCode === 39) { // Right arrow
        goToNextImage(event);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullScreen, event]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-green-600 text-xl animate-pulse">Loading event details...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-red-100 text-red-700 rounded-lg shadow-lg max-w-md">
        <h2 className="mb-2 text-xl font-bold">Error Loading Event</h2>
        <p>{error}</p>
      </div>
    </div>
  );
  
  if (!event) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-gray-100 text-gray-700 rounded-lg shadow-lg max-w-md">
        <h2 className="mb-2 text-xl font-bold">No Event Found</h2>
        <p>The event you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  );

  // Get image URLs
  const hasImages = event.images && event.images.length > 0;
  const getImageUrl = (image) => `http://209.38.121.118/api${image.image}`;
  const currentImageUrl = hasImages ? getImageUrl(event.images[currentImageIndex]) : 'https://via.placeholder.com/600x400?text=No+Image';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 my-[50px]">
      {/* Top Banner with Event Title */}
      <div className="bg-green-600 text-white shadow-md">
        <div className="container px-4 py-6 mx-auto">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-green-50">
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(event.from_date_time)}</span>
            </div>
            <div className="flex items-center">
              <MapPin size={16} className="mr-1" />
              <span>{event.venue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Image Gallery Section */}
          <div className="lg:col-span-8">
            <div className="overflow-hidden bg-white rounded-lg shadow-lg">
              {/* Main Image Display */}
              <div className="relative bg-gray-800">
                {hasImages ? (
                  <div className="aspect-w-16 aspect-h-10">
                    <img
                      src={currentImageUrl}
                      alt={`${event.title} - Featured`}
                      className="object-contain w-full h-full cursor-pointer"
                      onClick={() => openFullScreen(currentImageIndex)}
                    />
                    
                    {/* Image Navigation Controls */}
                    {event.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPrevImage(e);
                          }}
                          className="absolute p-2 text-white transition-all duration-200 transform -translate-y-1/2 rounded-full top-1/2 left-4 bg-black bg-opacity-30 hover:bg-opacity-50 focus:outline-none"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNextImage(e);
                          }}
                          className="absolute p-2 text-white transition-all duration-200 transform -translate-y-1/2 rounded-full top-1/2 right-4 bg-black bg-opacity-30 hover:bg-opacity-50 focus:outline-none"
                          aria-label="Next image"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter Badge */}
                    {event.images.length > 1 && (
                      <div className="absolute px-3 py-1 text-sm text-white rounded-md top-4 right-4 bg-black bg-opacity-40">
                        {currentImageIndex + 1} / {event.images.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-w-16 aspect-h-10 bg-gray-200">
                    <div className="p-8 text-center text-gray-500">
                      <div className="mb-2">No images available</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {hasImages && event.images.length > 1 && (
                <div className="p-3 bg-gray-200">
                  <div className="flex pb-1 space-x-2 overflow-x-auto">
                    {event.images.map((img, index) => (
                      <div 
                        key={img.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'ring-2 ring-green-600 opacity-100 transform scale-105' 
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={getImageUrl(img)}
                          alt={`Thumbnail ${index + 1}`}
                          className="object-cover w-24 h-16 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Event Description */}
            <div className="p-6 mt-6 bg-white rounded-lg shadow-lg">
              <h2 className="mb-4 text-2xl font-bold text-gray-800">About This Event</h2>
              <div className="text-gray-600 prose-lg max-w-none">
                {event.description}
              </div>
            </div>
          </div>
          
          {/* Event Details Sidebar */}
          <div className="lg:col-span-4">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              {/* Date & Time */}
              <div className="p-4 mb-4 border-b border-gray-200">
                <h3 className="mb-3 text-lg font-bold text-gray-800">Date & Time</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Clock size={18} className="mt-1 mr-3 text-green-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-700">From</div>
                      <div className="text-gray-600">{formatDate(event.from_date_time)}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock size={18} className="mt-1 mr-3 text-green-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-700">To</div>
                      <div className="text-gray-600">{formatDate(event.end_date_time)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div className="p-4 mb-4 border-b border-gray-200">
                <h3 className="mb-3 text-lg font-bold text-gray-800">Location</h3>
                <div className="flex items-start">
                  <MapPin size={18} className="mt-1 mr-3 text-green-600 flex-shrink-0" />
                  <div className="text-gray-600">{event.venue}</div>
                </div>
              </div>
              
              {/* Category */}
              <div className="p-4 mb-4 border-b border-gray-200">
                <h3 className="mb-3 text-lg font-bold text-gray-800">Category</h3>
                <div className="flex items-center">
                  <Tag size={18} className="mr-3 text-green-600 flex-shrink-0" />
                  <div className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                    {event.tag}
                  </div>
                </div>
              </div>
              
              {/* Event Creator */}
              <div className="p-4">
                <h3 className="mb-3 text-lg font-bold text-gray-800">Posted by</h3>
                <div className="flex items-start">
                  <User size={18} className="mt-1 mr-3 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">{event.uploaded_by}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.uploaded_on).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullScreen && hasImages && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={closeFullScreen}
        >
          <button 
            onClick={closeFullScreen} 
            className="absolute z-10 p-2 text-white transition-colors duration-200 rounded-full top-4 right-4 bg-black bg-opacity-40 hover:bg-opacity-60"
            aria-label="Close fullscreen view"
          >
            <X size={24} />
          </button>
          
          <div className="absolute px-3 py-1 text-sm text-white rounded-lg top-4 left-4 bg-black bg-opacity-40">
            {currentImageIndex + 1} / {event.images.length}
          </div>
          
          {event.images.length > 1 && (
            <>
              <button 
                onClick={goToPrevImage} 
                className="absolute p-3 text-white transition-colors duration-200 transform -translate-y-1/2 rounded-full left-4 top-1/2 bg-black bg-opacity-40 hover:bg-opacity-60"
              >
                <ChevronLeft size={28} />
              </button>
              
              <button 
                onClick={goToNextImage} 
                className="absolute p-3 text-white transition-colors duration-200 transform -translate-y-1/2 rounded-full right-4 top-1/2 bg-black bg-opacity-40 hover:bg-opacity-60"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          
          <div className="flex items-center justify-center w-full h-full p-4">
            <img 
              src={currentImageUrl}
              alt={`${event.title} - Fullscreen`}
              className="object-contain max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {event.images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0">
              <div className="flex items-center justify-center gap-2 px-4 py-2 overflow-x-auto">
                {event.images.map((img, index) => (
                  <div 
                    key={img.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'ring-2 ring-white transform scale-110 z-10' 
                        : 'opacity-60 hover:opacity-90'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                  >
                    <img 
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${index + 1}`}
                      className="object-cover w-20 h-14 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleEvents;