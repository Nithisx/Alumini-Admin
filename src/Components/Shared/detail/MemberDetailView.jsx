import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import ConfirmModal from "../ConfirmModal";
import ImageViewerModal from "../ImageViewerModal";
import ImageCropModal from "../ImageCropModal";
import ScrambleText from "../ScrambleText";
import { getProfilePlaceholderByGender } from "../../../lib/profilePlaceholders";
import { COLLEGE_NAMES, COURSES, COURSE_BRANCH_MAPPING, getCoursesForCollege } from "../../../constants/academicOptions";
import { API_BASE as API_ROOT, getMediaUrl } from "./media";
import useViewerProfile from "./useViewerProfile";
import { Icons } from "./primitives";

/* ─── constants ─────────────────────────────────────────────────────────── */
const TOKEN = () => localStorage.getItem("Token");
const API_PROFILE = `${API_ROOT}/profile/`;
const API_DEACTIVATE_USER = `${API_ROOT}/deactivate-user/`;
const API_DELETE_USER = `${API_ROOT}/delete-user/`;
const getAdminCoursesUrl = (userId) => `${API_ROOT}/profile/${userId}/courses/`;
const getAdminCourseUrl = (userId, courseId) => `${API_ROOT}/profile/${userId}/courses/${courseId}/`;
const MEMBERS_RETURN_URL_KEY = "members:returnUrl";
const COVER_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1556888335-95371827d5fb?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const TABS = ["Personal", "Professional Summary", "Contact Info", "Social"];

/* ─── small helpers ──────────────────────────────────────────────────────── */
const FieldRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
    <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-emerald-600">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  </div>
);

const EditInput = ({ value, onChange, type = "text", placeholder = "", className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white ${className}`}
  />
);

const EditSelect = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
  >
    {children}
  </select>
);

const TagList = ({ items, colorClass }) =>
  items && items.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((item, i) => (
        <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{item}</span>
      ))}
    </div>
  ) : (
    <span className="text-gray-400 italic">Not provided</span>
  );

const getPrimaryCourse = (user) => {
  const courses = Array.isArray(user?.user_courses) ? user.user_courses : [];
  return courses.find((course) => course?.is_primary) || courses[0] || null;
};

/* ─── main component ─────────────────────────────────────────────────────── */
/**
 * MemberDetailView — standard member profile, used by all roles.
 * Read-only for everyone; admin (isAdmin) additionally gets inline edit,
 * deactivate, delete, and course CRUD.
 * @param {string} basePath e.g. "/alumni"
 */
export default function MemberDetailView({ basePath = "" }) {
  const { name } = useParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { isAdmin } = useViewerProfile();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Personal");
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [addCourseForm, setAddCourseForm] = useState({ course: "", branch: "", college_name: "", passed_out_year: "" });
  const [addCourseLoading, setAddCourseLoading] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  // Image viewer + crop modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState("");
  const [viewerAltText, setViewerAltText] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  const openImageViewer = (url, alt) => {
    if (!url) return;
    setViewerImageUrl(url);
    setViewerAltText(alt || "Photo");
    setViewerOpen(true);
  };

  /* ── nav helpers ── */
  const navigateToMembersList = () => {
    const returnUrl = sessionStorage.getItem(MEMBERS_RETURN_URL_KEY);
    navigate(returnUrl || `${basePath}/members`);
  };
  const handleBackToMembers = () => {
    if (window.history.state?.idx > 0) { navigate(-1); return; }
    navigateToMembersList();
  };

  /* ── fetch ── */
  useEffect(() => {
    fetch(`${API_PROFILE}${name}`, {
      headers: { Authorization: `Token ${TOKEN()}`, "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setMember(data);
        setEditedMember(data);
        if (data.course && COURSE_BRANCH_MAPPING[data.course]) {
          setAvailableBranches(COURSE_BRANCH_MAPPING[data.course]);
        }
        if (Array.isArray(data.user_courses)) setUserCourses(data.user_courses);
        else fetchUserCourses(data.id);
      })
      .finally(() => setLoading(false));
  }, [name]);

  const fetchUserCourses = async (userId) => {
    try {
      const res = await fetch(getAdminCoursesUrl(userId), { headers: { Authorization: `Token ${TOKEN()}` } });
      if (res.ok) {
        const data = await res.json();
        setUserCourses(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
  };

  const handleAddCourse = async () => {
    if (!addCourseForm.course) { toast.error("Course is required"); return; }
    setAddCourseLoading(true);
    try {
      const res = await fetch(getAdminCoursesUrl(member.id), {
        method: "POST",
        headers: { Authorization: `Token ${TOKEN()}`, "Content-Type": "application/json" },
        body: JSON.stringify(addCourseForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.non_field_errors?.[0] || data?.error || data?.detail || "Failed to add course");
        return;
      }
      toast.success("Course added successfully");
      await fetchUserCourses(member.id);
      setShowAddCourseModal(false);
      setAddCourseForm({ course: "", branch: "", college_name: "", passed_out_year: "" });
    } catch (_) {
      toast.error("Failed to add course");
    } finally {
      setAddCourseLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    setDeletingCourseId(courseId);
    try {
      const res = await fetch(getAdminCourseUrl(member.id, courseId), {
        method: "DELETE",
        headers: { Authorization: `Token ${TOKEN()}` },
      });
      if (res.ok || res.status === 204) {
        setUserCourses((prev) => prev.filter((c) => c.id !== courseId));
        toast.success("Course removed");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Failed to remove course");
      }
    } catch (_) {
      toast.error("Failed to remove course");
    } finally {
      setDeletingCourseId(null);
    }
  };

  /* ── edit helpers ── */
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedMember({ ...member });
    setChangedFields(new Set());
    const primaryCourse = getPrimaryCourse(member);
    if (primaryCourse?.course && COURSE_BRANCH_MAPPING[primaryCourse.course]) {
      setAvailableBranches(COURSE_BRANCH_MAPPING[primaryCourse.course]);
    } else {
      setAvailableBranches([]);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMember({ ...member });
    resetImageSelection();
    setChangedFields(new Set());
  };

  const handleSaveEdit = async () => {
    if (usernameError) { toast.error(`Cannot save: ${usernameError}`); return; }
    if (changedFields.has("username") && (!editedMember.username || editedMember.username.trim() === "")) {
      setUsernameError("Username cannot be empty");
      toast.error("Username cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      if (selectedImage) {
        formData.append("profile_photo", selectedImage);
        setChangedFields((cur) => new Set([...cur, "profile_photo"]));
      }
      Object.entries(editedMember).forEach(([key, value]) => {
        if (key === "profile_photo" || key === "experience") return;
        if (!changedFields.has(key)) return;
        if (["professional_skills", "industries_worked_in", "roles_played"].includes(key)) {
          const arr = Array.isArray(value) ? value : value ? [value] : [];
          formData.append(key, JSON.stringify(arr));
        } else if (key === "social_links") {
          formData.append(key, JSON.stringify(value && typeof value === "object" ? value : {}));
        } else if (key === "work_experience" && value) {
          formData.append("work_experience", JSON.stringify(parseInt(value) || 0));
          formData.append("experience", JSON.stringify(parseInt(value) || 0));
        } else if (key === "worked_in") {
          formData.append("Worked_in", JSON.stringify(value || ""));
          formData.append("worked_in", JSON.stringify(value || ""));
        } else if (key === "current_work") {
          formData.append(key, (value || "").toString());
        } else {
          formData.append(key, value !== null && value !== undefined ? value : "");
        }
      });

      const response = await fetch(`${API_PROFILE}${member.id}/update/`, {
        method: "PUT",
        headers: { Authorization: `Token ${TOKEN()}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const updatedUser = {
          ...data.user,
          worked_in: data.user.worked_in || data.user.Worked_in || "",
          Worked_in: data.user.worked_in || data.user.Worked_in || "",
          current_work: data.user.current_work
            ? typeof data.user.current_work === "string" && data.user.current_work.startsWith('"')
              ? JSON.parse(data.user.current_work)
              : data.user.current_work
            : "",
        };
        setMember(updatedUser);
        setEditedMember(updatedUser);
        setIsEditing(false);
        resetImageSelection();
        setChangedFields(new Set());
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch {
      toast.error("Network error while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedMember((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "username") {
        const sanitized = value.replace(/[@\s#$%^&*()+=[\]\\';,./{}|":<>?~]/g, "");
        if (sanitized !== member.username) {
          updated[field] = sanitized;
          setChangedFields((cur) => new Set([...cur, field]));
          setUsernameError("");
          if (sanitized.trim() === "") setUsernameError("Username cannot be empty");
        } else {
          setChangedFields((cur) => { const s = new Set([...cur]); s.delete(field); return s; });
        }
      } else if (field === "course") {
        updated.branch = "";
        setAvailableBranches(value && COURSE_BRANCH_MAPPING[value] ? COURSE_BRANCH_MAPPING[value] : []);
        setChangedFields((cur) => new Set([...cur, field, "branch"]));
      } else {
        setChangedFields((cur) => new Set([...cur, field]));
      }
      if (field === "worked_in") {
        updated.Worked_in = value;
        setChangedFields((cur) => new Set([...cur, field, "Worked_in"]));
      }
      return updated;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImageSrc(ev.target.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = (croppedBlob, croppedPreviewUrl) => {
    const croppedFile = new File([croppedBlob], "profile_photo_cropped.jpg", { type: "image/jpeg" });
    setSelectedImage(croppedFile);
    setImagePreview(croppedPreviewUrl);
    setChangedFields((cur) => new Set([...cur, "profile_photo"]));
    setCropModalOpen(false);
    setCropImageSrc(null);
  };

  const resetImageSelection = () => { setSelectedImage(null); setImagePreview(null); };

  /* ── deactivate / delete ── */
  const handleDeactivateUser = () => setShowDeactivateConfirm(true);
  const doDeactivateUser = async () => {
    const action = member.is_active ? "deactivate" : "activate";
    setDeactivating(true);
    try {
      const res = await fetch(API_DEACTIVATE_USER, {
        method: "POST",
        headers: { Authorization: `Token ${TOKEN()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: member.id }),
      });
      const data = await res.json();
      if (res.status === 200) {
        toast.success(`User ${action}d successfully!`);
        navigateToMembersList();
        window.location.reload();
      } else {
        toast.error(`Failed to ${action} user: ${data.message || "Unknown error"}`);
      }
    } catch { toast.error(`Network error while ${action}ing user`); }
    finally { setDeactivating(false); }
  };

  const handleDeleteUser = () => setShowDeleteConfirm(true);
  const doDeleteUser = async () => {
    setDeleting(true);
    try {
      const res = await fetch(API_DELETE_USER, {
        method: "POST",
        headers: { Authorization: `Token ${TOKEN()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: member.id }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("User deleted successfully!"); navigateToMembersList(); }
      else toast.error(`Failed to delete user: ${data.message || data.error || "Unknown error"}`);
    } catch { toast.error("Network error while deleting user"); }
    finally { setDeleting(false); }
  };

  const handlechat = async () => {
    try {
      const res = await fetch("https://api.karpagamalumni.in/chat/rooms/", {
        method: "POST",
        headers: { Authorization: `Token ${TOKEN()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: member.id }),
      });
      if (res.ok) navigate(`${basePath}/chat`);
    } catch {}
  };

  /* ── loading / not found ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent mb-4"></div>
          <p className="text-gray-500 font-medium">Loading member profile…</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow border-l-4 border-red-500 max-w-sm w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Member Not Found</h2>
          <p className="text-gray-500 text-sm">The requested member profile could not be found.</p>
          <button onClick={handleBackToMembers} className="mt-5 bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const {
    username, first_name, last_name, salutation, gender, date_of_birth,
    email, secondary_email, phone, cover_photo, current_location,
    home_town, city, state, country, chapter, role, bio, current_work, worked_in,
    social_links = {}, is_active = true,
    company, position, work_experience,
    professional_skills = [], industries_worked_in = [], roles_played = [],
  } = member;

  const displayName = [salutation, first_name, last_name].filter(Boolean).join(" ");

  /* ── tab content renderer ── */
  const renderTabContent = () => {
    switch (activeTab) {
      case "Personal":
        return (
          <div>
            <FieldRow icon={Icons.person} label="Full Name">
              {isEditing ? (
                <div className="flex gap-2 flex-wrap">
                  <EditInput value={editedMember.first_name || ""} onChange={(v) => handleInputChange("first_name", v)} placeholder="First Name" className="flex-1 min-w-[120px]" />
                  <EditInput value={editedMember.last_name || ""} onChange={(v) => handleInputChange("last_name", v)} placeholder="Last Name" className="flex-1 min-w-[120px]" />
                </div>
              ) : (
                <span>{displayName || "—"}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.at} label="Username">
              {isEditing ? (
                <div>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-1 text-sm">@</span>
                    <EditInput value={editedMember.username || ""} onChange={(v) => handleInputChange("username", v)} placeholder="username" className={usernameError ? "border-red-400" : ""} />
                  </div>
                  {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
                </div>
              ) : (
                <span className="text-gray-500">@{username}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.email} label="Email">
              {isEditing ? (
                <EditInput type="email" value={editedMember.email || ""} onChange={(v) => handleInputChange("email", v)} />
              ) : (
                <span>{email || "—"}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.info} label="Bio">
              {isEditing ? (
                <textarea value={editedMember.bio || ""} onChange={(e) => handleInputChange("bio", e.target.value)} placeholder="Enter bio…" rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              ) : (
                <span className="whitespace-pre-line">{bio || <em className="text-gray-400">Not provided</em>}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.calendar} label="Date of Birth">
              {isEditing ? (
                <EditInput type="date" value={editedMember.date_of_birth || ""} onChange={(v) => handleInputChange("date_of_birth", v)} />
              ) : (
                <span>{date_of_birth || "—"}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.gender} label="Gender">
              {isEditing ? (
                <EditSelect value={editedMember.gender || ""} onChange={(v) => handleInputChange("gender", v)}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </EditSelect>
              ) : (
                <span>{gender || "—"}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.tag} label="Role"><span>{role || "—"}</span></FieldRow>
            <FieldRow icon={Icons.tag} label="Chapter"><span>{chapter || "—"}</span></FieldRow>
          </div>
        );

      case "Professional Summary":
        return (
          <div>
            <FieldRow icon={Icons.education} label="Education">
              <div>
                {isAdmin && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Course enrollments</span>
                    <button onClick={() => setShowAddCourseModal(true)} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium border border-emerald-300 rounded-md px-2 py-1 hover:bg-emerald-50 transition-colors">
                      + Add Course
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {userCourses.map((c) => (
                    <div key={c.id} className="bg-emerald-50 rounded-lg px-3 py-2 relative group border border-emerald-100">
                      <p className="text-sm text-gray-800 font-medium pr-6">
                        {[c.course, c.branch].filter(Boolean).join(" — ")}
                        {c.is_primary && <span className="ml-2 text-xs bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                      </p>
                      {c.college_name && <p className="text-xs text-gray-500 mt-0.5">{c.college_name}</p>}
                      {(c.course_start_year || c.course_end_year) && (
                        <p className="text-xs text-gray-400 mt-0.5">Study duration: {[c.course_start_year, c.course_end_year].filter(Boolean).join(" – ")}</p>
                      )}
                      {c.passed_out_year && <p className="text-xs text-gray-400 mt-0.5">Passed out: {c.passed_out_year}</p>}
                      {c.roll_no && <p className="text-xs text-gray-400 mt-0.5">Roll no: {c.roll_no}</p>}
                      {isAdmin && !c.is_primary && (
                        <button onClick={() => handleDeleteCourse(c.id)} disabled={deletingCourseId === c.id} className="absolute top-2 right-2 text-red-400 hover:text-red-600 disabled:opacity-50" title="Remove course">
                          {deletingCourseId === c.id ? <span className="inline-block w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : Icons.x}
                        </button>
                      )}
                    </div>
                  ))}
                  {userCourses.length === 0 && <p className="text-xs text-gray-400 italic">No course enrollments yet</p>}
                </div>
              </div>
            </FieldRow>

            <FieldRow icon={Icons.building} label="Company">
              {isEditing ? <EditInput value={editedMember.company || ""} onChange={(v) => handleInputChange("company", v)} placeholder="Company name" /> : <span>{company || <em className="text-gray-400">Not provided</em>}</span>}
            </FieldRow>

            <FieldRow icon={Icons.briefcase} label="Position">
              {isEditing ? <EditInput value={editedMember.position || ""} onChange={(v) => handleInputChange("position", v)} placeholder="Job title / position" /> : <span>{position || <em className="text-gray-400">Not provided</em>}</span>}
            </FieldRow>

            <FieldRow icon={Icons.chart} label="Work Experience">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <EditInput type="number" value={editedMember.work_experience || ""} onChange={(v) => handleInputChange("work_experience", v)} className="w-24" />
                  <span className="text-gray-500 text-sm">years</span>
                </div>
              ) : (
                <span>{work_experience > 0 ? `${work_experience} ${work_experience === 1 ? "year" : "years"}` : <em className="text-gray-400">Not provided</em>}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.briefcase} label="Current Work">
              {isEditing ? (
                <EditInput value={typeof editedMember.current_work === "string" && editedMember.current_work.startsWith('"') ? JSON.parse(editedMember.current_work) : editedMember.current_work || ""} onChange={(v) => handleInputChange("current_work", v)} placeholder="Current workplace" />
              ) : (
                <span>{(() => {
                  if (!current_work) return <em className="text-gray-400">Not provided</em>;
                  if (typeof current_work === "string" && current_work.startsWith('"') && current_work.endsWith('"')) {
                    try { return JSON.parse(current_work); } catch {}
                  }
                  return current_work;
                })()}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.building} label="Worked In">
              {isEditing ? (
                <EditInput value={editedMember.worked_in === undefined ? "" : editedMember.worked_in} onChange={(v) => handleInputChange("worked_in", v)} placeholder="Previous workplaces" />
              ) : (
                <span>{worked_in || member.Worked_in ? (worked_in || (Array.isArray(member.Worked_in) ? member.Worked_in.join(", ") : member.Worked_in)) : <em className="text-gray-400">Not provided</em>}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.tag} label="Professional Skills">
              {isEditing ? (
                <div>
                  <EditInput placeholder="Skills separated by commas" value={editedMember.professional_skills_text || (Array.isArray(editedMember.professional_skills) ? editedMember.professional_skills.join(", ") : "")} onChange={(v) => { handleInputChange("professional_skills_text", v); handleInputChange("professional_skills", v.split(",").map((s) => s.trim()).filter(Boolean)); }} />
                  <p className="text-xs text-gray-400 mt-1">e.g. React, Node.js, UI Design</p>
                </div>
              ) : (
                <TagList items={professional_skills} colorClass="bg-blue-100 text-blue-700" />
              )}
            </FieldRow>

            <FieldRow icon={Icons.building} label="Industries Worked In">
              {isEditing ? (
                <div>
                  <EditInput placeholder="Industries separated by commas" value={editedMember.industries_worked_in_text || (Array.isArray(editedMember.industries_worked_in) ? editedMember.industries_worked_in.join(", ") : "")} onChange={(v) => { handleInputChange("industries_worked_in_text", v); handleInputChange("industries_worked_in", v.split(",").map((s) => s.trim()).filter(Boolean)); }} />
                  <p className="text-xs text-gray-400 mt-1">e.g. IT, Healthcare, Education</p>
                </div>
              ) : (
                <TagList items={industries_worked_in} colorClass="bg-purple-100 text-purple-700" />
              )}
            </FieldRow>

            <FieldRow icon={Icons.briefcase} label="Roles Played">
              {isEditing ? (
                <div>
                  <EditInput placeholder="Roles separated by commas" value={editedMember.roles_played_text || (Array.isArray(editedMember.roles_played) ? editedMember.roles_played.join(", ") : "")} onChange={(v) => { handleInputChange("roles_played_text", v); handleInputChange("roles_played", v.split(",").map((s) => s.trim()).filter(Boolean)); }} />
                  <p className="text-xs text-gray-400 mt-1">e.g. Developer, Team Lead, Product Manager</p>
                </div>
              ) : (
                <TagList items={roles_played} colorClass="bg-orange-100 text-orange-700" />
              )}
            </FieldRow>
          </div>
        );

      case "Contact Info":
        return (
          <div>
            <FieldRow icon={Icons.phone} label="Phone">
              {isEditing ? <EditInput type="tel" value={editedMember.phone || ""} onChange={(v) => handleInputChange("phone", v)} /> : <span>{phone || <em className="text-gray-400">Not provided</em>}</span>}
            </FieldRow>

            <FieldRow icon={Icons.email} label="Secondary Email">
              {isEditing ? <EditInput type="email" value={editedMember.secondary_email || ""} onChange={(v) => handleInputChange("secondary_email", v)} /> : <span>{secondary_email || <em className="text-gray-400">Not provided</em>}</span>}
            </FieldRow>

            <FieldRow icon={Icons.pin} label="Current Location">
              {isEditing ? (
                <div className="space-y-2">
                  <EditInput placeholder="Current Location" value={editedMember.current_location || ""} onChange={(v) => handleInputChange("current_location", v)} />
                  <div className="grid grid-cols-3 gap-2">
                    <EditInput placeholder="City" value={editedMember.city || ""} onChange={(v) => handleInputChange("city", v)} />
                    <EditInput placeholder="State" value={editedMember.state || ""} onChange={(v) => handleInputChange("state", v)} />
                    <EditInput placeholder="Country" value={editedMember.country || ""} onChange={(v) => handleInputChange("country", v)} />
                  </div>
                </div>
              ) : (
                <span>{current_location || [city, state, country].filter(Boolean).join(", ") || <em className="text-gray-400">Not provided</em>}</span>
              )}
            </FieldRow>

            <FieldRow icon={Icons.home} label="Home Town">
              {isEditing ? <EditInput value={editedMember.home_town || ""} onChange={(v) => handleInputChange("home_town", v)} placeholder="Home town" /> : <span>{home_town || <em className="text-gray-400">Not provided</em>}</span>}
            </FieldRow>
          </div>
        );

      case "Social": {
        const sl = isEditing ? (editedMember.social_links || {}) : social_links;
        const socialFields = [
          { key: "linkedin_link", label: "LinkedIn" },
          { key: "twitter_link", label: "Twitter / X" },
          { key: "facebook_link", label: "Facebook" },
          { key: "instagram_link", label: "Instagram" },
          { key: "github_link", label: "GitHub" },
          { key: "website_link", label: "Website" },
        ];
        return (
          <div>
            {socialFields.map(({ key, label }) => (
              <FieldRow key={key} icon={Icons.link} label={label}>
                {isEditing ? (
                  <EditInput type="text" value={editedMember.social_links?.[key] || ""} onChange={(v) => handleInputChange("social_links", { ...editedMember.social_links, [key]: v })} placeholder={`${label} URL`} />
                ) : sl[key] ? (
                  <a href={sl[key]} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline break-all">{sl[key]}</a>
                ) : (
                  <em className="text-gray-400">Not provided</em>
                )}
              </FieldRow>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ── confirm modals (admin) ── */}
      <ConfirmModal
        isOpen={showDeactivateConfirm}
        title={member?.is_active ? "Deactivate User" : "Activate User"}
        message={member?.is_active ? `${member.first_name} ${member.last_name} will no longer be able to access their account.` : `Reactivate ${member?.first_name} ${member?.last_name}'s account?`}
        danger={!!member?.is_active}
        confirmText={member?.is_active ? "Deactivate" : "Activate"}
        onConfirm={() => { doDeactivateUser(); setShowDeactivateConfirm(false); }}
        onCancel={() => setShowDeactivateConfirm(false)}
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={`Delete ${member?.first_name} ${member?.last_name}`}
        message="This action cannot be undone and will delete all user data."
        bullets={["Delete all user data", "Remove their profile permanently", "Cannot be recovered"]}
        danger
        confirmText="Delete"
        requireTyping="DELETE"
        onConfirm={() => { doDeleteUser(); setShowDeleteConfirm(false); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* ── cover banner ── */}
      <div
        className="relative h-40 sm:h-52 bg-gradient-to-br from-emerald-600 to-green-700 clickable-cover-photo"
        style={{
          backgroundImage: cover_photo
            ? `url(${getMediaUrl(cover_photo)}), url(${COVER_PLACEHOLDER_IMAGE})`
            : `url(${COVER_PLACEHOLDER_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={() => openImageViewer(cover_photo ? getMediaUrl(cover_photo) : COVER_PLACEHOLDER_IMAGE, "Cover Photo")}
        title="Click to view cover photo"
      >
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* ── profile identity strip ── */}
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="relative -mt-14 sm:-mt-16 flex items-end justify-between pb-3 border-b border-gray-200">
          {/* avatar */}
          <div className="relative">
            <img
              src={imagePreview || (member.profile_photo ? getMediaUrl(member.profile_photo) : getProfilePlaceholderByGender(gender))}
              alt={username}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md object-cover bg-white clickable-photo"
              onError={(e) => { e.target.onerror = null; e.target.src = getProfilePlaceholderByGender(gender); }}
              onClick={() => {
                if (!isEditing) {
                  openImageViewer(imagePreview || (member.profile_photo ? getMediaUrl(member.profile_photo) : getProfilePlaceholderByGender(gender)), `${first_name} ${last_name}`);
                }
              }}
              title={isEditing ? "Click camera to change photo" : "Click to view profile photo"}
            />
            <span className={`absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white ${is_active ? "bg-emerald-500" : "bg-red-400"}`} />
            {isEditing && (
              <label htmlFor="profile-image-input" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer">
                <span className="text-white">{Icons.camera}</span>
                <input id="profile-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* action buttons — top right */}
          <div className="pb-2">
            {!isEditing ? (
              <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={handlechat} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                  {Icons.chat} Chat
                </button>
                {isAdmin && (
                  <>
                    <button onClick={handleEditClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                      {Icons.edit} Edit profile
                    </button>
                    <button onClick={handleDeactivateUser} disabled={deactivating} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm disabled:opacity-60 ${is_active ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                      {deactivating ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : is_active ? Icons.ban : Icons.activate}
                      {is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={handleDeleteUser} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60">
                      {deleting ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : Icons.trash}
                      Delete
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancelEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  {Icons.x} Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-60">
                  {saving ? <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <>{Icons.check} Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* new-image hint */}
        {isEditing && selectedImage && (
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <span className="font-medium">New photo selected:</span> {selectedImage.name}
            <button onClick={resetImageSelection} className="ml-auto text-red-500 hover:text-red-700 font-medium">Remove</button>
          </div>
        )}

        {/* name, username, badges */}
        <div className="mt-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            <ScrambleText text={displayName || username} duration={1000} />
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">@{username}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {role && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {Icons.briefcase} {role}
              </span>
            )}
            {chapter && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{chapter}</span>}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
              {is_active ? "● Active" : "● Inactive"}
            </span>
          </div>
        </div>

        {/* back link */}
        <button onClick={handleBackToMembers} className="mt-2 mb-4 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors">
          {Icons.back} Back to members
        </button>

        {/* tab nav */}
        <div className="border-b border-gray-200 mb-0">
          <nav className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* tab body */}
        <motion.div
          key={activeTab}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 px-4 sm:px-6 py-2 mb-8"
        >
          {renderTabContent()}
        </motion.div>
      </motion.div>

      {/* ── Add Course Modal (admin) ── */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">Add Course Enrollment</h2>
              <button onClick={() => setShowAddCourseModal(false)} className="text-gray-400 hover:text-gray-600">{Icons.x}</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Course *</label>
                <select value={addCourseForm.course} onChange={(e) => setAddCourseForm((f) => ({ ...f, course: e.target.value, branch: "" }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Select Course</option>
                  {getCoursesForCollege(addCourseForm.college_name).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {addCourseForm.course && COURSE_BRANCH_MAPPING[addCourseForm.course] && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Branch / Stream</label>
                  <select value={addCourseForm.branch} onChange={(e) => setAddCourseForm((f) => ({ ...f, branch: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option value="">Select Branch</option>
                    {COURSE_BRANCH_MAPPING[addCourseForm.course].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">College</label>
                <select value={addCourseForm.college_name} onChange={(e) => setAddCourseForm((f) => ({ ...f, college_name: e.target.value, course: "", branch: "" }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Select College</option>
                  {COLLEGE_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Passed Out Year</label>
                <input type="number" placeholder="e.g. 2024" value={addCourseForm.passed_out_year} onChange={(e) => setAddCourseForm((f) => ({ ...f, passed_out_year: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowAddCourseModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddCourse} disabled={addCourseLoading} className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-1.5">
                {addCourseLoading ? <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</> : "Add Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer + Crop modals */}
      <ImageViewerModal isOpen={viewerOpen} imageUrl={viewerImageUrl} altText={viewerAltText} onClose={() => setViewerOpen(false)} />
      <ImageCropModal isOpen={cropModalOpen} imageSrc={cropImageSrc} aspectRatio={1} cropShape="round" title="Crop Profile Photo" onClose={() => { setCropModalOpen(false); setCropImageSrc(null); }} onCropDone={handleCropDone} />
    </div>
  );
}
