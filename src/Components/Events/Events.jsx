import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faMapMarkerAlt,
  faUsers,
  faComment,
  faShare,
  faEllipsisH,
  faTrash,
  faCheckCircle,
  faUserCircle,
  faHeart,
  faClock,
  faFilter,
  faSearch
} from "@fortawesome/free-solid-svg-icons";

// Dummy data for events
const initialEvents = [
  {
    id: 1,
    username: "event_organizer",
    avatar: null,
    verified: true,
    timestamp: "3 hours ago",
    title: "Annual Tech Conference 2025",
    description: "Join us for the biggest tech conference of the year! Featuring keynote speakers, workshops, and networking opportunities.",
    image: "https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    date: "April 15-17, 2025",
    location: "San Francisco Convention Center",
    attendees: 342,
    likes: 124,
    comments: 43,
    shares: 12,
  },
  {
    id: 2,
    username: "music_festivals",
    avatar: null,
    verified: true,
    timestamp: "Yesterday",
    title: "Summer Music Festival",
    description: "Three days of amazing music across 5 stages with over 60 artists. Food, camping, and unforgettable memories!",
    image: "https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    date: "July 8-10, 2025",
    location: "Riverfront Park",
    attendees: 1243,
    likes: 367,
    comments: 98,
    shares: 213,
  },
  {
    id: 3,
    username: "fitness_community",
    avatar: null,
    verified: false,
    timestamp: "2 days ago",
    title: "5K Charity Run for Cancer Research",
    description: "Run or walk to support cancer research. Entry fee includes t-shirt and refreshments. All proceeds go to cancer research foundation.",
    image: "https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    date: "May 22, 2025",
    location: "Central Park",
    attendees: 756,
    likes: 289,
    comments: 67,
    shares: 145,
  },
  {
    id: 4,
    username: "workshop_hub",
    avatar: null,
    verified: false,
    timestamp: "5 days ago",
    title: "Photography Workshop for Beginners",
    description: "Learn the basics of photography from professional photographers. Bring your camera! Limited spots available.",
    image:"https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    date: "April 5, 2025",
    location: "Downtown Arts Center",
    attendees: 48,
    likes: 56,
    comments: 23,
    shares: 18,
  },
];

const Events = () => {
  const [events, setEvents] = useState(initialEvents);
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Handle delete click
  const handleDeleteClick = (eventId) => {
    if (deleteConfirm === eventId) {
      // Confirm delete
      setEvents(events.filter(event => event.id !== eventId));
      setDeleteConfirm(null);
    } else {
      // Show confirmation
      setDeleteConfirm(eventId);
      // Hide confirmation after 3 seconds if not clicked
      setTimeout(() => {
        setDeleteConfirm(null);
      }, 3000);
    }
  };

  // Toggle menu visibility
  const toggleMenu = (eventId) => {
    setActiveMenu(activeMenu === eventId ? null : eventId);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with search and filter */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-green-600">Events Management</h1>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <FontAwesomeIcon icon={faFilter} className="mr-2 text-gray-500" />
                <span>Filter</span>
              </button>
            </div>
          </div>
          
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm" 
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-gray-300 mb-3" />
            <h3 className="text-xl font-medium text-gray-500 mb-1">No Events Found</h3>
            <p className="text-gray-400">There are no events available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Event Image */}
                {event.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt="Event banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 p-3">
                      <div className="relative">
                        <button
                          onClick={() => toggleMenu(event.id)}
                          className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-sm"
                        >
                          <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                        
                        {activeMenu === event.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                            <button
                              onClick={() => handleDeleteClick(event.id)}
                              className="w-full text-left p-3 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-2" />
                              {deleteConfirm === event.id ? "Confirm Delete" : "Delete Event"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Event Content */}
                <div className="p-5 flex-grow">
                  {/* Creator Info */}
                  <div className="flex items-center mb-4">
                    <div className="mr-3">
                      <FontAwesomeIcon icon={faUserCircle} className="text-gray-400 text-2xl" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">{event.username}</span>
                        {event.verified && (
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="ml-1 text-blue-500 text-xs"
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{event.timestamp}</span>
                    </div>
                    
                    {/* Menu for events without images */}
                    {!event.image && (
                      <div className="relative ml-auto">
                        <button
                          onClick={() => toggleMenu(event.id)}
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                        >
                          <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                        
                        {activeMenu === event.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                            <button
                              onClick={() => handleDeleteClick(event.id)}
                              className="w-full text-left p-3 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-2" />
                              {deleteConfirm === event.id ? "Confirm Delete" : "Delete Event"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Event Title */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
                  
                  {/* Event Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FontAwesomeIcon icon={faClock} className="text-gray-400 w-4 mr-2" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 w-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FontAwesomeIcon icon={faUsers} className="text-gray-400 w-4 mr-2" />
                      <span>{event.attendees.toLocaleString()} attending</span>
                    </div>
                  </div>
                </div>
                
                {/* Event Stats & Actions */}
                <div className="border-t border-gray-100">
                  <div className="px-5 py-3 text-xs text-gray-500 flex justify-between">
                    <span>{event.likes} likes</span>
                    <span>{event.comments} comments</span>
                    <span>{event.shares} shares</span>
                  </div>
                  
                  <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                    <button className="flex-1 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faHeart} className="mr-2 text-gray-500" />
                      Like
                    </button>
                    <button className="flex-1 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faComment} className="mr-2 text-gray-500" />
                      Comment
                    </button>
                    <button className="flex-1 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faShare} className="mr-2 text-gray-500" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;