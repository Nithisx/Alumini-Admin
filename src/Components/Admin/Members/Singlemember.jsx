import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, href } from "react-router-dom";

const PROFILE_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0xMDAgNzVDOTEuNzE1NyA3NSA4NS4wMDAwIDgxLjcxNTcgODUuMDAwMCA5MEM4NS4wMDAwIDk4LjI4NDMgOTEuNzE1NyAxMDUgMTAwIDEwNUMxMDguMjg0IDEwNSAxMTUgOTguMjg0MyAxMTUgOTBDMTE1IDgxLjcxNTcgMTA4LjI4NCA3NSAxMDAgNzVaIiBmaWxsPSIjOUM5Qzk5Ii8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzg2LjE5MjkgMTEwIDc1IDEyMS4xOTMgNzUgMTM1VjE0MEg3NVYxNDBIMTI1VjE0MFYxMzVDMTI1IDEyMS4xOTMgMTEzLjgwNyAxMTAgMTAwIDExMFoiIGZpbGw9IiM5QzlDOTkiLz4KPC9zdmc+";

// Generate initials-based avatar for profile photos
const getProfileAvatar = (firstName, lastName) => {
  if (!firstName && !lastName) return PROFILE_PLACEHOLDER;
  const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  const colors = ["#4299E1", "#48BB78", "#ED8936", "#9F7AEA", "#F56565", "#38B2AC", "#ECC94B", "#667EEA", "#ED64A6"];
  const hashCode = (str) => { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h = h & h; } return h; };
  const bg = colors[Math.abs(hashCode(`${firstName}${lastName}`)) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}" /><text x="50%" y="50%" dy=".3em" font-family="Arial, sans-serif" font-size="80" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const TOKEN = localStorage.getItem("Token");
const API_BASE = "https://api.karpagamalumni.in/api/profile/";
const API_USER_ACTIONS = "https://api.karpagamalumni.in/api/admin-actions/";

// Dropdown data from Signup page
const ROLES = ["Student", "Alumni", "Staff"];

const CHAPTERS = [
  "KAHE CHAPTER CHENNAI",
  "KAHE CHAPTER COIMBATORE",
  "KAHE CHAPTER TRICHY",
];

const COLLEGE_NAMES = [
  "FASCM-Faculty of Arts, Science, Commerce and Management",
  "FOADP-Faculty of Architecture, Designing and Planning",
  "FOE-Faculty of Engineering",
  "FOP-Faculty of Pharmacy",
  "KAHE",
];

const COURSES = [
  "Bachelor of Architecture",
  "Bachelor of Arts",
  "Bachelor of Business Administration",
  "Bachelor of Commerce",
  "Bachelor of Computer Applications",
  "Bachelor of Design",
  "Bachelor of Engineering",
  "Bachelor of Pharmacy",
  "Bachelor of Philosophy",
  "Bachelor of Science",
  "Bachelor of Technology",
  "Master of Architecture",
  "Master of Building and Engineering Management",
  "Master of Business Administration",
  "Master of Commerce",
  "Master of Computer Applications",
  "Master of Engineering",
  "Master of Pharmacy",
  "Master of Philosophy",
  "Master of Planning",
  "Master of Science",
  "Ph.D"
];

const COURSE_BRANCH_MAPPING = {
  "Bachelor of Architecture": ["General"],
  "Bachelor of Arts": ["English Literature", "General"],
  "Bachelor of Business Administration": [
    "BBA",
    "Business Process Services",
    "General"
  ],
  "Bachelor of Commerce": [
    "FA",
    "General",
    "IAF",
    "Information Technology",
    "Professional Accounting"
  ],
  "Bachelor of Computer Applications": ["Computer Application", "General"],
  "Bachelor of Design": ["General", "Interior Design"],
  "Bachelor of Engineering": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science Engineering",
    "Computer Science Engineering(Cyber)",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Information Technology",
    "Mechanical Engineering"
  ],
  "Bachelor of Pharmacy": ["Pharmacy"],
  "Bachelor of Science": [
    "Artificial Intelligence / Data Science",
    "Bio Chemistry",
    "Bio Informatics",
    "Bio Technology",
    "Catering Science and Hotel Management",
    "Chemistry",
    "Cognitive systems",
    "Computer Science",
    "Computer Technology",
    "General",
    "Mathematics",
    "Microbiology",
    "Physics"
  ],
  "Bachelor of Technology": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Artificial Intelligence / Data Science",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Bio Technology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science Engineering",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Mechanical Engineering"
  ],
  "Master of Architecture": ["General"],
  "Master of Building and Engineering Management": ["General"],
  "Master of Business Administration": ["Business Process Services", "General", "MBA"],
  "Master of Commerce": ["General", "Professional Accounting"],
  "Master of Computer Applications": ["Computer Application", "General"],
  "Master of Engineering": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Bio Medical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science Engineering",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Food Technology",
    "Information Technology",
    "Mechanical Engineering",
    "Power Electronics and Drives",
    "Power System Engineering",
    "Structural Engineering",
    "Structural Engineering (Part Time)",
    "VLSI",
    "Water Resources And Environmental Engineering"
  ],
  "Master of Pharmacy": ["Pharmacy"],
  "Master of Planning": ["General"],
  "Master of Science": [
    "Bio Chemistry",
    "Bio Informatics",
    "Bio Technology",
    "Catering Science and Hotel Management",
    "Chemistry",
    "Cognitive Science",
    "Computer Science",
    "Computer Technology",
    "General",
    "Mathematics",
    "Microbiology",
    "Physics"
  ],
  "Ph.D": [
    "Aeronautical Engineering",
    "Aerospace Engineering",
    "Artificial Intelligence/Data Science",
    "Automobile Engineering",
    "Bio Chemistry",
    "Bio Informatics",
    "Bio Medical Engineering",
    "Bio Technology",
    "Business Process Services",
    "Chemical Engineering",
    "Chemistry",
    "Civil Engineering",
    "Cognitive Science",
    "Computer Application",
    "Computer Science",
    "Computer Science Engineering",
    "Computer Science Engineering(Cyber)",
    "Computer Technology",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "English Literature",
    "Food Technology",
    "General",
    "Information Technology",
    "Interior Design",
    "Mathematics",
    "Mechanical Engineering",
    "Microbiology",
    "Pharmacy",
    "Physics",
    "Power Electronics and Drives",
    "Power System Engineering",
    "Professional Accounting",
    "Structural Engineering",
    "Structural Engineering (Part Time)",
    "VLSI",
    "Water Resources And Environmental Engineering"
  ]
};

export default function SingleMember() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  // New state for user actions
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    console.log("Fetching specific member data...");
    fetch(`${API_BASE}${name}`, {
      headers: {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        console.log("Member data received:", data);
        setMember(data);
        setEditedMember(data); // Initialize edited member with original data

        // Set available branches based on current course
        if (data.course && COURSE_BRANCH_MAPPING[data.course]) {
          setAvailableBranches(COURSE_BRANCH_MAPPING[data.course]);
        }
      })
      .catch((err) => console.error("Error fetching member:", err))
      .finally(() => setLoading(false));
  }, [name]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedMember({ ...member }); // Reset edited data to current member data
    setChangedFields(new Set()); // Clear the changed fields set when starting edit mode

    // Set available branches based on current course
    if (member.course && COURSE_BRANCH_MAPPING[member.course]) {
      setAvailableBranches(COURSE_BRANCH_MAPPING[member.course]);
    } else {
      setAvailableBranches([]);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMember({ ...member }); // Reset to original data
    resetImageSelection(); // Reset image selection
    setChangedFields(new Set()); // Clear the changed fields set
  };

  const handleSaveEdit = async () => {
    // Check for errors before saving
    if (usernameError) {
      alert(`Cannot save: ${usernameError}`);
      return;
    }

    // Check if username is being changed and is empty
    if (
      changedFields.has("username") &&
      (!editedMember.username || editedMember.username.trim() === "")
    ) {
      setUsernameError("Username cannot be empty");
      alert("Username cannot be empty");
      return;
    }

    setSaving(true);
    try {
      // Prepare FormData for multipart/form-data submission
      const formData = new FormData();

      // Add the profile image if one was selected (profile image is always considered changed if selected)
      if (selectedImage) {
        formData.append("profile_photo", selectedImage);
        // Mark profile_photo as changed
        setChangedFields((current) => new Set([...current, "profile_photo"]));
      }

      // Add only edited fields to formData
      Object.entries(editedMember).forEach(([key, value]) => {
        // Skip these fields to avoid validation errors
        if (key === "profile_photo" || key === "experience") return;

        // Only process fields that were actually changed
        if (changedFields.has(key)) {
          // Handle array fields by converting to JSON strings (as expected by the API)
          if (
            key === "professional_skills" ||
            key === "industries_worked_in" ||
            key === "roles_played"
          ) {
            const arrayValue = Array.isArray(value)
              ? value
              : value
                ? [value]
                : [];
            formData.append(key, JSON.stringify(arrayValue));
          }
          // Handle social_links object - convert to JSON string
          else if (key === "social_links") {
            const socialLinksValue =
              value && typeof value === "object" ? value : {};
            formData.append(key, JSON.stringify(socialLinksValue));
          }
          // Handle work_experience field - map to experience and send as JSON number
          else if (key === "work_experience" && value) {
            formData.append(
              "work_experience",
              JSON.stringify(parseInt(value) || 0)
            );
            formData.append("experience", JSON.stringify(parseInt(value) || 0));
          }
          // Handle worked_in field with special care for capitalization (backend expects Worked_in with capital W)
          else if (key === "worked_in") {
            const valueToSend = value || "";
            // Use the correct field name expected by backend (Worked_in with capital W)
            formData.append("Worked_in", JSON.stringify(valueToSend)); // Send as proper JSON string
            // Also send lowercase version for backward compatibility
            formData.append("worked_in", JSON.stringify(valueToSend));
          }
          // Handle current_work field - send as plain string to avoid double quotes in UI
          else if (key === "current_work") {
            formData.append(key, (value || "").toString()); // Send as plain string to avoid JSON quotes
          }
          // Handle other fields - send only changed fields
          else {
            // Use empty string for null/undefined values
            formData.append(
              key,
              value !== null && value !== undefined ? value : ""
            );
          }
        }
      });

      // Make the API request with user ID instead of name
      const response = await fetch(`${API_BASE}${member.id}/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Token ${TOKEN}`,
          // Don't set Content-Type header - let the browser set it with boundary for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the member state with the returned user data
        // Handle the capitalization differences and JSON parsing
        const updatedUser = {
          ...data.user,
          // Make sure worked_in (lowercase) is available for display
          worked_in: data.user.worked_in || data.user.Worked_in || "",
          // Also ensure Worked_in (uppercase) is set for consistency
          Worked_in: data.user.worked_in || data.user.Worked_in || "",
          // Parse current_work if it's a stringified JSON
          current_work: data.user.current_work
            ? typeof data.user.current_work === "string" &&
              data.user.current_work.startsWith('"')
              ? JSON.parse(data.user.current_work)
              : data.user.current_work
            : "",
        };

        setMember(updatedUser);
        setEditedMember(updatedUser);
        setIsEditing(false);
        resetImageSelection(); // Reset image selection after successful save
        setChangedFields(new Set()); // Clear the changed fields set after successful save

        // Show success notification (you could implement a toast notification here)
        console.log(data.message); // User updated successfully

        // You could add a toast notification here:
        // toast.success(data.message);
      } else {
        // Handle error case
        console.error(
          "Failed to update member:",
          data.message || "Unknown error"
        );
        console.error("Error details:", data);
        // toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Error updating member:", error);
      // toast.error('Network error while updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedMember((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Special handling for username (prevent special characters)
      if (field === "username") {
        // Remove @ symbol and special characters from username
        const sanitizedUsername = value.replace(
          /[@\s#$%^&*()+=[\]\\';,./{}|":<>?~]/g,
          ""
        );

        // Only proceed if username actually changed
        if (sanitizedUsername !== member.username) {
          updated[field] = sanitizedUsername;
          setChangedFields((current) => new Set([...current, field]));

          // Clear previous errors
          setUsernameError("");

          // Check if username is not empty
          if (sanitizedUsername.trim() === "") {
            setUsernameError("Username cannot be empty");
          }
          // Don't need to check availability since the backend will handle this
          // We're only doing basic validation on the frontend
        } else {
          // Username unchanged, remove from changedFields
          setChangedFields((current) => {
            const newSet = new Set([...current]);
            newSet.delete(field);
            return newSet;
          });
        }
      }
      // If course is changed, reset the stream/branch and update available branches
      else if (field === "course") {
        updated.stream = "";
        setAvailableBranches(
          value && COURSE_BRANCH_MAPPING[value]
            ? COURSE_BRANCH_MAPPING[value]
            : []
        );
        // Mark stream as changed too since we're resetting it
        setChangedFields((current) => new Set([...current, field, "stream"]));
      } else {
        // Mark field as changed
        setChangedFields((current) => new Set([...current, field]));
      }

      // Special handling for worked_in field to handle capitalization issues
      if (field === "worked_in") {
        // Update both lowercase and capitalized versions to ensure consistency
        updated.Worked_in = value;
        // Mark Worked_in as changed too
        setChangedFields(
          (current) => new Set([...current, field, "Worked_in"])
        );
      }

      return updated;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      // Mark profile_photo as changed
      setChangedFields((current) => new Set([...current, "profile_photo"]));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Deactivate/Activate User Function
  const handleDeactivateUser = async () => {
    const action = member.is_active ? "deactivate" : "activate";
    const confirmMessage =
      member.is_active ??
      `Are you sure you want to deactivate ${member.first_name} ${member.last_name}? They will no longer be able to access their account.`;

    if (!window.confirm(confirmMessage)) return;

    setDeactivating(true);
    try {
      const response = await fetch(`${API_USER_ACTIONS}deactivate-user/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: member.id,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        alert(`User ${action}d successfully!`);
        navigate("/admin/members");
        // Reload the page when response is 200
        window.location.reload();
      } else {
        console.error(
          `Failed to ${action} user:`,
          data.message || "Unknown error"
        );
        alert(`Failed to ${action} user: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Network error while ${action}ing user`);
    } finally {
      setDeactivating(false);
    }
  };

  // Delete User Function
  const handleDeleteUser = async () => {
    const confirmMessage = `⚠️ WARNING: Are you sure you want to permanently delete ${member.first_name} ${member.last_name}?\n\nThis action cannot be undone and will:\n- Delete all user data\n- Remove their profile permanently\n- Cannot be recovered\n\nType "DELETE" below to confirm:`;

    const userInput = prompt(confirmMessage);
    if (userInput !== "DELETE") {
      if (userInput !== null) {
        // User didn't cancel
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${API_USER_ACTIONS}delete-user/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: member.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("User deleted successfully!");
        // Redirect to members list
        navigate("/admin/members");
      } else {
        console.error(
          "Failed to delete user:",
          data.message || "Unknown error"
        );
        alert(`Failed to delete user: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Network error while deleting user");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-green-600 border-t-transparent mb-4"></div>
          <p className="text-green-700 text-base sm:text-lg font-medium">
            Loading member profile...
          </p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-xl shadow-lg border-l-4 border-red-500 max-w-md w-full">
          <div className="text-red-500 text-4xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Member Not Found
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            The requested member profile could not be found.
          </p>
          <Link
            to="/admin/members"
            className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Members
          </Link>
        </div>
      </div>
    );
  }

  const {
    username,
    first_name,
    last_name,
    salutation,
    gender,
    date_of_birth,
    email,
    secondary_email,
    phone,
    profile_photo,
    current_location,
    home_town,
    city,
    state,
    country,
    branch,
    course,
    stream,
    start_year,
    end_year,
    college_name,
    chapter,
    role,
    bio,
    current_work,
    worked_in,
    passed_out_year,
    roll_no,
    social_links = {},
    is_active = true,
    // Add the new professional fields
    company,
    position,
    work_experience,
    professional_skills = [],
    industries_worked_in = [],
    roles_played = [],
  } = member;

  //  const handlechat = () => {


  //   navigate(`/admin/chat/${member.id}`);

  //   }

  const handlechat = async () => {
    const token = localStorage.getItem("Token");


    try {
      const response = await fetch('https://api.karpagamalumni.in/chat/rooms/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target_user_id: member.id })
      });

      if (response.ok) {


        navigate(`/admin/chat`);
      }
    } catch (error) {
      console.error('Room creation error:', error);
    }

    console.log("Room ")
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-4 sm:py-6 lg:py-8">
      <div className="max-w-full lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            to="/admin/members"
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors group"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm sm:text-base">Back to Members</span>
          </Link>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white shadow-lg sm:shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden border border-green-100">
          {/* Action Buttons */}
          <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-3">
              {/* User Status Indicator */}
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                ></div>
                <span
                  className={`text-sm font-medium ${is_active ? "text-green-700" : "text-red-700"
                    }`}
                >
                  {is_active ? "Active User" : "Inactive User"}
                </span>
              </div>

              <button
                onClick={handlechat}
                className="ml-60 inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m-5 0H7a2 2 0 01-2-2V6a2 2 0 012-2h9a2 2 0 012 2v9m-4 4l4 4m0 0l-4 4m4-4H7"
                  />
                </svg>
                Chat
              </button>


              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Profile
                    </button>

                    <button
                      onClick={handleDeactivateUser}
                      disabled={deactivating}
                      className={`inline-flex items-center px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed ${is_active
                        ? "bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400"
                        : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                        }`}
                    >
                      {deactivating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          {is_active ? "Deactivating..." : "Activating..."}
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {is_active ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            )}
                          </svg>
                          {is_active ? "Deactivate User" : "Activate User"}
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDeleteUser}
                      disabled={deleting}
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete User
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* Header Section with Gradient */}
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative flex flex-col items-center gap-4 sm:gap-6">
              <div className="relative">
                <img
                  src={
                    imagePreview ||
                    (member.profile_photo
                      ? `https://api.karpagamalumni.in/api${member.profile_photo}`
                      : getProfileAvatar(first_name, last_name))
                  }
                  alt={username}
                  className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white shadow-xl"
                />
                <div
                  className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 ${is_active ? "bg-green-500" : "bg-red-500"
                    } text-white rounded-full p-1.5 sm:p-2 shadow-lg`}
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {is_active ? (
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                </div>

                {/* Edit Image Button */}
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <label
                      htmlFor="profile-image-input"
                      className="cursor-pointer text-white hover:text-green-200 transition-colors"
                    >
                      <svg
                        className="w-6 h-6 sm:w-8 sm:h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </label>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Image Change Status */}
              {isEditing && selectedImage && (
                <div className="text-center text-white text-sm">
                  <p className="bg-green-500 px-3 py-1 rounded-full">
                    New image selected: {selectedImage.name}
                  </p>
                  <button
                    onClick={resetImageSelection}
                    className="mt-2 text-green-200 hover:text-white underline text-xs"
                  >
                    Remove new image
                  </button>
                </div>
              )}
              <div className="text-center text-white">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2">
                  {salutation} {first_name} {last_name}
                </h1>
                {isEditing ? (
                  <div className="flex flex-col items-center justify-center mb-2 sm:mb-3">
                    <div className="flex items-center">
                      <span className="text-green-100 text-base sm:text-lg lg:text-xl mr-1">
                        @
                      </span>
                      <input
                        type="text"
                        value={editedMember.username || ""}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        className={`bg-green-700 text-green-100 text-base sm:text-lg lg:text-xl border ${usernameError ? "border-red-400" : "border-green-300"
                          } rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-300`}
                        placeholder="username"
                      />
                    </div>
                    {usernameError && (
                      <p className="text-red-300 text-xs mt-1">
                        {usernameError}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-green-100 text-base sm:text-lg lg:text-xl mb-2 sm:mb-3">
                    @{username}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 justify-center">
                  {role && (
                    <span className="bg-white text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                      {role}
                    </span>
                  )}
                  {chapter && (
                    <span className="bg-white text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                      {chapter}
                    </span>
                  )}
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg ${is_active
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                      }`}
                  >
                    {is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">
                    Personal Information
                  </h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      First Name:
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.first_name || ""}
                        onChange={(e) =>
                          handleInputChange("first_name", e.target.value)
                        }
                        className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">
                        {first_name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Last Name:
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.last_name || ""}
                        onChange={(e) =>
                          handleInputChange("last_name", e.target.value)
                        }
                        className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">
                        {last_name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Gender:
                    </span>
                    {isEditing ? (
                      <select
                        value={editedMember.gender || ""}
                        onChange={(e) =>
                          handleInputChange("gender", e.target.value)
                        }
                        className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">
                        {gender}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Date of Birth:
                    </span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedMember.date_of_birth || ""}
                        onChange={(e) =>
                          handleInputChange("date_of_birth", e.target.value)
                        }
                        className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">
                        {date_of_birth}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Role:
                    </span>
                    {isEditing ? (
                      <select
                        value={editedMember.role || ""}
                        onChange={(e) =>
                          handleInputChange("role", e.target.value)
                        }
                        className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select Role</option>
                        {ROLES.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>
                            {roleOption}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">
                        {role}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Chapter:
                    </span>
                    {isEditing ? (
                      <select
                        value={editedMember.chapter || ""}
                        onChange={(e) =>
                          handleInputChange("chapter", e.target.value)
                        }
                        className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select Chapter</option>
                        {CHAPTERS.map((chapterOption) => (
                          <option key={chapterOption} value={chapterOption}>
                            {chapterOption}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700 text-sm sm:text-base mt-1 sm:mt-0">
                        {chapter}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">
                    Contact Details
                  </h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Email:
                    </span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedMember.email || ""}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {email}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Secondary Email:
                    </span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedMember.secondary_email || ""}
                        onChange={(e) =>
                          handleInputChange("secondary_email", e.target.value)
                        }
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : secondary_email ? (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {secondary_email}
                      </span>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        Not provided
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Phone:
                    </span>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedMember.phone || ""}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Location:
                    </span>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Current Location"
                          value={editedMember.current_location || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "current_location",
                              e.target.value
                            )
                          }
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={editedMember.city || ""}
                            onChange={(e) =>
                              handleInputChange("city", e.target.value)
                            }
                            className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={editedMember.state || ""}
                            onChange={(e) =>
                              handleInputChange("state", e.target.value)
                            }
                            className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Country"
                            value={editedMember.country || ""}
                            onChange={(e) =>
                              handleInputChange("country", e.target.value)
                            }
                            className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {current_location || `${city}, ${state}, ${country}`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Home Town:
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.home_town || ""}
                        onChange={(e) =>
                          handleInputChange("home_town", e.target.value)
                        }
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : home_town ? (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {home_town}
                      </span>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        Not provided
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">
                    Education
                  </h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      College:
                    </span>
                    {isEditing ? (
                      <select
                        value={editedMember.college_name || ""}
                        onChange={(e) =>
                          handleInputChange("college_name", e.target.value)
                        }
                        className="text-gray-700 text-sm mt-1 px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select College</option>
                        {COLLEGE_NAMES.map((college) => (
                          <option key={college} value={college}>
                            {college}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {college_name || "Not specified"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Course:
                    </span>
                    {isEditing ? (
                      <div className="space-y-2">
                        <select
                          value={editedMember.course || ""}
                          onChange={(e) =>
                            handleInputChange("course", e.target.value)
                          }
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                        >
                          <option value="">Select Course</option>
                          {COURSES.map((courseOption) => (
                            <option key={courseOption} value={courseOption}>
                              {courseOption}
                            </option>
                          ))}
                        </select>
                        {editedMember.course &&
                          COURSE_BRANCH_MAPPING[editedMember.course] && (
                            <select
                              value={editedMember.stream || ""}
                              onChange={(e) =>
                                handleInputChange("stream", e.target.value)
                              }
                              className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                            >
                              <option value="">Select Branch/Stream</option>
                              {COURSE_BRANCH_MAPPING[editedMember.course].map(
                                (branchOption) => (
                                  <option
                                    key={branchOption}
                                    value={branchOption}
                                  >
                                    {branchOption}
                                  </option>
                                )
                              )}
                            </select>
                          )}
                      </div>
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {[course, stream].filter(Boolean).join(", ") ||
                          "Not specified"}
                      </span>
                    )}
                  </div>
                  {(start_year || end_year) && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">
                        Duration:
                      </span>
                      {isEditing ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            placeholder="Start Year"
                            value={editedMember.start_year || ""}
                            onChange={(e) =>
                              handleInputChange("start_year", e.target.value)
                            }
                            className="text-gray-700 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">–</span>
                          <input
                            type="number"
                            placeholder="End Year"
                            value={editedMember.end_year || ""}
                            onChange={(e) =>
                              handleInputChange("end_year", e.target.value)
                            }
                            className="text-gray-700 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                          {start_year} – {end_year}
                        </span>
                      )}
                    </div>
                  )}
                  {passed_out_year && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">
                        Passed Out:
                      </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedMember.passed_out_year || ""}
                          onChange={(e) =>
                            handleInputChange("passed_out_year", e.target.value)
                          }
                          className="text-gray-700 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                          {passed_out_year}
                        </span>
                      )}
                    </div>
                  )}
                  {passed_out_year && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">
                        Roll No:
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMember.roll_no || ""}
                          onChange={(e) =>
                            handleInputChange("roll_no", e.target.value)
                          }
                          className="text-gray-700 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                          {roll_no}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Professional */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">
                    Professional
                  </h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {/* Company */}
                  {company && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">
                        Company:
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMember.company || ""}
                          onChange={(e) =>
                            handleInputChange("company", e.target.value)
                          }
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : company ? (
                        <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                          {company}
                        </span>
                      ) : (
                        <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                          Not provided
                        </span>
                      )}
                    </div>
                  )}

                  {/* Position */}
                  {position && (
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-green-700 text-sm sm:text-base">
                        Position:
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMember.position || ""}
                          onChange={(e) =>
                            handleInputChange("position", e.target.value)
                          }
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : position ? (
                        <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                          {position}
                        </span>
                      ) : (
                        <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                          Not provided
                        </span>
                      )}
                    </div>
                  )}

                  {/* Work Experience */}
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Work Experience:
                    </span>
                    {isEditing ? (
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          value={editedMember.work_experience || ""}
                          onChange={(e) =>
                            handleInputChange("work_experience", e.target.value)
                          }
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-20"
                        />
                        <span className="ml-2 text-gray-600">years</span>
                      </div>
                    ) : work_experience && work_experience > 0 ? (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {work_experience}{" "}
                        {work_experience === 1 ? "year" : "years"}
                      </span>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        Not provided
                      </span>
                    )}
                  </div>

                  {/* Professional Skills */}
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Professional Skills:
                    </span>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Enter skills, separated by commas"
                          value={
                            editedMember.professional_skills_text ||
                            (Array.isArray(editedMember.professional_skills)
                              ? editedMember.professional_skills.join(", ")
                              : "")
                          }
                          onChange={(e) => {
                            handleInputChange(
                              "professional_skills_text",
                              e.target.value
                            );
                            const skillsArray = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            handleInputChange(
                              "professional_skills",
                              skillsArray
                            );
                          }}
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                        />
                        <p className="text-xs text-gray-500">
                          Enter skills separated by commas (e.g. "React,
                          Node.js, UI Design")
                        </p>
                      </div>
                    ) : professional_skills &&
                      professional_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {professional_skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        No skills listed
                      </span>
                    )}
                  </div>

                  {/* Industries Worked In */}
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Industries Worked In:
                    </span>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Enter industries, separated by commas"
                          value={
                            editedMember.industries_worked_in_text ||
                            (Array.isArray(editedMember.industries_worked_in)
                              ? editedMember.industries_worked_in.join(", ")
                              : "")
                          }
                          onChange={(e) => {
                            handleInputChange(
                              "industries_worked_in_text",
                              e.target.value
                            );
                            const industriesArray = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            handleInputChange(
                              "industries_worked_in",
                              industriesArray
                            );
                          }}
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                        />
                        <p className="text-xs text-gray-500">
                          Enter industries separated by commas (e.g. "IT,
                          Healthcare, Education")
                        </p>
                      </div>
                    ) : industries_worked_in &&
                      industries_worked_in.length > 0 ? (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {industries_worked_in.map((industry, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        No industries listed
                      </span>
                    )}
                  </div>

                  {/* Roles Played */}
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Roles Played:
                    </span>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Enter roles, separated by commas"
                          value={
                            editedMember.roles_played_text ||
                            (Array.isArray(editedMember.roles_played)
                              ? editedMember.roles_played.join(", ")
                              : "")
                          }
                          onChange={(e) => {
                            handleInputChange(
                              "roles_played_text",
                              e.target.value
                            );
                            const rolesArray = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            handleInputChange("roles_played", rolesArray);
                          }}
                          className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                        />
                        <p className="text-xs text-gray-500">
                          Enter roles separated by commas (e.g. "Developer, Team
                          Lead, Product Manager")
                        </p>
                      </div>
                    ) : roles_played && roles_played.length > 0 ? (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {roles_played.map((role_played, index) => (
                          <span
                            key={index}
                            className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {role_played}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        No roles listed
                      </span>
                    )}
                  </div>

                  {/* Legacy fields - show if new fields are not available */}
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Worked In:
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={
                          editedMember.worked_in === undefined
                            ? ""
                            : editedMember.worked_in
                        }
                        onChange={(e) =>
                          handleInputChange("worked_in", e.target.value)
                        }
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : worked_in || member.Worked_in ? (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {worked_in ||
                          (Array.isArray(member.Worked_in)
                            ? member.Worked_in.join(", ")
                            : member.Worked_in)}
                      </span>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        Not provided
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-green-700 text-sm sm:text-base">
                      Current Work:
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={
                          typeof editedMember.current_work === "string" &&
                            editedMember.current_work.startsWith('"')
                            ? JSON.parse(editedMember.current_work)
                            : editedMember.current_work || ""
                        }
                        onChange={(e) =>
                          handleInputChange("current_work", e.target.value)
                        }
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    ) : current_work ? (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-sm">
                        {(() => {
                          if (typeof current_work === "string") {
                            try {
                              // Try to parse if it looks like JSON (starts and ends with quotes)
                              if (
                                current_work.startsWith('"') &&
                                current_work.endsWith('"')
                              ) {
                                return JSON.parse(current_work);
                              }
                            } catch (e) {
                              // If parsing fails, just use the original string
                              console.log("Failed to parse current_work:", e);
                            }
                          }
                          return current_work;
                        })()}
                      </span>
                    ) : (
                      <span className="text-gray-500 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm italic">
                        Not provided
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {bio && (
              <div className="mt-6 sm:mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">
                    About
                  </h2>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedMember.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Enter your bio here..."
                    className="text-gray-700 text-sm sm:text-base w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[120px]"
                  ></textarea>
                ) : (
                  <div className="bg-white rounded-lg p-3 sm:p-4">
                    {bio ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                        {bio}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic text-sm">
                        No bio provided
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Social Links Section */}
            {Object.keys(social_links).length > 0 && (
              <div className="mt-6 sm:mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-100">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-green-600 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3a4 4 0 00-1.414-1.414l-3 3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-800">
                    Social Links
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">LinkedIn</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.social_links?.linkedin_link || ""}
                        onChange={(e) =>
                          handleInputChange("social_links", {
                            ...editedMember.social_links,
                            linkedin_link: e.target.value,
                          })
                        }
                        placeholder="LinkedIn URL"
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {social_links.linkedin_link}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Twitter</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.social_links?.twitter_link || ""}
                        onChange={(e) =>
                          handleInputChange("social_links", {
                            ...editedMember.social_links,
                            twitter_link: e.target.value,
                          })
                        }
                        placeholder="Twitter URL"
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {social_links.twitter_link}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Facebook</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.social_links?.facebook_link || ""}
                        onChange={(e) =>
                          handleInputChange("social_links", {
                            ...editedMember.social_links,
                            facebook_link: e.target.value,
                          })
                        }
                        placeholder="Facebook URL"
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {social_links.facebook_link}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Instagram</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.social_links?.instagram_link || ""}
                        onChange={(e) =>
                          handleInputChange("social_links", {
                            ...editedMember.social_links,
                            instagram_link: e.target.value,
                          })
                        }
                        placeholder="Instagram URL"
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {social_links.instagram_link}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">GitHub</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.social_links?.github_link || ""}
                        onChange={(e) =>
                          handleInputChange("social_links", {
                            ...editedMember.social_links,
                            github_link: e.target.value,
                          })
                        }
                        placeholder="GitHub URL"
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {social_links.github_link}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Website</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMember.social_links?.website_link || ""}
                        onChange={(e) =>
                          handleInputChange("social_links", {
                            ...editedMember.social_links,
                            website_link: e.target.value,
                          })
                        }
                        placeholder="Personal Website URL"
                        className="text-gray-700 text-sm px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                      />
                    ) : (
                      <span className="text-gray-700 bg-white px-3 py-2 rounded-lg text-xs sm:text-sm break-all">
                        {social_links.website_link}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
