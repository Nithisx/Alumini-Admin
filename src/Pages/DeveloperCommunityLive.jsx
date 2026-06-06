import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import {
  ArrowRight,
  MessageSquare,
  PencilLine,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import Header from "./Header";
import Footer from "./about_components/Footer";
import AdminHeader from "../Components/Admin/AdminHeader";
import StaffHeader from "../Components/Staff/StaffHeader";
import AlumniHeader from "../Components/Alumni/AluminiHeader";
import ImageViewerModal from "../Components/Shared/ImageViewerModal";
import { normalizeRoleForBase } from "../lib/authRole";
import axiosInstance from "../lib/axiosInstance";
import { createResilientSocket } from "../Components/Shared/chat/resilientSocket";
import {
  API_CHAT_COMMUNITY,
  API_DEVELOPER_SHOWCASE,
  API_PROFILE,
  WS_COMMUNITY_URL,
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

const AUTH_BYPASS_HEADERS = {
  "x-skip-unauthorized-redirect": "true",
};

const getDisplayName = (person) =>
  [person?.salutation, person?.first_name, person?.last_name].filter(Boolean).join(" ") ||
  person?.name ||
  person?.username ||
  "Developer";

const getAvatar = (person) => {
  if (person?.profile_photo) return getMediaUrl(person.profile_photo);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(person))}&size=256&background=059669&color=fff`;
};

const getSpecialty = (person) => person?.developer_role || FALLBACK_ROLE_MAP[person?.id] || "Alumni Developer";

const getBatch = (person) => {
  const course = person?.user_courses?.[0];
  return course?.passed_out_year || person?.end_year || person?.start_year || "Batch not shared";
};

const getDepartment = (person) => {
  const course = person?.user_courses?.[0];
  return (
    person?.faculty_department ||
    person?.educational_course ||
    course?.branch ||
    course?.college_name ||
    "Department not shared"
  );
};

const getLink = (person, keys) => {
  for (const key of keys) {
    if (person?.[key]) return person[key];
    if (person?.social_links?.[key]) return person.social_links[key];
  }
  return "";
};

const fmtTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const fmtDateTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function DeveloperCommunityLive() {
  const [developers, setDevelopers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDeveloper, setExpandedDeveloper] = useState(null);

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

  const socketRef = useRef(null);
  const feedRef = useRef(null);

  const token = localStorage.getItem("Token");
  const roleBase = normalizeRoleForBase(localStorage.getItem("Role"));
  const isAuthorized = Boolean(token && roleBase);

  const renderHeader = () => {
    if (!isAuthorized) return <Header />;
    if (roleBase === "admin") return <AdminHeader />;
    if (roleBase === "staff") return <StaffHeader />;
    return <AlumniHeader />;
  };

  const currentDeveloper = useMemo(
    () => developers.find((developer) => developer.id === currentUser?.id),
    [developers, currentUser]
  );
  const canModerate = roleBase === "admin" || Boolean(currentDeveloper?.developer_role);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const loadDeveloperShowcase = async () => {
    const response = await axiosInstance.get(
      `${API_DEVELOPER_SHOWCASE}?ids=${FEATURED_DEVELOPER_IDS.join(",")}`
    );
    const list = response.data?.developers || [];
    setDevelopers(list);
  };

  const loadCurrentUser = async () => {
    if (!token) return;
    const response = await axiosInstance.get(API_PROFILE, {
      headers: {
        ...AUTH_BYPASS_HEADERS,
        Authorization: `Token ${token}`,
      },
    });
    setCurrentUser(response.data || null);
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        await loadDeveloperShowcase();
        await loadCurrentUser();
        if (token) {
          await axiosInstance.get(API_CHAT_COMMUNITY, {
            headers: {
              ...AUTH_BYPASS_HEADERS,
              Authorization: `Token ${token}`,
            },
          });
        }
      } catch (bootstrapError) {
        console.error(bootstrapError);
        if (active) setError("Failed to load the developer community.");
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    setConnecting(true);
    const socket = createResilientSocket({
      getUrl: () => WS_COMMUNITY_URL(token, "developer"),
      onOpen: () => {
        setConnected(true);
        setConnecting(false);
      },
      onDown: () => setConnected(false),
      onMessage: (payload) => {
        if (payload.action === "message_history" && Array.isArray(payload.messages)) {
          setMessages(payload.messages);
          scrollToBottom();
          return;
        }
        if (payload.action === "new_message") {
          setMessages((previous) => [...previous, payload]);
          scrollToBottom();
          return;
        }
        if (payload.action === "message_deleted") {
          setMessages((previous) => previous.filter((message) => String(message.id) !== String(payload.message_id)));
          return;
        }
        if (payload.action === "message_edited") {
          setMessages((previous) =>
            previous.map((message) =>
              String(message.id) === String(payload.message_id)
                ? { ...message, text: payload.new_text, edited: true }
                : message
            )
          );
        }
      },
    });

    socketRef.current = socket;
    socket.connect();

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (messages.length) {
      scrollToBottom();
    }
  }, [messages.length]);

  const sendMessage = () => {
    if (!messageText.trim() || !socketRef.current || !connected) return;
    socketRef.current.send({ message: messageText.trim() });
    setMessageText("");
  };

  const editMessage = (message) => {
    const nextText = window.prompt("Edit community message", message.text || message.content || "");
    if (!nextText || !nextText.trim()) return;
    socketRef.current?.send({ action: "edit_message", message_id: message.id, new_text: nextText.trim() });
  };

  const deleteMessage = (message) => {
    if (!window.confirm("Delete this community message?")) return;
    socketRef.current?.send({ action: "delete_message", message_id: message.id });
  };

  const isOwnMessage = (message) => String(message?.sender?.id) === String(currentUser?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9f6]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="mt-4 text-emerald-700 font-medium">Loading the developer community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_30%),linear-gradient(180deg,_#f8fcf9_0%,_#eef8f2_100%)]">
      {renderHeader()}

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/80 p-6 shadow-sm shadow-emerald-100/40 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <MessageSquare className="h-4 w-4" />
                  Developer Community
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Ask, share, and build with the alumni developers.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Use this space for technical questions, opportunities, project ideas, and community support. Messages update in real time for connected users.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Developers</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{developers.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Messages</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{messages.length}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Live status</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                    {connected ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-slate-400" />}
                    {connected ? "Connected" : connecting ? "Connecting" : "Offline"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {error}
            </div>
          )}

          {!isAuthorized && (
            <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sign in to post and chat in real time</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Guests can still explore the developer profiles, but posting and moderation need a logged-in account.
                  </p>
                </div>
                <a href="/login" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Go to login <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-sm shadow-emerald-100/40">
                <div className="flex items-center gap-3 text-emerald-700">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-lg font-bold text-slate-900">Featured developers</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {developers.map((developer) => (
                    <button
                      key={developer.id}
                      type="button"
                      onClick={() => setExpandedDeveloper((previous) => (previous === developer.id ? null : developer.id))}
                      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                    >
                      <img src={getAvatar(developer)} alt={getDisplayName(developer)} className="h-14 w-14 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-slate-900">{getDisplayName(developer)}</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            {getSpecialty(developer).split(" ")[0]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{getBatch(developer)} • {getDepartment(developer)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </aside>

              <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-sm shadow-emerald-100/40 flex flex-col h-[500px] md:h-[600px]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Community feed</h2>
                  <p className="text-sm text-slate-500">Realtime updates for the developer circle.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  {connected ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-slate-400" />}
                  {connected ? "Live" : "Waiting"}
                </div>
              </div>

              <div ref={feedRef} className="flex-1 overflow-y-auto px-5 py-5">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = isOwnMessage(message);
                    const canManage = canModerate || isOwn;
                    return (
                      <article key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[92%] rounded-[1.5rem] border px-4 py-3 shadow-sm sm:max-w-[78%] ${isOwn ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}>
                          <div className="flex items-start gap-3">
                            <img
                              src={getAvatar(message.sender)}
                              alt={message.sender ? getDisplayName(message.sender) : "User"}
                              className="h-10 w-10 rounded-2xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">{message.sender ? getDisplayName(message.sender) : "Member"}</p>
                                  <p className={`text-xs ${isOwn ? "text-emerald-100" : "text-slate-500"}`}>
                                    {fmtDateTime(message.timestamp) || fmtTime(message.timestamp)}
                                    {message.edited ? " • edited" : ""}
                                  </p>
                                </div>
                                {canManage && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => editMessage(message)}
                                      className={`rounded-full p-2 transition ${isOwn ? "bg-white/15 text-white hover:bg-white/20" : "bg-white text-emerald-700 hover:bg-emerald-50"}`}
                                      title="Edit"
                                    >
                                      <PencilLine className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteMessage(message)}
                                      className={`rounded-full p-2 transition ${isOwn ? "bg-white/15 text-white hover:bg-white/20" : "bg-white text-rose-600 hover:bg-rose-50"}`}
                                      title="Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{message.text || message.content}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {!messages.length && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                      The conversation is quiet. Start the first thread or ask a question.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-4">
                {isAuthorized ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder={canModerate ? "Share an opportunity, answer a doubt, or post an update..." : "Write your question, idea, or opportunity..."}
                      rows={3}
                      className="flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!messageText.trim() || !connected}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Login required to participate</p>
                      <p className="text-sm text-slate-500">Sign in to send messages and join the live discussion.</p>
                    </div>
                    <a href="/login" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                      Go to login <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </section>
          </div>


          {expandedDeveloper && (
            <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-100/40">
              {(() => {
                const developer = developers.find((item) => item.id === expandedDeveloper);
                if (!developer) return null;
                const githubLink = getLink(developer, ["github_url", "github", "githubLink"]);
                const linkedInLink = getLink(developer, ["linkedin_link", "linkedin", "linkedIn"]);
                const portfolioLink = getLink(developer, ["website_link", "portfolio_url", "website"]);

                return (
                  <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                    <div className="relative h-80 w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-700">
                      <img
                        src={getAvatar(developer)}
                        alt={getDisplayName(developer)}
                        className="h-full w-full object-cover opacity-90 transition duration-500 hover:scale-102 cursor-pointer"
                        onClick={() => openImageViewer(getAvatar(developer), getDisplayName(developer))}
                        title="Click to view profile photo"
                        onError={(event) => {
                          event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(developer))}&size=256&background=059669&color=fff`;
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold text-slate-900">{getDisplayName(developer)}</h3>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          {getSpecialty(developer)}
                        </span>
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                        {developer.bio || "This developer profile is synced from the members table."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {githubLink && (
                          <a href={githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                            <FaGithub /> GitHub
                          </a>
                        )}
                        {linkedInLink && (
                          <a href={linkedInLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white">
                            <FaLinkedinIn /> LinkedIn
                          </a>
                        )}
                        {portfolioLink && (
                          <a href={portfolioLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
                            <FontAwesomeIcon icon={faGlobe} /> Portfolio
                          </a>
                        )}
                        {developer.email && (
                          <a href={`mailto:${developer.email}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                            <FontAwesomeIcon icon={faEnvelope} /> Email
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-700 to-green-700 p-6 text-white shadow-lg shadow-emerald-200/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50">
                  <Users className="h-4 w-4" />
                  Need help with a build?
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90">
                  Ask in the community, tag the developers, and follow the discussion as it updates live.
                </p>
              </div>
              <a href="/developers" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">
                Meet the team <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </section>
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
