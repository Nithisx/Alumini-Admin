import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faImage,
  faFileAlt,
  faTimesCircle,
  faTimes,
  faUpload,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import AdminFeed from "./Post"; // Import the feed component we created earlier

const Post = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    // Check if file is image or PDF
    const fileType = file.type;
    if (fileType.startsWith("image/") || fileType === "application/pdf") {
      setUploadedFile({
        file,
        name: file.name,
        type: fileType,
        preview: fileType.startsWith("image/") ? URL.createObjectURL(file) : null,
        size: (file.size / 1024 / 1024).toFixed(2) // Convert to MB
      });
    } else {
      alert("Please upload only images or PDF files.");
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      alert("Please upload a file first.");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Submitting post:", {
        description,
        file: uploadedFile.file,
      });
      
      // Reset form
      setDescription("");
      removeFile();
      setIsLoading(false);
      setIsModalOpen(false);
      
      // Show success message
      alert("Post created successfully!");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Main content - Feed */}
      <AdminFeed />

      {/* Add post floating button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-green-600 text-white shadow-lg 
                   hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
      </button>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Create New Post</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-4">
                {/* File Upload Section */}
                {!uploadedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-3 bg-gray-100 p-3 rounded-full">
                        <FontAwesomeIcon icon={faUpload} className="text-2xl text-blue-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-700 mb-1">Drop files to upload</h4>
                      <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                      
                      <div className="flex justify-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faImage} className="text-green-500 mr-2" />
                          <span>Images</span>
                        </div>
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faFileAlt} className="text-red-500 mr-2" />
                          <span>PDF</span>
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,application/pdf"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Uploaded File</h4>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTimesCircle} />
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      {uploadedFile.preview ? (
                        <div className="relative mr-3">
                          <img 
                            src={uploadedFile.preview} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faFileAlt} className="text-2xl text-red-500" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">{uploadedFile.size} MB</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description Input */}
                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Write a description for your post..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                            flex items-center justify-center min-w-[80px]
                            ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
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