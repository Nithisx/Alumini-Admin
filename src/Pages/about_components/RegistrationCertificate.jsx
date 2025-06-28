import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFilePdf, faSpinner } from '@fortawesome/free-solid-svg-icons';
import certificate from "../../assets/RegistrationCertificate.jpeg"; // Adjust the path as necessary
const RegistrationCertificate = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Replace this with your actual certificate image path
    const imagePath = "../../images/RegistrationCertificate.jpeg"; 
    
    // Keep PDF download path if you still want to offer PDF download
    const pdfUrl = "/path/to/certificate.pdf";

    const handleImageError = () => {
        setError('Failed to load certificate image. Please try again later.');
        setIsLoading(false);
    };

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'RegistrationCertificate.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-green-800">Registration Certificate</h3>
                <p className="text-gray-600 mt-2">
                    Official registration certificate for Karpagam Academy of Higher Education Alumni Association.
                </p>
            </div>
            
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-md relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 z-10">
                        <div className="text-center">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-green-600 text-3xl mb-2" />
                            <p className="text-sm text-green-700">Loading certificate...</p>
                        </div>
                    </div>
                )}
                
                {error ? (
                    <div className="flex items-center justify-center h-[500px] w-full">
                        <div className="text-center">
                            <p className="text-red-500 font-medium">{error}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                Try downloading the certificate instead.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center p-4 bg-gray-50">
                        <img 
                            src={certificate}
                            alt="Registration Certificate"
                            className="max-w-full object-contain max-h-[600px] shadow-lg"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </div>
                )}
            </div>
            
            <div className="flex justify-center mt-6">
                <button 
                    onClick={handleDownload}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all duration-200 flex items-center"
                >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    <span>Download Certificate</span>
                </button>
            </div>
            
            {/* <div className="mt-6 bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="flex items-start">
                    <FontAwesomeIcon icon={faFilePdf} className="text-red-500 mt-1 mr-3" />
                    <p className="text-sm text-green-800">
                        This certificate validates that the Karpagam Academy of Higher Education Alumni Association 
                        is officially registered under the Tamil Nadu Societies Registration Act, 1975.
                    </p>
                </div>
            </div> */}
        </div>
    );
};

export default RegistrationCertificate;