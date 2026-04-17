"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import * as XLSX from "xlsx";
import Pagination from "../Shared/Pagination";

const TOKEN =
  typeof window !== "undefined" ? localStorage.getItem("Token") : null;
const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const API_URL = `${BASE_URL}/admin-members/`;
const DROPDOWN_FILTERS_URL = `${BASE_URL}/dynamic-dropdown-filters/`;

const placeholder =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVDOTEuNzE1NyA3NSA4NS4wMDAwIDgxLjcxNTcgODUuMDAwMCA5MEM4NS4wMDAwIDk4LjI4NDMgOTEuNzE1NyAxMDUgMTAwIDEwNUMxMDguMjg0IDEwNSAxMTUgOTguMjg0MyAxMTUgOTBDMTE1IDgxLjcxNTcgMTA4LjI4NCA3NSAxMDAgNzVaIiBmaWxsPSIjOUM5Qzk5Ii8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzg2LjE5MjkgMTEwIDc1IDEyMS4xOTMgNzUgMTM1VjE0MEg3NVYxNDBIMTI1VjE0MFYxMzVDMTI1IDEyMS4xOTMgMTEzLjgwNyAxMTAgMTAwIDExMFoiIGZpbGw9IiM5QzlDOTkiLz4KPC9zdmc+";

// Placeholder image service
const getInitialsAvatar = (firstName, lastName) => {
  if (!firstName && !lastName) return placeholder;

  // Get initials from name
  const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""
    }`.toUpperCase();

  // Generate a deterministic color based on name
  const colors = [
    "#4299E1", // blue-500
    "#48BB78", // green-500
    "#ED8936", // orange-500
    "#9F7AEA", // purple-500
    "#F56565", // red-500
    "#38B2AC", // teal-500
    "#ECC94B", // yellow-500
    "#667EEA", // indigo-500
    "#ED64A6", // pink-500
  ];

  // Simple hash function to get consistent color
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  const colorIndex =
    Math.abs(hashCode(`${firstName}${lastName}`)) % colors.length;
  const backgroundColor = colors[colorIndex];

  // Create SVG for avatar
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${backgroundColor}" />
      <text x="50%" y="50%" dy=".3em" fontFamily="Arial, sans-serif" fontSize="80" 
        fill="white" textAnchor="middle" dominantBaseline="middle">${initials}</text>
    </svg>
  `;

  // Convert SVG to data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const MAX_DROPDOWN_ITEMS = 50;

// Highlight matched text in suggestions
const HighlightMatch = ({ text, query }) => {
  if (!query.trim()) return <span>{text}</span>;
  const strText = text.toString();
  const idx = strText.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{strText}</span>;
  return (
    <span>
      {strText.substring(0, idx)}
      <mark className="bg-blue-100 text-blue-800 rounded px-0.5">{strText.substring(idx, idx + query.length)}</mark>
      {strText.substring(idx + query.length)}
    </span>
  );
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
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  // Cache the fullest set of options we've ever received.
  // When filters narrow down the API response, we still want the
  // full original list available for the dropdown suggestions.
  const cachedOptionsRef = useRef([]);

  // Update cache: always keep the larger set so we never lose options
  useEffect(() => {
    if (options.length > cachedOptionsRef.current.length) {
      cachedOptionsRef.current = options;
    }
  }, [options]);

  // Sync input value with parent value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Re-filter suggestions when options change (e.g. after API refetch)
  useEffect(() => {
    if (showSuggestions) {
      filterOptions(inputValue);
    }
  }, [options]);

  // Filter suggestions helper — always uses cached (full) options
  const filterOptions = (query) => {
    const source = cachedOptionsRef.current.length > 0
      ? cachedOptionsRef.current
      : options;

    if (query.trim() === "") {
      const limited = source.slice(0, MAX_DROPDOWN_ITEMS);
      setFilteredSuggestions(limited);
      setTotalMatches(source.length);
    } else {
      const filtered = source.filter((item) =>
        item.toString().toLowerCase().includes(query.toLowerCase())
      );
      setTotalMatches(filtered.length);
      setFilteredSuggestions(filtered.slice(0, MAX_DROPDOWN_ITEMS));
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    filterOptions(val);
    setShowSuggestions(true);
  };

  // Handle Enter key press for manual filtering
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(inputValue);
      setShowSuggestions(false);
    }
  };

  // Handle manual trigger on blur - only if value changed
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 200);
  };

  const handleFocus = () => {
    filterOptions(inputValue);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue("");
    onChange("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActive = value && value.trim() !== "";

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={`w-full border rounded-lg px-3 py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm ${isActive
            ? "border-blue-400 bg-blue-50/30 shadow-sm shadow-blue-100"
            : "border-gray-300"
            }`}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete="off"
        />
        {icon}

        {/* Clear button when value exists */}
        {(inputValue || isActive) && (
          <button
            type="button"
            onMouseDown={handleClear}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
            title="Clear"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

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
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0 transition-colors group"
                onMouseDown={() => handleSuggestionClick(suggestion)}
              >
                <span className="text-gray-700 group-hover:text-blue-700 transition-colors truncate block">
                  <HighlightMatch text={suggestion} query={inputValue} />
                </span>
              </div>
            ))}
            {totalMatches > MAX_DROPDOWN_ITEMS && (
              <div className="px-3 py-2 text-center text-xs text-gray-400 bg-gray-50 border-t border-gray-100 sticky bottom-0">
                Showing {MAX_DROPDOWN_ITEMS} of {totalMatches} results — type to narrow down
              </div>
            )}
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
              <div className="px-3 py-3 text-center text-gray-500 text-sm">
                <svg className="w-5 h-5 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                No matches for "<strong>{inputValue}</strong>"
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
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

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
  const [chapterFilter, setChapterFilter] = useState(""); // Add chapter filter state
  const [branchFilter, setBranchFilter] = useState(""); // Add branch filter state
  const [emailFilter, setEmailFilter] = useState(""); // Declare emailFilter state
  const [rollNoFilter, setRollNoFilter] = useState(""); // Declare rollNoFilter state
  const [showFilters, setShowFilters] = useState(false);
  const [manualSearchTrigger, setManualSearchTrigger] = useState(0); // Trigger for manual search

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
    email: [],
    current_location: [], // Add current_location for chapters
    branch: [], // Add branch for chapters
    roll_no: [], // Add roll_no for filtering
  });

  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting states
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' or 'desc'

  // Fetch dropdown filter options
  const fetchDropdownFilters = async () => {
    setFiltersLoading(true);
    try {
      const params = new URLSearchParams();

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
      if (chapterFilter) params.append("current_location", chapterFilter);
      if (emailFilter) params.append("email", emailFilter);
      if (branchFilter) params.append("branch", branchFilter);
      if (rollNoFilter) params.append("roll_no", rollNoFilter);

      const url = params.toString()
        ? `${DROPDOWN_FILTERS_URL}?${params.toString()}`
        : DROPDOWN_FILTERS_URL;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      const filtersData = response.data?.filters_data ?? response.data ?? {};
      setDropdownFilters((prev) => ({
        ...prev,
        ...filtersData,
      }));
      setFiltersLoading(false);
    } catch (error) {
      setFiltersLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage,
      page_size: pageSize,
    });

    // Add sorting parameter
    const orderingValue = sortDirection === "asc" ? `-${sortField}` : sortField;
    params.append("ordering", orderingValue);

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
    if (chapterFilter) params.append("current_location", chapterFilter);
    if (emailFilter) params.append("email", emailFilter);
    if (branchFilter) params.append("branch", branchFilter);
    if (rollNoFilter) params.append("roll_no", rollNoFilter);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownFilters();
  }, [
    roleFilter,
    cityFilter,
    workedInFilter,
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
    chapterFilter,
    emailFilter,
    branchFilter,
    rollNoFilter,
    manualSearchTrigger,
  ]);

  const handleMemberSelect = (memberId) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);

    // Update select all state based on current page members
    setSelectAll(members.every((member) => newSelected.has(member.id)));
  };

  const fetchAllFilteredMembers = async () => {
    let allMembers = [];
    let page = 1;
    let hasMore = true;

    const baseParams = new URLSearchParams({
      page_size: 1000, // Use maximum allowed page size
    });

    if (roleFilter) baseParams.append("role", roleFilter);
    if (cityFilter) baseParams.append("city", cityFilter);
    if (workedInFilter) baseParams.append("worked_in", workedInFilter);
    if (rolesPlayedFilter) baseParams.append("roles_played", rolesPlayedFilter);
    if (searchQuery) baseParams.append("search", searchQuery);
    if (genderFilter) baseParams.append("gender", genderFilter);
    if (courseEndYearFilter)
      baseParams.append("course_end_year", courseEndYearFilter);
    if (companyFilter) baseParams.append("company", companyFilter);
    if (countryFilter) baseParams.append("country", countryFilter);
    if (stateFilter) baseParams.append("state", stateFilter);
    if (passedOutYearFilter)
      baseParams.append("passed_out_year", passedOutYearFilter);
    if (courseFilter) baseParams.append("course", courseFilter);
    if (collegeNameFilter) baseParams.append("college_name", collegeNameFilter);
    if (currentWorkFilter) baseParams.append("current_work", currentWorkFilter);
    if (chapterFilter) baseParams.append("current_location", chapterFilter);
    if (emailFilter) baseParams.append("email", emailFilter);
    if (branchFilter) baseParams.append("branch", branchFilter);
    if (rollNoFilter) baseParams.append("roll_no", rollNoFilter);

    try {
      while (hasMore) {
        const params = new URLSearchParams(baseParams);
        params.append("page", page.toString());


        const response = await axios.get(`${API_URL}?${params.toString()}`, {
          headers: {
            Authorization: `Token ${TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        const { results, next } = response.data;

        if (results && results.length > 0) {
          allMembers = [...allMembers, ...results];
        }

        // Check if there are more pages
        hasMore = !!next && results && results.length > 0;
        page++;

        // Safety check to prevent infinite loops
        if (page > 100) {
          break;
        }
      }

      return allMembers;
    } catch (error) {
      return [];
    }
  };

  const handleSelectAll = async () => {
    if (selectAll) {
      setSelectedMembers(new Set());
      setSelectAll(false);
    } else {
      setSelectAllLoading(true);
      try {
        // Fetch all filtered members to get their IDs
        const allFilteredMembers = await fetchAllFilteredMembers();
        if (allFilteredMembers && allFilteredMembers.length > 0) {
          const allMemberIds = new Set(
            allFilteredMembers.map((member) => member.id)
          );
          setSelectedMembers(allMemberIds);
          setSelectAll(true);
        }
      } catch (error) {
      } finally {
        setSelectAllLoading(false);
      }
    }
  };

  const exportToExcel = async () => {
    if (selectedMembers.size === 0) {
      toast.error("Please select at least one member to export.");
      return;
    }

    setExportLoading(true);

    try {
      // If we have selected members that might not be in current page, fetch all filtered members
      let selectedMembersData = [];

      if (selectAll || selectedMembers.size > members.length) {
        // Fetch all filtered members to get complete data
        const allFilteredMembers = await fetchAllFilteredMembers();
        selectedMembersData = allFilteredMembers.filter((member) =>
          selectedMembers.has(member.id)
        );
      } else {
        // Use current page members if all selected are visible
        selectedMembersData = members.filter((member) =>
          selectedMembers.has(member.id)
        );
      }

      // Prepare data for Excel export with all important fields
      const excelData = selectedMembersData.map((member) => ({
        ID: member.id,
        Username: member.username,
        "First Name": member.first_name,
        "Last Name": member.last_name,
        Email: member.email,
        "Secondary Email": member.secondary_email,
        Phone: member.phone,
        Gender: member.gender,
        "Date of Birth": member.date_of_birth,
        Role: member.role,
        "Roll Number": member.roll_no,
        Course: member.course,
        Stream: member.stream,
        Branch: member.branch,
        "Course Start Year": member.course_start_year,
        "Course End Year": member.course_end_year,
        "Passed Out Year": member.passed_out_year,
        "College Name": member.college_name,
        "Current Location/Chapter": member.current_location,
        "Home Town": member.home_town,
        City: member.city,
        State: member.state,
        Country: member.country,
        Address: member.Address,
        "Zip Code": member.zip_code,
        Company: member.company,
        Position: member.position,
        "Current Work": member.current_work,
        "Work Experience": member.work_experience,
        "Professional Skills": member.professional_skills,
        "Industries Worked In": member.industries_worked_in,
        "Roles Played": member.roles_played,
        Bio: member.bio,
        "Educational Course": member.educational_course,
        "Educational Institute": member.educational_institute,
        "Account Status": member.approval_status?.status_display,
        "Account Type": member.approval_status?.account_type,
        "Is Active": member.approval_status?.is_active ? "Yes" : "No",
        "Is Staff": member.approval_status?.is_staff ? "Yes" : "No",
        "Last Login": member.approval_status?.last_login,
        "Date Joined": member.approval_status?.date_joined,
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [];
      const headers = Object.keys(excelData[0] || {});
      headers.forEach((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...excelData.map((row) => String(row[header] || "").length)
        );
        colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
      });
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Members");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `members_export_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      // Show success message
      toast.error(
        `Successfully exported ${selectedMembers.size} members to ${filename}`
      );
    } catch (error) {
      toast.error("Error exporting data to Excel. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // When filters change, always reset page to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [
    roleFilter,
    cityFilter,
    workedInFilter,
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
    chapterFilter,
    emailFilter,
    branchFilter,
    rollNoFilter,
    // Remove searchQuery from automatic dependencies
    manualSearchTrigger, // Add manual search trigger to dependencies
  ]);

  useEffect(() => {
    setSelectedMembers(new Set());
    setSelectAll(false);
  }, [
    roleFilter,
    cityFilter,
    workedInFilter,
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
    chapterFilter,
    emailFilter,
    branchFilter,
    rollNoFilter,
    currentPage,
    manualSearchTrigger, // Add manual search trigger to dependencies
  ]);

  // Whenever page, filters, or sorting change, fetch data
  useEffect(() => {
    fetchMembers();
  }, [
    currentPage,
    pageSize,
    roleFilter,
    cityFilter,
    workedInFilter,
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
    chapterFilter,
    emailFilter,
    branchFilter,
    rollNoFilter,
    sortField,
    sortDirection,
    manualSearchTrigger, // Add manual search trigger to dependencies
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

  // Handle sorting changes
  const handleSortChange = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }

    // Reset to first page when sorting changes
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
    setEmailFilter("");
    setCourseFilter("");
    setCollegeNameFilter("");
    setCurrentWorkFilter("");
    setChapterFilter("");
    setBranchFilter("");
    setRollNoFilter("");
    setCurrentPage(1);
    // Reset manual search trigger to ensure search is cleared
    setManualSearchTrigger((prev) => prev + 1);
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

  // Handle Enter key press for search
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setManualSearchTrigger((prev) => prev + 1);
    }
  };

  // Handle search input change (typing only, no auto-search)
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search button click
  const handleSearchClick = () => {
    setManualSearchTrigger((prev) => prev + 1);
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
                  className={`w-5 h-5 transform transition-transform ${showFilters ? "rotate-180" : ""
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

          {/* Selection Controls - Always visible */}
          {members.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={selectAllLoading}
                      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${selectAllLoading ? "opacity-50 cursor-wait" : ""
                        }`}
                    />
                    {selectAllLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-t-blue-600 border-r-blue-600 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="selectAll"
                    className={`ml-2 text-sm font-medium text-gray-700 ${selectAllLoading ? "opacity-50" : ""
                      }`}
                  >
                    {selectAllLoading
                      ? "Selecting all..."
                      : `Select All (${filteredTotal} total filtered results)`}
                  </label>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedMembers.size} selected
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedMembers(new Set());
                    setSelectAll(false);
                  }}
                  disabled={selectedMembers.size === 0}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedMembers.size === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-500 border border-red-200"
                    }`}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Selection
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={selectedMembers.size === 0 || exportLoading}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedMembers.size === 0 || exportLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                    }`}
                >
                  {exportLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export to Excel ({selectedMembers.size})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Filters Loading State or Grid */}
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

                <AutocompleteInput
                  id="branch-filter"
                  label="Branch"
                  placeholder="Select branch..."
                  value={branchFilter}
                  onChange={setBranchFilter}
                  filterType="branch"
                  options={dropdownFilters.branch || []}
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

                {/* Roll No Filter */}
                <AutocompleteInput
                  id="roll-no-filter"
                  label="Roll No"
                  placeholder="Search by roll no..."
                  value={rollNoFilter}
                  onChange={setRollNoFilter}
                  filterType="roll_no"
                  options={dropdownFilters.roll_no || []}
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
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
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
                  label="Faculty "
                  placeholder="Select Faculty ..."
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

                <AutocompleteInput
                  id="email"
                  label="Email"
                  placeholder="Select email..."
                  value={emailFilter}
                  onChange={setEmailFilter}
                  filterType="email"
                  options={dropdownFilters.email || []}
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
                <div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
                  <label
                    htmlFor="search-box"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Search
                  </label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="search-box"
                        type="text"
                        className={`w-full border rounded-lg px-3 py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${searchQuery
                          ? "border-blue-400 bg-blue-50/30 shadow-sm shadow-blue-100"
                          : "border-gray-300"
                          }`}
                        placeholder="Search by name, email, or roll no..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyPress}
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
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setManualSearchTrigger((prev) => prev + 1);
                          }}
                          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                          title="Clear search"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchClick}
                      className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors flex items-center justify-center shrink-0"
                      title="Search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
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
              chapterFilter ||
              genderFilter ||
              courseEndYearFilter ||
              companyFilter ||
              emailFilter) && (
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
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {filteredTotal > 0 ? (
                  <>
                    Showing {members.length} of {filteredTotal} members
                    {selectedMembers.size > 0 && (
                      <span className="ml-2 text-sm font-normal text-blue-600">
                        ({selectedMembers.size} selected)
                      </span>
                    )}
                  </>
                ) : (
                  "No members found"
                )}
              </h2>

              {/* Sorting Controls */}
              <div className="flex items-center gap-2">
                {/* <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortField}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="first_name">First Name</option>
                  <option value="last_name">Last Name</option>
                  <option value="passed_out_year">Passed Out Year</option>
                  <option value="college_name">College</option>
                  <option value="course">Course</option>
                  <option value="branch">Branch</option>
                  <option value="role">Role</option>
                  <option value="city">City</option>
                </select> */}

                <button
                  onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                  }
                  className="flex items-center gap-1 text-sm border border-gray-300 rounded-md px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortDirection === "asc" ? "Ascending" : "Descending"}
                  <svg
                    className={`w-4 h-4 ${sortDirection === "asc" ? "rotate-0" : "rotate-180"
                      } transition-transform`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

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
                  <div key={member.id} className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => handleMemberSelect(member.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/members/${member.username}`;
                      }}
                    >
                      {/* Profile Image */}
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                        <img
                          src={
                            member.profile_photo
                              ? `https://api.karpagamalumni.in/api/v1${member.profile_photo}`
                              : placeholder
                          }
                          alt={`${member.first_name || "Alumni"} ${member.last_name || ""
                            }`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            // Generate avatar with initials if image fails to load
                            e.target.src = getInitialsAvatar(
                              member.first_name,
                              member.last_name
                            );
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
                              <span className="truncate">
                                {member.worked_in}
                              </span>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
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
