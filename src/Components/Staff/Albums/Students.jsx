import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "../../../lib/axiosInstance";
import { PageHero, MotionList, MotionItem } from "../../Shared/ui";

const StudentImageUpload = () => {
  const [students, setStudents] = useState([]);  // Store students
  const [formData, setFormData] = useState({ name: "", image: null }); // Form data

  useEffect(() => {
    // Fetch students when component mounts
    const fetchStudents = async () => {
      try {

        const token = localStorage.getItem("Token")
        const response = await axios.get("https://api.karpagamalumni.in/api/v1/students/", {
          headers: { Authorization: `Token ${token}` },
        });
        setStudents(response.data);  // Set students in state
      } catch { /* ignore */ }
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
      toast.error("Please enter student name and select an image.");
      return;
    }

    try {
      const token = localStorage.getItem("Token"); // Get token from local storage
      let formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("image", formData.image);

      const response = await axios.post(
        "https://api.karpagamalumni.in/api/v1/students/",
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
      toast.success("Student added successfully!");
    } catch (error) {
      toast.success("Could not upload student image.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <PageHero
        section="students"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        title="Student Images"
        subtitle="Upload and manage student images for the gallery."
      />

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
      <MotionList className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {students.map((student) => (
          <MotionItem key={student.id} className="bg-white rounded-lg shadow p-4">
            {student.image ? (
              <img
                src={`https://api.karpagamalumni.in${student.image}`}
                alt={student.name}
                className="w-full h-40 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-800 mt-2">{student.name}</h3>
          </MotionItem>
        ))}
      </MotionList>
    </div>
  );
};

export default StudentImageUpload;
