import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faGlobe,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faBuilding,
  faCalendarAlt,
  faUsers,
  faTags
} from "@fortawesome/free-solid-svg-icons";

const BusinessView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("Token");
  const BASE_URL = "https://xyndrix.me/api";

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        // Fetch business details
        const businessResponse = await axios.get(
          `${BASE_URL}/businesses/${id}/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        // Fetch business images
        const imagesResponse = await axios.get(
          `${BASE_URL}/businesses/${id}/images/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        setBusiness(businessResponse.data);
        setImages(imagesResponse.data);
      } catch (error) {
        console.error("Error fetching business details:", error);
        alert("Error loading business details");
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [id, token, BASE_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Not Found</h2>
        <button
          onClick={() => navigate('/alumni/business')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/alumni/business')}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Directory
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Business Details</h1>
      </div>

      <div className="space-y-6">
        {/* Business Header */}
        <div className="flex items-center space-x-4">
          {business.logo && (
            <img
              src={`${BASE_URL}${business.logo}`}
              alt="Business Logo"
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{business.business_name}</h2>
            <p className="text-blue-600 font-medium text-lg">{business.category}</p>
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{business.description}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {business.address && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Address</h4>
              <div className="flex items-start">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-500 mt-1 mr-2" />
                <span className="text-gray-600">
                  {business.address}, {business.city}, {business.state}
                </span>
              </div>
            </div>
          )}

          {business.phone && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Phone</h4>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faPhone} className="text-gray-500 mr-2" />
                <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                  {business.phone}
                </a>
              </div>
            </div>
          )}

          {business.email && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 mr-2" />
                <a href={`mailto:${business.email}`} className="text-blue-600 hover:underline">
                  {business.email}
                </a>
              </div>
            </div>
          )}

          {business.website && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Website</h4>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faGlobe} className="text-gray-500 mr-2" />
                <a
                  href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {business.website}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {business.year_founded && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Year Founded</h4>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500 mr-2" />
                <span className="text-gray-600">{business.year_founded}</span>
              </div>
            </div>
          )}

          {business.employee_count && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Employees</h4>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faUsers} className="text-gray-500 mr-2" />
                <span className="text-gray-600">{business.employee_count}</span>
              </div>
            </div>
          )}
        </div>

        {/* Keywords */}
        {business.keywords && business.keywords.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {business.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Business Images */}
        {images.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Business Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={`${BASE_URL}${image.image}`}
                  alt="Business"
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessView;