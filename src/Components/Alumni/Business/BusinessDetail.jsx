import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faTrash,
  faArrowLeft,
  faPlus,
  faGlobe,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faBuilding,
  faCalendarAlt,
  faUsers,
  faTags
} from "@fortawesome/free-solid-svg-icons";

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewBusiness = id === 'add';
  
  const [business, setBusiness] = useState({
    business_name: '',
    description: '',
    category: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    year_founded: '',
    employee_count: '',
    keywords: [],
    social_media: { facebook: '', linkedin: '', twitter: '', instagram: '' },
    is_active: true
  });
  
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(!isNewBusiness);
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [categories, setCategories] = useState([]);
  
  const token = localStorage.getItem("Token");
  const BASE_URL = "http://209.38.121.118/api";

  // Fetch business details if editing an existing business
  useEffect(() => {
    const fetchData = async () => {
      if (isNewBusiness) {
        setLoading(false);
        return;
      }
      
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
        
        if (businessResponse.data.logo) {
          setLogoPreview(`${BASE_URL}${businessResponse.data.logo}`);
        }
      } catch (error) {
        console.error("Error fetching business details:", error);
        alert("Error loading business details");
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch categories for dropdown
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/businesses/categories/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        
        setCategories(response.data.map(cat => cat.category));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    fetchCategories();
    fetchData();
  }, [id, isNewBusiness]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects like social_media.facebook
      const [parent, child] = name.split('.');
      setBusiness({
        ...business,
        [parent]: {
          ...business[parent],
          [child]: value
        }
      });
    } else {
      setBusiness({
        ...business,
        [name]: value
      });
    }
  };

  // Handle logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle multiple image uploads
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles([...imageFiles, ...files]);
  };

  // Remove an image from the upload list
  const removeImageFile = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  // Delete an existing image
  const deleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await axios.delete(`${BASE_URL}/businesses/${imageId}/images/`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      setImages(images.filter(image => image.id !== imageId));
      alert("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  // Add keyword to the list
  const addKeyword = () => {
    if (keywordInput.trim() && !business.keywords.includes(keywordInput.trim())) {
      setBusiness({
        ...business,
        keywords: [...business.keywords, keywordInput.trim()]
      });
      setKeywordInput('');
    }
  };

  // Remove keyword from the list
  const removeKeyword = (keyword) => {
    setBusiness({
      ...business,
      keywords: business.keywords.filter(k => k !== keyword)
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      
      // Append all business details
      Object.keys(business).forEach(key => {
        if (key === 'keywords' || key === 'social_media') {
          formData.append(key, JSON.stringify(business[key]));
        } else {
          formData.append(key, business[key]);
        }
      });
      
      // Append logo if selected
      if (logo) {
        formData.append('logo', logo);
      }
      
      let response;
      
      if (isNewBusiness) {
        // Create new business
        response = await axios.post(
          `${BASE_URL}/businesses/`,
          formData,
          {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        // Upload images if any
        if (imageFiles.length > 0 && response.data.id) {
          const imagesFormData = new FormData();
          imageFiles.forEach(image => {
            imagesFormData.append('images', image);
          });
          
          await axios.post(
            `${BASE_URL}/businesses/${response.data.id}/images/`,
            imagesFormData,
            {
              headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        }
        
        alert("Business created successfully!");
        navigate(`/staff/business/${response.data.id}`);
      } else {
        // Update existing business
        response = await axios.put(
          `${BASE_URL}/businesses/${id}/`,
          formData,
          {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        // Upload images if any
        if (imageFiles.length > 0) {
          const imagesFormData = new FormData();
          imageFiles.forEach(image => {
            imagesFormData.append('images', image);
          });
          
          const imagesResponse = await axios.post(
            `${BASE_URL}/businesses/${id}/images/`,
            imagesFormData,
            {
              headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          
          // Update images state with newly uploaded images
          setImages([...imagesResponse.data, ...images]);
          setImageFiles([]);
        }
        
        alert("Business updated successfully!");
      }
    } catch (error) {
      console.error("Error saving business:", error);
      alert("Error saving business. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/staff/business')}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Directory
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isNewBusiness ? 'Add New Business' : 'Edit Business'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name*
              </label>
              <input
                type="text"
                name="business_name"
                value={business.business_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Business name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <input
                type="text"
                name="category"
                value={business.category}
                onChange={handleChange}
                list="categories"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select or type a category"
              />
              <datalist id="categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={business.description || ''}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the business..."
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  <FontAwesomeIcon icon={faGlobe} />
                </span>
                <input
                  type="text"
                  name="website"
                  value={business.website || ''}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={business.email || ''}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  <FontAwesomeIcon icon={faPhone} />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={business.phone || ''}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (123) 456-7890"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Founded
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </span>
                <input
                  type="number"
                  name="year_founded"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={business.year_founded || ''}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2010"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Count
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <input
                  type="number"
                  name="employee_count"
                  min="1"
                  value={business.employee_count || ''}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={business.is_active}
                onChange={(e) => setBusiness({...business, is_active: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active Business Listing
              </label>
            </div>
          </div>
        </div>
        
        {/* Address Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Address Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                </span>
                <input
                  type="text"
                  name="address"
                  value={business.address || ''}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Business Street"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={business.city || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State / Province
              </label>
              <input
                type="text"
                name="state"
                value={business.state || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal / ZIP Code
              </label>
              <input
                type="text"
                name="postal_code"
                value={business.postal_code || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Postal code"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={business.country || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Country"
              />
            </div>
          </div>
        </div>
        
        {/* Social Media */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Media Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="text"
                name="social_media.facebook"
                value={business.social_media.facebook || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                type="text"
                name="social_media.linkedin"
                value={business.social_media.linkedin || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter
              </label>
              <input
                type="text"
                name="social_media.twitter"
                value={business.social_media.twitter || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="text"
                name="social_media.instagram"
                value={business.social_media.instagram || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
          </div>
        </div>
        
        {/* Keywords */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Keywords
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Help people find your business)
            </span>
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {business.keywords.map((keyword, index) => (
              <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <div className="flex-1">
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                  <FontAwesomeIcon icon={faTags} />
                </span>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 border border-gray-300 rounded-none rounded-r-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add keyword (e.g., tech, startup)"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addKeyword}
              className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1" />
              Add
            </button>
          </div>
        </div>
        
        {/* Logo and Images */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Business Logo</h2>
              
              <div className="mb-4">
                {logoPreview ? (
                  <div className="mb-4 relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-40 w-40 object-contain border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogo(null);
                        setLogoPreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-40 w-40 bg-gray-200 flex items-center justify-center border rounded-lg">
                    <FontAwesomeIcon icon={faBuilding} className="text-gray-500 text-4xl" />
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Images Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Business Images</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {/* Display existing images */}
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${BASE_URL}${image.image}`}
                      alt={image.caption || "Business image"}
                      className="h-32 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => deleteImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {/* Display new images being uploaded */}
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New upload ${index + 1}`}
                      className="h-32 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/staff/business')}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center ${
              saving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <FontAwesomeIcon icon={faSave} className={`${saving ? 'hidden' : 'mr-2'}`} />
            {isNewBusiness ? 'Create Business' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessDetail;
