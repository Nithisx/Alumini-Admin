import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faImage,
  faTimesCircle,
  faTimes,
  faUpload,
  faSpinner,
  faCalendarAlt,
  faMapMarkerAlt,
  faClock,
  faCalendarPlus,
  faTag
} from "@fortawesome/free-solid-svg-icons";
import Events from "./Events";

const AddEvent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    endDate: "",
    endTime: "",
    tag: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle drop zone events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the selected file
  const handleFile = (file) => {
    // Check if file is image
    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: URL.createObjectURL(file),
        size: (file.size / 1024 / 1024).toFixed(2) // Convert to MB
      });
    } else {
      alert("Please upload only image files for event banners.");
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Format date and time for API
  const formatDateTime = (date, time) => {
    if (!date) return null;
    
    // If time is not provided, default to 00:00:00
    const timeString = time || "00:00:00";
    
    return `${date}T${timeString}Z`;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.title || !formData.date || !formData.location) {
      alert("Please fill in all required fields.");
      return;
    }
  
    setIsLoading(true);
    setApiError(null);
  
    try {
      // Prepare form data for API
      const eventData = new FormData();
  
      eventData.append("title", formData.title);
      eventData.append("description", formData.description);
      eventData.append("venue", formData.location);
      eventData.append("from_date_time", formatDateTime(formData.date, formData.time));
      eventData.append("end_date_time", formatDateTime(formData.endDate || formData.date, formData.endTime || formData.time));
      eventData.append("tag", formData.tag);
  
      // Append image if uploaded
      if (uploadedFile?.file) {
        eventData.append("image", uploadedFile.file);
      }
  
      // Send to API
      const response = await fetch("http://192.168.249.123:8000/events/", {
        method: "POST",
        headers: {
          "Authorization": `Token 2e3c06490e12df87036a731e47345bcd7e2a4ec7`, // Add token to headers
        },
        body: eventData, // We use FormData for multipart/form-data to handle file upload
      });
  
      // Parse response
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to create event");
      }
  
      setApiResponse(data);
  
      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        endDate: "",
        endTime: "",
        tag: "",
      });
      removeFile();
      setIsModalOpen(false);
  
      // Show success message
      alert("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      setApiError(error.message || "An error occurred while creating the event");
      alert(`Failed to create event: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Main content - Events list */}
      <Events />

      {/* Add event floating button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   flex items-center justify-center transition-all duration-200"
        aria-label="Add new event"
      >
        <FontAwesomeIcon icon={faCalendarPlus} className="text-xl" />
      </button>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-500" />
                Create New Event
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Event Title */}
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Event Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your event"
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                {/* Event Start Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                      </div>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.time}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Event End Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                      </div>
                      <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.endTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Event Location */}
                <div className="mb-4">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location/Venue <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter event location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Event Tag */}
                <div className="mb-4">
                  <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Tag
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faTag} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="tag"
                      name="tag"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter event tag (e.g., workshop, seminar, conference)"
                      value={formData.tag}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Event Banner Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Banner
                  </label>
                  
                  {!uploadedFile ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <div className="flex flex-col items-center">
                        <div className="mb-3 bg-gray-100 p-3 rounded-full">
                          <FontAwesomeIcon icon={faUpload} className="text-xl text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop an image here</p>
                        <p className="text-xs text-gray-500 mb-2">or click to browse</p>
                        <p className="text-xs text-gray-400">Recommended size: 1200 x 600 pixels</p>
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
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Banner Preview</h4>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTimesCircle} />
                        </button>
                      </div>
                      
                      <div className="relative">
                        <img 
                          src={uploadedFile.preview} 
                          alt="Event banner preview" 
                          className="w-full h-40 object-cover rounded"
                        />
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs text-gray-500">{uploadedFile.name}</span>
                          <span className="text-xs text-gray-500">{uploadedFile.size} MB</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* API Error Message */}
                {apiError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                    <p className="font-medium">Error:</p>
                    <p>{apiError}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm
                          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                          flex items-center justify-center min-w-[100px]
                          ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEvent;