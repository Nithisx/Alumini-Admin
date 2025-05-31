import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faTrash, 
  faSearch, 
  faPlus, 
  faFilter, 
  faGlobe, 
  faPhone, 
  faEnvelope, 
  faMapMarkerAlt,
  faUsers
} from "@fortawesome/free-solid-svg-icons";

const BusinessDirectory = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  
  const token = localStorage.getItem("Token");
  const BASE_URL = "http://134.209.157.195:8000";
  
  // Fetch all businesses and categories when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch businesses
        const businessesResponse = await axios.get(
          `${BASE_URL}/businesses/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        
        // Fetch categories
        const categoriesResponse = await axios.get(
          `${BASE_URL}/businesses/categories/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        
        setBusinesses(businessesResponse.data);
        setFilteredBusinesses(businessesResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Apply filters when search query or filter values change
  useEffect(() => {
    let results = [...businesses];
    
    // Apply search query
    if (searchQuery) {
      results = results.filter(business => 
        business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        business.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (business.keywords && business.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      results = results.filter(business => business.category === categoryFilter);
    }
    
    // Apply city filter
    if (cityFilter) {
      results = results.filter(business => business.city === cityFilter);
    }
    
    // Apply state filter
    if (stateFilter) {
      results = results.filter(business => business.state === stateFilter);
    }
    
    setFilteredBusinesses(results);
  }, [searchQuery, categoryFilter, cityFilter, stateFilter, businesses]);

  // Extract unique cities and states for filters
  const cities = [...new Set(businesses.map(b => b.city))].filter(Boolean).sort();
  const states = [...new Set(businesses.map(b => b.state))].filter(Boolean).sort();

  // Handle business deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this business listing?")) return;
    
    try {
      await axios.delete(`${BASE_URL}/businesses/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      setBusinesses(businesses.filter(business => business.id !== id));
      setFilteredBusinesses(filteredBusinesses.filter(business => business.id !== id));
      alert("Business deleted successfully!");
    } catch (error) {
      console.error("Error deleting business:", error);
      alert("Failed to delete business.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Business Directory</h1>
        <Link 
          to="/admin/business/add" 
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Business</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search businesses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-3 text-gray-400"
              />
            </div>
          </div>
          
          {/* Filter icon for mobile */}
          <button className="md:hidden bg-gray-200 p-2 rounded-md">
            <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category filter */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category-filter"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          
          {/* City filter */}
          <div>
            <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              id="city-filter"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          {/* State filter */}
          <div>
            <label htmlFor="state-filter" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              id="state-filter"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Business listings */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {filteredBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <div key={business.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gray-100 relative">
                    {business.logo ? (
                      <img
                        src={`${BASE_URL}${business.logo}`}
                        alt={business.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-500 text-lg">{business.business_name[0]}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Link
                        to={`/admin/business/${business.id}`}
                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
                      >
                        <FontAwesomeIcon icon={faEdit} size="sm" />
                      </Link>
                      <button
                        onClick={() => handleDelete(business.id)}
                        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition"
                      >
                        <FontAwesomeIcon icon={faTrash} size="sm" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <Link to={`/admin/business/${business.id}`} className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                      {business.business_name}
                    </Link>
                    <p className="text-sm text-gray-500 mb-2">{business.category}</p>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{business.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      {business.address && (
                        <div className="flex items-start">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-500 mt-1 mr-2" />
                          <span className="text-gray-600 line-clamp-1">
                            {business.address}, {business.city}, {business.state}
                          </span>
                        </div>
                      )}
                      
                      {business.phone && (
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faPhone} className="text-gray-500 mr-2" />
                          <a href={`tel:${business.phone}`} className="text-gray-600 hover:text-blue-600">
                            {business.phone}
                          </a>
                        </div>
                      )}
                      
                      {business.email && (
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 mr-2" />
                          <a href={`mailto:${business.email}`} className="text-gray-600 hover:text-blue-600 truncate max-w-[200px]">
                            {business.email}
                          </a>
                        </div>
                      )}
                      
                      {business.website && (
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faGlobe} className="text-gray-500 mr-2" />
                          <a 
                            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 truncate max-w-[200px]"
                          >
                            {business.website.replace(/(^\w+:|^)\/\//, '')}
                          </a>
                        </div>
                      )}
                      
                      {business.employee_count && (
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUsers} className="text-gray-500 mr-2" />
                          <span className="text-gray-600">
                            {business.employee_count} employees
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No businesses found matching your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BusinessDirectory;
