import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faExclamationTriangle,
  faSpinner,
  faUser,
  faEnvelope,
  faPhone,
  faUserTag,
  faUniversity,
  faChevronDown,
  faChevronUp,
  faGraduationCap,
  faCalendarAlt,
  faIdCard,
  faBars,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

export default function RegisterRequest() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const API_URL = "http://134.209.157.195/Approve-signup/";

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
        showMessage({
          text: "Failed to load requests. Please try again.",
          type: "error",
        });
      });
  }, []);

  const toggleRowExpansion = (userId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

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
      showMessage({
        text: "Failed to accept request. Please try again.",
        type: "error",
      });
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
      showMessage({
        text: "Failed to decline request. Please try again.",
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Mobile Card Component
  const MobileCard = ({ req }) => (
    <div className="bg-white  rounded-xl shadow-lg border  border-green-100 mb-4 overflow-hidden">
      <div className="p-4 ">
        <div className="flex  items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center mr-3">
              <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {req.username ||
                  `${req.first_name} ${req.last_name}`.trim() ||
                  "N/A"}
              </h3>
              <p className="text-xs text-gray-500">{req.role}</p>
            </div>
          </div>
          <button
            onClick={() => toggleRowExpansion(req.id)}
            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          >
            <FontAwesomeIcon
              icon={expandedRows[req.id] ? faChevronUp : faEye}
              className="text-sm"
            />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-gray-600">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="mr-2 text-green-500 w-3"
            />
            <span className="truncate">{req.email}</span>
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <FontAwesomeIcon
              icon={faPhone}
              className="mr-2 text-green-500 w-3"
            />
            <span>{req.phone}</span>
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <FontAwesomeIcon
              icon={faUniversity}
              className="mr-2 text-green-500 w-3"
            />
            <span className="truncate">{req.college_name}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleAccept(req.id, req.email)}
            disabled={processing}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 text-sm font-medium flex items-center justify-center disabled:opacity-50 transition-all"
          >
            <FontAwesomeIcon
              icon={processing ? faSpinner : faCheck}
              className={`mr-1 text-xs ${processing ? "animate-spin" : ""}`}
            />
            Accept
          </button>
          <button
            onClick={() => handleDecline(req.id, req.email)}
            disabled={processing}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-lg hover:from-pink-500 hover:to-red-500 text-sm font-medium flex items-center justify-center disabled:opacity-50 transition-all"
          >
            <FontAwesomeIcon
              icon={processing ? faSpinner : faTimes}
              className={`mr-1 text-xs ${processing ? "animate-spin" : ""}`}
            />
            Decline
          </button>
        </div>
      </div>

      {/* Mobile Expanded Content */}
      {expandedRows[req.id] && (
        <div className="border-t border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                <FontAwesomeIcon
                  icon={faUser}
                  className="mr-2 text-green-500"
                />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>{" "}
                  <span className="text-gray-800">
                    {req.first_name} {req.last_name}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Username:</span>{" "}
                  <span className="text-gray-800">{req.username || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Gender:</span>{" "}
                  <span className="text-gray-800">{req.gender || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">DOB:</span>{" "}
                  <span className="text-gray-800">
                    {req.date_of_birth || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                <FontAwesomeIcon
                  icon={faIdCard}
                  className="mr-2 text-green-500"
                />
                Student ID
              </h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div>
                  <span className="font-medium text-gray-600">
                    Roll Number:
                  </span>{" "}
                  <span className="text-gray-800 font-mono bg-gray-100 px-1 rounded">
                    {req.roll_no || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Chapter:</span>{" "}
                  <span className="text-gray-800">{req.chapter || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  className="mr-2 text-green-500"
                />
                Academic Details
              </h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Course:</span>{" "}
                  <span className="text-gray-800">{req.course || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Start Year:</span>{" "}
                  <span className="text-gray-800">
                    {req.course_start_year || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">End Year:</span>{" "}
                  <span className="text-gray-800">
                    {req.course_end_year || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Passed Out:</span>{" "}
                  <span className="text-gray-800">
                    {req.passed_out_year || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="mr-2 text-green-500"
                />
                Contact Details
              </h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div>
                  <span className="font-medium text-gray-600">
                    Primary Email:
                  </span>{" "}
                  <span className="text-gray-800 break-all">{req.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Secondary Email:
                  </span>{" "}
                  <span className="text-gray-800 break-all">
                    {req.secondary_email || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>{" "}
                  <span className="text-gray-800">{req.phone}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Location:</span>{" "}
                  <span className="text-gray-800">
                    {req.current_location || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {req.role !== "Student" && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h4 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faUniversity}
                    className="mr-2 text-green-500"
                  />
                  Professional Info
                </h4>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Company:</span>{" "}
                    <span className="text-gray-800">
                      {req.company || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Position:</span>{" "}
                    <span className="text-gray-800">
                      {req.position || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Experience:
                    </span>{" "}
                    <span className="text-gray-800">
                      {req.work_experience
                        ? `${req.work_experience} years`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <h4 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="mr-2 text-green-500"
                />
                Registration Status
              </h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Created:</span>{" "}
                  <span className="text-gray-800">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>{" "}
                  <span className="text-red-600 font-semibold">
                    Pending Approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col py-4 sm:py-10">
      <style>{`
        @keyframes slideIn {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes expandDown {
          0% { 
            opacity: 0; 
            max-height: 0; 
            transform: translateY(-10px);
          }
          100% { 
            opacity: 1; 
            max-height: 200px; 
            transform: translateY(0);
          }
        }
        
        .table-row-animate {
          transition: all 0.3s ease;
        }
        
        .table-row-animate:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.1);
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
        
        .btn-animate {
          transition: all 0.2s ease;
        }
        
        .btn-animate:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .btn-animate:active:not(:disabled) {
          transform: translateY(0px);
        }
        
        .dropdown-content {
          animation: expandDown 0.3s ease-out;
          overflow: hidden;
        }
        
        .card-hover {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .card-hover:hover {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
      `}</style>

      <div className="w-full sm:w-full lg:m-10 mx-auto px-4">
        <div className="bg-white shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden border border-green-100 mb-4 sm:mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-8 py-4 sm:py-6">
            <h2 className="text-xl sm:text-3xl font-bold text-white flex items-center">
              <FontAwesomeIcon
                icon={faUserTag}
                className="mr-2 sm:mr-4 text-green-100"
              />
              <span className="hidden sm:inline">
                Registration Requests Management
              </span>
              <span className="sm:hidden">Registration Requests</span>
            </h2>
            <p className="text-green-100 mt-1 sm:mt-2 text-sm sm:text-lg">
              <span className="hidden sm:inline">
                Review and manage pending user registrations
              </span>
              <span className="sm:hidden">Manage pending registrations</span>
            </p>
          </div>

          {/* Mobile View */}
          <div className="block lg:hidden">
            <div className="p-4">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-full p-4 mb-3">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="text-3xl text-green-400"
                    />
                  </div>
                  <p className="text-lg font-semibold text-gray-600 text-center">
                    No registration requests
                  </p>
                  <p className="text-sm mt-1 text-gray-500 text-center">
                    New requests will appear here
                  </p>
                </div>
              ) : (
                requests.map((req) => <MobileCard key={req.id} req={req} />)
              )}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden w-[105rem] lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-green-100">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th className="px-6 py-5 text-left text-sm font-bold text-green-700 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="mr-3 text-green-500"
                      />
                      User Details
                    </span>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-green-700 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="mr-3 text-green-500"
                      />
                      Contact Info
                    </span>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-green-700 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon
                        icon={faUserTag}
                        className="mr-3 text-green-500"
                      />
                      Role
                    </span>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-green-700 uppercase tracking-wider">
                    <span className="flex items-center">
                      <FontAwesomeIcon
                        icon={faUniversity}
                        className="mr-3 text-green-500"
                      />
                      Institution
                    </span>
                  </th>
                  <th className="px-6 py-5 text-center text-sm font-bold text-green-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-50">
                {requests.map((req) => (
                  <React.Fragment key={req.id}>
                    <tr
                      className="table-row-animate card-hover border-l-4 border-l-transparent hover:border-l-green-400"
                      onClick={() => toggleRowExpansion(req.id)}
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                              <FontAwesomeIcon
                                icon={faUser}
                                className="text-white text-lg"
                              />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-lg font-semibold text-gray-900 flex items-center">
                              {req.username ||
                                `${req.first_name} ${req.last_name}`.trim() ||
                                "N/A"}
                              <FontAwesomeIcon
                                icon={
                                  expandedRows[req.id]
                                    ? faChevronUp
                                    : faChevronDown
                                }
                                className="ml-2 text-green-500 text-sm transition-transform duration-200"
                              />
                            </div>
                            <div className="text-sm text-gray-500">
                              Click to view details
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="mr-2 text-green-500"
                            />
                            {req.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <FontAwesomeIcon
                              icon={faPhone}
                              className="mr-2 text-green-500"
                            />
                            {req.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                          <FontAwesomeIcon icon={faUserTag} className="mr-2" />
                          {req.role}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-700 font-medium">
                        {req.college_name}
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-900">
                        <div
                          className="flex justify-center space-x-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAccept(req.id, req.email)}
                            disabled={processing}
                            className="btn-animate px-5 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                          >
                            <FontAwesomeIcon
                              icon={processing ? faSpinner : faCheck}
                              className={`mr-2 ${
                                processing ? "animate-spin" : ""
                              }`}
                            />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(req.id, req.email)}
                            disabled={processing}
                            className="btn-animate px-5 py-2 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-xl hover:from-pink-500 hover:to-red-500 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                          >
                            <FontAwesomeIcon
                              icon={processing ? faSpinner : faTimes}
                              className={`mr-2 ${
                                processing ? "animate-spin" : ""
                              }`}
                            />
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Dropdown Content */}
                    {expandedRows[req.id] && (
                      <tr>
                        <td colSpan="5" className="px-0 py-0">
                          <div className="dropdown-content bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
                            <div className="px-8 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                                  <div className="flex items-center mb-3">
                                    <FontAwesomeIcon
                                      icon={faUser}
                                      className="text-green-500 text-lg mr-3"
                                    />
                                    <h4 className="font-bold text-green-700">
                                      Personal Information
                                    </h4>
                                  </div>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        First Name:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.first_name || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Last Name:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.last_name || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Username:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.username || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Gender:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.gender || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Date of Birth:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.date_of_birth || "N/A"}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                                  <div className="flex items-center mb-3">
                                    <FontAwesomeIcon
                                      icon={faIdCard}
                                      className="text-green-500 text-lg mr-3"
                                    />
                                    <h4 className="font-bold text-green-700">
                                      Student ID
                                    </h4>
                                  </div>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Roll Number:
                                      </span>{" "}
                                      <span className="text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
                                        {req.roll_no || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Chapter:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.chapter || "N/A"}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                                  <div className="flex items-center mb-3">
                                    <FontAwesomeIcon
                                      icon={faGraduationCap}
                                      className="text-green-500 text-lg mr-3"
                                    />
                                    <h4 className="font-bold text-green-700">
                                      Academic Details
                                    </h4>
                                  </div>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Course:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.course || "N/A"}
                                      </span>
                                    </p>
                                    <div className="flex items-center">
                                      <FontAwesomeIcon
                                        icon={faCalendarAlt}
                                        className="text-green-500 mr-2"
                                      />
                                      <span className="font-semibold text-gray-600">
                                        Start Year:
                                      </span>
                                      <span className="ml-2 text-gray-800 font-semibold">
                                        {req.course_start_year || "N/A"}
                                      </span>
                                    </div>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        End Year:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.course_end_year || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Passed Out Year:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.passed_out_year || "N/A"}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                                  <div className="flex items-center mb-3">
                                    <FontAwesomeIcon
                                      icon={faEnvelope}
                                      className="text-green-500 text-lg mr-3"
                                    />
                                    <h4 className="font-bold text-green-700">
                                      Contact Details
                                    </h4>
                                  </div>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Primary Email:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.email}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Secondary Email:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.secondary_email || "N/A"}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Phone:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.phone}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Location:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {req.current_location || "N/A"}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                {req.role !== "Student" && (
                                  <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                                    <div className="flex items-center mb-3">
                                      <FontAwesomeIcon
                                        icon={faUniversity}
                                        className="text-green-500 text-lg mr-3"
                                      />
                                      <h4 className="font-bold text-green-700">
                                        Professional Info
                                      </h4>
                                    </div>
                                    <div className="space-y-2">
                                      <p>
                                        <span className="font-semibold text-gray-600">
                                          Experience:
                                        </span>{" "}
                                        <span className="text-gray-800">
                                          {req.work_experience
                                            ? `${req.work_experience} years`
                                            : "N/A"}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                                  <div className="flex items-center mb-3">
                                    <FontAwesomeIcon
                                      icon={faCalendarAlt}
                                      className="text-green-500 text-lg mr-3"
                                    />
                                    <h4 className="font-bold text-green-700">
                                      Registration Status
                                    </h4>
                                  </div>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Created At:
                                      </span>{" "}
                                      <span className="text-gray-800">
                                        {new Date(
                                          req.created_at
                                        ).toLocaleDateString()}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-semibold text-gray-600">
                                        Status:
                                      </span>{" "}
                                      <span className="text-red-600 font-semibold">
                                        Pending Approval
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-full p-6 mb-4">
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="text-5xl text-green-400"
                          />
                        </div>
                        <p className="text-xl font-semibold text-gray-600">
                          No registration requests available
                        </p>
                        <p className="text-sm mt-2 text-gray-500">
                          New requests will appear here when submitted by users
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced animated message banner */}
      {message && (
        <div
          style={{ animation: "slideIn 0.5s ease-out" }}
          className={`fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:max-w-md px-4 sm:px-8 py-3 sm:py-4 text-white rounded-xl shadow-2xl flex items-center font-semibold text-sm sm:text-lg ${
            message.type === "success"
              ? "bg-gradient-to-r from-green-400 to-emerald-400"
              : "bg-gradient-to-r from-pink-400 to-red-400"
          }`}
        >
          <FontAwesomeIcon
            icon={message.type === "success" ? faCheck : faExclamationTriangle}
            className="mr-2 sm:mr-3 text-lg sm:text-xl flex-shrink-0"
          />
          <span className="truncate">{message.text}</span>
        </div>
      )}
    </div>
  );
}
