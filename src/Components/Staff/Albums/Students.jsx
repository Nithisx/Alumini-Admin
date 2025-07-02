import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentImageUpload = () => {
  const [students, setStudents] = useState([]);  // Store students
  const [formData, setFormData] = useState({ name: "", image: null }); // Form data

  useEffect(() => {
    // Fetch students when component mounts
    const fetchStudents = async () => {
      try {
        
        const token = localStorage.getItem("Token")
        const response = await axios.get("http://209.38.121.118:8000/api/students/", {
          headers: { Authorization: `Token ${token}` },
        });
        setStudents(response.data);  // Set students in state
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.image) {
      alert("Please enter student name and select an image.");
      return;
    }

    try {
      const token = localStorage.getItem("Token"); // Get token from local storage
      let formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("image", formData.image);

      const response = await axios.post(
        "http://209.38.121.118:8000/api/students/",
        formDataToSend,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setStudents([response.data, ...students]); // Add new student to list
      setFormData({ name: "", image: null });  // Reset form
      alert("Student added successfully!");
    } catch (error) {
      console.error("Error uploading student image:", error);
      alert("Could not upload student image.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-blue-600 mb-4">Upload Student Image</h2>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Student Name</label>
          <input
            type="text"
            name="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter student name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Student Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-green-600 rounded-md"
        >
          Upload
        </button>
      </form>

      {/* Display Uploaded Students */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-lg shadow p-4">
            {student.image ? (
              <img
                src={`http://209.38.121.118:8000/api${student.image}`}
                alt={student.name}
                className="w-full h-40 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-800 mt-2">{student.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentImageUpload;
