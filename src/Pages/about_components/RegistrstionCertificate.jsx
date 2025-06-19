import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faExpand, faTimes } from "@fortawesome/free-solid-svg-icons";

// Import your certificate image
// You may need to adjust this import path based on your actual image location
import certificateImage from "../../images/RegistrationCertificate.jpeg"; 

const RegistrationCertificate = () => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const openFullscreen = () => {
    setImageLoading(true);
    setShowFullscreen(true);
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
  };

  const handleImageLoaded = () => {
    setImageLoading(false);
  };

  const downloadCertificate = () => {
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = certificateImage;
    
    // Set a filename for the download
    link.download = "KAHEAA_Registration_Certificate.jpg";
    
    // Append to the document body
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-teal-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
            Registration Certificate
          </h2>
          
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Certificate Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Image Container */}
            <div className="relative group cursor-pointer" onClick={openFullscreen}>
              {/* Add image debugging information */}
              {imageLoading && <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500">Loading image...</div>
              </div>}
              
              <img
                src={certificateImage}
                alt="KAHEAA Registration Certificate"
                className="w-full h-auto object-contain transform group-hover:scale-[1.01] transition-transform duration-300"
                onLoad={handleImageLoaded}
                onError={(e) => {
                  console.error("Image failed to load");
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M30 50 L70 50 M50 30 L50 70' stroke='%23cccccc' stroke-width='5'/%3E%3C/svg%3E";
                }}
                style={{minHeight: "200px"}}
              />
              
            </div>
            
            {/* Caption and Download Button */}
            <div className="p-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Official Registration Document</h3>
                  <p className="text-sm text-gray-500">Click to view full size</p>
                </div>
                
                <button
                  onClick={downloadCertificate}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-md"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  <span className="font-medium">Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Loading Spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
              </div>
            )}
            
            {/* Image */}
            <img
              src={certificateImage}
              alt="KAHEAA Registration Certificate"
              className={`max-w-full max-h-[85vh] object-contain transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={handleImageLoaded}
              onError={(e) => {
                console.error("Fullscreen image failed to load");
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M30 50 L70 50 M50 30 L50 70' stroke='%23cccccc' stroke-width='5'/%3E%3C/svg%3E";
              }}
            />

            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
            </button>

            {/* Download Button */}
            <button
              onClick={downloadCertificate}
              className="absolute bottom-4 right-4 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition flex items-center justify-center"
              aria-label="Download"
            >
              <FontAwesomeIcon icon={faDownload} className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default RegistrationCertificate;