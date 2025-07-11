import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Pagination from "../../Shared/Pagination";
import placeholder from "../../../assets/placeholder.jpeg"; // Import your placeholder image

const TOKEN = localStorage.getItem("Token");
const BASE_URL = "https://xyndrix.me/api";
const API_URL = `${BASE_URL}/admin-members/`;
const DROPDOWN_FILTERS_URL = `${BASE_URL}/dropdown-filters/`;

// Placeholder image service
const getInitialsAvatar = (firstName, lastName) => {
  if (!firstName && !lastName) return placeholder;
  
  // Get initials from name
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  
  // Generate a deterministic color based on name
  const colors = [
    '#4299E1', // blue-500
    '#48BB78', // green-500
    '#ED8936', // orange-500
    '#9F7AEA', // purple-500
    '#F56565', // red-500
    '#38B2AC', // teal-500
    '#ECC94B', // yellow-500
    '#667EEA', // indigo-500
    '#ED64A6'  // pink-500
  ];
  
  // Simple hash function to get consistent color
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };
  
  const colorIndex = Math.abs(hashCode(`${firstName}${lastName}`)) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  // Create SVG for avatar
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${backgroundColor}" />
      <text x="50%" y="50%" dy=".3em" font-family="Arial, sans-serif" font-size="80" 
        fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `;
  
  // Convert SVG to data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};


const AutocompleteInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  filterType,
  options,
  icon,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync input value with parent value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onChange(value); // Update parent state

    if (value.trim() === "") {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    } else {
      const filtered = options.filter((item) =>
        item.toString().toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  const handleFocus = () => {
    setFilteredSuggestions(options);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2 relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete="off"
        />
        {icon}

        {/* Dropdown Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={`${filterType}-${index}-${suggestion}`}
                className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors group"
                onMouseDown={() => handleSuggestionClick(suggestion)}
              >
                <span className="text-gray-700 group-hover:text-blue-700 transition-colors truncate">
                  {suggestion}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* No options message */}
        {showSuggestions &&
          filteredSuggestions.length === 0 &&
          inputValue.trim() !== "" && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No options found for "{inputValue}"
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [workedInFilter, setWorkedInFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [rolesPlayedFilter, setRolesPlayedFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [courseEndYearFilter, setCourseEndYearFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [passedOutYearFilter, setPassedOutYearFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [collegeNameFilter, setCollegeNameFilter] = useState("");
  const [currentWorkFilter, setCurrentWorkFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Store dropdown options
  const [dropdownFilters, setDropdownFilters] = useState({
    current_work: [],
    college_name: [],
    city: [],
    state: [],
    country: [],
    role: [],
    passed_out_year: [],
    course: [],
  });

  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch dropdown filter options
  const fetchDropdownFilters = async () => {
    setFiltersLoading(true);
    try {
      const response = await axios.get(DROPDOWN_FILTERS_URL, {
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      setDropdownFilters(response.data);
      setFiltersLoading(false);
    } catch (error) {
      console.error("Error fetching dropdown filters:", error);
      setFiltersLoading(false);
    }
  };

  // Fetch dropdown options on component mount
  useEffect(() => {
    fetchDropdownFilters();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage,
      page_size: pageSize,
    });

    if (roleFilter) params.append("role", roleFilter);
    if (cityFilter) params.append("city", cityFilter);
    if (workedInFilter) params.append("worked_in", workedInFilter);
    if (rolesPlayedFilter) params.append("roles_played", rolesPlayedFilter);
    if (searchQuery) params.append("search", searchQuery);
    if (genderFilter) params.append("gender", genderFilter);
    if (courseEndYearFilter)
      params.append("course_end_year", courseEndYearFilter);
    if (companyFilter) params.append("company", companyFilter);
    if (countryFilter) params.append("country", countryFilter);
    if (stateFilter) params.append("state", stateFilter);
    if (passedOutYearFilter)
      params.append("passed_out_year", passedOutYearFilter);
    if (courseFilter) params.append("course", courseFilter);
    if (collegeNameFilter) params.append("college_name", collegeNameFilter);
    if (currentWorkFilter) params.append("current_work", currentWorkFilter);

    try {
      const response = await axios.get(`${API_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const { results, count } = response.data;

      setMembers(results);
      setFilteredTotal(count);
      setTotalPages(Math.ceil(count / pageSize));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      setLoading(false);
    }
  };

  // When filters change, always reset page to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [
    roleFilter,
    cityFilter,
    workedInFilter,
    searchQuery,
    rolesPlayedFilter,
    genderFilter,
    courseEndYearFilter,
    companyFilter,
    countryFilter,
    stateFilter,
    passedOutYearFilter,
    courseFilter,
    collegeNameFilter,
    currentWorkFilter,
  ]);

  // Whenever page or filters change, fetch data
  useEffect(() => {
    fetchMembers();
  }, [
    currentPage,
    pageSize,
    roleFilter,
    cityFilter,
    workedInFilter,
    searchQuery,
    rolesPlayedFilter,
    genderFilter,
    courseEndYearFilter,
    companyFilter,
    countryFilter,
    stateFilter,
    passedOutYearFilter,
    courseFilter,
    collegeNameFilter,
    currentWorkFilter,
  ]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setRoleFilter("");
    setCityFilter("");
    setWorkedInFilter("");
    setRolesPlayedFilter("");
    setSearchQuery("");
    setGenderFilter("");
    setCourseEndYearFilter("");
    setCompanyFilter("");
    setCountryFilter("");
    setStateFilter("");
    setPassedOutYearFilter("");
    setCourseFilter("");
    setCollegeNameFilter("");
    setCurrentWorkFilter("");
    setCurrentPage(1);
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "staff":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "student":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-full lg:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Members Directory
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage and explore our community members
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="hidden sm:inline">Filter & Search</span>
              <span className="sm:hidden">Filters</span>
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
              >
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {filtersLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 text-sm sm:text-base">
                  Loading filters...
                </span>
              </div>
            </div>
          ) : (
            <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {/* Role Filter */}
                <AutocompleteInput
                  id="role-filter"
                  label="Role"
                  placeholder="Select role..."
                  value={roleFilter}
                  onChange={setRoleFilter}
                  filterType="role"
                  options={dropdownFilters.role || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                />

                {/* Course Filter */}
                <AutocompleteInput
                  id="course-filter"
                  label="Course"
                  placeholder="Select course..."
                  value={courseFilter}
                  onChange={setCourseFilter}
                  filterType="course"
                  options={dropdownFilters.course || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  }
                />

                {/* Passed Out Year Filter */}
                <AutocompleteInput
                  id="passed-out-year-filter"
                  label="Passed Out Year"
                  placeholder="Select year..."
                  value={passedOutYearFilter}
                  onChange={setPassedOutYearFilter}
                  filterType="passedOutYear"
                  options={dropdownFilters.passed_out_year || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7h8M8 7H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                      />
                    </svg>
                  }
                />

                {/* City Filter */}
                <AutocompleteInput
                  id="city-filter"
                  label="City"
                  placeholder="Select city..."
                  value={cityFilter}
                  onChange={setCityFilter}
                  filterType="city"
                  options={dropdownFilters.city || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  }
                />

                {/* State Filter */}
                <AutocompleteInput
                  id="state-filter"
                  label="State"
                  placeholder="Select state..."
                  value={stateFilter}
                  onChange={setStateFilter}
                  filterType="state"
                  options={dropdownFilters.state || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m-6 3l6-3"
                      />
                    </svg>
                  }
                />

                {/* Country Filter */}
                <AutocompleteInput
                  id="country-filter"
                  label="Country"
                  placeholder="Select country..."
                  value={countryFilter}
                  onChange={setCountryFilter}
                  filterType="country"
                  options={dropdownFilters.country || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />

                {/* College Name Filter */}
                <AutocompleteInput
                  id="college-name-filter"
                  label="College Name"
                  placeholder="Select college..."
                  value={collegeNameFilter}
                  onChange={setCollegeNameFilter}
                  filterType="collegeName"
                  options={dropdownFilters.college_name || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  }
                />

                {/* Working In Filter */}
                <AutocompleteInput
                  id="current-work-filter"
                  label="Working In"
                  placeholder="Select company..."
                  value={currentWorkFilter}
                  onChange={setCurrentWorkFilter}
                  filterType="currentWork"
                  options={dropdownFilters.current_work || []}
                  icon={
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
                      />
                    </svg>
                  }
                />

                {/* Search - spans full width on mobile */}
                <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                  <label
                    htmlFor="search-box"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Search
                  </label>
                  <div className="relative">
                    <input
                      id="search-box"
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg
                      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <p className="text-sm sm:text-base text-gray-700 font-medium">
              {filteredTotal} {filteredTotal === 1 ? "member" : "members"} found
            </p>
            {(roleFilter ||
              cityFilter ||
              workedInFilter ||
              searchQuery ||
              countryFilter ||
              stateFilter ||
              passedOutYearFilter ||
              courseFilter ||
              collegeNameFilter ||
              currentWorkFilter ||
              genderFilter ||
              courseEndYearFilter ||
              companyFilter) && (
              <span className="text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                Filtered
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 font-medium text-sm sm:text-base">
                Loading members...
              </span>
            </div>
          </div>
        ) : (
          <>
            {members.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                  No members found
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              /* Members Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                {members.map((member) => (
                  <Link
                    to={`/alumni/members/${member.username}`}
                    key={member.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                  >
                    {/* Profile Image */}
                    
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                      <img
                        src={member.profile_photo || placeholder}
                        alt={`${member.first_name || 'Alumni'} ${member.last_name || ''}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite loop
                          // Generate avatar with initials if image fails to load
                          e.target.src = getInitialsAvatar(member.first_name, member.last_name);
                        }}
                      />
                      {/* Role Badge */}
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="p-3 sm:p-5">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {member.first_name} {member.last_name}
                      </h3>

                      <div className="space-y-1.5 sm:space-y-2">
                        {member.city && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="truncate">{member.city}</span>
                          </div>
                        )}

                        {member.worked_in && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
                              />
                            </svg>
                            <span className="truncate">{member.worked_in}</span>
                          </div>
                        )}

                        {member.course_name && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            <span className="truncate">
                              {member.course_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {members.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredTotal}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
