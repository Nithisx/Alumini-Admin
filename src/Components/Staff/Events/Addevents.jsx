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
  faTag,
  faSortAmountDown
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

  // Drag‑and‑drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  // File select
  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };
  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload only image files for event banners.");
      return;
    }
    setUploadedFile({
      file,
      name: file.name,
      type: file.type,
      preview: URL.createObjectURL(file),
      size: (file.size / 1024 / 1024).toFixed(2),
    });
  };
  const removeFile = () => {
    if (uploadedFile?.preview) URL.revokeObjectURL(uploadedFile.preview);
    setUploadedFile(null);
  };

  // Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  // Build ISO datetime
  const formatDateTime = (date, time) => {
    if (!date) return null;
    const timeString = time || "00:00:00";
    return `${date}T${timeString}Z`;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.location) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const eventData = new FormData();
      eventData.append("title", formData.title);
      eventData.append("description", formData.description);
      eventData.append("venue", formData.location);
      eventData.append(
        "from_date_time",
        formatDateTime(formData.date, formData.time)
      );
      eventData.append(
        "end_date_time",
        formatDateTime(
          formData.endDate || formData.date,
          formData.endTime || formData.time
        )
      );
      eventData.append("tag", formData.tag);

      // ← KEY FIX: backend expects `images` array
      if (uploadedFile?.file) {
        eventData.append("images", uploadedFile.file);
      }

      const token = localStorage.getItem("Token");
      const response = await fetch("https://xyndrix.me/api/events/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: eventData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create event");

      setApiResponse(data);
      // reset
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        endDate: "",
        endTime: "",
        tag: ""
      });
      removeFile();
      setIsModalOpen(false);
      alert("Event created successfully!");
    } catch (err) {
      console.error(err);
      setApiError(err.message);
      alert(`Failed to create event: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <Events />

      {/* Add button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-green-600 text-white shadow-xl 
                   hover:bg-green-700 transform hover:scale-105 transition-all duration-200
                   flex items-center justify-center"
        aria-label="Add new event"
      >
        <FontAwesomeIcon icon={faPlus} className="text-2xl" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-green-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center">
                <FontAwesomeIcon icon={faCalendarPlus} className="mr-3 text-white" />
                New Event
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200"
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left */}
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                        Event Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter a memorable title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Start */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-green-600" />
                          </div>
                          <input
                            type="date"
                            id="date"
                            name="date"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={formData.date}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="time" className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Time
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faClock} className="text-green-600" />
                          </div>
                          <input
                            type="time"
                            id="time"
                            name="time"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={formData.time}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* End */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-green-600" />
                          </div>
                          <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={formData.endDate}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 mb-2">
                          End Time
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faClock} className="text-green-600" />
                          </div>
                          <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={formData.endTime}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Venue */}
                    <div>
                      <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                        Location/Venue <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600" />
                        </div>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Where is your event happening?"
                          value={formData.location}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Tag */}
                    <div>
                      <label htmlFor="tag" className="block text-sm font-semibold text-gray-700 mb-2">
                        Event Tag
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FontAwesomeIcon icon={faTag} className="text-green-600" />
                        </div>
                        <input
                          type="text"
                          id="tag"
                          name="tag"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="E.g., workshop, seminar, conference"
                          value={formData.tag}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows="5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Tell people what your event is about"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Banner upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Event Banner
                      </label>
                      {!uploadedFile ? (
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                            ${isDragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400"}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current.click()}
                        >
                          <div className="flex flex-col items-center">
                            <div className="mb-4 bg-green-100 p-4 rounded-full">
                              <FontAwesomeIcon icon={faImage} className="text-2xl text-green-600" />
                            </div>
                            <p className="text-base font-medium text-gray-700 mb-2">Drag and drop an image here</p>
                            <p className="text-sm text-gray-500 mb-3">or click to browse</p>
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
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Banner Preview</h4>
                            <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-700">
                              <FontAwesomeIcon icon={faTimesCircle} className="text-lg" />
                            </button>
                          </div>
                          <img
                            src={uploadedFile.preview}
                            alt="Event banner preview"
                            className="w-full h-48 object-cover rounded-lg shadow-sm"
                          />
                          <div className="mt-3 flex justify-between items-center px-1">
                            <span className="text-xs text-gray-500">{uploadedFile.name}</span>
                            <span className="text-xs text-gray-500">{uploadedFile.size} MB</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* API error */}
                {apiError && (
                  <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    <p className="font-medium mb-1">Error:</p>
                    <p>{apiError}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className={`px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm
                          hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500
                          flex items-center justify-center min-w-[120px]
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
