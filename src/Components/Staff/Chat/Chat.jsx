import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Smile,
  Plus,
  Users,
  MessageSquare,
  Trash2,
  Globe,
  Shield,
  Eye,
  AlertTriangle,
} from "lucide-react";

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [communityRoom, setCommunityRoom] = useState(null);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [showAgreement, setShowAgreement] = useState(() => {
    return !localStorage.getItem("chat_agreement_accepted");
  });
  const messagesEndRef = useRef(null);

  const handleAcceptAgreement = () => {
    localStorage.setItem("chat_agreement_accepted", "true");
    setShowAgreement(false);
  };

  const handleDeclineAgreement = () => {
    window.history.back();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Token utilities: use a single key 'auth_token' in localStorage
  const getToken = () => localStorage.getItem("Token");
  const setToken = (t) => localStorage.setItem("auth_token", t);

  // Load initial data
  useEffect(() => {
    loadRooms();
    getCurrentUser();
    loadCommunityChat(); // Load community chat

    return () => {
      if (socket) {
        try {
          socket.onopen =
            socket.onmessage =
            socket.onerror =
            socket.onclose =
            null;
          socket.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Get current user info
  const getCurrentUser = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const endpoints = [
        "https://api.karpagamalumni.in/chat/user/me/",
        "https://api.karpagamalumni.in/auth/user/",
        "https://api.karpagamalumni.in/api/v1/user/me/",
        "https://api.karpagamalumni.in/user/profile/",
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const userData = await res.json();
            setCurrentUser(userData);
            return;
          }
        } catch (err) {
          continue;
        }
      }
    } catch (error) {
    }
  };

  // Load chat rooms via HTTP
  const loadRooms = async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://api.karpagamalumni.in/chat/rooms/", {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        const text = await response.text().catch(() => "no-body");
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `https://api.karpagamalumni.in/chat/search/?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
      }
    } catch (error) {
    }
  };

  // Create room with user
  const createRoom = async (userId) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch("https://api.karpagamalumni.in/chat/rooms/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_user_id: userId }),
      });

      if (response.ok) {
        const room = await response.json();
        setRooms((prev) => [...prev, room]);
        setSelectedChat(room);
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
        connectWebSocket(room.id);
      }
    } catch (error) {
    }
  };

  // Connect to WebSocket
  const connectWebSocket = (roomId) => {
    const token = getToken();
    if (!token) return;

    if (socket) {
      try {
        socket.onopen =
          socket.onmessage =
          socket.onerror =
          socket.onclose =
          null;
        socket.close();
      } catch (e) { }
      setSocket(null);
    }

    setIsConnected(false);
    setMessages([]);

    const wsProtocol = "wss:";
    const wsHost = "api.karpagamalumni.in";
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${encodeURIComponent(
      roomId
    )}/?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({ action: "get_message_history", room_id: roomId })
          );
        }
      }, 500);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "message_history" && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else if (
          data.type === "chat_message" ||
          data.action === "chat_message"
        ) {
          const newMessage = {
            id:
              data.message_id ||
              data.id ||
              Math.random().toString(36).slice(2, 9),
            text: data.message || data.text || "",
            sender: data.sender
              ? typeof data.sender === "string"
                ? { username: data.sender }
                : data.sender
              : null,
            time: data.timestamp
              ? new Date(data.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
              : new Date().toLocaleTimeString(),
            timestamp: data.timestamp || new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      } catch (error) {
      }
    };

    ws.onerror = (error) => {
      setIsConnected(false);
      loadMessagesViaHTTP(roomId);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      if (event.code === 1006 || !event.wasClean) {
        loadMessagesViaHTTP(roomId);
      }
    };

    setSocket(ws);
  };

  // Create community chat
  const createCommunityChat = async () => {
    const token = getToken();
    if (!token) return null;

    setLoadingCommunity(true);
    try {
      const response = await fetch("https://api.karpagamalumni.in/chat/community/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Community Room",
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add community identifier
        const communityRoom = {
          ...data,
          is_community: true,
          name: "Community Chat",
        };

        setCommunityRoom(communityRoom);
        return communityRoom;
      } else {
        const err = await response.json().catch(() => ({}));
        return null;
      }
    } catch (error) {
      return null;
    } finally {
      setLoadingCommunity(false);
    }
  };

  // Load community chat
  const loadCommunityChat = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch("https://api.karpagamalumni.in/chat/community/", {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          const communityRoom = {
            ...data,
            is_community: true,
            name: "Community Chat",
          };
          setCommunityRoom(communityRoom);
        } else {
          // If no community exists, create one
          await createCommunityChat();
        }
      } else {
        await createCommunityChat();
      }
    } catch (error) {
      await createCommunityChat();
    }
  };

  // Sort rooms to put community first
  const getSortedRooms = () => {
    const allRooms = [...rooms];

    if (communityRoom) {
      // Remove any existing community room from the list (in case of duplicates)
      const filteredRooms = allRooms.filter((room) => !room.is_community);
      // Put community room first
      return [communityRoom, ...filteredRooms];
    }

    return allRooms;
  };

  // Delete room
  const deleteRoom = async (roomId) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `https://api.karpagamalumni.in/chat/rooms/?room_id=${encodeURIComponent(roomId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Remove room from state
        setRooms((prev) => prev.filter((room) => room.id !== roomId));

        // If deleted room was selected, clear selection
        if (selectedChat?.id === roomId) {
          setSelectedChat(null);
          if (socket) {
            try {
              socket.onopen =
                socket.onmessage =
                socket.onerror =
                socket.onclose =
                null;
              socket.close();
            } catch (e) { }
            setSocket(null);
          }
          setMessages([]);
          setIsConnected(false);
        }

        setShowDeleteModal(false);
        setRoomToDelete(null);
      } else {
        const text = await response.text().catch(() => "no-body");
      }
    } catch (error) {
    }
  };

  const handleDeleteClick = (room, e) => {
    e.stopPropagation(); // Prevent selecting the chat
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  // Fallback: Load messages via HTTP
  const loadMessagesViaHTTP = async (roomId) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `https://api.karpagamalumni.in/chat/rooms/${encodeURIComponent(roomId)}/messages/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const msgs = await response.json();
        setMessages(msgs);
      }
    } catch (error) {
    }
  };

  // Send message
  const sendMessage = () => {
    if (!message.trim()) return;

    if (!socket || !isConnected) {
      return;
    }

    try {
      const payload = {
        action: "send_message",
        room_id: selectedChat?.id,
        message: message.trim(),
      };

      socket.send(JSON.stringify(payload));
      setMessage("");
    } catch (error) {
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "";
    }
  };

  const token = getToken();

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please store your auth token in localStorage as 'auth_token'
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <code className="text-sm text-gray-700">
                localStorage.setItem('auth_token', '&lt;your-token&gt;')
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-[calc(100vh-56px-56px)] lg:h-[calc(100vh-56px)]">
      {/* ── Agreement modal ── */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="chat-agree-title"
            className="bg-white w-full sm:max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 id="chat-agree-title" className="text-base font-bold text-gray-900">Chat Usage Agreement</h2>
              <p className="text-gray-400 text-sm mt-0.5">Please read before continuing</p>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                <Eye className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Messages Are Monitored</p>
                  <p className="text-emerald-700 text-xs mt-1">All messages are monitored by Administrators for safety and compliance.</p>
                </div>
              </div>
              
              {/* ── Updated Disclaimer Section ── */}
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Data Disclaimer</p>
                  <p className="text-red-700 text-xs mt-1">
                    In case any issues arise during the use of the portal’s chat feature, we are not responsible for your data, content, or any consequences arising from the use of this chat service.
                  </p>
                </div>
              </div>

              {/* ── Updated Bullet Points ── */}
              <ul className="text-xs text-gray-500 space-y-1.5 px-1 mt-2">
                {[
                  "Your messages may be reviewed by administrators",
                  "You are responsible for the content you share",
                  "We are not liable for data, content, or chat-related consequences",
                  "Use the chat responsibly and respectfully"
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={handleDeclineAgreement} className="px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-semibold">
                Decline
              </button>
              <button onClick={handleAcceptAgreement} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-semibold shadow-sm">
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Instagram DM layout ── */}
      <div className="flex h-full max-w-5xl mx-auto border-x border-gray-200 bg-white">

        {/* ── Left panel: conversation list ── */}
        <div className={`${selectedChat ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 border-r border-gray-200`}>
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-base font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${showSearch ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              title="Find users"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          {showSearch && (
            <div className="px-4 py-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search people…"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
                  className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} onClick={() => createRoom(user.id)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.profile_photo ? (
                          <img src={user.profile_photo.startsWith("http") ? user.profile_photo : `https://api.karpagamalumni.in${user.profile_photo}`} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-bold">{user.first_name?.charAt(0) || user.username?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-3">No users found</p>
              )}
            </div>
          )}

          {/* Room list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : getSortedRooms().length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-300 text-xs mt-1">Tap + to start one</p>
              </div>
            ) : (
              getSortedRooms().map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => { setSelectedChat(chat); connectWebSocket(chat.id); }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition group relative ${selectedChat?.id === chat.id ? "bg-emerald-50" : ""}`}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${chat.is_community ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-emerald-500"}`}>
                    {chat.is_community ? <Globe className="w-6 h-6 text-white" /> :
                      chat.avatar ? <img src={chat.avatar.startsWith("http") ? chat.avatar : `https://api.karpagamalumni.in${chat.avatar}`} alt={chat.name} className="w-12 h-12 object-cover" /> :
                      <span className="text-white font-bold">{chat.name?.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm font-semibold truncate ${chat.is_community ? "text-indigo-800" : "text-gray-900"}`}>{chat.name}</p>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {chat.is_community ? "Community · All members" : chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  {!chat.is_community && (
                    <button onClick={(e) => handleDeleteClick(chat, e)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 transition flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{chat.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right panel: chat window ── */}
        <div className={`${selectedChat ? "flex" : "hidden lg:flex"} flex-1 flex-col`}>
          {selectedChat ? (
            <>
              {/* Chat top bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                <button onClick={() => setSelectedChat(null)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${selectedChat.is_community ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-emerald-500"}`}>
                  {selectedChat.is_community ? <Globe className="w-4 h-4 text-white" /> :
                    selectedChat.avatar ? <img src={selectedChat.avatar.startsWith("http") ? selectedChat.avatar : `https://api.karpagamalumni.in${selectedChat.avatar}`} alt={selectedChat.name} className="w-9 h-9 object-cover" /> :
                    <span className="text-white text-sm font-bold">{selectedChat.name?.charAt(0)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selectedChat.is_community ? "text-indigo-800" : "text-gray-900"}`}>{selectedChat.name}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-yellow-400 animate-pulse"}`} />
                    <p className="text-xs text-gray-400">{isConnected ? "Connected" : "Connecting…"}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-3">
                {!isConnected && messages.length === 0 && (
                  <div className="flex justify-center">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
                      <div className="w-3.5 h-3.5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                      Connecting…
                      <button onClick={() => connectWebSocket(selectedChat.id)} className="underline text-yellow-800 font-medium">Retry</button>
                    </div>
                  </div>
                )}
                {messages.length === 0 && isConnected && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">{selectedChat.is_community ? "Be first to say hello!" : "Start the conversation!"}</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isOwn = currentUser && (msg.sender?.id === currentUser.id || msg.sender?.username === currentUser.username);
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[70%]">
                        {!isOwn && msg.sender && (
                          <p className="text-xs text-gray-400 mb-1 px-1">{msg.sender.first_name} {msg.sender.last_name}</p>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isOwn
                          ? selectedChat.is_community ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-emerald-600 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm"}`}>
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-white/60" : "text-gray-400"}`}>{msg.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
                  <input
                    type="text"
                    placeholder={selectedChat.is_community ? "Message the community…" : "Message…"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim() || !isConnected}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition disabled:opacity-40 ${selectedChat.is_community ? "text-indigo-600 hover:bg-indigo-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Your messages</h2>
                <p className="text-sm text-gray-400 mt-1">Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Chat</h3>
                <p className="text-xs text-gray-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">Delete your chat with <span className="font-semibold">{roomToDelete?.name}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setRoomToDelete(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => deleteRoom(roomToDelete?.id)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
