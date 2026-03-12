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
        "https://api.karpagamalumni.in/api/user/me/",
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
            console.log("Current user loaded:", userData);
            setCurrentUser(userData);
            return;
          }
        } catch (err) {
          continue;
        }
      }
    } catch (error) {
      console.error("Get current user error:", error);
    }
  };

  // Load chat rooms via HTTP
  const loadRooms = async () => {
    const token = getToken();
    if (!token) {
      console.error("No auth token found in localStorage");
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
        console.log("Loaded rooms:", data);
        setRooms(data);
      } else {
        const text = await response.text().catch(() => "no-body");
        console.error("Failed to load rooms:", response.status, text);
      }
    } catch (error) {
      console.error("Load rooms error:", error);
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
        console.error("Search failed:", response.status);
      }
    } catch (error) {
      console.error("Search error:", error);
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
      console.error("Room creation error:", error);
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
      console.log("WebSocket connected to room:", roomId);
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
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
      loadMessagesViaHTTP(roomId);
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected");
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
        console.log("✅ Community chat created:", data);

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
        console.error("❌ Failed to create community chat:", err);
        return null;
      }
    } catch (error) {
      console.error("❌ Error creating community chat:", error);
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
        console.log("No community chat found, creating one...");
        await createCommunityChat();
      }
    } catch (error) {
      console.error("Error loading community chat:", error);
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
        console.log("Room deleted successfully");
      } else {
        const text = await response.text().catch(() => "no-body");
        console.error("Failed to delete room:", response.status, text);
      }
    } catch (error) {
      console.error("Delete room error:", error);
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
      console.error("HTTP message loading error:", error);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!message.trim()) return;

    if (!socket || !isConnected) {
      console.warn("Cannot send message — no socket or not connected");
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
      console.error("Error sending message:", error);
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
    <div className="min-h-screen bg-gray-50">
      {/* Chat Monitoring Agreement Modal */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in">
            {/* Modal Header */}
            <div className="bg-green-600 px-6 py-5">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white">Chat Usage Agreement</h2>
                <p className="text-green-100 text-sm mt-1">Please read before proceeding</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Monitoring Notice */}
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <Eye className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-800 text-sm">Messages Are Monitored</h3>
                  <p className="text-green-700 text-sm mt-1">
                    All messages sent through this chat feature are monitored by the Administrators of this panel for safety and compliance purposes.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 text-sm">Data Disclaimer</h3>
                  <p className="text-red-700 text-sm mt-1">
                    In case any issues arise on behalf of this panel's chat feature, this organisation shall not be held responsible for your data,
                    content shared, or any consequences arising from the use of this chat service.
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  By clicking <strong>"I Agree & Continue"</strong>, you acknowledge that:
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Your messages may be reviewed by panel administrators
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    You are responsible for the content you share
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    The organisation is not liable for any data-related issues
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    You agree to use the chat responsibly and respectfully
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={handleDeclineAgreement}
                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
              >
                Decline & Go Back
              </button>
              <button
                onClick={handleAcceptAgreement}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm shadow-sm"
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Alumni Connect
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Connect and communicate with your network
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Search className="w-4 h-4" />
                <span>Find Users</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
          {/* Sidebar - Chat List */}
          <div
            className={`${selectedChat ? "hidden lg:block" : "block"
              } lg:w-80 bg-white rounded-lg shadow-sm h-full flex flex-col`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Messages</h2>
              </div>

              {/* Search */}
              {showSearch && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => createRoom(user.id)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center overflow-hidden">
                              {user.profile_photo ? (
                                <img
                                  src={
                                    user.profile_photo.startsWith("http")
                                      ? user.profile_photo
                                      : `https://api.karpagamalumni.in${user.profile_photo}`
                                  }
                                  alt={user.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-sm font-medium">
                                  {user.first_name?.charAt(0) ||
                                    user.username?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-800 font-medium text-sm">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      No users found
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : getSortedRooms().length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {getSortedRooms().map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setSelectedChat(chat);
                        connectWebSocket(chat.id);
                      }}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition relative group ${selectedChat?.id === chat.id
                        ? "bg-green-50 border-r-2 border-green-500"
                        : ""
                        } ${chat.is_community
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                          : ""
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${chat.is_community
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                            : "bg-green-600"
                            }`}
                        >
                          {chat.is_community ? (
                            <Globe className="w-6 h-6 text-white" />
                          ) : chat.avatar ? (
                            <img
                              src={
                                chat.avatar.startsWith("http")
                                  ? chat.avatar
                                  : `https://api.karpagamalumni.in${chat.avatar}`
                              }
                              alt={chat.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-medium">
                              {chat.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`font-medium truncate ${chat.is_community
                                  ? "text-blue-800"
                                  : "text-gray-800"
                                  }`}
                              >
                                {chat.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-xs">
                                {formatTime(chat.lastMessageTime)}
                              </span>
                              {!chat.is_community && (
                                <button
                                  onClick={(e) => handleDeleteClick(chat, e)}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded transition-all duration-200"
                                  title="Delete chat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm truncate">
                            {chat.is_community
                              ? "Connect with the entire community"
                              : chat.lastMessage || "No messages yet"}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <div
                            className={`text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${chat.is_community ? "bg-blue-500" : "bg-green-500"
                              }`}
                          >
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No conversations yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2 text-center">
                    Click "Find Users" to start a new conversation or join the
                    Community
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`${selectedChat ? "block" : "hidden lg:block"
              } flex-1 bg-white rounded-lg shadow-sm flex flex-col h-full`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div
                  className={`p-4 border-b border-gray-200 flex items-center justify-between ${selectedChat.is_community
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                    : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${selectedChat.is_community
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                        : "bg-green-600"
                        }`}
                    >
                      {selectedChat.is_community ? (
                        <Globe className="w-5 h-5 text-white" />
                      ) : selectedChat.avatar ? (
                        <img
                          src={
                            selectedChat.avatar.startsWith("http")
                              ? selectedChat.avatar
                              : `https://api.karpagamalumni.in${selectedChat.avatar}`
                          }
                          alt={selectedChat.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium">
                          {selectedChat.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2
                          className={`font-semibold ${selectedChat.is_community
                            ? "text-blue-800"
                            : "text-gray-800"
                            }`}
                        >
                          {selectedChat.name}
                        </h2>
                        {selectedChat.is_community && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Community
                          </span>
                        )}
                      </div>
                      {/* <p className="text-sm text-gray-500">
                        {isConnected ? (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {selectedChat.is_community
                              ? "Community Online"
                              : "Connected"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                            Connecting...
                          </span>
                        )}
                      </p> */}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {selectedChat.is_community && messages.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Globe className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">
                          Welcome to Community Chat!
                        </h3>
                        <p className="text-gray-600">
                          Connect with all alumni members in this shared space.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isConnected && messages.length === 0 && (
                    <div className="flex items-center justify-center py-4 mb-4">
                      <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting to chat...</span>
                        <button
                          onClick={() => connectWebSocket(selectedChat.id)}
                          className="ml-2 underline hover:no-underline"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {messages.length === 0 && isConnected ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                          {selectedChat.is_community
                            ? "No messages yet. Be the first to say hello to the community!"
                            : "No messages yet. Start the conversation!"}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwnMessage =
                          currentUser &&
                          (msg.sender?.id === currentUser.id ||
                            msg.sender?.username === currentUser.username);

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                          >
                            <div className="max-w-xs lg:max-w-md">
                              {!isOwnMessage && msg.sender && (
                                <p className="text-gray-500 text-xs mb-1 px-1">
                                  {msg.sender.first_name} {msg.sender.last_name}
                                  {selectedChat.is_community && (
                                    <span className="ml-1 text-blue-500">
                                      • Community
                                    </span>
                                  )}
                                </p>
                              )}
                              <div
                                className={`px-4 py-2 rounded-lg shadow-sm ${isOwnMessage
                                  ? selectedChat.is_community
                                    ? "bg-blue-600 text-white"
                                    : "bg-green-600 text-white"
                                  : "bg-white text-gray-800 border border-gray-200"
                                  }`}
                              >
                                <p>{msg.text}</p>
                                <p
                                  className={`text-xs mt-1 ${isOwnMessage
                                    ? selectedChat.is_community
                                      ? "text-blue-100"
                                      : "text-green-100"
                                    : "text-gray-500"
                                    }`}
                                >
                                  {msg.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-gray-100 rounded-lg">
                      <input
                        type="text"
                        placeholder={
                          selectedChat.is_community
                            ? "Message the community..."
                            : "Type a message..."
                        }
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1 bg-transparent text-gray-800 px-4 py-3 focus:outline-none"
                        disabled={!isConnected}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!message.trim() || !isConnected}
                        className={`p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed mr-1 ${selectedChat.is_community
                          ? "text-blue-600 hover:text-blue-700"
                          : "text-green-600 hover:text-green-700"
                          }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Alumni Connect
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Send and receive messages in real-time.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Chat
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your chat with{" "}
              <span className="font-medium">{roomToDelete?.name}</span>? All
              messages will be permanently removed.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRoomToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRoom(roomToDelete?.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
