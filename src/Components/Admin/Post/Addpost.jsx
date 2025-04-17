import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faImage, faFileAlt, faTimesCircle,
  faTimes, faUpload, faSpinner
} from "@fortawesome/free-solid-svg-icons";
import AdminFeed from "./Post"; // Feed component

const Post = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Job Post Fields
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostCompany, setNewPostCompany] = useState("");
  const [newPostRole, setNewPostRole] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostSalary, setNewPostSalary] = useState("");
  const [newPostType, setNewPostType] = useState("");
  const [error, setError] = useState("");

  // Drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  const handleFile = (file) => {
    const fileType = file.type;
    if (fileType.startsWith("image/") || fileType === "application/pdf") {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: fileType.startsWith("image/") ? URL.createObjectURL(file) : null,
        size: (file.size / 1024 / 1024).toFixed(2)
      });
    } else {
      alert("Only images or PDFs are allowed.");
    }
  };
  const removeFile = () => {
    if (uploadedFile?.preview) URL.revokeObjectURL(uploadedFile.preview);
    setUploadedFile(null);
  };

  // Submit post
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPostCaption || !newPostCompany || !newPostRole || !newPostLocation || !newPostSalary || !newPostType) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      console.log("Job Posted:", {
        newPostCaption,
        newPostCompany,
        newPostRole,
        newPostLocation,
        newPostSalary,
        newPostType,
        uploadedFile,
      });

      // Reset everything
      setNewPostCaption("");
      setNewPostCompany("");
      setNewPostRole("");
      setNewPostLocation("");
      setNewPostSalary("");
      setNewPostType("");
      removeFile();
      setIsLoading(false);
      setIsModalOpen(false);
      alert("Job post created successfully!");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <AdminFeed />

      {/* Floating Add Post Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-green-600 text-white shadow-lg 
                   hover:bg-green-700 focus:outline-none flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Create New Job Post</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-3">
                <input type="text" placeholder="Job Description" className="border p-2 w-full rounded"
                  value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} />
                <input type="text" placeholder="Company Name" className="border p-2 w-full rounded"
                  value={newPostCompany} onChange={(e) => setNewPostCompany(e.target.value)} />
                <input type="text" placeholder="Role" className="border p-2 w-full rounded"
                  value={newPostRole} onChange={(e) => setNewPostRole(e.target.value)} />
                <input type="text" placeholder="Location" className="border p-2 w-full rounded"
                  value={newPostLocation} onChange={(e) => setNewPostLocation(e.target.value)} />
                <input type="text" placeholder="Salary Range" className="border p-2 w-full rounded"
                  value={newPostSalary} onChange={(e) => setNewPostSalary(e.target.value)} />
                <input type="text" placeholder="Job Type" className="border p-2 w-full rounded"
                  value={newPostType} onChange={(e) => setNewPostType(e.target.value)} />

                {/* File Upload Section */}
                {!uploadedFile ? (
                  <div className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer 
                                ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <FontAwesomeIcon icon={faUpload} className="text-2xl text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Drop image or click to upload</p>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                  </div>
                ) : (
                  <div className="border p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {uploadedFile.preview ? (
                        <img src={uploadedFile.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <FontAwesomeIcon icon={faFileAlt} className="text-2xl text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">{uploadedFile.size} MB</p>
                      </div>
                    </div>
                    <button type="button" onClick={removeFile} className="text-red-500">
                      <FontAwesomeIcon icon={faTimesCircle} />
                    </button>
                  </div>
                )}

                {error && <p className="text-red-600 text-sm">{error}</p>}
              </div>

              <div className="p-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 px-4 py-2 rounded text-sm"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2
                            ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
