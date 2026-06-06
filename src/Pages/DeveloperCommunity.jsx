                          {selectedPost.author.first_name}{" "}
                          {selectedPost.author.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedPost.author.department} •{" "}
                          {new Date(selectedPost.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap mb-4">
                      {selectedPost.content}
                    </p>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikePost(selectedPost.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                          selectedPost.has_liked
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span>{selectedPost.like_count}</span>
                      </button>
                    </div>
                  </div>

                  {/* Replies */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Replies ({selectedPost.reply_count})
                    </h3>

                    {/* Reply Form */}
                    {!selectedPost.is_locked && (
                      <form onSubmit={handleCreateReply} className="mb-6">
                        <textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="Write your reply..."
                          rows="3"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                          Post Reply
                        </button>
                      </form>
                    )}

                    {selectedPost.is_locked && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
                        <FontAwesomeIcon icon={faLock} className="mr-2" />
                        This post is locked and cannot accept new replies
                      </div>
                    )}

                    {/* Replies List */}
                    <div className="space-y-4">
                      {selectedPost.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-lg ${
                            reply.is_solution
                              ? "bg-green-50 border-2 border-green-500"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  reply.author.profile_photo ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    reply.author.first_name
                                  )}&size=40&background=10b981&color=fff`
                                }
                                alt={reply.author.first_name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {reply.author.salutation}{" "}
                                  {reply.author.first_name}{" "}
                                  {reply.author.last_name}
                                  {reply.is_solution && (
                                    <FontAwesomeIcon
                                      icon={faCheckCircle}
                                      className="ml-2 text-green-600"
                                      title="Accepted Solution"
                                    />
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(reply.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {reply.can_manage && (
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="text-gray-600 hover:text-red-600"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            )}
                          </div>

                          <p className="text-gray-700 whitespace-pre-wrap mb-3">
                            {reply.content}
                          </p>

                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleLikeReply(reply.id)}
                              className={`flex items-center gap-2 text-sm px-3 py-1 rounded transition ${
                                reply.has_liked
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              <FontAwesomeIcon icon={faThumbsUp} />
                              <span>{reply.like_count}</span>
                            </button>

                            {(selectedPost.is_author || selectedPost.can_manage) && !reply.is_solution && (
                              <button
                                onClick={() => handleMarkSolution(reply.id)}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                Mark as Solution
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
                  <FontAwesomeIcon
                    icon={faComment}
                    className="text-6xl mb-4 text-gray-300"
                  />
                  <p>Select a post to view details and replies</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Create New Post
            </h2>

            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) =>
                    setNewPost({ ...newPost, category: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="question">Question/Doubt</option>
                  <option value="opportunity">Job/Internship Opportunity</option>
                  <option value="project">Project Collaboration</option>
                  <option value="discussion">General Discussion</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  placeholder="Enter post title"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  placeholder="Describe your question, opportunity, or idea..."
                  rows="6"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Create Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DeveloperCommunity;
