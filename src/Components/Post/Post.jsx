import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faComment,
  faShare,
  faEllipsisH,
  faTrash,
  faCheckCircle,
  faUserCircle,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import Addpost from "./Addpost";

// Dummy data for posts with comments
const initialPosts = [
  {
    id: 1,
    username: "john_doe",
    avatar: null,
    verified: true,
    timestamp: "2 hours ago",
    content: "Just launched our new product! Check it out on our website.",
    image: "https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    likes: 124,
    comments: 43,
    shares: 12,
    commentsList: [
      { id: 101, username: "tech_fan", avatar: null, content: "That's awesome! Can't wait to try it out.", timestamp: "1 hour ago" },
      { id: 102, username: "curious_user", avatar: null, content: "What features does it have?", timestamp: "30 minutes ago" }
    ]
  },
  {
    id: 2,
    username: "jane_smith",
    avatar: null,
    verified: false,
    timestamp: "Yesterday",
    content: "Beautiful sunset at the beach today! 🌅 #nature #peace",
    image: "https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    likes: 287,
    comments: 56,
    shares: 24,
    commentsList: [
      { id: 201, username: "nature_lover", avatar: null, content: "Wow! What beach is this?", timestamp: "20 hours ago" },
      { id: 202, username: "photographer", avatar: null, content: "Great composition! What camera did you use?", timestamp: "18 hours ago" }
    ]
  },
  {
    id: 3,
    username: "tech_enthusiast",
    avatar: null,
    verified: true,
    timestamp: "3 days ago",
    content: "Just got the new iPhone! The camera quality is absolutely amazing. What do you think of the latest models?",
    image: "https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    likes: 432,
    comments: 89,
    shares: 32,
    commentsList: [
      { id: 301, username: "apple_fan", avatar: null, content: "The battery life is incredible too!", timestamp: "2 days ago" },
      { id: 302, username: "tech_reviewer", avatar: null, content: "The A15 chip performance is game-changing.", timestamp: "1 day ago" }
    ]
  },
  {
    id: 4,
    username: "fitness_guru",
    avatar: null,
    verified: false,
    timestamp: "1 week ago",
    content: "Completed my first marathon today! It was tough but so worth it. Remember: consistency is key to achieving your fitness goals!",
    image: "https://picsum.photos/600/400?random=${Math.floor(Math.random() * 10000)}",
    likes: 876,
    comments: 145,
    shares: 67,
    commentsList: [
      { id: 401, username: "runner_101", avatar: null, content: "Congrats! What was your time?", timestamp: "6 days ago" },
      { id: 402, username: "fitness_newbie", avatar: null, content: "So inspiring! I'm training for my first 5K.", timestamp: "5 days ago" }
    ]
  },
];

const AdminFeed = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeComments, setActiveComments] = useState(null);
  const [newComments, setNewComments] = useState({});

  // Handle delete click
  const handleDeleteClick = (postId) => {
    if (deleteConfirm === postId) {
      // Confirm delete
      setPosts(posts.filter(post => post.id !== postId));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(postId);
      
      setTimeout(() => {
        setDeleteConfirm(null);
      }, 3000);
    }
  };

  // Toggle menu visibility
  const toggleMenu = (postId) => {
    setActiveMenu(activeMenu === postId ? null : postId);
  };

  // Toggle comments section
  const toggleComments = (postId) => {
    setActiveComments(activeComments === postId ? null : postId);
  };

  // Handle new comment input change
  const handleCommentChange = (postId, value) => {
    setNewComments({
      ...newComments,
      [postId]: value
    });
  };

  // Add new comment
  const addComment = (postId) => {
    if (!newComments[postId] || newComments[postId].trim() === '') return;
    
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: Math.floor(Math.random() * 10000),
          username: "current_user", // This would normally be the logged-in user
          avatar: null,
          content: newComments[postId],
          timestamp: "Just now"
        };
        
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [newComment, ...post.commentsList]
        };
      }
      return post;
    });
    
    setPosts(updatedPosts);
    setNewComments({
      ...newComments,
      [postId]: ''
    });
  };

  return (
    <>
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6 flex items-center justify-center">
          <FontAwesomeIcon icon={faUserCircle} className="mr-2 text-green-600 text-2xl" />
          <h2 className="text-3xl font-bold text-green-700 text-center">User Posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 text-lg">No posts available</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {post.avatar ? (
                    <img
                      src={post.avatar}
                      alt={`${post.username}'s avatar`}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUserCircle} className="w-10 h-10 text-gray-400" />
                  )}
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{post.username}</span>
                      {post.verified && (
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="ml-1 text-blue-500 text-sm"
                        />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{post.timestamp}</span>
                  </div>
                </div>

                {/* Three dots menu */}
                <div className="relative">
                  <button
                    onClick={() => toggleMenu(post.id)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <FontAwesomeIcon icon={faEllipsisH} className="text-gray-600" />
                  </button>

                  {activeMenu === post.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10">
                      <button
                        onClick={() => handleDeleteClick(post.id)}
                        className="w-full text-left p-3 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        {deleteConfirm === post.id ? "Confirm Delete" : "Delete Post"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 py-2">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Image (if available) */}
              {post.image && (
                <div className="mt-2">
                  <img
                    src={post.image}
                    alt="Post content"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Post Stats */}
              <div className="px-4 py-2 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="font-semibold">{post.likes} likes</span>
                  <div>
                    <span className="mr-3 font-semibold">{post.comments} comments</span>
                    <span className="font-semibold">{post.shares} shares</span>
                  </div>
                </div>
              </div>

              {/* Post Actions */}
              <div className="flex border-t border-gray-200">
                <button className="flex-1 py-2 text-center text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center">
                  <FontAwesomeIcon icon={faHeart} className="mr-2" />
                  Like
                </button>
                <button 
                  className="flex-1 py-2 text-center text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  onClick={() => toggleComments(post.id)}
                >
                  <FontAwesomeIcon icon={faComment} className="mr-2" />
                  Comment
                </button>
                <button className="flex-1 py-2 text-center text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center">
                  <FontAwesomeIcon icon={faShare} className="mr-2" />
                  Share
                </button>
              </div>

              {/* Comments Section - with animation */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeComments === post.id ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="border-t border-gray-200 p-4">
                  {/* Add comment form */}
                  <div className="flex items-center mb-4">
                    <FontAwesomeIcon icon={faUserCircle} className="w-8 h-8 text-gray-400 mr-2" />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        className="w-full border border-gray-200 rounded-full py-2 px-4 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newComments[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                      />
                      <button 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
                        onClick={() => addComment(post.id)}
                      >
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </button>
                    </div>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {post.commentsList.map(comment => (
                      <div key={comment.id} className="flex">
                        {comment.avatar ? (
                          <img
                            src={comment.avatar}
                            alt={`${comment.username}'s avatar`}
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUserCircle} className="w-8 h-8 text-gray-400 mr-2" />
                        )}
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-lg p-3">
                            <p className="font-medium text-sm">{comment.username}</p>
                            <p className="text-gray-800 text-sm">{comment.content}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 ml-2">
                            {comment.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default AdminFeed;
