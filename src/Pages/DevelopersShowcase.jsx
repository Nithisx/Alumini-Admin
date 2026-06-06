import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import ImageViewerModal from "../Components/Shared/ImageViewerModal";
import {
  ArrowRight,
  BadgeInfo,
  BriefcaseBusiness,
  GraduationCap,
  Save,
  Sparkles,
  Users,
  X,
  Star,
  Trash2,
  Plus,
} from "lucide-react";
import Header from "./Header";
import Footer from "./about_components/Footer";
import AdminHeader from "../Components/Admin/AdminHeader";
import StaffHeader from "../Components/Staff/StaffHeader";
import AlumniHeader from "../Components/Alumni/AluminiHeader";
import { normalizeRoleForBase } from "../lib/authRole";
import axiosInstance from "../lib/axiosInstance";
import {
  API_ADMIN_USER_UPDATE,
  API_DEVELOPER_SHOWCASE,
  API_PROFILE,
  API_ENDORSEMENTS,
  API_ENDORSEMENT_USER,
  API_ENDORSEMENT_DELETE,
  getMediaUrl,
} from "../config/api";

const FEATURED_DEVELOPER_IDS = [
  "c2a1b4d7-c9e8-4dca-a297-23bb68d8681a",
  "16c18467-6ca6-42e6-a500-5fa6c0c8bde4",
  "3d5871f6-e365-41ff-abf3-7e644f746c9f",
];

const FALLBACK_ROLE_MAP = {
  "c2a1b4d7-c9e8-4dca-a297-23bb68d8681a": "DEVOPS & Backend Development",
  "16c18467-6ca6-42e6-a500-5fa6c0c8bde4": "UI/UX And frontend Development",
  "3d5871f6-e365-41ff-abf3-7e644f746c9f": "UI/UX And frontend Development",
};

const getDisplayName = (developer) =>
  [developer.salutation, developer.first_name, developer.last_name].filter(Boolean).join(" ") ||
  developer.name ||
  developer.username ||
  "Developer";

const getSpecialty = (developer) => developer.developer_role || FALLBACK_ROLE_MAP[developer.id] || "Alumni Developer";

const getBatch = (developer) => {
  const course = developer.user_courses?.[0];
  return course?.passed_out_year || developer.end_year || developer.start_year || "Batch not shared";
};

const getDepartment = (developer) => {
  const course = developer.user_courses?.[0];
  return (
    developer.faculty_department ||
    developer.educational_course ||
    course?.branch ||
    course?.college_name ||
    "Department not shared"
  );
};

const getAvatar = (developer) => {
  if (developer.profile_photo) return getMediaUrl(developer.profile_photo);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(developer))}&size=256&background=059669&color=fff`;
};

const getLink = (developer, keys) => {
  for (const key of keys) {
    if (developer[key]) return developer[key];
    if (developer.social_links && developer.social_links[key]) return developer.social_links[key];
  }
  return "";
};

export default function DevelopersShowcase() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Endorsements & current user state
  const [currentUser, setCurrentUser] = useState(null);
  const [endorsements, setEndorsements] = useState({});
  const [showReviews, setShowReviews] = useState({});
  const [showFormId, setShowFormId] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [contentInput, setContentInput] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  // Image viewer modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState("");
  const [viewerAltText, setViewerAltText] = useState("");

  const openImageViewer = (url, alt) => {
    if (!url) return;
    setViewerImageUrl(url);
    setViewerAltText(alt || "Photo");
    setViewerOpen(true);
  };

  const token = localStorage.getItem("Token");
  const roleBase = normalizeRoleForBase(localStorage.getItem("Role"));
  const isAdmin = roleBase === "admin";

  const renderHeader = () => {
    if (!token || !roleBase) return <Header />;
    if (roleBase === "admin") return <AdminHeader />;
    if (roleBase === "staff") return <StaffHeader />;
    return <AlumniHeader />;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (token) {
          axiosInstance
            .get(API_PROFILE, {
              headers: { Authorization: `Token ${token}` },
            })
            .then((res) => {
              setCurrentUser(res.data || null);
            })
            .catch((err) => {
              console.error("Failed to load user profile:", err);
            });
        }

        const response = await axiosInstance.get(`${API_DEVELOPER_SHOWCASE}?ids=${FEATURED_DEVELOPER_IDS.join(",")}`);
        const list = response.data?.developers || [];
        setDevelopers(list);
        setRoleDrafts(
          Object.fromEntries(
            list.map((developer) => [
              developer.id,
              developer.developer_role || FALLBACK_ROLE_MAP[developer.id] || "",
            ])
          )
        );

        // Fetch endorsements for all developer cards
        const endorsementsData = {};
        await Promise.all(
          list.map(async (dev) => {
            try {
              const res = await axiosInstance.get(API_ENDORSEMENT_USER(dev.id));
              if (res.data?.success) {
                endorsementsData[dev.id] = res.data.data || [];
              }
            } catch (err) {
              console.error(`Failed to load endorsements for dev ${dev.id}:`, err);
              endorsementsData[dev.id] = [];
            }
          })
        );
        setEndorsements(endorsementsData);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load the developer showcase right now.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const saveRole = async (developerId) => {
    if (!isAdmin) return;
    setSavingId(developerId);
    try {
      const response = await axiosInstance.patch(API_ADMIN_USER_UPDATE(developerId), {
        developer_role: roleDrafts[developerId] || "",
      });
      if (response.data?.user) {
        setDevelopers((previous) => previous.map((developer) => (developer.id === developerId ? response.data.user : developer)));
        setRoleDrafts((previous) => ({
          ...previous,
          [developerId]: response.data.user.developer_role || "",
        }));
      }
    } catch (saveError) {
      console.error(saveError);
      alert(saveError.response?.data?.message || "Unable to save developer role.");
    } finally {
      setSavingId(null);
    }
  };

  const toggleReviews = (developerId) => {
    setShowReviews((prev) => ({
      ...prev,
      [developerId]: !prev[developerId],
    }));
  };

  const toggleForm = (developerId) => {
    if (showFormId === developerId) {
      setShowFormId(null);
      setContentInput("");
      setRatingInput(5);
    } else {
      setShowFormId(developerId);
      setContentInput("");
      setRatingInput(5);
    }
  };

  const submitEndorsement = async (developerId) => {
    if (!token) return;
    if (!contentInput.trim()) {
      alert("Please write a recommendation message.");
      return;
    }
    setSubmittingId(developerId);
    try {
      const response = await axiosInstance.post(
        API_ENDORSEMENTS,
        {
          recipient_id: developerId,
          rating: ratingInput,
          content: contentInput.trim(),
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      if (response.data?.success) {
        const res = await axiosInstance.get(API_ENDORSEMENT_USER(developerId));
        if (res.data?.success) {
          setEndorsements((prev) => ({
            ...prev,
            [developerId]: res.data.data || [],
          }));
        }
        setShowFormId(null);
        setContentInput("");
        setRatingInput(5);
        setShowReviews((prev) => ({ ...prev, [developerId]: true }));
      }
    } catch (err) {
      console.error("Failed to submit endorsement:", err);
      alert(err.response?.data?.message || err.response?.data?.errors?.recipient_id?.[0] || "Unable to submit endorsement.");
    } finally {
      setSubmittingId(null);
    }
  };

  const deleteEndorsement = async (endorsementId, developerId) => {
    if (!window.confirm("Are you sure you want to delete this recommendation?")) return;
    try {
      const response = await axiosInstance.delete(API_ENDORSEMENT_DELETE(endorsementId), {
        headers: { Authorization: `Token ${token}` },
      });
      if (response.data?.success) {
        setEndorsements((prev) => ({
          ...prev,
          [developerId]: prev[developerId].filter((e) => e.id !== endorsementId),
        }));
      }
    } catch (err) {
      console.error("Failed to delete endorsement:", err);
      alert(err.response?.data?.message || "Unable to delete endorsement.");
    }
  };

  const getAverageRating = (devEndorsements) => {
    if (!devEndorsements || devEndorsements.length === 0) return "0.0";
    const sum = devEndorsements.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / devEndorsements.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9f6]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="mt-4 text-emerald-700 font-medium">Loading developer showcase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(180deg,_#f9fdfb_0%,_#f4faf6_100%)]">
      {renderHeader()}

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-emerald-100/70">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800" />
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20 text-white">
            <div className="max-w-3xl">

              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Meet the team behind the portal.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">
                Explore the alumni developers who built this platform, connect with them on GitHub or LinkedIn, and jump into the community where they answer technical questions.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/developer-community"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-emerald-800 shadow-lg shadow-black/10 transition hover:translate-y-[-1px] hover:bg-emerald-50"
                >
                  Join the community <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Contact the team
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {developers.map((developer) => {
              const specialty = getSpecialty(developer);
              const displayName = getDisplayName(developer);
              const githubLink = getLink(developer, ["github_url", "github", "githubLink"]);
              const linkedInLink = getLink(developer, ["linkedin_link", "linkedin", "linkedIn"]);
              const portfolioLink = getLink(developer, ["website_link", "portfolio_url", "website"]);
              const emailLink = developer.email || "";

              return (
                <article key={developer.id} className="group overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(16,185,129,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(16,185,129,0.12)]">
                  <div className="relative h-80 overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-700">
                    <img
                      src={getAvatar(developer)}
                      alt={displayName}
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 cursor-pointer"
                      onClick={() => openImageViewer(getAvatar(developer), displayName)}
                      title="Click to view profile photo"
                      onError={(event) => {
                        event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=256&background=059669&color=fff`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/30 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-100/80">Profile</p>
                      <h2 className="mt-1 text-2xl font-bold">{displayName}</h2>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 border border-emerald-100">
                        {specialty}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                        {developer.role || "Alumni"}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-emerald-600" />
                        <span>Batch: {getBatch(developer)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-emerald-600" />
                        <span>{getDepartment(developer)}</span>
                      </div>
                    </div>

                    <p className="min-h-[4.5rem] text-sm leading-7 text-slate-600">
                      {developer.bio || "This developer profile is synced from the members table and can be updated by an admin from the showcase page."}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {githubLink && (
                        <a href={githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                          <FaGithub /> GitHub
                        </a>
                      )}
                      {linkedInLink && (
                        <a href={linkedInLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0958a8]">
                          <FaLinkedinIn /> LinkedIn
                        </a>
                      )}
                      {portfolioLink && (
                        <a href={portfolioLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                          <FontAwesomeIcon icon={faGlobe} /> Portfolio
                        </a>
                      )}
                      {emailLink && (
                        <a href={`mailto:${emailLink}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          <FontAwesomeIcon icon={faEnvelope} /> Email
                        </a>
                      )}
                    </div>

                    {/* Endorsements Section */}
                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="ml-1 text-sm font-bold text-slate-800">
                              {getAverageRating(endorsements[developer.id])}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            ({endorsements[developer.id]?.length || 0} {endorsements[developer.id]?.length === 1 ? 'endorsement' : 'endorsements'})
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleReviews(developer.id)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                          >
                            {showReviews[developer.id] ? "Hide" : "View"} Reviews
                          </button>
                          
                          {token && (
                            <button
                              type="button"
                              onClick={() => toggleForm(developer.id)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Endorse
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Guest login prompt */}
                      {!token && (
                        <div className="text-xs text-slate-500 text-center py-1">
                          Want to endorse? <a href="/login" className="text-emerald-600 font-semibold hover:underline">Log in</a>
                        </div>
                      )}

                      {/* Collapsible Endorsement Form */}
                      {showFormId === developer.id && (
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Endorse {displayName}
                          </h4>
                          
                          {/* Rating Picker */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600">Rating:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setRatingInput(star)}
                                  className="text-amber-400 hover:scale-110 transition"
                                >
                                  <Star
                                    className={`h-5 w-5 ${
                                      star <= ratingInput ? "fill-amber-400" : "text-slate-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Comment Textarea */}
                          <div className="space-y-1">
                            <textarea
                              value={contentInput}
                              onChange={(e) => setContentInput(e.target.value)}
                              placeholder="Write a recommendation or describe how they helped you..."
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 outline-none resize-none h-20 bg-white"
                              maxLength={500}
                            />
                            <div className="text-[10px] text-slate-400 text-right">
                              {contentInput.length}/500
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setShowFormId(null);
                                setContentInput("");
                                setRatingInput(5);
                              }}
                              className="px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => submitEndorsement(developer.id)}
                              disabled={submittingId === developer.id}
                              className="px-4 py-1.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-wait"
                            >
                              {submittingId === developer.id ? "Submitting..." : "Submit"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Collapsible Reviews List */}
                      {showReviews[developer.id] && (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 border-t border-slate-100 pt-3">
                          {!endorsements[developer.id] || endorsements[developer.id].length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-2">No recommendations yet. Be the first to write one!</p>
                          ) : (
                            endorsements[developer.id].map((endorsement) => {
                              const endorser = endorsement.endorser || {};
                              const endorserName = [endorser.first_name, endorser.last_name].filter(Boolean).join(" ") || "Alumni Member";
                              const isOwnEndorsement = currentUser && currentUser.id === endorser.id;
                              
                              return (
                                <div key={endorsement.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 relative">
                                  <div className="flex items-center gap-2">
                                    {/* Endorser Avatar */}
                                    {endorser.profile_image ? (
                                      <img
                                        src={getMediaUrl(endorser.profile_image)}
                                        alt={endorserName}
                                        className="h-7 w-7 rounded-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(endorserName)}&size=64&background=059669&color=fff`;
                                        }}
                                      />
                                    ) : (
                                      <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                                        {endorser.initials || "AM"}
                                      </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-xs font-bold text-slate-800 truncate">
                                        {endorserName} {isOwnEndorsement && <span className="text-[10px] text-emerald-600 font-normal ml-1">(You)</span>}
                                      </h5>
                                      <p className="text-[10px] text-slate-500 truncate">
                                        {endorser.role || "Alumni"}
                                      </p>
                                    </div>
                                    
                                    {/* Rating */}
                                    <div className="flex text-amber-400 gap-0.5">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${
                                            i < endorsement.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-slate-600 leading-relaxed pl-9">
                                    {endorsement.content}
                                  </p>
                                  
                                  {/* Delete Button */}
                                  {(isOwnEndorsement || isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => deleteEndorsement(endorsement.id, developer.id)}
                                      className="absolute right-3 bottom-3 text-slate-400 hover:text-red-500 transition"
                                      title="Delete recommendation"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <BadgeInfo className="h-4 w-4 text-emerald-600" />
                        Admin notes
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        The specialization shown here is stored on the member record and can be updated by an admin.
                      </p>

                      {isAdmin && (
                        <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Developer role
                          </label>
                          <input
                            value={roleDrafts[developer.id] || ""}
                            onChange={(event) => setRoleDrafts((previous) => ({ ...previous, [developer.id]: event.target.value }))}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            placeholder="DEVOPS & Backend Development"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveRole(developer.id)}
                              disabled={savingId === developer.id}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                            >
                              <Save className="h-4 w-4" />
                              {savingId === developer.id ? "Saving..." : "Save role"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRoleDrafts((previous) => ({ ...previous, [developer.id]: FALLBACK_ROLE_MAP[developer.id] || "" }))}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              <X className="h-4 w-4" />
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!developers.length && !error && (
            <div className="mt-8 rounded-3xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center text-slate-600">
              No featured developers were found yet.
            </div>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[2rem] border border-white/70 bg-white p-7 shadow-sm shadow-emerald-100/40">
              <div className="flex items-center gap-3 text-emerald-700">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-lg font-bold text-slate-900">What they built</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The alumni developers maintain the portal, member experience, messaging, and community workflows. Their work combines backend systems, UI craftsmanship, and ongoing improvements from user feedback.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-700">Django + REST</span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-700">React + Vite</span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-700">WebSocket messaging</span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-700">PWA delivery</span>
              </div>
            </section>

            <section className="rounded-[2rem] bg-gradient-to-br from-emerald-700 to-green-700 p-7 text-white shadow-lg shadow-emerald-200/50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <h3 className="text-lg font-bold">Want to collaborate?</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-emerald-50/90">
                Join the developer community to ask questions, share opportunities, and discuss technical work with the alumni team.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/developer-community" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">
                  Open community <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  Get in touch
                </a>
              </div>
            </section>
          </div>
        </section>
      </main>

      <Footer />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        imageUrl={viewerImageUrl}
        altText={viewerAltText}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
