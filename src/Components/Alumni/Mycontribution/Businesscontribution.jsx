import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faSpinner,
  faExclamationTriangle,
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faGlobe,
  faUsers,
  faIndustry,
  faCalendarAlt,
  faSearch,
  faFilter,
  faTimes,
  faCheck,
  faExternalLinkAlt,
  faTags,
  faBusinessTime,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";

const TOKEN = localStorage.getItem("Token");
const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

export default function BusinessContribution() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    category: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    phone: "",
    email: "",
    website: "",
    year_founded: "",
    employee_count: "",
    keywords: [],
    logo: null,
  });

  const categories = [
    "Technology",
    "Healthcare",
    "Education",
    "Finance",
    "Retail",
    "Manufacturing",
    "Consulting",
    "Real Estate",
    "Food & Beverage",
    "Transportation",
    "Entertainment",
    "Non-Profit",
    "Other",
  ];

  // Fetch businesses
  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/myposts/`, {
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch businesses");
      }

      const data = await response.json();
      // Extract business array from the response
      setBusinesses(data.business || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else if (name === "keywords") {
      const keywordArray = value
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword);
      setFormData((prev) => ({
        ...prev,
        [name]: keywordArray,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      business_name: "",
      description: "",
      category: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      phone: "",
      email: "",
      website: "",
      year_founded: "",
      employee_count: "",
      keywords: [],
      logo: null,
    });
  };

  // Handle add business
  const handleAddBusiness = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "keywords") {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === "logo" && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== "") {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(`${BASE_URL}/businesses/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${TOKEN}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to create business");
      }

      const newBusiness = await response.json();
      setBusinesses((prev) => [newBusiness, ...prev]);
      setShowAddModal(false);
      resetForm();
      toast.success("Business added successfully!");
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit business
  const handleEditBusiness = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "keywords") {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === "logo" && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== "") {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(
        `${BASE_URL}/businesses/${selectedBusiness.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Token ${TOKEN}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update business");
      }

      const updatedBusiness = await response.json();
      setBusinesses((prev) =>
        prev.map((business) =>
          business.id === selectedBusiness.id ? updatedBusiness : business
        )
      );
      setShowEditModal(false);
      setSelectedBusiness(null);
      resetForm();
      toast.success("Business updated successfully!");
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete business
  const handleDeleteBusiness = async (businessId) => {
    try {
      const response = await fetch(`${BASE_URL}/businesses/${businessId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete business");
      }

      setBusinesses((prev) =>
        prev.filter((business) => business.id !== businessId)
      );
      setDeleteConfirm(null);
      toast.success("Business deleted successfully!");
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // Open edit modal
  const openEditModal = (business) => {
    setSelectedBusiness(business);
    setFormData({
      business_name: business.business_name || "",
      description: business.description || "",
      category: business.category || "",
      address: business.address || "",
      city: business.city || "",
      state: business.state || "",
      country: business.country || "",
      postal_code: business.postal_code || "",
      phone: business.phone || "",
      email: business.email || "",
      website: business.website || "",
      year_founded: business.year_founded || "",
      employee_count: business.employee_count || "",
      keywords: business.keywords || [],
      logo: null,
    });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (business) => {
    setSelectedBusiness(business);
    setShowViewModal(true);
  };

  // Filter businesses
  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.business_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      business.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || business.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });


  // Business Card Component
  const BusinessCard = ({ business }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {business.logo ? (
              <img
                src={`${MEDIA_BASE_URL}${business.logo}`}
                alt={business.business_name}
                className="w-12 h-12 rounded-lg object-cover mr-4"
              />
            ) : (
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="text-green-600 text-xl"
                />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {business.business_name}
              </h3>
              <p className="text-sm text-gray-500">{business.category}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => openViewModal(business)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <FontAwesomeIcon icon={faEye} />
            </button>

            <button
              onClick={() => setDeleteConfirm(business.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Business"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {business.description}
        </p>

        <div className="space-y-2">
          {(business.address || business.city) && (
            <div className="flex items-center text-sm text-gray-500">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 mr-2" />
              {`${business.address || ""} ${business.city || ""} ${business.state || ""
                }`.trim()}
            </div>
          )}
          {business.phone && (
            <div className="flex items-center text-sm text-gray-500">
              <FontAwesomeIcon icon={faPhone} className="w-4 mr-2" />
              {business.phone}
            </div>
          )}
          {business.website && (
            <div className="flex items-center text-sm text-gray-500">
              <FontAwesomeIcon icon={faGlobe} className="w-4 mr-2" />
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {business.keywords && business.keywords.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {business.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {business.keywords.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{business.keywords.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Business Images Preview */}
        {business.images && business.images.length > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {business.images.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={`${MEDIA_BASE_URL}${image.image}`}
                  alt="Business"
                  className="w-full h-16 object-cover rounded-lg"
                />
              ))}
            </div>
            {business.images.length > 3 && (
              <p className="text-xs text-gray-500 mt-2">
                +{business.images.length - 3} more images
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-4xl text-green-600 animate-spin mb-4"
          />
          <p className="text-gray-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="text-4xl text-red-600 mb-4"
          />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchBusinesses}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Business Cards Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FontAwesomeIcon
              icon={faBuilding}
              className="text-6xl text-gray-300 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || categoryFilter !== "all"
                ? "No businesses found"
                : "No businesses yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start contributing by adding your first business to the directory"}
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </div>




      {/* View Business Modal */}
      {showViewModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="biz-view-title"
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-full overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 id="biz-view-title" className="text-xl font-bold text-gray-900">
                  Business Details
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedBusiness(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center">
                  {selectedBusiness.logo ? (
                    <img
                      src={`${MEDIA_BASE_URL}${selectedBusiness.logo}`}
                      alt={selectedBusiness.business_name}
                      className="w-16 h-16 rounded-lg object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <FontAwesomeIcon
                        icon={faBuilding}
                        className="text-green-600 text-2xl"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedBusiness.business_name}
                    </h3>
                    <p className="text-green-600 font-medium">
                      {selectedBusiness.category}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600">
                    {selectedBusiness.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedBusiness.address || selectedBusiness.city) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Address
                      </h4>
                      <p className="text-gray-600 flex items-center">
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          className="mr-2 text-green-600"
                        />
                        {`${selectedBusiness.address || ""} ${selectedBusiness.city || ""
                          } ${selectedBusiness.state || ""} ${selectedBusiness.country || ""
                          }`.trim()}
                      </p>
                    </div>
                  )}

                  {selectedBusiness.phone && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Phone
                      </h4>
                      <p className="text-gray-600 flex items-center">
                        <FontAwesomeIcon
                          icon={faPhone}
                          className="mr-2 text-green-600"
                        />
                        {selectedBusiness.phone}
                      </p>
                    </div>
                  )}

                  {selectedBusiness.email && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Email
                      </h4>
                      <p className="text-gray-600 flex items-center">
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="mr-2 text-green-600"
                        />
                        {selectedBusiness.email}
                      </p>
                    </div>
                  )}

                  {selectedBusiness.website && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Website
                      </h4>
                      <a
                        href={selectedBusiness.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                        Visit Website
                        <FontAwesomeIcon
                          icon={faExternalLinkAlt}
                          className="ml-1 text-sm"
                        />
                      </a>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBusiness.year_founded && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Founded
                      </h4>
                      <p className="text-gray-600 flex items-center">
                        <FontAwesomeIcon
                          icon={faCalendarAlt}
                          className="mr-2 text-green-600"
                        />
                        {selectedBusiness.year_founded}
                      </p>
                    </div>
                  )}

                  {selectedBusiness.employee_count && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Employees
                      </h4>
                      <p className="text-gray-600 flex items-center">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="mr-2 text-green-600"
                        />
                        {selectedBusiness.employee_count}
                      </p>
                    </div>
                  )}
                </div>

                {selectedBusiness.keywords &&
                  selectedBusiness.keywords.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedBusiness.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Business Images */}
                {selectedBusiness.images &&
                  selectedBusiness.images.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Business Images
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedBusiness.images.map((image, index) => (
                          <img
                            key={index}
                            src={`${MEDIA_BASE_URL}${image.image}`}
                            alt="Business"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Owner Details */}
                {selectedBusiness.owner_details && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Business Owner
                    </h4>
                    <div className="flex items-center">
                      {selectedBusiness.owner_details.profile_photo ? (
                        <img
                          src={`${MEDIA_BASE_URL}${selectedBusiness.owner_details.profile_photo}`}
                          alt="Owner"
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {selectedBusiness.owner_details.first_name?.[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-900 font-medium">
                          {selectedBusiness.owner_details.first_name}{" "}
                          {selectedBusiness.owner_details.last_name}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {selectedBusiness.owner_details.username}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-biz-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-4xl text-red-600 mb-4"
                aria-hidden="true"
              />
              <h3 id="delete-biz-title" className="text-lg font-semibold text-gray-900 mb-2">
                Delete Business
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this business? This action
                cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBusiness(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
