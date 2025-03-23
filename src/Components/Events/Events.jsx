import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faMapMarkerAlt,
  faUsers,
  faEllipsisV,
  faTrash,
  faUserCircle,
  faClock,
  faFilter,
  faSearch,
  faSpinner,
  faExclamationTriangle,
  faEdit,
  faPlus,
  faDownload,
  faSortAmountDown
} from "@fortawesome/free-solid-svg-icons";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
  
        // Set up the request headers with the Authorization token
        const headers = {
          "Authorization": `Token 2e3c06490e12df87036a731e47345bcd7e2a4ec7`,
        };
  
        const response = await fetch("http://192.168.249.123:8000/events/", { headers });
  
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
  
        const data = await response.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch events. Please try again later.");
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchEvents();
  }, []);
  

  const handleDeleteClick = async (eventId) => {
    if (deleteConfirm === eventId) {
      try {
        
        setEvents(events.filter(event => event.id !== eventId));
        setDeleteConfirm(null);
      } catch (err) {
        setError("Failed to delete event. Please try again.");
        console.error("Error deleting event:", err);
      }
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
  const toggleMenu = (eventId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === eventId ? null : eventId);
  };

  // Close all menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Filter events based on search term
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date without time
  const formatDateOnly = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Format time only
  const formatTimeOnly = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate how long ago the event was uploaded
  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    } else {
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Events Management</h1>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded shadow-sm flex items-center text-gray-700 hover:bg-gray-50">
                <FontAwesomeIcon icon={faFilter} className="mr-2 text-gray-500" />
                <span>Filter</span>
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded shadow-sm flex items-center text-gray-700 hover:bg-gray-50">
                <FontAwesomeIcon icon={faSortAmountDown} className="mr-2 text-gray-500" />
                <span>Sort</span>
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded shadow-sm flex items-center text-gray-700 hover:bg-gray-50">
                <FontAwesomeIcon icon={faDownload} className="mr-2 text-gray-500" />
                <span>Export</span>
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 rounded shadow-sm flex items-center text-white hover:bg-blue-700"
                onClick={() => alert("Add new event functionality would go here")}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                <span>New Event</span>
              </button>
            </div>
          </div>
          
          {/* Search and View Mode Controls */}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative w-full md:w-3/4">
              <input 
                type="text" 
                placeholder="Search events by title, description or venue..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* View mode toggle */}
            <div className="flex justify-center w-full md:w-auto">
              <div className="inline-flex rounded shadow-sm">
                <button
                  className={`px-4 py-2 text-sm font-medium ${viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-200 rounded-l`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid View
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-200 border-l-0 rounded-r`}
                  onClick={() => setViewMode('list')}
                >
                  List View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-4xl" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-6 flex items-start">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5 mr-3 text-red-500" />
            <div>
              <h3 className="font-medium">Error Loading Events</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="bg-white rounded shadow-sm p-8 text-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-gray-300 mb-3" />
            <h3 className="text-xl font-medium text-gray-700 mb-1">No Events Found</h3>
            <p className="text-gray-500 mb-4">There are no events matching your search criteria.</p>
            <button className="px-4 py-2 bg-blue-600 rounded shadow-sm flex items-center text-white hover:bg-blue-700 mx-auto">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              <span>Create New Event</span>
            </button>
          </div>
        )}

        {/* Grid View */}
        {!loading && !error && filteredEvents.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                {/* Event Image */}
                {event.image && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={`http://192.168.249.123:8000${event.image}`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://picsum.photos/400/200?random=" + event.id;
                      }}
                    />
                  </div>
                )}
                
                {/* Event Content */}
                <div className="p-5 flex-grow">
                  {/* Status and Actions */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(event.id, e)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                      >
                        <FontAwesomeIcon icon={faEllipsisV} />
                      </button>
                      
                      {activeMenu === event.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded shadow-lg z-10 border border-gray-200 py-1">
                          <button
                            onClick={() => alert("Edit event functionality would go here")}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-3 text-gray-500 w-4" />
                            Edit Event
                          </button>
                          <button
                            onClick={() => handleDeleteClick(event.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-3 text-red-500 w-4" />
                            {deleteConfirm === event.id ? "Confirm Delete" : "Delete Event"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{event.title}</h3>
                  
                  {/* Event Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  {/* Event Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start text-sm">
                      <FontAwesomeIcon icon={faClock} className="text-gray-400 w-4 mt-0.5 mr-3" />
                      <div>
                        <div className="text-gray-800">{formatDateOnly(event.from_date_time)}</div>
                        <div className="text-gray-600">
                          {formatTimeOnly(event.from_date_time)} - {formatTimeOnly(event.end_date_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start text-sm">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 w-4 mt-0.5 mr-3" />
                      <span className="text-gray-700">{event.venue || "Location not specified"}</span>
                    </div>
                    <div className="flex items-start text-sm">
                      <FontAwesomeIcon icon={faUsers} className="text-gray-400 w-4 mt-0.5 mr-3" />
                      <span className="text-gray-700">{Math.floor(Math.random() * 1000) + 10} registered attendees</span>
                    </div>
                  </div>
                </div>
                
                {/* Event Creator & Timestamp */}
                <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-600 flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUserCircle} className="text-gray-400 text-sm mr-2" />
                    <span className="font-medium">User {event.user}</span>
                  </div>
                  <span>Created {getTimeAgo(event.uploaded_on)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && !error && filteredEvents.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {event.image && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img 
                              className="h-10 w-10 rounded object-cover" 
                              src={`http://192.168.249.123:8000${event.image}`} 
                              alt=""
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://picsum.photos/400/200?random=" + event.id;
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">{event.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{event.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateOnly(event.from_date_time)}</div>
                      <div className="text-sm text-gray-500">
                        {formatTimeOnly(event.from_date_time)} - {formatTimeOnly(event.end_date_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.venue || "Not specified"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.floor(Math.random() * 1000) + 10}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      User {event.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(event.id, e)}
                          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
                        >
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </button>
                        
                        {activeMenu === event.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded shadow-lg z-10 border border-gray-200 py-1">
                            <button
                              onClick={() => alert("Edit event functionality would go here")}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <FontAwesomeIcon icon={faEdit} className="mr-3 text-gray-500 w-4" />
                              Edit Event
                            </button>
                            <button
                              onClick={() => handleDeleteClick(event.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-3 text-red-500 w-4" />
                              {deleteConfirm === event.id ? "Confirm Delete" : "Delete Event"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded shadow-sm">
            <div className="flex flex-1 justify-between sm:hidden">
              <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredEvents.length}</span> of <span className="font-medium">{filteredEvents.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    1
                  </button>
                  <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;