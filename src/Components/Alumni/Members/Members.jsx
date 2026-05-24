"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import * as XLSX from "xlsx";
import Pagination from "../../Shared/Pagination";
import MultiSelectAutocomplete, { HighlightMatch } from "../../Shared/MultiSelectAutocomplete";
import ActiveFilterChips from "../../Shared/ActiveFilterChips";
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

const readQueryArray = (key) => {
  const raw = readQueryValue(key, "");
  if (!raw) return [];
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
};

const valueMatchesAny = (memberValue, filterValues) => {
  if (memberValue === null || memberValue === undefined) return false;
  if (!filterValues || filterValues.length === 0) return false;
  const mv = String(memberValue).trim().toLowerCase();
  if (!mv) return false;
  return filterValues.some((fv) => {
    const f = String(fv).trim().toLowerCase();
    return f === mv || mv.includes(f);
  });
};


export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [roleFilter, setRoleFilter] = useState(() => readQueryArray("role"));
  const [cityFilter, setCityFilter] = useState(() => readQueryArray("city"));
  const [workedInFilter, setWorkedInFilter] = useState(() => readQueryArray("worked_in"));
  const [searchQuery, setSearchQuery] = useState(() => readQueryValue("search"));
  const [rolesPlayedFilter, setRolesPlayedFilter] = useState(() => readQueryArray("roles_played"));
  const [genderFilter, setGenderFilter] = useState(() => readQueryArray("gender"));
  const [courseEndYearFilter, setCourseEndYearFilter] = useState(() => readQueryArray("course_end_year"));
  const [companyFilter, setCompanyFilter] = useState(() => readQueryArray("company"));
  const [countryFilter, setCountryFilter] = useState(() => readQueryArray("country"));
  const [stateFilter, setStateFilter] = useState(() => readQueryArray("state"));
  const [passedOutYearFilter, setPassedOutYearFilter] = useState(() => readQueryArray("passed_out_year"));
  const [courseFilter, setCourseFilter] = useState(() => readQueryArray("course"));
  const [collegeNameFilter, setCollegeNameFilter] = useState(() => readQueryArray("college_name"));
  const [currentWorkFilter, setCurrentWorkFilter] = useState(() => readQueryArray("current_work"));
  const [chapterFilter, setChapterFilter] = useState(() => readQueryArray("current_location")); // Add chapter filter state
  const [branchFilter, setBranchFilter] = useState(() => readQueryArray("branch")); // Add branch filter state
  const [emailFilter, setEmailFilter] = useState(() => readQueryArray("email")); // Declare emailFilter state
  const [rollNoFilter, setRollNoFilter] = useState(() => readQueryArray("roll_no")); // Declare rollNoFilter state
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

  // Group by state
  const [groupBy, setGroupBy] = useState(() => readQueryValue("group_by", ""));
  const [currentUserYear, setCurrentUserYear] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");

  // Fetch current user's profile to get passed_out_year and role
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
    if (!token) return;
    fetch(`${BASE_URL}/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then((r) => r.json())
      .then((profile) => {
        setCurrentUserYear(profile?.passed_out_year || null);
        setCurrentUserRole((profile?.role || "").toLowerCase());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (roleFilter.length > 0) params.set("role", roleFilter.join(","));
    if (cityFilter.length > 0) params.set("city", cityFilter.join(","));
    if (workedInFilter.length > 0) params.set("worked_in", workedInFilter.join(","));
    if (searchQuery) params.set("search", searchQuery);
    if (rolesPlayedFilter.length > 0) params.set("roles_played", rolesPlayedFilter.join(","));
    if (genderFilter.length > 0) params.set("gender", genderFilter.join(","));
    if (courseEndYearFilter.length > 0) params.set("course_end_year", courseEndYearFilter.join(","));
    if (companyFilter.length > 0) params.set("company", companyFilter.join(","));
    if (countryFilter.length > 0) params.set("country", countryFilter.join(","));
    if (stateFilter.length > 0) params.set("state", stateFilter.join(","));
    if (passedOutYearFilter.length > 0) params.set("passed_out_year", passedOutYearFilter.join(","));
    if (courseFilter.length > 0) params.set("course", courseFilter.join(","));
    if (collegeNameFilter.length > 0) params.set("college_name", collegeNameFilter.join(","));
    if (currentWorkFilter.length > 0) params.set("current_work", currentWorkFilter.join(","));
    if (chapterFilter.length > 0) params.set("current_location", chapterFilter.join(","));
    if (emailFilter.length > 0) params.set("email", emailFilter.join(","));
    if (branchFilter.length > 0) params.set("branch", branchFilter.join(","));
    if (rollNoFilter.length > 0) params.set("roll_no", rollNoFilter.join(","));

    params.set("page", currentPage.toString());
    params.set("page_size", pageSize.toString());
    params.set("sort_field", sortField);
    params.set("sort_direction", sortDirection);
    if (groupBy) params.set("group_by", groupBy);

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
    groupBy,
    showFilters,
  ]);

  // Fetch dropdown filter options
  const fetchDropdownFilters = async () => {
    setFiltersLoading(true);
    try {
      const params = new URLSearchParams();

      // Add ALL current filters to the request
      if (roleFilter.length > 0) params.append("role", roleFilter.join(","));
      if (cityFilter.length > 0) params.append("city", cityFilter.join(","));
      if (workedInFilter.length > 0) params.append("worked_in", workedInFilter.join(","));
      if (rolesPlayedFilter.length > 0) params.append("roles_played", rolesPlayedFilter.join(","));
      if (searchQuery) params.append("search", searchQuery);
      if (genderFilter.length > 0) params.append("gender", genderFilter.join(","));
      if (courseEndYearFilter.length > 0) params.append("course_end_year", courseEndYearFilter.join(","));
      if (companyFilter.length > 0) params.append("company", companyFilter.join(","));
      if (countryFilter.length > 0) params.append("country", countryFilter.join(","));
      if (stateFilter.length > 0) params.append("state", stateFilter.join(","));
      if (passedOutYearFilter.length > 0) params.append("passed_out_year", passedOutYearFilter.join(","));
      if (courseFilter.length > 0) params.append("course", courseFilter.join(","));
      if (collegeNameFilter.length > 0) params.append("college_name", collegeNameFilter.join(","));
      if (currentWorkFilter.length > 0) params.append("current_work", currentWorkFilter.join(","));
      if (chapterFilter.length > 0) params.append("current_location", chapterFilter.join(","));
      if (emailFilter.length > 0) params.append("email", emailFilter.join(","));
      if (branchFilter.length > 0) params.append("branch", branchFilter.join(","));
      if (rollNoFilter.length > 0) params.append("roll_no", rollNoFilter.join(","));

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

    // Add sorting parameter — desc = newest/largest first (no prefix), asc = oldest/smallest first (- prefix)
    const orderingValue = sortDirection === "desc" ? sortField : `-${sortField}`;
    params.append("ordering", orderingValue);

    if (roleFilter.length > 0) params.append("role", roleFilter.join(","));
    if (cityFilter.length > 0) params.append("city", cityFilter.join(","));
    if (workedInFilter.length > 0) params.append("worked_in", workedInFilter.join(","));
    if (rolesPlayedFilter.length > 0) params.append("roles_played", rolesPlayedFilter.join(","));
    if (searchQuery) params.append("search", searchQuery);
    if (genderFilter.length > 0) params.append("gender", genderFilter.join(","));
    if (courseEndYearFilter.length > 0)
      params.append("course_end_year", courseEndYearFilter.join(","));
    if (companyFilter.length > 0) params.append("company", companyFilter.join(","));
    if (countryFilter.length > 0) params.append("country", countryFilter.join(","));
    if (stateFilter.length > 0) params.append("state", stateFilter.join(","));
    // "Your Batchmates" group by overrides passed_out_year filter with current user's year
    const effectiveYear = groupBy === "batchmates" && currentUserYear
      ? currentUserYear
      : passedOutYearFilter;
    if (effectiveYear) params.append("passed_out_year", effectiveYear);
    if (courseFilter.length > 0) params.append("course", courseFilter.join(","));
    if (collegeNameFilter.length > 0) params.append("college_name", collegeNameFilter.join(","));
    if (currentWorkFilter.length > 0) params.append("current_work", currentWorkFilter.join(","));
    if (chapterFilter.length > 0) params.append("current_location", chapterFilter.join(","));
    if (emailFilter.length > 0) params.append("email", emailFilter.join(","));
    if (branchFilter.length > 0) params.append("branch", branchFilter.join(","));
    if (rollNoFilter.length > 0) params.append("roll_no", rollNoFilter.join(","));
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

    if (roleFilter.length > 0) baseParams.append("role", roleFilter.join(","));
    if (cityFilter.length > 0) baseParams.append("city", cityFilter.join(","));
    if (workedInFilter.length > 0) baseParams.append("worked_in", workedInFilter.join(","));
    if (rolesPlayedFilter.length > 0) baseParams.append("roles_played", rolesPlayedFilter.join(","));
    if (searchQuery) baseParams.append("search", searchQuery);
    if (genderFilter.length > 0) baseParams.append("gender", genderFilter.join(","));
    if (courseEndYearFilter.length > 0)
      baseParams.append("course_end_year", courseEndYearFilter.join(","));
    if (companyFilter.length > 0) baseParams.append("company", companyFilter.join(","));
    if (countryFilter.length > 0) baseParams.append("country", countryFilter.join(","));
    if (stateFilter.length > 0) baseParams.append("state", stateFilter.join(","));
    if (passedOutYearFilter.length > 0)
      baseParams.append("passed_out_year", passedOutYearFilter.join(","));
    if (courseFilter.length > 0) baseParams.append("course", courseFilter.join(","));
    if (collegeNameFilter.length > 0) baseParams.append("college_name", collegeNameFilter.join(","));
    if (currentWorkFilter.length > 0) baseParams.append("current_work", currentWorkFilter.join(","));
    if (chapterFilter.length > 0) baseParams.append("current_location", chapterFilter.join(","));
    if (emailFilter.length > 0) baseParams.append("email", emailFilter.join(","));
    if (branchFilter.length > 0) baseParams.append("branch", branchFilter.join(","));
    if (rollNoFilter.length > 0) baseParams.append("roll_no", rollNoFilter.join(","));

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
    groupBy,
    currentUserYear,
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
    setRoleFilter([]);
    setCityFilter([]);
    setWorkedInFilter([]);
    setRolesPlayedFilter([]);
    setSearchQuery("");
    setGenderFilter([]);
    setCourseEndYearFilter([]);
    setCompanyFilter([]);
    setCountryFilter([]);
    setStateFilter([]);
    setPassedOutYearFilter([]);
    setEmailFilter([]);
    setCourseFilter([]);
    setCollegeNameFilter([]);
    setCurrentWorkFilter([]);
    setChapterFilter([]);
    setBranchFilter([]);
    setRollNoFilter([]);
    setGroupBy("");
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
                id="search-box"
                type="text"
                className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Search name, email, roll no…"
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
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm transition-all ${showFilters ? "block" : "hidden"}`}>
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
          {(
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* Role Filter */}
                <MultiSelectAutocomplete
                  id="role-filter"
                  label="Role"
                  placeholder="Select role..."
                  values={roleFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="course-filter"
                  label="Course"
                  placeholder="Select course..."
                  values={courseFilter} loading={filtersLoading}
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

                <MultiSelectAutocomplete
                  id="branch-filter"
                  label="Branch"
                  placeholder="Select branch..."
                  values={branchFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="roll-no-filter"
                  label="Roll No"
                  placeholder="Search by roll no..."
                  values={rollNoFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="passed-out-year-filter"
                  label="Passed Out Year"
                  placeholder="Select year..."
                  values={passedOutYearFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="city-filter"
                  label="City"
                  placeholder="Select city..."
                  values={cityFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="state-filter"
                  label="State"
                  placeholder="Select state..."
                  values={stateFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="country-filter"
                  label="Country"
                  placeholder="Select country..."
                  values={countryFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="college-name-filter"
                  label="Faculty "
                  placeholder="Select Faculty ..."
                  values={collegeNameFilter} loading={filtersLoading}
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
                <MultiSelectAutocomplete
                  id="current-work-filter"
                  label="Working In"
                  placeholder="Select company..."
                  values={currentWorkFilter} loading={filtersLoading}
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

                <MultiSelectAutocomplete
                  id="email"
                  label="Email"
                  placeholder="Select email..."
                  values={emailFilter} loading={filtersLoading}
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
        </div>

        <ActiveFilterChips
          onClearAll={handleResetFilters}
          filters={[
            { key: "role", label: "Role", values: roleFilter, onRemove: (v) => setRoleFilter(roleFilter.filter((x) => x !== v)) },
            { key: "course", label: "Course", values: courseFilter, onRemove: (v) => setCourseFilter(courseFilter.filter((x) => x !== v)) },
            { key: "branch", label: "Branch", values: branchFilter, onRemove: (v) => setBranchFilter(branchFilter.filter((x) => x !== v)) },
            { key: "roll_no", label: "Roll No", values: rollNoFilter, onRemove: (v) => setRollNoFilter(rollNoFilter.filter((x) => x !== v)) },
            { key: "passed_out_year", label: "Passed Out", values: passedOutYearFilter, onRemove: (v) => setPassedOutYearFilter(passedOutYearFilter.filter((x) => x !== v)) },
            { key: "city", label: "City", values: cityFilter, onRemove: (v) => setCityFilter(cityFilter.filter((x) => x !== v)) },
            { key: "state", label: "State", values: stateFilter, onRemove: (v) => setStateFilter(stateFilter.filter((x) => x !== v)) },
            { key: "country", label: "Country", values: countryFilter, onRemove: (v) => setCountryFilter(countryFilter.filter((x) => x !== v)) },
            { key: "college_name", label: "Faculty", values: collegeNameFilter, onRemove: (v) => setCollegeNameFilter(collegeNameFilter.filter((x) => x !== v)) },
            { key: "current_work", label: "Working In", values: currentWorkFilter, onRemove: (v) => setCurrentWorkFilter(currentWorkFilter.filter((x) => x !== v)) },
            { key: "email", label: "Email", values: emailFilter, onRemove: (v) => setEmailFilter(emailFilter.filter((x) => x !== v)) },
            { key: "gender", label: "Gender", values: genderFilter, onRemove: (v) => setGenderFilter(genderFilter.filter((x) => x !== v)) },
            { key: "company", label: "Company", values: companyFilter, onRemove: (v) => setCompanyFilter(companyFilter.filter((x) => x !== v)) },
            { key: "current_location", label: "Chapter", values: chapterFilter, onRemove: (v) => setChapterFilter(chapterFilter.filter((x) => x !== v)) },
            { key: "course_end_year", label: "Course End", values: courseEndYearFilter, onRemove: (v) => setCourseEndYearFilter(courseEndYearFilter.filter((x) => x !== v)) },
            { key: "worked_in", label: "Worked In", values: workedInFilter, onRemove: (v) => setWorkedInFilter(workedInFilter.filter((x) => x !== v)) },
            { key: "roles_played", label: "Roles", values: rolesPlayedFilter, onRemove: (v) => setRolesPlayedFilter(rolesPlayedFilter.filter((x) => x !== v)) },
            ...(searchQuery ? [{ key: "search", label: "Search", values: [searchQuery], onRemove: () => setSearchQuery("") }] : []),
          ]}
        />

        {/* Results summary + sort/group bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-bold text-gray-800">{filteredTotal}</span> {filteredTotal === 1 ? "member" : "members"}
            {(roleFilter.length || cityFilter.length || searchQuery || countryFilter.length || stateFilter.length || passedOutYearFilter.length || courseFilter.length || collegeNameFilter.length || currentWorkFilter.length || chapterFilter.length || emailFilter.length || branchFilter.length || rollNoFilter.length || companyFilter.length || genderFilter.length || courseEndYearFilter.length || workedInFilter.length || rolesPlayedFilter.length || groupBy) ? (
              <span className="ml-2 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">filtered</span>
            ) : null}
            {groupBy === "batchmates" && currentUserYear && (
              <span className="ml-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Batch {currentUserYear}</span>
            )}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort by */}
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
            {/* Direction toggle */}
            <button
              onClick={() => { setSortDirection(sortDirection === "asc" ? "desc" : "asc"); setCurrentPage(1); }}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 transition"
            >
              {sortDirection === "desc" ? "↓ Descending" : "↑ Ascending"}
            </button>
            {/* Group by — only for alumni/student roles */}
            {(currentUserRole === "alumni" || currentUserRole === "student" || currentUserRole === "") && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Group by</span>
                <select
                  value={groupBy}
                  onChange={(e) => { setGroupBy(e.target.value); setCurrentPage(1); }}
                  className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer"
                >
                  <option value="">None</option>
                  {currentUserYear && (
                    <option value="batchmates">Your Batchmates</option>
                  )}
                  <option value="batch">Group by Batch</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Group by batch: render batch sections */}
        {groupBy === "batch" && !loading && members.length > 0 && (() => {
          const byYear = {};
          members.forEach((m) => {
            const yr = m.passed_out_year || "Unknown";
            if (!byYear[yr]) byYear[yr] = [];
            byYear[yr].push(m);
          });
          const sortedYears = Object.keys(byYear).sort((a, b) => {
            if (a === "Unknown") return 1;
            if (b === "Unknown") return -1;
            return sortDirection === "desc" ? Number(b) - Number(a) : Number(a) - Number(b);
          });
          return (
            <div className="space-y-6">
              {sortedYears.map((yr) => (
                <div key={yr}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-gray-700">Batch {yr}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{byYear[yr].length} members</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {byYear[yr].map((member) => (
                      <div
                        key={member.id}
                        onClick={() => {
                          sessionStorage.setItem(MEMBERS_RETURN_URL_KEY, `${window.location.pathname}${window.location.search}`);
                          window.location.href = `/alumni/members/${member.username}`;
                        }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                          <img
                            src={member.profile_photo ? `https://api.karpagamalumni.in${member.profile_photo}` : getProfilePlaceholderByGender(member.gender)}
                            alt={`${member.first_name} ${member.last_name}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.onerror = null; e.target.src = getProfilePlaceholderByGender(member.gender); }}
                          />
                          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(member.role)} ${valueMatchesAny(member.role, roleFilter) ? "ring-2 ring-yellow-300" : ""}`}>
                            {member.role}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            <HighlightMatch text={`${member.first_name || ""} ${member.last_name || ""}`.trim()} query={searchQuery || ""} />
                          </p>
                          {member.city && (
                            <p className={`text-xs truncate mt-0.5 ${valueMatchesAny(member.city, cityFilter) ? "text-blue-700 font-semibold" : "text-gray-400"}`}>
                              <HighlightMatch text={member.city} query={(cityFilter && cityFilter[0]) || ""} />
                            </p>
                          )}
                          {member.current_work && (
                            <p className={`text-xs truncate mt-0.5 ${valueMatchesAny(member.current_work, currentWorkFilter) ? "text-blue-700 font-semibold" : "text-emerald-600"}`}>
                              <HighlightMatch text={member.current_work} query={(currentWorkFilter && currentWorkFilter[0]) || ""} />
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

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
        ) : groupBy !== "batch" ? (
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
                  window.location.href = `/alumni/members/${member.username}`;
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
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(member.role)} ${valueMatchesAny(member.role, roleFilter) ? "ring-2 ring-yellow-300" : ""}`}>
                    {member.role}
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    <HighlightMatch text={`${member.first_name || ""} ${member.last_name || ""}`.trim()} query={searchQuery || ""} />
                  </p>
                  {member.city && (
                    <p className={`text-xs truncate mt-0.5 ${valueMatchesAny(member.city, cityFilter) ? "text-blue-700 font-semibold" : "text-gray-400"}`}>
                      <HighlightMatch text={member.city} query={(cityFilter && cityFilter[0]) || ""} />
                    </p>
                  )}
                  {member.current_work && (
                    <p className={`text-xs truncate mt-0.5 ${valueMatchesAny(member.current_work, currentWorkFilter) || valueMatchesAny(member.current_work, companyFilter) ? "text-blue-700 font-semibold" : "text-emerald-600"}`}>
                      <HighlightMatch text={member.current_work} query={(currentWorkFilter && currentWorkFilter[0]) || (companyFilter && companyFilter[0]) || ""} />
                    </p>
                  )}
                  {member.course && valueMatchesAny(member.course, courseFilter) && (
                    <p className="text-xs truncate mt-0.5 text-purple-700 font-medium">Course: <HighlightMatch text={member.course} query={(courseFilter && courseFilter[0]) || ""} /></p>
                  )}
                  {member.branch && valueMatchesAny(member.branch, branchFilter) && (
                    <p className="text-xs truncate mt-0.5 text-purple-700 font-medium">Branch: <HighlightMatch text={member.branch} query={(branchFilter && branchFilter[0]) || ""} /></p>
                  )}
                  {member.college_name && valueMatchesAny(member.college_name, collegeNameFilter) && (
                    <p className="text-xs truncate mt-0.5 text-purple-700 font-medium">Faculty: <HighlightMatch text={member.college_name} query={(collegeNameFilter && collegeNameFilter[0]) || ""} /></p>
                  )}
                  {member.passed_out_year && valueMatchesAny(member.passed_out_year, passedOutYearFilter) && (
                    <p className="text-xs truncate mt-0.5 text-purple-700 font-medium">Passed Out: {member.passed_out_year}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

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
