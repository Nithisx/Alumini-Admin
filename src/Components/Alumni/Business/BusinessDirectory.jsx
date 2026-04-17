import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Users,
  ChevronDown,
  ChevronRight,
  Building,
  Package,
  Settings,
} from "lucide-react";

const BusinessDirectory = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedService, setSelectedService] = useState("");

  // Sidebar collapse states
  const [industriesCollapsed, setIndustriesCollapsed] = useState(false);
  const [productsCollapsed, setProductsCollapsed] = useState(false);
  const [servicesCollapsed, setServicesCollapsed] = useState(false);

  const token = localStorage.getItem("Token");
  const userType = localStorage.getItem("userType"); // Get user type from localStorage
  const currentUserId = localStorage.getItem("userId"); // Get current user ID
  const BASE_URL = "https://api.karpagamalumni.in/api/v1";
  const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

  // Check if current user can edit/delete a business
  const canEditBusiness = (business) => {
    // Admin can edit/delete all businesses
    if (userType === "admin") {
      return true;
    }

    // Students and staff can only edit/delete their own businesses
    // and not businesses created by admin
    if (userType === "student" || userType === "staff") {
      // Check if the business owner is admin
      if (business.owner_details && business.owner_details.user_type === "admin") {
        return false;
      }

      // Check if current user is the owner
      return business.owner_details &&
        business.owner_details.id === parseInt(currentUserId);
    }

    return false;
  };

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Apply filters when search query or filter values change
  useEffect(() => {
    let results = [...businesses];

    // Apply search query
    if (searchQuery) {
      results = results.filter(
        (business) =>
          business.business_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          business.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (business.keywords &&
            business.keywords.some((keyword) =>
              keyword.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      results = results.filter(
        (business) => business.category === categoryFilter
      );
    }

    // Apply city filter
    if (cityFilter) {
      results = results.filter((business) => business.city === cityFilter);
    }

    // Apply state filter
    if (stateFilter) {
      results = results.filter((business) => business.state === stateFilter);
    }

    // Apply industry filter
    if (selectedIndustry) {
      results = results.filter(
        (business) => business.category === selectedIndustry
      );
    }

    // Apply product filter
    if (selectedProduct) {
      results = results.filter(
        (business) =>
          business.products?.includes(selectedProduct) ||
          business.description
            ?.toLowerCase()
            .includes(selectedProduct.toLowerCase())
      );
    }

    // Apply service filter
    if (selectedService) {
      results = results.filter(
        (business) =>
          business.services?.includes(selectedService) ||
          business.description
            ?.toLowerCase()
            .includes(selectedService.toLowerCase())
      );
    }

    setFilteredBusinesses(results);
  }, [
    searchQuery,
    categoryFilter,
    cityFilter,
    stateFilter,
    selectedIndustry,
    selectedProduct,
    selectedService,
    businesses,
  ]);

  // Extract unique cities and states for filters
  const cities = [...new Set(businesses.map((b) => b.city))]
    .filter(Boolean)
    .sort();
  const states = [...new Set(businesses.map((b) => b.state))]
    .filter(Boolean)
    .sort();

  // Create dynamic industries, products, and services from fetched data
  const industries = categories.length > 0 ? categories :
    [...new Set(businesses.map(b => b.category))]
      .filter(Boolean)
      .map(category => ({
        name: category,
        count: businesses.filter(b => b.category === category).length
      }));

  const products = [...new Set(businesses.flatMap(b => b.products || []))]
    .filter(Boolean)
    .map(product => ({
      name: product,
      count: businesses.filter(b => b.products?.includes(product)).length
    }));

  const services = [...new Set(businesses.flatMap(b => b.services || []))]
    .filter(Boolean)
    .map(service => ({
      name: service,
      count: businesses.filter(b => b.services?.includes(service)).length
    }));

  // Handle business deletion
  const handleDelete = (id) => setConfirmDeleteId(id);

  const doDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/businesses/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      setBusinesses(businesses.filter(business => business.id !== id));
      setFilteredBusinesses(filteredBusinesses.filter(business => business.id !== id));
      toast.success("Business deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete business.");
    }
  };

  // Handle navigation
  const handleNavigation = (path) => {
    window.location.href = path;
  };

  const SidebarSection = ({
    title,
    items,
    collapsed,
    setCollapsed,
    selectedValue,
    onSelect,
    icon,
  }) => (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-gray-900 pb-2"
      >
        <div className="flex items-center">
          {React.createElement(icon, { className: "mr-2 w-4 h-4" })}
          <span>{title}</span>
        </div>
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronDown className="w-3 h-3 text-gray-500" />
        )}
      </button>
      {!collapsed && (
        <div className="mt-2 space-y-1">
          {items.map((item) => (
            <label
              key={item.name}
              className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                type="radio"
                name={title.toLowerCase()}
                value={item.name}
                checked={selectedValue === item.name}
                onChange={() =>
                  onSelect(selectedValue === item.name ? "" : item.name)
                }
                className="mr-2 text-blue-600"
              />
              <span className="text-sm text-gray-600 flex-1">
                {item.category || item.name} {item.count && `(${item.count})`}
              </span>
            </label>
          ))}
          {selectedValue && (
            <button
              onClick={() => onSelect("")}
              className="text-xs text-blue-600 hover:text-blue-800 ml-5"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Business Listing"
        message="This will permanently delete this business listing."
        danger
        confirmText="Delete"
        onConfirm={() => { doDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Business Directory
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                List your Business for others to find, or search for one in the
                Directory
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/alumni/business/add"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add a Business Listing</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-80 bg-white rounded-lg shadow-sm p-6 h-fit">
            <SidebarSection
              title="Industries"
              items={industries}
              collapsed={industriesCollapsed}
              setCollapsed={setIndustriesCollapsed}
              selectedValue={selectedIndustry}
              onSelect={setSelectedIndustry}
              icon={Building}
            />

            <SidebarSection
              title="Products"
              items={products}
              collapsed={productsCollapsed}
              setCollapsed={setProductsCollapsed}
              selectedValue={selectedProduct}
              onSelect={setSelectedProduct}
              icon={Package}
            />

            <SidebarSection
              title="Services"
              items={services}
              collapsed={servicesCollapsed}
              setCollapsed={setServicesCollapsed}
              selectedValue={selectedService}
              onSelect={setSelectedService}
              icon={Settings}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Location, Industry, Product or Service"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-lg text-gray-600">
                <strong>{filteredBusinesses.length}</strong> Businesses Found
              </p>
            </div>

            {/* Business Listings */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {filteredBusinesses.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBusinesses.map((business) => (
                      <Link
                        key={business.id}
                        to={`/alumni/business/view/${business.id}`} // This should work with the updated route
                        className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Business Logo */}
                          <div className="md:w-32">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden mx-auto md:mx-0">
                              {business.logo ? (
                                <img
                                  src={`${MEDIA_BASE_URL}${business.logo}`}
                                  alt={business.business_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <span className="text-gray-500 text-xl font-bold">
                                    {business.business_name?.[0] || "B"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Business Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-bold text-blue-600 hover:text-blue-800 transition">
                                {business.business_name}
                              </h3>

                              {/* Only show edit/delete buttons if user has permission */}
                              {canEditBusiness(business) && (
                                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <Link
                                    to={`/alumni/business/edit/${business.id}`}
                                    className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Edit Business"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDelete(business.id);
                                    }}
                                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition"
                                    title="Delete Business"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="text-blue-600 font-medium mb-1">
                              {business.category}
                            </p>
                            <p className="text-gray-600 mb-3">
                              {business.description}
                            </p>

                            {/* Show business owner info if it's an admin post */}
                            {business.owner_details && business.owner_details.user_type === "admin" && (
                              <div className="mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Official Business Listing
                                </span>
                              </div>
                            )}

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {business.address && (
                                <div className="flex items-start">
                                  <MapPin className="text-gray-500 mt-1 mr-2 w-4 h-4 flex-shrink-0" />
                                  <span className="text-gray-600">
                                    {business.address}, {business.city},{" "}
                                    {business.state}
                                  </span>
                                </div>
                              )}

                              {business.phone && (
                                <div className="flex items-center">
                                  <Phone className="text-gray-500 mr-2 w-4 h-4 flex-shrink-0" />
                                  <a
                                    href={`tel:${business.phone}`}
                                    className="text-gray-600 hover:text-blue-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {business.phone}
                                  </a>
                                </div>
                              )}

                              {business.email && (
                                <div className="flex items-center">
                                  <Mail className="text-gray-500 mr-2 w-4 h-4 flex-shrink-0" />
                                  <a
                                    href={`mailto:${business.email}`}
                                    className="text-gray-600 hover:text-blue-600 truncate"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {business.email}
                                  </a>
                                </div>
                              )}

                              {business.website && (
                                <div className="flex items-center">
                                  <Globe className="text-gray-500 mr-2 w-4 h-4 flex-shrink-0" />
                                  <a
                                    href={
                                      business.website.startsWith("http")
                                        ? business.website
                                        : `https://${business.website}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 truncate"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {business.website.replace(
                                      /(^\w+:|^)\/\//,
                                      ""
                                    )}
                                  </a>
                                </div>
                              )}

                              {business.employee_count && (
                                <div className="flex items-center">
                                  <Users className="text-gray-500 mr-2 w-4 h-4 flex-shrink-0" />
                                  <span className="text-gray-600">
                                    {business.employee_count} employees
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-500 text-lg">
                      No businesses found matching your criteria.
                    </p>
                    <p className="text-gray-400 mt-2">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDirectory;
