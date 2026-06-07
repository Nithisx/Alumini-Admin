import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt, faMapMarkerAlt, faClock, faTag,
  faImage, faTimesCircle, faSpinner, faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const BASE_URL = "https://api.karpagamalumni.in";

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFile, setNewImageFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "", description: "", date: "", time: "",
    endDate: "", endTime: "", location: "", tag: "",
  });

  const token = localStorage.getItem("Token");

  useEffect(() => {
    fetch(`${BASE_URL}/api/v1/events/${id}`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const from = new Date(data.from_date_time);
        const end = new Date(data.end_date_time);
        setFormData({
          title: data.title || "",
          description: data.description || "",
          date: from.toISOString().slice(0, 10),
          time: from.toISOString().slice(11, 16),
          endDate: end.toISOString().slice(0, 10),
          endTime: end.toISOString().slice(11, 16),
          location: data.venue || "",
          tag: data.tag || "",
        });
        setExistingImages(data.images || []);
      })
      .catch(() => toast.error("Failed to load event"))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload only image files.");
        return;
      }
      if (newImageFile?.preview) URL.revokeObjectURL(newImageFile.preview);
      setNewImageFile({ file, preview: URL.createObjectURL(file) });
    }
  };

  const removeNewImage = () => {
    if (newImageFile?.preview) URL.revokeObjectURL(newImageFile.preview);
    setNewImageFile(null);
  };

  const formatDateTime = (date, time) => {
    if (!date) return null;
    return `${date}T${time || "00:00:00"}Z`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.location) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("venue", formData.location);
      payload.append("from_date_time", formatDateTime(formData.date, formData.time));
      payload.append("end_date_time", formatDateTime(formData.endDate || formData.date, formData.endTime || formData.time));
      payload.append("tag", formData.tag);
      if (newImageFile?.file) {
        payload.append("images", newImageFile.file);
      }

      const res = await fetch(`${BASE_URL}/api/v1/events/${id}`, {
        method: "PUT",
        headers: { Authorization: `Token ${token}` },
        body: payload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update event");
      }

      toast.success("Event updated successfully!");
      navigate(`/admin/event/${id}`);
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <div className="bg-green-600 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/admin/event/${id}`)} className="text-white hover:text-green-200">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="text-xl font-bold">Edit Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="title" value={formData.title}
                onChange={handleInputChange} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Event title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
                  <input type="date" name="date" value={formData.date}
                    onChange={handleInputChange} required
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faClock} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
                  <input type="time" name="time" value={formData.time}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
                  <input type="date" name="endDate" value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faClock} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
                  <input type="time" name="endTime" value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Location/Venue <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
                <input type="text" name="location" value={formData.location}
                  onChange={handleInputChange} required
                  className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Venue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Event Tag</label>
              <div className="relative">
                <FontAwesomeIcon icon={faTag} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
                <input type="text" name="tag" value={formData.tag}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., seminar, workshop"
                />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={5} value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe your event"
              />
            </div>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Images</label>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <img key={img.id} src={`${BASE_URL}${img.image}`}
                      alt="Event" className="w-24 h-16 object-cover rounded-lg border" />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload a new image below to replace all existing images.</p>
              </div>
            )}

            {/* New image upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {existingImages.length > 0 ? "Replace Image" : "Event Banner"}
              </label>
              {!newImageFile ? (
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-green-400 rounded-lg p-6 text-center cursor-pointer transition-colors"
                >
                  <FontAwesomeIcon icon={faImage} className="text-2xl text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload image</p>
                  <input type="file" ref={fileInputRef} className="hidden"
                    onChange={handleFileSelect} accept="image/*" />
                </div>
              ) : (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">New Image</span>
                    <button type="button" onClick={removeNewImage} className="text-red-500 hover:text-red-700">
                      <FontAwesomeIcon icon={faTimesCircle} />
                    </button>
                  </div>
                  <img src={newImageFile.preview} alt="Preview"
                    className="w-full h-40 object-cover rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={() => navigate(`/admin/event/${id}`)}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className={`px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2 ${saving ? "opacity-75 cursor-not-allowed" : ""}`}>
            {saving ? (
              <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Saving...</>
            ) : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEvent;
