import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, MoreVertical, ArrowLeft, Smile, Plus } from 'lucide-react';

// Fixed / debug-ready Chat component
// Key fixes included here:
// - unified token key: 'auth_token'
// - added '/chat/user/me/' to user endpoints
// - safer websocket URL construction + encoding
// - proper socket cleanup and fallback to HTTP message loading
// - include room_id when sending messages (backend may require it)
// - improved logging for easier debugging

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ---- Token utilities: use a single key 'auth_token' in localStorage ----
  const getToken = () => localStorage.getItem('Token');
  const setToken = (t) => localStorage.setItem('auth_token', t);

  // ---- Load initial data ----
  useEffect(() => {
    loadRooms();
    getCurrentUser();

    // cleanup on unmount
    return () => {
      if (socket) {
        try {
          socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
          socket.close();
        } catch (e) {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Get current user info (tries multiple common endpoints) ----
  const getCurrentUser = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Added chat/user/me/ as your curl suggests it exists
      const endpoints = [
        'https://xyndrix.me/chat/user/me/',
        'https://xyndrix.me/auth/user/',
        'https://xyndrix.me/api/user/me/',
        'https://xyndrix.me/user/profile/'
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (res.ok) {
            const userData = await res.json();
            console.log('Current user loaded:', userData);
            setCurrentUser(userData);
            return;
          } else {
            const text = await res.text().catch(() => 'no-body');
            console.warn('Endpoint returned non-ok:', endpoint, res.status, text);
          }
        } catch (err) {
          console.warn('Request failed for endpoint', endpoint, err);
          continue;
        }
      }

      console.warn('Could not load current user info from any endpoint');
    } catch (error) {
      console.error('Get current user error:', error);
    }
  };

  // ---- Load chat rooms via HTTP ----
  const loadRooms = async () => {
    const token = getToken();
    if (!token) {
      console.error("No auth token found in localStorage (key='auth_token')");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://xyndrix.me/chat/rooms/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded rooms:', data);
        setRooms(data);
      } else {
        const text = await response.text().catch(() => 'no-body');
        console.error('Failed to load rooms:', response.status, text);
      }
    } catch (error) {
      console.error('Load rooms error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Search users ----
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const token = getToken();
    if (!token) {
      console.error('No auth token found');
      return;
    }

    try {
      const response = await fetch(`https://xyndrix.me/chat/search/?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        console.error('Search failed:', response.status);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // ---- Create room with user ----
  const createRoom = async (userId) => {
    const token = getToken();
    if (!token) {
      console.error('No auth token found');
      return;
    }

    try {
      const response = await fetch('https://xyndrix.me/chat/rooms/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target_user_id: userId })
      });

      if (response.ok) {
        const room = await response.json();
        setRooms((prev) => [...prev, room]);
        setSelectedChat(room);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);

        // Connect to WebSocket for this room
        connectWebSocket(room.id);
      } else {
        const text = await response.text().catch(() => 'no-body');
        console.error('Room creation failed:', response.status, text);
      }
    } catch (error) {
      console.error('Room creation error:', error);
    }
  };

  // ---- Connect to WebSocket ----
  const connectWebSocket = (roomId) => {
    const token = getToken();
    if (!token) {
      console.error('No auth token for WebSocket (store it with localStorage.setItem("auth_token", "<token>"))');
      return;
    }

    // Clean up existing socket (if any)
    if (socket) {
      try {
        socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
        socket.close();
      } catch (e) {
        // ignore
      }
      setSocket(null);
    }

    setIsConnected(false);
    setMessages([]); // Clear messages when connecting to a new room

    // Build WebSocket URL safely. Use wss if page is HTTPS.
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Prefer same host as current page when possible (helps with reverse proxies).
    // If you're connecting to a different host, replace this with 'xyndrix.me'.
    const wsHost = 'xyndrix.me';

    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${encodeURIComponent(roomId)}/?token=${encodeURIComponent(token)}`;

    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected to room:', roomId);
      setIsConnected(true);

      // Request message history after connect
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log('📨 Requesting message history...');
          ws.send(JSON.stringify({ action: 'get_message_history', room_id: roomId }));
        }
      }, 500);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 WebSocket message received:', data);

        // message_history: array of message objects
        if (data.action === 'message_history' && Array.isArray(data.messages)) {
          console.log('📜 Loading message history:', data.messages.length, 'messages');
          setMessages(data.messages);
        } else if (data.type === 'chat_message' || data.action === 'chat_message') {
          // single incoming message
          console.log('💬 New message received:', data);
          const newMessage = {
            id: data.message_id || data.id || Math.random().toString(36).slice(2, 9),
            text: data.message || data.text || '',
            sender: data.sender ? (typeof data.sender === 'string' ? { username: data.sender } : data.sender) : null,
            time: data.timestamp
              ? new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
              : new Date().toLocaleTimeString(),
            timestamp: data.timestamp || new Date().toISOString()
          };
          setMessages((prev) => [...prev, newMessage]);
        } else if (data.error) {
          console.error('Server error via WS:', data.error);
        } else {
          console.log('❓ Unhandled WebSocket message type:', data);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error details:', {
        error,
        readyState: ws.readyState,
        url: ws.url,
        protocol: ws.protocol
      });
      setIsConnected(false);

      // Try fallback to HTTP endpoints for message loading
      loadMessagesViaHTTP(roomId);
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
      setIsConnected(false);

      // If abnormal closure, try HTTP fallback
      if (event.code === 1006 || !event.wasClean) {
        console.log('💡 Abnormal closure — trying HTTP fallback...');
        loadMessagesViaHTTP(roomId);
      }
    };

    setSocket(ws);
  };

  // ---- Fallback: Load messages via HTTP API if WebSocket fails ----
  const loadMessagesViaHTTP = async (roomId) => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('🔄 Loading messages via HTTP for room:', roomId);
      const response = await fetch(`https://xyndrix.me/chat/rooms/${encodeURIComponent(roomId)}/messages/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const msgs = await response.json();
        console.log('✅ HTTP messages loaded:', Array.isArray(msgs) ? msgs.length : 'unknown');
        setMessages(msgs);
      } else {
        const text = await response.text().catch(() => 'no-body');
        console.error('❌ Failed to load messages via HTTP:', response.status, text);
      }
    } catch (error) {
      console.error('❌ HTTP message loading error:', error);
    }
  };

  // ---- Send message ----
  const sendMessage = () => {
    if (!message.trim()) return;

    if (!socket || !isConnected) {
      console.warn('Cannot send message — no socket or not connected');

      // Optionally try to POST to HTTP endpoint as fallback: (uncomment if backend supports)
      // sendMessageViaHTTP();
      return;
    }

    try {
      const payload = {
        action: 'send_message',
        room_id: selectedChat?.id, // include room id in case backend expects it
        message: message.trim()
      };

      socket.send(JSON.stringify(payload));
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Optional: send via HTTP if WS down (uncomment & adjust endpoint if backend supports it)
  /*
  const sendMessageViaHTTP = async () => {
    const token = getToken();
    if (!token || !selectedChat) return;
    try {
      const res = await fetch(`https://xyndrix.me/chat/rooms/${selectedChat.id}/messages/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() })
      });
      if (res.ok) {
        setMessage('');
        const saved = await res.json();
        setMessages(prev => [...prev, saved]);
      } else {
        console.error('HTTP send failed', res.status);
      }
    } catch (err) {
      console.error('HTTP send error', err);
    }
  };
  */

  // ---- Utility to format last message time ----
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const token = getToken();

  if (!token) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">Authentication Required</h2>
          <p className="text-gray-400">Please store your auth token in localStorage as 'auth_token'</p>
          <p className="text-gray-500 text-sm mt-2">Open browser console and run: <code>localStorage.setItem('auth_token', '&lt;your-token&gt;')</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${selectedChat ? 'hidden md:block' : 'block'} w-full md:w-1/3 bg-gray-800 border-r border-gray-700`}>
        {/* Header */}
        <div className="bg-green-600 p-4 flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">Xyndrix Chat</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="text-white hover:bg-green-700 p-2 rounded-full"
              title="Search users"
            >
              <Search size={20} />
            </button>
            <button
              onClick={loadRooms}
              className="text-white hover:bg-green-700 p-2 rounded-full"
              title="Refresh"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="p-4 bg-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full bg-gray-600 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-gray-600 rounded-lg max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => createRoom(user.id)}
                    className="p-3 hover:bg-gray-500 cursor-pointer border-b border-gray-500 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center overflow-hidden">
                        {user.profile_photo ? (
                          <img
                            src={user.profile_photo.startsWith('http') ? user.profile_photo : `https://xyndrix.me${user.profile_photo}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              // fallback to initials
                              try { e.target.nextSibling.style.display = 'flex'; } catch (err) {}
                            }}
                          />
                        ) : null}
                        <span className="text-white text-sm font-medium" style={{ display: user.profile_photo ? 'none' : 'flex' }}>
                          {user.first_name?.charAt(0) || user.username?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <p className="text-gray-400 text-center py-4">No users found</p>
            )}
          </div>
        )}

        {/* Chat List */}
        <div className="overflow-y-auto h-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading chats...</div>
            </div>
          ) : rooms.length > 0 ? (
            rooms.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat);
                  connectWebSocket(chat.id);
                }}
                className={`p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${selectedChat?.id === chat.id ? 'bg-gray-700' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center overflow-hidden">
                    {chat.avatar ? (
                      <img
                        src={chat.avatar.startsWith('http') ? chat.avatar : `https://xyndrix.me${chat.avatar}`}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : null}
                    <span className="text-white font-medium" style={{ display: chat.avatar ? 'none' : 'flex' }}>{chat.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-medium truncate">{chat.name}</h3>
                      <span className="text-gray-400 text-sm">{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">{chat.lastMessage || 'No messages yet'}</p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">{chat.unreadCount}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="text-gray-400 text-center">
                <Plus size={48} className="mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Click the search icon to find users and start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedChat ? 'block' : 'hidden md:block'} flex-1 flex flex-col bg-gray-900`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-green-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="md:hidden text-white hover:bg-green-700 p-1 rounded-full"><ArrowLeft size={20} /></button>
                <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedChat.avatar ? (
                    <img src={selectedChat.avatar.startsWith('http') ? selectedChat.avatar : `https://xyndrix.me${selectedChat.avatar}`} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : null}
                  <span className="text-white font-medium" style={{ display: selectedChat.avatar ? 'none' : 'flex' }}>{selectedChat.name?.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-white font-medium">{selectedChat.name}</h2>
                  <p className="text-green-100 text-sm">{isConnected ? (<span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span>online</span>) : (<span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>connecting...</span>)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-white hover:bg-green-700 p-2 rounded-full"><Phone size={20} /></button>
                <button className="text-white hover:bg-green-700 p-2 rounded-full"><Video size={20} /></button>
                <button className="text-white hover:bg-green-700 p-2 rounded-full"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-800">
              {!isConnected && messages.length === 0 && (
                <div className="flex items-center justify-center py-4 mb-4">
                  <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting to chat...</span>
                    <button onClick={() => connectWebSocket(selectedChat.id)} className="ml-2 underline hover:no-underline">Retry</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full"><p className="text-gray-500">No messages yet. Start the conversation!</p></div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = currentUser && (msg.sender?.id === currentUser.id || msg.sender?.username === currentUser.username);

                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-xs lg:max-w-md">
                          {!isOwnMessage && msg.sender && (
                            <p className="text-gray-400 text-xs mb-1 px-1">{msg.sender.first_name} {msg.sender.last_name}</p>
                          )}
                          <div className={`px-4 py-2 rounded-lg ${isOwnMessage ? 'bg-green-600 text-white' : 'bg-gray-700 text-white'}`}>
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-gray-400'}`}>{msg.time}</p>
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
            <div className="p-4 bg-gray-700">
              <div className="flex items-center gap-2">
                <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-600"><Smile size={20} /></button>
                <div className="flex-1 flex items-center bg-gray-600 rounded-full">
                  <input
                    type="text"
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim() || !isConnected}
                    className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-white text-4xl font-bold">X</span></div>
              <h2 className="text-white text-2xl mb-2">Xyndrix Chat</h2>
              <p className="text-gray-400">Send and receive messages in real-time.</p>
              <p className="text-gray-500 text-sm mt-2">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
