import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfilePlaceholderByGender } from "../../../lib/profilePlaceholders";

/* ─── constants ─────────────────────────────────────────────────────────── */

const PLACEHOLDER_IMAGE = "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";

const TOKEN = localStorage.getItem("Token");
const API_BASE = "https://api.karpagamalumni.in/api/v1/profile/";
const MEDIA_BASE_URL = "https://api.karpagamalumni.in";
const MEMBERS_RETURN_URL_KEY = "members:returnUrl";

const getMediaUrl = (uri) => {
  if (!uri) return "";
  if (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("file://") || uri.startsWith("data:") || uri.startsWith("blob:")) return uri;
  return uri.startsWith("/") ? `${MEDIA_BASE_URL}${uri}` : `${MEDIA_BASE_URL}/${uri}`;
};

const TABS = ["Personal", "Work", "Contact", "Social"];

/* ─── small helpers ──────────────────────────────────────────────────────── */

const FieldRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
    <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-green-600">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-0.5">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  </div>
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

/* ─── SVG icons ──────────────────────────────────────────────────────────── */
const Icons = {
  person: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>,
  at: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z" clipRule="evenodd"/></svg>,
  email: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>,
  info: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>,
  calendar: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>,
  gender: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>,
  lock: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>,
  briefcase: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  building: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>,
  chart: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  tag: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>,
  pin: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>,
  home: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>,
  phone: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>,
  link: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/></svg>,
  chat: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>,
  back: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>,
  check: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>,
  education: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>,
};

/* ─── main component ─────────────────────────────────────────────────────── */

export default function SingleMember() {
  const { name } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Personal");

  /* ── helpers ── */
  const navigateToMembersList = () => {
    const returnUrl = sessionStorage.getItem(MEMBERS_RETURN_URL_KEY);
    navigate(returnUrl || "/admin/members");
  };

  const handleBackToMembers = () => {
    if (window.history.state?.idx > 0) { navigate(-1); return; }
    navigateToMembersList();
  };

  /* ── fetch ── */
  useEffect(() => {
    fetch(`${API_BASE}${name}`, {
      headers: { Authorization: `Token ${TOKEN}`, "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setMember(data);
      })
      .finally(() => setLoading(false));
  }, [name]);

  const handlechat = async () => {
    const token = localStorage.getItem("Token");
    try {
      const res = await fetch("https://api.karpagamalumni.in/chat/rooms/", {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: member.id }),
      });
      if (res.ok) navigate("/admin/chat");
    } catch {}
  };

  /* ── loading / not found ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent mb-4"></div>
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
          <button onClick={handleBackToMembers} className="mt-5 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const {
    username, first_name, last_name, salutation, gender, date_of_birth,
    email, secondary_email, phone, cover_photo, current_location,
    home_town, city, state, country, course, stream, start_year,
    end_year, college_name, chapter, role, bio, current_work, worked_in,
    passed_out_year, roll_no, social_links = {}, is_active = true,
    company, position, work_experience,
    professional_skills = [], industries_worked_in = [], roles_played = [],
  } = member;

  const displayName = [salutation, first_name, last_name].filter(Boolean).join(" ");

  /* ── tab content renderer ── */
  const renderTabContent = () => {
    switch (activeTab) {
      /* ── Personal ── */
      case "Personal":
        return (
          <div>
            <FieldRow icon={Icons.person} label="Full Name">
              <span>{displayName || "—"}</span>
            </FieldRow>

            <FieldRow icon={Icons.at} label="Username">
              <span className="text-gray-500">@{username}</span>
            </FieldRow>

            <FieldRow icon={Icons.email} label="Email">
              <span>{email || "—"}</span>
            </FieldRow>

            <FieldRow icon={Icons.info} label="Bio">
              <span className="whitespace-pre-line">{bio || <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.calendar} label="Date of Birth">
              <span>{date_of_birth || "—"}</span>
            </FieldRow>

            <FieldRow icon={Icons.gender} label="Gender">
              <span>{gender || "—"}</span>
            </FieldRow>

            {/* Role & Chapter */}
            <FieldRow icon={Icons.tag} label="Role">
              <span>{role || "—"}</span>
            </FieldRow>

            <FieldRow icon={Icons.tag} label="Chapter">
              <span>{chapter || "—"}</span>
            </FieldRow>

            {/* Password management */}
            <FieldRow icon={Icons.lock} label="Password Management">
              <p className="text-green-600 text-sm mb-2">Manage your account security settings</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigate("/admin/change-password")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {Icons.lock} Change Password
                </button>
                <button
                  onClick={() => navigate("/admin/reset-password")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {Icons.check} Reset Password
                </button>
              </div>
            </FieldRow>
          </div>
        );

      /* ── Work ── */
      case "Work":
        return (
          <div>
            <FieldRow icon={Icons.education} label="College">
              <span>{college_name || "—"}</span>
            </FieldRow>

            <FieldRow icon={Icons.education} label="Course & Branch">
              <span>{[course, stream].filter(Boolean).join(", ") || "—"}</span>
            </FieldRow>

            {(start_year || end_year) && (
              <FieldRow icon={Icons.calendar} label="Study Duration">
                <span>{[start_year, end_year].filter(Boolean).join(" – ") || "—"}</span>
              </FieldRow>
            )}

            <FieldRow icon={Icons.calendar} label="Passed Out Year">
              <span>{passed_out_year || "—"}</span>
            </FieldRow>

            <FieldRow icon={Icons.tag} label="Roll No">
              <span>{roll_no || "—"}</span>
            </FieldRow>

            <FieldRow icon={Icons.building} label="Company">
              <span>{company || <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.briefcase} label="Position">
              <span>{position || <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.chart} label="Work Experience">
              <span>{work_experience > 0 ? `${work_experience} ${work_experience === 1 ? "year" : "years"}` : <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.briefcase} label="Current Work">
              <span>{(() => {
                if (!current_work) return <em className="text-gray-400">Not provided</em>;
                if (typeof current_work === "string" && current_work.startsWith('"') && current_work.endsWith('"')) {
                  try { return JSON.parse(current_work); } catch {}
                }
                return current_work;
              })()}</span>
            </FieldRow>

            <FieldRow icon={Icons.building} label="Worked In">
              <span>{worked_in || member.Worked_in
                ? (worked_in || (Array.isArray(member.Worked_in) ? member.Worked_in.join(", ") : member.Worked_in))
                : <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.tag} label="Professional Skills">
              <TagList items={professional_skills} colorClass="bg-blue-100 text-blue-700" />
            </FieldRow>

            <FieldRow icon={Icons.building} label="Industries Worked In">
              <TagList items={industries_worked_in} colorClass="bg-purple-100 text-purple-700" />
            </FieldRow>

            <FieldRow icon={Icons.briefcase} label="Roles Played">
              <TagList items={roles_played} colorClass="bg-orange-100 text-orange-700" />
            </FieldRow>
          </div>
        );

      /* ── Contact ── */
      case "Contact":
        return (
          <div>
            <FieldRow icon={Icons.phone} label="Phone">
              <span>{phone || <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.email} label="Secondary Email">
              <span>{secondary_email || <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.pin} label="Current Location">
              <span>{current_location || [city, state, country].filter(Boolean).join(", ") || <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>

            <FieldRow icon={Icons.home} label="Home Town">
              <span>{home_town || <em className="text-gray-400">Not provided</em>}</span>
            </FieldRow>
          </div>
        );

      /* ── Social ── */
      case "Social": {
        const sl = social_links || {};
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
                {sl[key] ? (
                  <a href={sl[key]} target="_blank" rel="noreferrer" className="text-green-600 hover:underline break-all">{sl[key]}</a>
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
      {/* ── cover banner ── */}
      <div
        className="relative h-40 sm:h-52 bg-gray-200"
        style={{
          backgroundImage: `url(${cover_photo ? getMediaUrl(cover_photo) : PLACEHOLDER_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* ── profile identity strip ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-14 sm:-mt-16 flex items-end justify-between pb-3 border-b border-gray-200">
          {/* avatar */}
          <div className="relative">
            <img
              src={member.profile_photo ? getMediaUrl(member.profile_photo) : getProfilePlaceholderByGender(gender)}
              alt={username}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md object-cover bg-white"
              onError={(e) => { e.target.onerror = null; e.target.src = getProfilePlaceholderByGender(gender); }}
            />
            {/* active dot */}
            <span className={`absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white ${is_active ? "bg-green-500" : "bg-red-400"}`} />
          </div>

          {/* edit / action buttons — top right */}
          <div className="pb-2">
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={handlechat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                {Icons.chat} Chat
              </button>
            </div>
          </div>
        </div>

        {/* name, username, badges */}
        <div className="mt-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{displayName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">@{username}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {role && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                {Icons.briefcase} {role}
              </span>
            )}
            {chapter && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{chapter}</span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {is_active ? "● Active" : "● Inactive"}
            </span>
          </div>
        </div>

        {/* back link */}
        <button
          onClick={handleBackToMembers}
          className="mt-2 mb-4 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors"
        >
          {Icons.back} Back to members
        </button>

        {/* ── tab nav ── */}
        <div className="border-b border-gray-200 mb-0">
          <nav className="flex gap-0 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* ── tab body ── */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 px-4 sm:px-6 py-2 mb-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
