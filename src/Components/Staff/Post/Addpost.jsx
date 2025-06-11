import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFilePdf,
  faTimesCircle,
  faSpinner,
  faPlus,
  faTimes,
  faImage,
  faFileAlt
} from "@fortawesome/free-solid-svg-icons";

const UploadBrochure = () => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Job upload states
  const [isJobDragging, setIsJobDragging] = useState(false);
  const [uploadedJobFile, setUploadedJobFile] = useState(null);
  const [isJobUploading, setIsJobUploading] = useState(false);
  const [jobError, setJobError] = useState("");
  const jobFileInputRef = useRef(null);

  // Brochure upload states
  const [isBrochureDragging, setIsBrochureDragging] = useState(false);
  const [uploadedBrochureFile, setUploadedBrochureFile] = useState(null);
  const [isBrochureUploading, setIsBrochureUploading] = useState(false);
  const [brochureError, setBrochureError] = useState("");
  const brochureFileInputRef = useRef(null);

  // Job file handlers
  const handleJobDragOver = (e) => {
    e.preventDefault();
    setIsJobDragging(true);
  };

  const handleJobDragLeave = () => {
    setIsJobDragging(false);
  };

  const handleJobDrop = (e) => {
    e.preventDefault();
    setIsJobDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleJobFile(e.dataTransfer.files[0]);
    }
  };

  const handleJobFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleJobFile(e.target.files[0]);
    }
  };

  const handleJobFile = (file) => {
    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      setUploadedJobFile({
        file,
        name: file.name,
        type: fileType,
        preview: URL.createObjectURL(file),
        size: (file.size / 1024 / 1024).toFixed(2)
      });
      setJobError("");
    } else {
      setJobError("Please upload only image files for job posts.");
    }
  };

  // Brochure file handlers
  const handleBrochureDragOver = (e) => {
    e.preventDefault();
    setIsBrochureDragging(true);
  };

  const handleBrochureDragLeave = () => {
    setIsBrochureDragging(false);
  };

  const handleBrochureDrop = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBrochureFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrochureFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleBrochureFile(e.target.files[0]);
    }
  };

  const handleBrochureFile = (file) => {
    const fileType = file.type;
    if (fileType === "application/pdf") {
      setUploadedBrochureFile({
        file,
        name: file.name,
        type: fileType,
        size: (file.size / 1024 / 1024).toFixed(2)
      });
      setBrochureError("");
    } else {
      setBrochureError("Please upload only PDF files for brochures.");
    }
  };

  // Remove files
  const removeJobFile = () => {
    if (uploadedJobFile?.preview) {
      URL.revokeObjectURL(uploadedJobFile.preview);
    }
    setUploadedJobFile(null);
    setJobError("");
    if (jobFileInputRef.current) {
      jobFileInputRef.current.value = "";
    }
  };

  const removeBrochureFile = () => {
    setUploadedBrochureFile(null);
    setBrochureError("");
    if (brochureFileInputRef.current) {
      brochureFileInputRef.current.value = "";
    }
  };

  // Upload handlers
  const handleJobUpload = async () => {
    if (!uploadedJobFile) {
      setJobError("Please select an image file to upload.");
      return;
    }

    setIsJobUploading(true);
    setJobError("");

    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Authentication token not found");

      const formData = new FormData();
      formData.append("image", uploadedJobFile.file);
      formData.append("name", uploadedJobFile.name);

      // Replace with your actual job image upload endpoint
      const response = await fetch("http://134.209.157.195:8000/job-images/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("Job image uploaded successfully!");
        removeJobFile();
      } else {
        throw new Error("Failed to upload job image");
      }
      
    } catch (error) {
      console.error("Error uploading job image:", error);
      setJobError(error.message || "Failed to upload job image. Please try again.");
    } finally {
      setIsJobUploading(false);
    }
  };

  const handleBrochureUpload = async () => {
    if (!uploadedBrochureFile) {
      setBrochureError("Please select a brochure file to upload.");
      return;
    }

    setIsBrochureUploading(true);
    setBrochureError("");

    try {
      const token = localStorage.getItem("Token");
      if (!token) throw new Error("Authentication token not found");

      const formData = new FormData();
      formData.append("brochure", uploadedBrochureFile.file);
      formData.append("name", uploadedBrochureFile.name);

      const response = await fetch("http://134.209.157.195:8000/brochures/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("Brochure uploaded successfully!");
        removeBrochureFile();
      } else {
        throw new Error("Failed to upload brochure");
      }
      
    } catch (error) {
      console.error("Error uploading brochure:", error);
      setBrochureError(error.message || "Failed to upload brochure. Please try again.");
    } finally {
      setIsBrochureUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    removeJobFile();
    removeBrochureFile();
    setJobError("");
    setBrochureError("");
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-green-600">Upload Center</h2>
          <div className="h-1 w-20 bg-green-600 mt-2 rounded"></div>
        </div>

        {/* Single Upload Button */}
        <div className="text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 hover:scale-105"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-3 text-xl" />
            Upload Files
          </button>
        </div>

        {/* Upload Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-600 to-blue-600">
                <h3 className="text-2xl font-bold text-white">Choose Upload Type</h3>
                <button 
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>

              {/* Modal Body with Two Cards */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Card - Job Image Upload */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faImage} className="text-2xl text-green-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Upload Job Image</h4>
                      <p className="text-gray-600 mt-2">Upload images for job postings</p>
                    </div>

                    {jobError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {jobError}
                      </div>
                    )}

                    {!uploadedJobFile ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                  ${isJobDragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400"}`}
                        onDragOver={handleJobDragOver}
                        onDragLeave={handleJobDragLeave}
                        onDrop={handleJobDrop}
                        onClick={() => jobFileInputRef.current.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-4 bg-gray-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faUpload} className="text-2xl text-green-500" />
                          </div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Drop image here</h4>
                          <p className="text-xs text-gray-500 mb-2">or click to browse</p>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <FontAwesomeIcon icon={faImage} className="text-green-500 mr-1" />
                            <span>JPG, PNG, GIF supported</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          ref={jobFileInputRef}
                          onChange={handleJobFileSelect}
                          accept="image/*"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-700">Selected Image</h4>
                          <button
                            type="button"
                            onClick={removeJobFile}
                            className="text-red-500 hover:text-red-700"
                            disabled={isJobUploading}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </button>
                        </div>

                        <div className="flex items-center">
                          <div className="relative mr-3">
                            <img 
                              src={uploadedJobFile.preview} 
                              alt="Preview" 
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{uploadedJobFile.name}</p>
                            <p className="text-xs text-gray-500">{uploadedJobFile.size} MB</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={handleJobUpload}
                            className={`w-full px-4 py-2 font-medium text-white bg-green-600 rounded-lg
                                      hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                                      flex items-center justify-center
                                      ${isJobUploading ? "opacity-75 cursor-not-allowed" : ""}`}
                            disabled={isJobUploading}
                          >
                            {isJobUploading ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                                Upload Image
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OR Separator */}
                  <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-4 border-gray-200 rounded-full w-16 h-16 z-10">
                    <span className="text-gray-500 font-bold text-lg">OR</span>
                  </div>

                  {/* Mobile OR Separator */}
                  <div className="lg:hidden flex items-center justify-center my-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-gray-500 font-bold">OR</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* Right Card - Brochure Upload */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faFilePdf} className="text-2xl text-blue-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Upload Brochure</h4>
                      <p className="text-gray-600 mt-2">Upload PDF brochures and documents</p>
                    </div>

                    {brochureError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {brochureError}
                      </div>
                    )}

                    {!uploadedBrochureFile ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                  ${isBrochureDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
                        onDragOver={handleBrochureDragOver}
                        onDragLeave={handleBrochureDragLeave}
                        onDrop={handleBrochureDrop}
                        onClick={() => brochureFileInputRef.current.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-4 bg-gray-100 p-3 rounded-full">
                            <FontAwesomeIcon icon={faUpload} className="text-2xl text-blue-500" />
                          </div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Drop PDF here</h4>
                          <p className="text-xs text-gray-500 mb-2">or click to browse</p>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <FontAwesomeIcon icon={faFilePdf} className="text-red-500 mr-1" />
                            <span>PDF files only</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          ref={brochureFileInputRef}
                          onChange={handleBrochureFileSelect}
                          accept=".pdf,application/pdf"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-700">Selected Brochure</h4>
                          <button
                            type="button"
                            onClick={removeBrochureFile}
                            className="text-red-500 hover:text-red-700"
                            disabled={isBrochureUploading}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </button>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faFilePdf} className="text-red-500 text-2xl" />
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{uploadedBrochureFile.name}</p>
                            <p className="text-xs text-gray-500">{uploadedBrochureFile.size} MB</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={handleBrochureUpload}
                            className={`w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-lg
                                      hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                                      flex items-center justify-center
                                      ${isBrochureUploading ? "opacity-75 cursor-not-allowed" : ""}`}
                            disabled={isBrochureUploading}
                          >
                            {isBrochureUploading ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                                Upload Brochure
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadBrochure;