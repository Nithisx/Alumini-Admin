"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import * as XLSX from "xlsx";
import Pagination from "../../Shared/Pagination";
import { getProfilePlaceholderByGender } from "../../../lib/profilePlaceholders";

const TOKEN =
  typeof window !== "undefined" ? localStorage.getItem("Token") : null;
const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const API_URL = `${BASE_URL}/admin-members/`;
const DROPDOWN_FILTERS_URL = `${BASE_URL}/dynamic-dropdown-filters/`;


const MAX_DROPDOWN_ITEMS = 50;
const MEMBERS_RETURN_URL_KEY = "members:returnUrl";

const readQueryValue = (key, fallback = "") => {
  if (typeof window === "undefined") return fallback;
  const value = new URLSearchParams(window.location.search).get(key);
  return value ?? fallback;
};

const readQueryNumber = (key, fallback) => {
  const raw = readQueryValue(key, "");
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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
  const [roleFilter, setRoleFilter] = useState(() => readQueryValue("role"));
  const [cityFilter, setCityFilter] = useState(() => readQueryValue("city"));
  const [workedInFilter, setWorkedInFilter] = useState(() => readQueryValue("worked_in"));
  const [searchQuery, setSearchQuery] = useState(() => readQueryValue("search"));
  const [nameSearchQuery, setNameSearchQuery] = useState(() => readQueryValue("name_search"));
  const [rolesPlayedFilter, setRolesPlayedFilter] = useState(() => readQueryValue("roles_played"));
  const [genderFilter, setGenderFilter] = useState(() => readQueryValue("gender"));
  const [courseEndYearFilter, setCourseEndYearFilter] = useState(() => readQueryValue("course_end_year"));
  const [companyFilter, setCompanyFilter] = useState(() => readQueryValue("company"));
  const [countryFilter, setCountryFilter] = useState(() => readQueryValue("country"));
  const [stateFilter, setStateFilter] = useState(() => readQueryValue("state"));
  const [passedOutYearFilter, setPassedOutYearFilter] = useState(() => readQueryValue("passed_out_year"));
  const [courseFilter, setCourseFilter] = useState(() => readQueryValue("course"));
  const [collegeNameFilter, setCollegeNameFilter] = useState(() => readQueryValue("college_name"));
  const [currentWorkFilter, setCurrentWorkFilter] = useState(() => readQueryValue("current_work"));
  const [chapterFilter, setChapterFilter] = useState(() => readQueryValue("current_location")); // Add chapter filter state
  const [branchFilter, setBranchFilter] = useState(() => readQueryValue("branch")); // Add branch filter state
  const [emailFilter, setEmailFilter] = useState(() => readQueryValue("email")); // Declare emailFilter state
  const [rollNoFilter, setRollNoFilter] = useState(() => readQueryValue("roll_no")); // Declare rollNoFilter state
  const [showFilters, setShowFilters] = useState(() => readQueryValue("show_filters") === "1");
  // Add a new state to track manual search triggers
  const [manualSearchTrigger, setManualSearchTrigger] = useState(0);

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
  const [currentPage, setCurrentPage] = useState(() => readQueryNumber("page", 1));
  const [pageSize, setPageSize] = useState(() => readQueryNumber("page_size", 25));
  const [totalPages, setTotalPages] = useState(1);

  // Sorting states
  const [sortField, setSortField] = useState(() => readQueryValue("sort_field", "date_joined"));
  const [sortDirection, setSortDirection] = useState(() => {
    const direction = readQueryValue("sort_direction", "asc");

    return direction === "asc" ? "asc" : "desc";
  }); // 'asc' or 'desc'

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (cityFilter) params.set("city", cityFilter);
    if (workedInFilter) params.set("worked_in", workedInFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (nameSearchQuery) params.set("name_search", nameSearchQuery);
    if (rolesPlayedFilter) params.set("roles_played", rolesPlayedFilter);
    if (genderFilter) params.set("gender", genderFilter);
    if (courseEndYearFilter) params.set("course_end_year", courseEndYearFilter);
    if (companyFilter) params.set("company", companyFilter);
    if (countryFilter) params.set("country", countryFilter);
    if (stateFilter) params.set("state", stateFilter);
    if (passedOutYearFilter) params.set("passed_out_year", passedOutYearFilter);
    if (courseFilter) params.set("course", courseFilter);
    if (collegeNameFilter) params.set("college_name", collegeNameFilter);
    if (currentWorkFilter) params.set("current_work", currentWorkFilter);
    if (chapterFilter) params.set("current_location", chapterFilter);
    if (emailFilter) params.set("email", emailFilter);
    if (branchFilter) params.set("branch", branchFilter);
    if (rollNoFilter) params.set("roll_no", rollNoFilter);

    params.set("page", currentPage.toString());
    params.set("page_size", pageSize.toString());
    params.set("sort_field", sortField);
    params.set("sort_direction", sortDirection);

    if (showFilters) params.set("show_filters", "1");

    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [
    currentPage,
    pageSize,
    sortField,
    sortDirection,
    roleFilter,
    cityFilter,
    workedInFilter,
    searchQuery,
    nameSearchQuery,
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
    showFilters,
  ]);

  // Fetch dropdown filter options
  const fetchDropdownFilters = async () => {
    setFiltersLoading(true);
    try {
      const params = new URLSearchParams();

      // Add ALL current filters to the request
      if (roleFilter) params.append("role", roleFilter);
      if (cityFilter) params.append("city", cityFilter);
      if (workedInFilter) params.append("worked_in", workedInFilter);
      if (rolesPlayedFilter) params.append("roles_played", rolesPlayedFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (nameSearchQuery) params.append("name_search", nameSearchQuery);
      if (genderFilter) params.append("gender", genderFilter);
      if (courseEndYearFilter) params.append("course_end_year", courseEndYearFilter);
      if (companyFilter) params.append("company", companyFilter);
      if (countryFilter) params.append("country", countryFilter);
      if (stateFilter) params.append("state", stateFilter);
      if (passedOutYearFilter) params.append("passed_out_year", passedOutYearFilter);
      if (courseFilter) params.append("course", courseFilter);
      if (collegeNameFilter) params.append("college_name", collegeNameFilter);
      if (currentWorkFilter) params.append("current_work", currentWorkFilter);
      if (chapterFilter) params.append("current_location", chapterFilter);
      if (emailFilter) params.append("email", emailFilter);
      if (branchFilter) params.append("branch", branchFilter);
      if (rollNoFilter) params.append("roll_no", rollNoFilter);

      // Build URL with or without parameters
      const url = params.toString()
        ? `${DROPDOWN_FILTERS_URL}?${params.toString()}`
        : DROPDOWN_FILTERS_URL;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      // Update to handle the new response structure with filters_data wrapper
      setDropdownFilters(response.data.filters_data);

      // Optional: You can also store metadata for display
      // setFilteredCount(response.data.filtered_count);
      // setTotalCount(response.data.total_count);

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
    const orderingValue = sortDirection === "desc" ? sortField : `-${sortField}`;
    params.append("ordering", orderingValue);

    if (roleFilter) params.append("role", roleFilter);
    if (cityFilter) params.append("city", cityFilter);
    if (workedInFilter) params.append("worked_in", workedInFilter);
    if (rolesPlayedFilter) params.append("roles_played", rolesPlayedFilter);
    if (searchQuery) params.append("search", searchQuery);
    if (nameSearchQuery) params.append("name_search", nameSearchQuery);
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

  // Fetch dropdown options when filters change
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
    manualSearchTrigger, // Keep manual search trigger
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
    if (nameSearchQuery) baseParams.append("name_search", nameSearchQuery);
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
  ]);

  // Handle Enter key press for search
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setManualSearchTrigger(prev => prev + 1);
    }
  };

  // Handle search input change (typing only, no auto-search)
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search button click
  const handleSearchClick = () => {
    setManualSearchTrigger(prev => prev + 1);
  };

  // Handle Enter key press for name-only filter search
  const handleNameSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setManualSearchTrigger(prev => prev + 1);
    }
  };

  // Handle name-only filter search input change
  const handleNameSearchChange = (e) => {
    setNameSearchQuery(e.target.value);
  };

  // Handle name-only filter search button click
  const handleNameSearchClick = () => {
    setManualSearchTrigger(prev => prev + 1);
  };

  // Update the useEffect for fetching members
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
    manualSearchTrigger, // Only trigger on manual search
  ]);

  // Update the useEffect for dropdown filters to include manual search trigger
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
    manualSearchTrigger, // Add manual search trigger to dependencies
  ]);

  // Update the useEffect for resetting page to include manual search trigger
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
    manualSearchTrigger, // Add manual search trigger to dependencies
  ]);

  // Update the useEffect for clearing selected members to include manual search trigger
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
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setRoleFilter("");
    setCityFilter("");
    setWorkedInFilter("");
    setRolesPlayedFilter("");
    setSearchQuery("");
    setNameSearchQuery("");
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
    setManualSearchTrigger(prev => prev + 1);
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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      {/* ── Instagram-style sticky header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-base font-bold text-gray-900 flex-shrink-0">Members</h1>
            {/* Inline search */}
            <div className="relative flex-1 min-w-[160px]">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="global-search-box"
                type="text"
                className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Global search: name, email, roll no, and more…"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyPress}
              />
            </div>
            <button
              onClick={handleSearchClick}
              className="flex-shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border transition ${showFilters ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="flex-shrink-0 text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-xl hover:bg-red-50 transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Filters Panel */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all ${showFilters ? "block" : "hidden"}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter & Search
              </h2>
            </div>

          {/* Filters Loading State or Grid */}
          {filtersLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <span className="text-gray-500 text-sm">Loading filters…</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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

                {/* Search Input - triggers on Enter or Search button click */}
                <div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
                  <label
                    htmlFor="name-search-box"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name Search
                  </label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="name-search-box"
                        type="text"
                        className={`w-full border rounded-lg px-3 py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${nameSearchQuery
                          ? "border-blue-400 bg-blue-50/30 shadow-sm shadow-blue-100"
                          : "border-gray-300"
                          }`}
                        placeholder="Search by member name only..."
                        value={nameSearchQuery}
                        onChange={handleNameSearchChange}
                        onKeyDown={handleNameSearchKeyPress}
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
                      {nameSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setNameSearchQuery("");
                            setManualSearchTrigger(prev => prev + 1);
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
                      onClick={handleNameSearchClick}
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
        </div>

        {/* Results summary + sort bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-bold text-gray-800">{filteredTotal}</span> {filteredTotal === 1 ? "member" : "members"}
            {(roleFilter || cityFilter || searchQuery || nameSearchQuery || countryFilter || stateFilter || passedOutYearFilter || courseFilter || collegeNameFilter || currentWorkFilter || chapterFilter || emailFilter) && (
              <span className="ml-2 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">filtered</span>
            )}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Sort by</span>
              <select
                value={sortField}
                onChange={(e) => { setSortField(e.target.value); setCurrentPage(1); }}
                className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer"
              >
                <option value="date_joined">Date Joined</option>
                <option value="first_name">Name</option>
                <option value="passed_out_year">Passout Year</option>
              </select>
            </div>
            <button
              onClick={() => { setSortDirection(sortDirection === "asc" ? "desc" : "asc"); setCurrentPage(1); }}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 transition"
            >
              {sortDirection === "desc" ? "↓ Descending" : "↑ Ascending"}
            </button>
          </div>
        </div>

        {/* Members content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[1,2,3,4,5,6,8,9,10].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No members found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          /* ── Instagram-style profile grid ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                onClick={() => {
                  sessionStorage.setItem(
                    MEMBERS_RETURN_URL_KEY,
                    `${window.location.pathname}${window.location.search}`
                  );
                  window.location.href = `/admin/members/${member.username}`;
                }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
              >
                {/* Square photo */}
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                  <img
                    src={member.profile_photo ? `https://api.karpagamalumni.in${member.profile_photo}` : getProfilePlaceholderByGender(member.gender)}
                    alt={`${member.first_name} ${member.last_name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.onerror = null; e.target.src = getProfilePlaceholderByGender(member.gender); }}
                  />
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 truncate">{member.first_name} {member.last_name}</p>
                  {member.city && <p className="text-xs text-gray-400 truncate mt-0.5">{member.city}</p>}
                  {member.current_work && <p className="text-xs text-emerald-600 truncate mt-0.5">{member.current_work}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {members.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTotal}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  );
}
