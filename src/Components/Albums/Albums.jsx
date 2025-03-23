import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen,
  faPlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const AlbumsPage = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {

    const fetchAlbums = async () => {
      try {
        
        let token = "2e3c06490e12df87036a731e47345bcd7e2a4ec7";
        const response = await axios.get("http://192.168.142.123:8000/albums/", {
          headers: { Authorization: `Token ${token}` },
        });
  
        console.log("Fetched Albums:", response.data);
  
        if (Array.isArray(response.data)) {
          setAlbums(response.data);
        } else {
          console.warn("Unexpected API response format", response.data);
          setAlbums([]);
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
        setAlbums([]);
      }
    };
  
    fetchAlbums();
  }, []);
  

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert("Please enter an album title.");
      return;
    }
  
    try {
      let token = "2e3c06490e12df87036a731e47345bcd7e2a4ec7";
      let formDataToSend = new FormData();
  
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
  
      if (uploadedFile) {
        formDataToSend.append("cover_image", uploadedFile.file, uploadedFile.name);
      }
  
      const response = await axios.post(
        "http://192.168.142.123:8000/albums/",
        formDataToSend,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      console.log("New Album Created:", response.data); // Debugging log
  
      // ✅ Refresh Albums List After Submission
      setAlbums((prevAlbums) => [response.data, ...prevAlbums]);
      setIsModalOpen(false);
      setFormData({ title: "", description: "" });
      setUploadedFile(null);
      alert("Album created successfully!");
    } catch (error) {
      console.error("Error creating album:", error);
      alert("Could not create album.");
    }
  };
  

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setUploadedFile({
          file,
          name: file.name,
          type: file.type,
          preview: URL.createObjectURL(file),
        });
      } else {
        alert("Please upload only image files.");
      }
    }
  };

  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-green-600 mb-4">Albums</h2>
      {Array.isArray(albums) && albums.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FontAwesomeIcon
            icon={faFolderOpen}
            className="text-4xl text-gray-300 mb-3"
          />
          <h3 className="text-xl font-medium text-gray-500 mb-1">
            No Albums Found
          </h3>
          <p className="text-gray-400">
            There are no albums available at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer"
              onClick={() => {
                console.log("Navigating to album:", album.id);
                console.log("Fetched Albums Data:", albums);
                navigate(`/albums/${album.id}`);
              }}
            
            >
              {album.cover_image ? (
                <img
                  src={`http://192.168.142.123:8000${album.cover_image}`}
                  alt={album.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {album.title}
                </h3>
                <p className="text-gray-600 text-sm">{album.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Floating Create Album Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
      </button>
      {/* Create Album Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">
                Create Album
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Album Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Album Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter album title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Album Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Describe the album"
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Album Cover Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {uploadedFile && (
                    <div className="mt-2 relative">
                      <img
                        src={uploadedFile.preview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <button
                        onClick={removeFile}
                        type="button"
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ml-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md"
                  >
                    Create Album
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumsPage;
