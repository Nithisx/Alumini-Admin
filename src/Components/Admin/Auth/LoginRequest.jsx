import React, { useEffect, useState } from "react";
// You'll need to install FontAwesome packages if not already installed
// npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faExclamationTriangle, faSpinner, faUser, faEnvelope, faPhone, faUserTag, faUniversity } from "@fortawesome/free-solid-svg-icons";

export default function RegisterRequest() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const API_URL = "http://134.209.157.195:8000/Approve-signup/";

  // Helper function to show message and auto-clear after 3 seconds
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        setRequests(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        showMessage({ text: "Failed to load requests. Please try again.", type: "error" });
      });
  }, []);

  const handleAccept = async (id, email) => {
    setProcessing(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
         
        },
        body: JSON.stringify({ email }),
      });
      showMessage({ text: "Request accepted successfully!", type: "success" });
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error accepting request:", error);
      showMessage({ text: "Failed to accept request. Please try again.", type: "error" });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleDecline = async (id, email) => {
    setProcessing(true);
    try {
      await fetch(API_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
         
        },
        body: JSON.stringify({ email }),
      });
      showMessage({ text: "Request rejected successfully!", type: "error" });
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error declining request:", error);
      showMessage({ text: "Failed to decline request. Please try again.", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      {/* Animations and transitions */}
      <style>{`
        @keyframes slideIn {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .table-row-animate {
          transition: all 0.3s ease;
        }
        
        .table-row-animate:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .btn-animate {
          transition: all 0.2s ease;
        }
        
        .btn-animate:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        
        .btn-animate:active:not(:disabled) {
          transform: translateY(1px);
        }
      `}</style>

      <div className="w-full max-w-6xl px-4">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 mb-8">

          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FontAwesomeIcon icon={faUserTag} className="mr-3" /> 
              Registration Requests
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" /> 
                      Name
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-500" /> 
                      Email
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="mr-2 text-blue-500" /> 
                      Phone
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faUserTag} className="mr-2 text-blue-500" /> 
                      Role
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faUniversity} className="mr-2 text-blue-500" /> 
                      College
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="table-row-animate hover:bg-blue-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {req.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.college_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 flex justify-center space-x-3">
                      <button
                        onClick={() => handleAccept(req.id, req.email)}
                        disabled={processing}
                        className="btn-animate px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={processing ? faSpinner : faCheck} 
                          className={`mr-2 ${processing ? "animate-spin" : ""}`} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(req.id, req.email)}
                        disabled={processing}
                        className="btn-animate px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={processing ? faSpinner : faTimes} 
                          className={`mr-2 ${processing ? "animate-spin" : ""}`} />
                        Decline
                      </button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl mb-3 text-gray-400" />
                        <p className="text-lg font-medium">No registration requests available.</p>
                        <p className="text-sm mt-1">New requests will appear here when submitted.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Animated message banner */}
      {message && (
        <div
          style={{ animation: "slideIn 0.5s ease-out" }}
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 text-white rounded-md shadow-lg flex items-center ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <FontAwesomeIcon 
            icon={message.type === "success" ? faCheck : faExclamationTriangle} 
            className="mr-2" 
          />
          {message.text}
        </div>
      )}
    </div>
  );
}