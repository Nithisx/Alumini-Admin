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
  faIdCard,
  faEye,
  faCircleNotch,
  faPencilAlt,
  faSave,
  faBan,
  faLink,
  faBriefcase,
  faMapMarkerAlt,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const COLLEGE_NAMES = [
  "FASCM-Faculty of Arts, Science, Commerce and Management",
  "FOADP-Faculty of Architecture, Designing and Planning",
  "FOE-Faculty of Engineering",
  "FOP-Faculty of Pharmacy",
  "KAHE",
];

const COURSES = [
  "Bachelor of Architecture", "Bachelor of Arts", "Bachelor of Business Administration",
  "Bachelor of Commerce", "Bachelor of Computer Applications", "Bachelor of Design",
  "Bachelor of Engineering", "Bachelor of Pharmacy", "Bachelor of Philosophy",
  "Bachelor of Science", "Bachelor of Technology", "Master of Architecture",
  "Master of Building and Engineering Management", "Master of Business Administration",
  "Master of Commerce", "Master of Computer Applications", "Master of Engineering",
  "Master of Pharmacy", "Master of Philosophy", "Master of Planning",
  "Master of Science", "Master of Social Work", "Ph.D",
];

const COURSE_BRANCH_MAPPING = {
  "Bachelor of Architecture": ["General"],
  "Bachelor of Arts": ["English Literature", "General"],
  "Bachelor of Business Administration": ["BBA", "Business Process Services", "General"],
  "Bachelor of Commerce": ["FA", "General", "IAF", "Information Technology", "Professional Accounting", "Computer Application", "Computer Science"],
  "Bachelor of Computer Applications": ["Computer Application", "General"],
  "Bachelor of Design": ["General", "Interior Design"],
  "Bachelor of Engineering": ["Aeronautical Engineering", "Aerospace Engineering", "Automobile Engineering", "Bio Medical Engineering", "Chemical Engineering", "Civil Engineering", "Computer Science and Design", "Computer Science Engineering", "Computer Science Engineering(Cyber)", "Electrical & Electronics Engineering", "Electronics & Communication Engineering", "Food Technology", "Information Technology", "Mechanical Engineering"],
  "Bachelor of Pharmacy": ["Pharmacy"],
  "Bachelor of Science": ["Artificial Intelligence / Data Science", "Bio Chemistry", "Bio Informatics", "Bio Technology", "Catering Science and Hotel Management", "Chemistry", "Cognitive systems", "Computer Science", "Computer Technology", "General", "Mathematics", "Microbiology", "Physics"],
  "Bachelor of Technology": ["Aeronautical Engineering", "Aerospace Engineering", "Artificial Intelligence / Data Science", "Automobile Engineering", "Bio Medical Engineering", "Bio Technology", "Chemical Engineering", "Civil Engineering", "Computer Science Engineering", "Electrical & Electronics Engineering", "Electronics & Communication Engineering", "Food Technology", "Mechanical Engineering"],
  "Master of Architecture": ["General"], "Master of Building and Engineering Management": ["General"],
  "Master of Business Administration": ["Business Process Services", "General", "MBA"],
  "Master of Commerce": ["General"], "Master of Computer Applications": ["General"],
  "Master of Engineering": ["General"], "Master of Pharmacy": ["General"],
  "Master of Philosophy": ["General"], "Master of Planning": ["General"],
  "Master of Science": ["General"], "Master of Social Work": ["General"],
  "Ph.D": ["General"],
};

export default function RegisterRequest() {
  const [requests, setRequests] = useState([]); // Initialize as empty array
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedIds, setSelectedIds] = useState({});
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  // Edit-mode state: which request is being edited + draft form data + saving flag
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const API_URL = "https://api.karpagamalumni.in/api/v1/Approve-signup/";
  const EDIT_URL = (id) => `https://api.karpagamalumni.in/api/v1/Approve-signup/${id}/`;

  // Fields admin is NOT allowed to edit
  const IMMUTABLE = new Set(["email", "username", "id", "created_at", "is_approved", "approved_at", "password"]);

  // Complete list of editable fields grouped for display
  const FIELD_GROUPS = [
    {
      title: "Personal",
      icon: faUser,
      fields: [
        ["salutation", "Salutation", "text"],
        ["first_name", "First Name", "text"],
        ["last_name", "Last Name", "text"],
        ["gender", "Gender", "select", ["", "Male", "Female", "Other"]],
        ["date_of_birth", "Date of Birth", "date"],
        ["label", "Label", "text"],
        ["profile_type", "Profile Type", "text"],
        ["bio", "Bio", "textarea"],
      ],
    },
    {
      title: "Contact",
      icon: faEnvelope,
      fields: [
        ["secondary_email", "Secondary Email", "email"],
        ["phone", "Phone", "text"],
        ["office_phone_no", "Office Phone", "text"],
      ],
    },
    {
      title: "Academic",
      icon: faGraduationCap,
      fields: [
        ["role", "Role", "select", ["", "Student", "Alumni", "Staff", "Admin"]],
        ["college_name", "College", "select-college"],
        ["roll_no", "Roll No", "text"],
        ["course", "Course", "select-course"],
        ["branch", "Branch", "select-branch"],
        ["course_start_year", "Course Start Year", "text"],
        ["course_end_year", "Course End Year", "text"],
        ["passed_out_year", "Passed Out Year", "text"],
        ["chapter", "Chapter", "text"],
      ],
    },
    {
      title: "Faculty",
      icon: faUniversity,
      fields: [
        ["faculty_job_title", "Job Title", "text"],
        ["faculty_institute", "Institute", "text"],
        ["faculty_department", "Department", "text"],
        ["faculty_start_year", "Start Year", "text"],
        ["faculty_start_month", "Start Month", "text"],
        ["faculty_end_year", "End Year", "text"],
        ["faculty_end_month", "End Month", "text"],
      ],
    },
    {
      title: "Other Education",
      icon: faGraduationCap,
      fields: [
        ["educational_course", "Course", "text"],
        ["educational_institute", "Institute", "text"],
        ["start_year", "Start Year", "text"],
        ["end_year", "End Year", "text"],
      ],
    },
    {
      title: "Professional",
      icon: faBriefcase,
      fields: [
        ["company", "Company", "text"],
        ["position", "Position", "text"],
        ["current_work", "Current Work", "text"],
        ["work_experience", "Work Experience (yrs)", "number"],
        ["member_roles", "Member Roles", "text"],
      ],
    },
    {
      title: "Location",
      icon: faMapMarkerAlt,
      fields: [
        ["Address", "Address", "textarea"],
        ["city", "City", "text"],
        ["state", "State", "text"],
        ["country", "Country", "text"],
        ["zip_code", "Zip / Pincode", "text"],
        ["current_location", "Current Location", "text"],
        ["home_town", "Home Town", "text"],
      ],
    },
    {
      title: "Correspondence Address",
      icon: faMapMarkerAlt,
      fields: [
        ["correspondence_address", "Address", "textarea"],
        ["correspondence_city", "City", "text"],
        ["correspondence_state", "State", "text"],
        ["correspondence_country", "Country", "text"],
        ["correspondence_pincode", "Pincode", "text"],
      ],
    },
    {
      title: "Social Links",
      icon: faLink,
      fields: [
        ["facebook_link", "Facebook", "url"],
        ["linkedin_link", "LinkedIn", "url"],
        ["twitter_link", "Twitter / X", "url"],
        ["website_link", "Website", "url"],
      ],
    },
  ];

  // Helper function to show message and auto-clear after 3 seconds
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    setLoading(true); // Set loading to true when starting to fetch
    const token = localStorage.getItem('Token');

    if (!token) {
      setError("Authentication required. Please log in to view registration requests.");
      setLoading(false);
      return;
    }

    fetch(API_URL, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle paginated response format
        if (data && data.results && Array.isArray(data.results)) {
          setRequests(data.results);
        } else if (Array.isArray(data)) {
          // Fallback if API directly returns an array
          setRequests(data);
        } else {
          setRequests([]); // Set to empty array as fallback
          showMessage({
            text: "Invalid data format received. Please try again.",
            type: "error",
          });
        }
      })
      .catch((error) => {
        if (error.message.includes('401') || error.message.includes('Authentication')) {
          setError("Authentication failed. Please log in with admin credentials.");
        } else {
          setError("Failed to load requests. Please try again.");
        }
        showMessage({
          text: "Failed to load requests. Please try again.",
          type: "error",
        });
      })
      .finally(() => {
        setLoading(false); // Set loading to false when fetch completes (success or error)
      });
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (!requests || requests.length === 0) {
        return {};
      }

      const next = {};
      requests.forEach((req) => {
        if (prev[req.id]) {
          next[req.id] = true;
        }
      });
      return next;
    });
  }, [requests]);

  const toggleRowExpansion = (userId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleSelectUser = (userId) => {
    setSelectedIds((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const clearSelection = () => {
    setSelectedIds({});
  };

  const selectedUserIds = Array.isArray(requests)
    ? requests.filter((req) => selectedIds[req.id]).map((req) => req.id)
    : [];

  const allSelected =
    Array.isArray(requests) &&
    requests.length > 0 &&
    requests.every((req) => selectedIds[req.id]);

  const toggleSelectAll = () => {
    if (!Array.isArray(requests) || requests.length === 0) {
      return;
    }

    if (allSelected) {
      clearSelection();
      return;
    }

    const next = {};
    requests.forEach((req) => {
      next[req.id] = true;
    });
    setSelectedIds(next);
  };

  const handleAccept = async (id, email) => {
    setProcessing(true);
    const token = localStorage.getItem('Token');

    if (!token) {
      showMessage({
        text: "Authentication required. Please log in.",
        type: "error",
      });
      setProcessing(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify({ email }),
      });

      if (response.status === 401) {
        showMessage({
          text: "Authentication failed. Please log in again.",
          type: "error",
        });
        return;
      }

      showMessage({ text: "Request accepted successfully!", type: "success" });
      // Filter out the accepted request
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      showMessage({
        text: "Failed to accept request. Please try again.",
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAccept = async () => {
    if (!Array.isArray(requests) || selectedUserIds.length === 0) {
      showMessage({
        text: "Select at least one user to approve.",
        type: "error",
      });
      return;
    }

    setProcessing(true);
    const token = localStorage.getItem('Token');

    if (!token) {
      showMessage({
        text: "Authentication required. Please log in.",
        type: "error",
      });
      setProcessing(false);
      return;
    }

    const selectedRequests = requests.filter((req) => selectedIds[req.id]);

    try {
      let approvedCount = 0;
      let failedCount = 0;

      for (const req of selectedRequests) {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
          },
          body: JSON.stringify({ email: req.email }),
        });

        if (response.status === 401) {
          showMessage({
            text: "Authentication failed. Please log in again.",
            type: "error",
          });
          return;
        }

        if (response.ok) {
          approvedCount += 1;
        } else {
          failedCount += 1;
        }
      }

      if (approvedCount > 0) {
        showMessage({
          text: `${approvedCount} request${approvedCount > 1 ? "s" : ""} approved successfully!`,
          type: "success",
        });
      }

      if (failedCount > 0) {
        showMessage({
          text: `${failedCount} request${failedCount > 1 ? "s" : ""} failed to approve. Please try again.`,
          type: "error",
        });
      }

      setRequests((prev) =>
        prev.filter((req) => !selectedIds[req.id])
      );
      clearSelection();
    } catch (error) {
      showMessage({
        text: "Failed to approve selected requests. Please try again.",
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async (id, email) => {
    setProcessing(true);
    const token = localStorage.getItem('Token');

    if (!token) {
      showMessage({
        text: "Authentication required. Please log in.",
        type: "error",
      });
      setProcessing(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify({ email }),
      });

      if (response.status === 401) {
        showMessage({
          text: "Authentication failed. Please log in again.",
          type: "error",
        });
        return;
      }

      showMessage({ text: "Request rejected successfully!", type: "error" });
      // Filter out the declined request
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      showMessage({
        text: "Failed to decline request. Please try again.",
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  // --- Edit flow ---
  const startEdit = (req) => {
    setEditingId(req.id);
    // Clone so the user can cancel cleanly
    setEditDraft({ ...req });
    // Ensure row is expanded while editing
    setExpandedRows((prev) => ({ ...prev, [req.id]: true }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const updateDraft = (field, value) => {
    setEditDraft((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "role" && value === "Staff") updated.college_name = "KAHE";
      if (field === "role" && value !== "Staff" && updated.college_name === "KAHE") updated.college_name = "";
      return updated;
    });
  };

  const saveEdit = async (req) => {
    const token = localStorage.getItem("Token");
    if (!token) {
      showMessage({ text: "Authentication required. Please log in.", type: "error" });
      return;
    }
    setSavingEdit(true);
    try {
      // Strip immutable fields — backend also blocks them, but avoid sending
      const payload = {};
      Object.keys(editDraft).forEach((k) => {
        if (!IMMUTABLE.has(k) && editDraft[k] !== undefined) {
          payload[k] = editDraft[k] === null ? "" : editDraft[k];
        }
      });

      const res = await fetch(EDIT_URL(req.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showMessage({ text: data.error || "Failed to update. Please try again.", type: "error" });
        return;
      }

      // Merge updated fields back into the list
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, ...(data.data || payload) } : r))
      );
      showMessage({ text: "Details updated successfully.", type: "success" });
      cancelEdit();
    } catch (e) {
      showMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setSavingEdit(false);
    }
  };

  // Render a single editable or read-only field
  const renderField = (req, [key, label, kind, options]) => {
    const isEditing = editingId === req.id;
    const value = isEditing ? (editDraft[key] ?? "") : (req[key] ?? "");
    const immutable = IMMUTABLE.has(key);

    // For dynamic dropdowns that depend on other draft values
    const currentRole = isEditing ? (editDraft["role"] ?? req["role"] ?? "") : (req["role"] ?? "");
    const currentCourse = isEditing ? (editDraft["course"] ?? req["course"] ?? "") : (req["course"] ?? "");

    if (!isEditing) {
      return (
        <div key={key} className="text-sm">
          <span className="font-semibold text-gray-600">{label}:</span>{" "}
          <span className="text-gray-800 break-words">{value !== "" && value !== null ? String(value) : "N/A"}</span>
        </div>
      );
    }

    const common =
      "w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-400 " +
      (immutable ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "border-gray-300");

    // College dropdown: Staff sees only KAHE, others see all colleges
    if (kind === "select-college") {
      const collegeOptions = currentRole === "Staff" ? ["KAHE"] : COLLEGE_NAMES;
      return (
        <div key={key} className="text-sm">
          <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
          <select
            className={common}
            value={value || ""}
            onChange={(e) => updateDraft(key, e.target.value)}
          >
            <option value="">— Select College —</option>
            {collegeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    // Course dropdown
    if (kind === "select-course") {
      return (
        <div key={key} className="text-sm">
          <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
          <select
            className={common}
            value={value || ""}
            onChange={(e) => {
              updateDraft(key, e.target.value);
              updateDraft("branch", ""); // reset branch when course changes
            }}
          >
            <option value="">— Select Course —</option>
            {COURSES.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    // Branch dropdown: dynamic based on current course
    if (kind === "select-branch") {
      const branchOptions = COURSE_BRANCH_MAPPING[currentCourse] || [];
      return (
        <div key={key} className="text-sm">
          <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
          <select
            className={common}
            value={value || ""}
            onChange={(e) => updateDraft(key, e.target.value)}
            disabled={!currentCourse}
          >
            <option value="">— Select Branch —</option>
            {branchOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {!currentCourse && <p className="text-[10px] text-gray-400 mt-0.5">Select a course first</p>}
        </div>
      );
    }

    return (
      <div key={key} className="text-sm">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}
          {immutable && <span className="ml-1 text-[10px] text-gray-400">(locked)</span>}
        </label>
        {kind === "textarea" ? (
          <textarea
            className={common}
            rows={2}
            value={value || ""}
            disabled={immutable}
            onChange={(e) => updateDraft(key, e.target.value)}
          />
        ) : kind === "select" ? (
          <select
            className={common}
            value={value || ""}
            disabled={immutable}
            onChange={(e) => updateDraft(key, e.target.value)}
          >
            {(options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt || "—"}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={kind || "text"}
            className={common}
            value={value || ""}
            disabled={immutable}
            onChange={(e) => updateDraft(key, e.target.value)}
          />
        )}
      </div>
    );
  };

  // Full detail + edit panel reused on both mobile and desktop
  const DetailPanel = ({ req }) => {
    const isEditing = editingId === req.id;
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100 p-4 sm:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <FontAwesomeIcon icon={faInfoCircle} />
            {isEditing ? (
              <span>Editing — email and username are locked.</span>
            ) : (
              <span>All registration details</span>
            )}
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => startEdit(req)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <FontAwesomeIcon icon={faPencilAlt} className="mr-2" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => saveEdit(req)}
                  disabled={savingEdit}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60 flex items-center"
                >
                  <FontAwesomeIcon
                    icon={savingEdit ? faSpinner : faSave}
                    className={`mr-2 ${savingEdit ? "animate-spin" : ""}`}
                  />
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={savingEdit}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-60 flex items-center"
                >
                  <FontAwesomeIcon icon={faBan} className="mr-2" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Identity fields (read-only always) */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4 border border-gray-100">
          <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center">
            <FontAwesomeIcon icon={faIdCard} className="mr-2 text-gray-400" />
            Identity (read-only)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
            <div className="text-sm">
              <span className="font-semibold text-gray-600">Email:</span>{" "}
              <span className="text-gray-800 break-all">{req.email}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-gray-600">Username:</span>{" "}
              <span className="text-gray-800 break-all">{req.username}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-gray-600">Created At:</span>{" "}
              <span className="text-gray-800">
                {req.created_at ? new Date(req.created_at).toLocaleString() : "N/A"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-gray-600">Status:</span>{" "}
              <span className="text-red-600 font-semibold">
                {req.is_approved ? "Approved" : "Pending Approval"}
              </span>
            </div>
          </div>
        </div>

        {/* Grouped fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELD_GROUPS.map((group) => (
            <div
              key={group.title}
              className="bg-white rounded-lg p-4 shadow-sm border border-green-100"
            >
              <h4 className="font-bold text-green-700 text-sm mb-3 flex items-center">
                <FontAwesomeIcon icon={group.icon} className="mr-2 text-green-500" />
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.fields.map((f) => renderField(req, f))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Mobile Card Component
  const MobileCard = ({ req }) => (
    <div className="bg-white  rounded-xl shadow-lg border  border-green-100 mb-4 overflow-hidden">
      <div className="p-4 ">
        <div className="flex  items-center justify-between mb-3">
          <div className="flex items-center">
            <label
              className="mr-3 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!selectedIds[req.id]}
                onChange={() => toggleSelectUser(req.id)}
                className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
              />
            </label>
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
      {expandedRows[req.id] && <DetailPanel req={req} />}
    </div>
  );

  // Loader Component
  const Loader = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-green-500"></div>
        <div className="h-24 w-24 rounded-full border-r-4 border-l-4 border-transparent absolute inset-0 animate-ping opacity-75"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faCircleNotch}
            className="text-4xl text-green-600 animate-spin"
          />
        </div>
      </div>
      <p className="mt-6 text-lg font-medium text-green-600">
        Loading requests...
      </p>
      <p className="text-gray-500 text-sm mt-2">
        Please wait while we fetch the data
      </p>
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
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
          50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.9); }
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
        
        .pulse-glow {
          animation: pulseGlow 2s infinite;
        }
      `}</style>

      <div className="w-full lg:mx-10 mx-auto px-4">
        <div className="bg-white shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden border border-green-100 mb-4 sm:mb-8">
          {/* Header */}
          <div className=" px-4 sm:px-8 py-4 sm:py-6">
            <h2 className="text-xl sm:text-3xl font-bold text-green-600 flex items-center">
              <FontAwesomeIcon
                icon={faUserTag}
                className="mr-2 sm:mr-4 text-green-600"
              />
              <span className="hidden sm:inline">
                Registration Requests Management
              </span>
              <span className="sm:hidden">Registration Requests</span>
            </h2>
            <p className="text-green-600 mt-1 sm:mt-2 text-sm sm:text-lg">
              <span className="hidden sm:inline">
                Review and manage pending user registrations
              </span>
              <span className="sm:hidden">Manage pending registrations</span>
            </p>
          </div>

          {/* Loader Display */}
          {loading ? (
            <Loader />
          ) : (
            <>
              {/* Mobile View */}
              <div className="block lg:hidden">
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <button
                      onClick={toggleSelectAll}
                      disabled={processing || !requests || requests.length === 0}
                      className="px-4 py-2 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {allSelected ? "Clear selection" : "Select all"}
                    </button>
                    <button
                      onClick={handleBulkAccept}
                      disabled={processing || selectedUserIds.length === 0}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve selected ({selectedUserIds.length})
                    </button>
                  </div>
                  {!requests || requests.length === 0 ? (
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
                    Array.isArray(requests) &&
                    requests.map((req) => <MobileCard key={req.id} req={req} />)
                  )}
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="min-w-[1000px]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 bg-white">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleSelectAll}
                        disabled={processing || !requests || requests.length === 0}
                        className="px-4 py-2 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {allSelected ? "Clear selection" : "Select all"}
                      </button>
                      <span className="text-sm text-gray-600">
                        Selected: <span className="font-semibold text-green-700">{selectedUserIds.length}</span>
                      </span>
                    </div>
                    <button
                      onClick={handleBulkAccept}
                      disabled={processing || selectedUserIds.length === 0}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve selected ({selectedUserIds.length})
                    </button>
                  </div>
                  <table className="w-full table-auto divide-y divide-green-100">
                    <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                      <tr>
                        <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-green-700 uppercase tracking-wider whitespace-nowrap">
                          <label className="flex items-center gap-2 text-green-700">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleSelectAll}
                              disabled={processing || !requests || requests.length === 0}
                              className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                            />
                            Select
                          </label>
                        </th>
                        <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-green-700 uppercase tracking-wider whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faUser}
                              className="text-green-500"
                            />
                            <span className="hidden sm:inline">
                              User Details
                            </span>
                            <span className="sm:hidden">User</span>
                          </span>
                        </th>
                        <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-green-700 uppercase tracking-wider whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="text-green-500"
                            />
                            <span className="hidden sm:inline">
                              Contact Info
                            </span>
                            <span className="sm:hidden">Contact</span>
                          </span>
                        </th>
                        <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-green-700 uppercase tracking-wider whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faUserTag}
                              className="text-green-500"
                            />
                            Role
                          </span>
                        </th>
                        <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-green-700 uppercase tracking-wider whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faUniversity}
                              className="text-green-500"
                            />
                            Institution
                          </span>
                        </th>
                        <th className="px-4 xl:px-6 py-4 xl:py-5 text-center text-xs xl:text-sm font-bold text-green-700 uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-green-50">
                      {Array.isArray(requests) && requests.length > 0 ? (
                        requests.map((req) => (
                          <React.Fragment key={req.id}>
                            <tr
                              className="table-row-animate card-hover border-l-4 border-l-transparent hover:border-l-green-400"
                              onClick={() => toggleRowExpansion(req.id)}
                            >
                              <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={!!selectedIds[req.id]}
                                  onChange={() => toggleSelectUser(req.id)}
                                  className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                                />
                              </td>
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
                                  <FontAwesomeIcon
                                    icon={faUserTag}
                                    className="mr-2"
                                  />
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
                                    onClick={() =>
                                      handleAccept(req.id, req.email)
                                    }
                                    disabled={processing}
                                    className="btn-animate px-5 py-2 bg-green-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                  >
                                    <FontAwesomeIcon
                                      icon={processing ? faSpinner : faCheck}
                                      className={`mr-2 ${processing ? "animate-spin" : ""
                                        }`}
                                    />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDecline(req.id, req.email)
                                    }
                                    disabled={processing}
                                    className="btn-animate px-5 py-2 bg-pink-700 text-white rounded-xl hover:from-pink-500 hover:to-red-500 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                  >
                                    <FontAwesomeIcon
                                      icon={processing ? faSpinner : faTimes}
                                      className={`mr-2 ${processing ? "animate-spin" : ""
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
                                <td colSpan="6" className="px-0 py-0">
                                  <div className="dropdown-content">
                                    <DetailPanel req={req} />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-16 text-center">
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
                                New requests will appear here when submitted by
                                users
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced animated message banner */}
      {message && (
        <div
          style={{ animation: "slideIn 0.5s ease-out" }}
          className={`fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:max-w-md px-4 sm:px-8 py-3 sm:py-4 text-white rounded-xl shadow-2xl flex items-center font-semibold text-sm sm:text-lg ${message.type === "success"
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
