import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPaperPlane,
  faSpinner,
  faFileUpload,
  faUsers,
  faUser,
  faHeading,
  faFileAlt,
  faLayerGroup,
  faExclamationTriangle,
  faCheck,
  faSearch
} from "@fortawesome/free-solid-svg-icons";

const SendMail = () => {
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    send_to_all: false,
    role: "",
    recipients: [],
    attachments: [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewAttachments, setPreviewAttachments] = useState([]);
  
  // Email suggestions state
  const [emailInput, setEmailInput] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Refs for dropdown
  const emailInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Helper function to show message and auto-clear after 3 seconds
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, attachments: e.target.files });
    
    // Create preview list
    const fileList = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2), // KB
      type: file.type
    }));
    setPreviewAttachments(fileList);
  };

  // Fetch email suggestions
  const fetchEmailSuggestions = async (query) => {
    if (!query.trim() || formData.send_to_all) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await axios.get(`http://134.209.157.195:8000/email-suggestions/?query=${query}`, {
        headers: {
          Authorization: `Token ${localStorage.getItem("Token")}`,
        },
      });
      
      if (response.data && response.data.suggestions) {
        setEmailSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching email suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounce function to limit API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInput.trim()) {
        fetchEmailSuggestions(emailInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [emailInput]);

  // Handle email input change
  const handleEmailInputChange = (e) => {
    const value = e.target.value;
    setEmailInput(value);
    
    if (value.trim() === "") {
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  };

  // Handle email suggestion click
  const handleSuggestionClick = (email) => {
    const updatedRecipients = [...formData.recipients];
    if (!updatedRecipients.includes(email)) {
      updatedRecipients.push(email);
      setFormData({ ...formData, recipients: updatedRecipients });
    }
    setEmailInput("");
    setShowSuggestions(false);
  };

  // Handle removing a recipient
  const removeRecipient = (email) => {
    const updatedRecipients = formData.recipients.filter(r => r !== email);
    setFormData({ ...formData, recipients: updatedRecipients });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        emailInputRef.current && 
        !emailInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmailInputKeyDown = (e) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      e.preventDefault();
      
      const email = emailInput.trim();
      // Basic email validation
      if (email.match(/^\S+@\S+\.\S+$/)) {
        if (!formData.recipients.includes(email)) {
          setFormData({ 
            ...formData, 
            recipients: [...formData.recipients, email] 
          });
        }
        setEmailInput("");
      } else {
        showMessage({ text: "Please enter a valid email address", type: "error" });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append("subject", formData.subject);
    data.append("body", formData.body);
    data.append("send_to_all", formData.send_to_all);
    if (formData.role) data.append("role", formData.role);
    if (formData.recipients.length > 0) {
      formData.recipients.forEach((recipient) => data.append("recipients[]", recipient));
    }
    if (formData.attachments.length > 0) {
      Array.from(formData.attachments).forEach((file) => data.append("attachments", file));
    }

    try {
      const response = await axios.post("http://134.209.157.195:8000/send-email/", data, {
        headers: {
          Authorization: `Token ${localStorage.getItem("Token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showMessage({ text: "Email sent successfully!", type: "success" });
      // Reset form after successful submission
      setFormData({
        subject: "",
        body: "",
        send_to_all: false,
        role: "",
        recipients: [],
        attachments: [],
      });
      setPreviewAttachments([]);
    } catch (error) {
      console.error(error.response?.data || error);
      showMessage({ 
        text: error.response?.data?.error || "An error occurred while sending the email.", 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = ["Alumni", "Staff"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-4 sm:py-10">
      <style>{`
        @keyframes slideIn {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
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
        
        .email-tag {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      <div className="w-full lg:w-4/5 xl:w-3/4 mx-auto px-4">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-green-100 mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 sm:px-8 py-4 sm:py-6">
            <h2 className="text-xl sm:text-3xl font-bold text-white flex items-center">
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className="mr-3 sm:mr-4 text-green-100"
              />
              <span>Email Broadcast System</span>
            </h2>
            <p className="text-green-100 mt-2 text-sm sm:text-lg">
              Send emails to alumni, staff, and administrators
            </p>
          </div>
          
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6">
              {/* Subject */}
              <div className="form-group">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FontAwesomeIcon icon={faHeading} className="text-green-500 mr-2" />
                  Subject
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter email subject"
                />
              </div>
              
              {/* Body */}
              <div className="form-group">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FontAwesomeIcon icon={faFileAlt} className="text-green-500 mr-2" />
                  Message Content
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  required
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Write your email message here..."
                ></textarea>
              </div>
              
              {/* Recipients Options */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="text-green-500 mr-3" />
                  Select Recipients
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Send to All */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="send_to_all"
                        id="send_to_all"
                        checked={formData.send_to_all}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="send_to_all" className="font-semibold text-gray-700">Send to All Users</label>
                      <p className="text-gray-500">Email will be sent to all registered users</p>
                    </div>
                  </div>
                  
                  {/* Role Selection */}
                  <div className="form-group">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faUser} className="text-green-500 mr-2" />
                      Filter by Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled={formData.send_to_all}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        formData.send_to_all ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">Select Role (optional)</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if not filtering by role
                    </p>
                  </div>
                </div>
                
                {/* Specific Recipients with Autocomplete */}
                <div className="mt-6">
                  <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center">
                    <FontAwesomeIcon icon={faLayerGroup} className="text-green-500 mr-2" />
                    Specific Recipients
                  </label>
                  
                  {/* Email input with autocomplete */}
                  <div className="relative">
                    <div className="flex items-center relative">
                      <span className="absolute left-3 text-gray-400">
                        <FontAwesomeIcon icon={faSearch} />
                      </span>
                      <input
                        ref={emailInputRef}
                        type="text"
                        value={emailInput}
                        onChange={handleEmailInputChange}
                        onKeyDown={handleEmailInputKeyDown}
                        disabled={formData.send_to_all}
                        placeholder="Type email address..."
                        className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          formData.send_to_all ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    
                    {/* Email suggestions dropdown */}
                    {showSuggestions && emailSuggestions.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {loadingSuggestions ? (
                          <div className="p-4 text-center text-gray-500">
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                            Loading suggestions...
                          </div>
                        ) : (
                          emailSuggestions.map((email, index) => (
                            <div
                              key={index}
                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                              onClick={() => handleSuggestionClick(email)}
                            >
                              <div className="flex items-center">
                                <FontAwesomeIcon icon={faEnvelope} className="text-green-500 mr-2" />
                                <span>{email}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected recipients display */}
                  {formData.recipients.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {formData.recipients.map((email, index) => (
                          <div 
                            key={index}
                            className="email-tag bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm flex items-center"
                          >
                            <span className="mr-1">{email}</span>
                            <button
                              type="button"
                              onClick={() => removeRecipient(email)}
                              className="text-green-700 hover:text-green-900 focus:outline-none"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Type an email address and press Enter to add it, or select from suggestions.
                    {formData.recipients.length > 0 && ` ${formData.recipients.length} recipient(s) selected.`}
                  </p>
                </div>
              </div>
              
              {/* Attachments */}
              <div className="form-group">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FontAwesomeIcon icon={faFileUpload} className="text-green-500 mr-2" />
                  Attachments
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    name="attachments"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FontAwesomeIcon icon={faFileUpload} className="text-green-500 text-2xl mb-2" />
                  <p className="text-gray-700">Drag files here or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">Maximum 5 files (5MB each)</p>
                </div>
                
                {/* Display attached files preview */}
                {previewAttachments.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Attached Files ({previewAttachments.length})</h4>
                    <ul className="space-y-2">
                      {previewAttachments.map((file, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <FontAwesomeIcon icon={faFileAlt} className="text-green-500 mr-2" />
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-xs text-gray-500">{file.size} KB</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-animate w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl hover:from-green-500 hover:to-emerald-600 font-bold text-lg shadow-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon
                    icon={isSubmitting ? faSpinner : faPaperPlane}
                    className={`mr-3 ${isSubmitting ? "animate-spin" : ""}`}
                  />
                  {isSubmitting ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Message Banner */}
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
};

export default SendMail;