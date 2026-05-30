"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Pagination from "../../Shared/Pagination";
import MultiSelectAutocomplete, { HighlightMatch } from "../../Shared/MultiSelectAutocomplete";
import ActiveFilterChips from "../../Shared/ActiveFilterChips";
import { getProfilePlaceholderByGender } from "../../../lib/profilePlaceholders";

const TOKEN =
  typeof window !== "undefined" ? localStorage.getItem("Token") : null;
const BASE_URL = "https://api.karpagamalumni.in/api/v1";
const API_URL = `${BASE_URL}/admin-members/`;
const DROPDOWN_FILTERS_URL = `${BASE_URL}/dynamic-dropdown-filters/`;

const MEMBERS_RETURN_URL_KEY = "members:returnUrl";

const readQueryValue = (key, fallback = "") => {
  if (typeof window === "undefined") return fallback;
  const value = new URLSearchParams(window.location.search).get(key);
  return value ?? fallback;
};

const readQueryArray = (key) => {
  const raw = readQueryValue(key, "");
  if (!raw) return [];
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
};

const readQueryNumber = (key, fallback) => {
  const raw = readQueryValue(key, "");
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Compare any value (string/number) case-insensitively to any string in the list.
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

// ── Export field definitions ───────────────────────────────────────────────
const EXPORT_FIELD_GROUPS = [
  {
    label: "Identity",
    fields: [
      { key: "username", label: "Username" },
      { key: "first_name", label: "First Name" },
      { key: "last_name", label: "Last Name" },
      { key: "gender", label: "Gender" },
      { key: "date_of_birth", label: "Date of Birth" },
      { key: "role", label: "Role" },
    ],
  },
  {
    label: "Contact",
    fields: [
      { key: "email", label: "Email" },
      { key: "secondary_email", label: "Secondary Email" },
      { key: "phone", label: "Phone" },
    ],
  },
  {
    label: "Academic",
    fields: [
      { key: "roll_no", label: "Roll Number" },
      { key: "course", label: "Course" },
      { key: "stream", label: "Stream" },
      { key: "branch", label: "Branch" },
      { key: "course_start_year", label: "Course Start Year" },
      { key: "course_end_year", label: "Course End Year" },
      { key: "passed_out_year", label: "Passed Out Year" },
      { key: "college_name", label: "College Name" },
    ],
  },
  {
    label: "Professional",
    fields: [
      { key: "company", label: "Company" },
      { key: "position", label: "Position" },
      { key: "current_work", label: "Current Work" },
      { key: "work_experience", label: "Work Experience" },
      { key: "professional_skills", label: "Professional Skills" },
      { key: "industries_worked_in", label: "Industries Worked In" },
      { key: "roles_played", label: "Roles Played" },
    ],
  },
  {
    label: "Location",
    fields: [
      { key: "current_location", label: "Chapter / Current Location" },
      { key: "home_town", label: "Home Town" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "country", label: "Country" },
      { key: "Address", label: "Address" },
      { key: "zip_code", label: "Zip Code" },
    ],
  },
  {
    label: "Account",
    fields: [
      { key: "account_status", label: "Account Status" },
      { key: "account_type", label: "Account Type" },
      { key: "is_active", label: "Is Active" },
      { key: "is_staff", label: "Is Staff" },
      { key: "last_login", label: "Last Login" },
      { key: "date_joined", label: "Date Joined" },
    ],
  },
  {
    label: "Other",
    fields: [
      { key: "bio", label: "Bio" },
      { key: "educational_course", label: "Educational Course" },
      { key: "educational_institute", label: "Educational Institute" },
    ],
  },
];

const ALL_FIELD_KEYS = EXPORT_FIELD_GROUPS.flatMap((g) => g.fields).map((f) => f.key);

// ── Export Modal ───────────────────────────────────────────────────────────
function ExportModal({ onClose, onExport, loading, selectedCount, filteredTotal, exportFields, setExportFields, exportScope, setExportScope, exportFormat, setExportFormat }) {
  const allSelected = exportFields.length === ALL_FIELD_KEYS.length;

  const toggleField = (key) => {
    setExportFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleGroup = (groupFields) => {
    const keys = groupFields.map((f) => f.key);
    const allOn = keys.every((k) => exportFields.includes(k));
    if (allOn) {
      setExportFields((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setExportFields((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const toggleAll = () => {
    setExportFields(allSelected ? [] : [...ALL_FIELD_KEYS]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <h2 className="text-base font-bold text-gray-900">Export Members</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Scope */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Export Scope</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "selected", label: `Selected (${selectedCount})`, disabled: selectedCount === 0 },
                { value: "page", label: "Current Page" },
                { value: "all", label: `All Filtered (${filteredTotal})` },
              ].map(({ value, label, disabled }) => (
                <button
                  key={value}
                  disabled={disabled}
                  onClick={() => !disabled && setExportScope(value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${
                    exportScope === value
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : disabled
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">File Format</p>
            <div className="flex gap-2">
              {[
                { value: "xlsx", label: "Excel (.xlsx)" },
                { value: "csv", label: "CSV (.csv)" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setExportFormat(value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${
                    exportFormat === value
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Fields — {exportFields.length} / {ALL_FIELD_KEYS.length} selected
              </p>
              <button
                onClick={toggleAll}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="space-y-3">
              {EXPORT_FIELD_GROUPS.map((group) => {
                const groupKeys = group.fields.map((f) => f.key);
                const allGroupOn = groupKeys.every((k) => exportFields.includes(k));
                const someGroupOn = groupKeys.some((k) => exportFields.includes(k));
                return (
                  <div key={group.label} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleGroup(group.fields)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <span className="text-xs font-bold text-gray-700">{group.label}</span>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${allGroupOn ? "bg-emerald-600 border-emerald-600" : someGroupOn ? "bg-emerald-200 border-emerald-400" : "border-gray-300"}`}>
                        {(allGroupOn || someGroupOn) && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={allGroupOn ? "M5 13l4 4L19 7" : "M5 12h14"} />
                          </svg>
                        )}
                      </span>
                    </button>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100">
                      {group.fields.map((field) => {
                        const on = exportFields.includes(field.key);
                        return (
                          <button
                            key={field.key}
                            onClick={() => toggleField(field.key)}
                            className={`flex items-center gap-2 px-3 py-2 bg-white text-left text-xs transition hover:bg-emerald-50 ${on ? "text-gray-900" : "text-gray-400"}`}
                          >
                            <span className={`w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${on ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                              {on && (
                                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            {field.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {exportFields.length === 0 ? "Select at least one field." : `${exportFields.length} column${exportFields.length !== 1 ? "s" : ""} will be exported.`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onExport}
              disabled={loading || exportFields.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Exporting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  // Multi-select filters — each holds an array of selected values
  const [roleFilter, setRoleFilter] = useState(() => readQueryArray("role"));
  const [cityFilter, setCityFilter] = useState(() => readQueryArray("city"));
  const [workedInFilter, setWorkedInFilter] = useState(() => readQueryArray("worked_in"));
  const [searchQuery, setSearchQuery] = useState(() => readQueryValue("search"));
  const [nameSearchQuery, setNameSearchQuery] = useState(() => readQueryValue("name_search"));
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
  const [chapterFilter, setChapterFilter] = useState(() => readQueryArray("current_location"));
  const [branchFilter, setBranchFilter] = useState(() => readQueryArray("branch"));
  const [emailFilter, setEmailFilter] = useState(() => readQueryArray("email"));
  const [rollNoFilter, setRollNoFilter] = useState(() => readQueryArray("roll_no"));
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState("selected"); // "selected" | "page" | "all"
  const [exportFormat, setExportFormat] = useState("xlsx"); // "xlsx" | "csv"
  const [exportFields, setExportFields] = useState(() =>
    EXPORT_FIELD_GROUPS.flatMap((g) => g.fields).map((f) => f.key)
  );

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
    const setArr = (key, arr) => { if (arr && arr.length > 0) params.set(key, arr.join(",")); };
    setArr("role", roleFilter);
    setArr("city", cityFilter);
    setArr("worked_in", workedInFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (nameSearchQuery) params.set("name_search", nameSearchQuery);
    setArr("roles_played", rolesPlayedFilter);
    setArr("gender", genderFilter);
    setArr("course_end_year", courseEndYearFilter);
    setArr("company", companyFilter);
    setArr("country", countryFilter);
    setArr("state", stateFilter);
    setArr("passed_out_year", passedOutYearFilter);
    setArr("course", courseFilter);
    setArr("college_name", collegeNameFilter);
    setArr("current_work", currentWorkFilter);
    setArr("current_location", chapterFilter);
    setArr("email", emailFilter);
    setArr("branch", branchFilter);
    setArr("roll_no", rollNoFilter);

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
      const addArr = (key, arr) => { if (arr && arr.length > 0) params.append(key, arr.join(",")); };
      addArr("role", roleFilter);
      addArr("city", cityFilter);
      addArr("worked_in", workedInFilter);
      addArr("roles_played", rolesPlayedFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (nameSearchQuery) params.append("name_search", nameSearchQuery);
      addArr("gender", genderFilter);
      addArr("course_end_year", courseEndYearFilter);
      addArr("company", companyFilter);
      addArr("country", countryFilter);
      addArr("state", stateFilter);
      addArr("passed_out_year", passedOutYearFilter);
      addArr("course", courseFilter);
      addArr("college_name", collegeNameFilter);
      addArr("current_work", currentWorkFilter);
      addArr("current_location", chapterFilter);
      addArr("email", emailFilter);
      addArr("branch", branchFilter);
      addArr("roll_no", rollNoFilter);

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

    const addArr = (key, arr) => { if (arr && arr.length > 0) params.append(key, arr.join(",")); };
    addArr("role", roleFilter);
    addArr("city", cityFilter);
    addArr("worked_in", workedInFilter);
    addArr("roles_played", rolesPlayedFilter);
    if (searchQuery) params.append("search", searchQuery);
    if (nameSearchQuery) params.append("name_search", nameSearchQuery);
    addArr("gender", genderFilter);
    addArr("course_end_year", courseEndYearFilter);
    addArr("company", companyFilter);
    addArr("country", countryFilter);
    addArr("state", stateFilter);
    addArr("passed_out_year", passedOutYearFilter);
    addArr("course", courseFilter);
    addArr("college_name", collegeNameFilter);
    addArr("current_work", currentWorkFilter);
    addArr("current_location", chapterFilter);
    addArr("email", emailFilter);
    addArr("branch", branchFilter);
    addArr("roll_no", rollNoFilter);
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

    const addArr = (key, arr) => { if (arr && arr.length > 0) baseParams.append(key, arr.join(",")); };
    addArr("role", roleFilter);
    addArr("city", cityFilter);
    addArr("worked_in", workedInFilter);
    addArr("roles_played", rolesPlayedFilter);
    if (searchQuery) baseParams.append("search", searchQuery);
    if (nameSearchQuery) baseParams.append("name_search", nameSearchQuery);
    addArr("gender", genderFilter);
    addArr("course_end_year", courseEndYearFilter);
    addArr("company", companyFilter);
    addArr("country", countryFilter);
    addArr("state", stateFilter);
    addArr("passed_out_year", passedOutYearFilter);
    addArr("course", courseFilter);
    addArr("college_name", collegeNameFilter);
    addArr("current_work", currentWorkFilter);
    addArr("current_location", chapterFilter);
    addArr("email", emailFilter);
    addArr("branch", branchFilter);
    addArr("roll_no", rollNoFilter);

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

  const handleExport = async () => {
    if (exportFields.length === 0) {
      toast.error("Select at least one field to export.");
      return;
    }
    if (exportScope === "selected" && selectedMembers.size === 0) {
      toast.error("No members selected.");
      return;
    }

    setExportLoading(true);
    try {
      const body = {
        format: exportFormat,
        fields: exportFields,
      };

      if (exportScope === "selected") {
        body.ids = [...selectedMembers];
      } else if (exportScope === "page") {
        body.ids = members.map((m) => m.id);
      } else {
        // All filtered — send active filters so backend queries server-side
        const filters = {};
        const setArr = (key, arr) => { if (arr && arr.length > 0) filters[key] = arr; };
        setArr("role", roleFilter);
        setArr("city", cityFilter);
        setArr("state", stateFilter);
        setArr("country", countryFilter);
        setArr("gender", genderFilter);
        setArr("course", courseFilter);
        setArr("branch", branchFilter);
        setArr("passed_out_year", passedOutYearFilter);
        setArr("course_end_year", courseEndYearFilter);
        setArr("college_name", collegeNameFilter);
        setArr("company", companyFilter);
        setArr("current_work", currentWorkFilter);
        setArr("current_location", chapterFilter);
        setArr("email", emailFilter);
        setArr("roll_no", rollNoFilter);
        setArr("worked_in", workedInFilter);
        setArr("roles_played", rolesPlayedFilter);
        if (searchQuery) filters.search = searchQuery;
        if (nameSearchQuery) filters.name_search = nameSearchQuery;
        body.filters = filters;
      }

      const response = await axios.post(
        `${BASE_URL}/members/export/`,
        body,
        {
          headers: { Authorization: `Token ${TOKEN}`, "Content-Type": "application/json" },
          responseType: "blob",
        }
      );

      const ext = exportFormat === "xlsx" ? "xlsx" : "csv";
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `members_export_${timestamp}.${ext}`;
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const approxCount = exportScope === "selected"
        ? selectedMembers.size
        : exportScope === "page"
        ? members.length
        : filteredTotal;
      toast.success(`Exported ~${approxCount} members as ${ext.toUpperCase()}.`);
      setShowExportModal(false);
    } catch {
      toast.error("Export failed. Please try again.");
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
    setRoleFilter([]);
    setCityFilter([]);
    setWorkedInFilter([]);
    setRolesPlayedFilter([]);
    setSearchQuery("");
    setNameSearchQuery("");
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
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          loading={exportLoading}
          selectedCount={selectedMembers.size}
          filteredTotal={filteredTotal}
          exportFields={exportFields}
          setExportFields={setExportFields}
          exportScope={exportScope}
          setExportScope={setExportScope}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
        />
      )}
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
            <button
              onClick={() => {
                if (selectedMembers.size > 0) setExportScope("selected");
                else setExportScope("page");
                setShowExportModal(true);
              }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
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

          {/* Filter grid — suggestions load per-dropdown so the panel stays interactive */}
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

        {/* Active filter chips — quick view of every selected value with remove */}
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
            ...(nameSearchQuery ? [{ key: "name_search", label: "Name", values: [nameSearchQuery], onRemove: () => setNameSearchQuery("") }] : []),
          ]}
        />

        {/* Results summary + sort bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-bold text-gray-800">{filteredTotal}</span> {filteredTotal === 1 ? "member" : "members"}
            {(roleFilter.length || cityFilter.length || searchQuery || nameSearchQuery || countryFilter.length || stateFilter.length || passedOutYearFilter.length || courseFilter.length || collegeNameFilter.length || currentWorkFilter.length || chapterFilter.length || emailFilter.length || branchFilter.length || rollNoFilter.length || companyFilter.length || genderFilter.length || courseEndYearFilter.length || workedInFilter.length || rolesPlayedFilter.length) ? (
              <span className="ml-2 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">filtered</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Select mode toggle */}
            <button
              onClick={() => {
                const next = !selectionMode;
                setSelectionMode(next);
                if (!next) { setSelectedMembers(new Set()); setSelectAll(false); }
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${selectionMode ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {selectionMode ? "Selecting" : "Select"}
            </button>
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

        {/* Selection bar — visible only in selection mode */}
        {selectionMode && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 flex-wrap">
            <span className="text-sm font-semibold text-emerald-800">
              {selectedMembers.size === 0 ? "No members selected" : `${selectedMembers.size} selected`}
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {/* Select current page */}
              <button
                onClick={() => {
                  const newSet = new Set(selectedMembers);
                  members.forEach((m) => newSet.add(m.id));
                  setSelectedMembers(newSet);
                }}
                className="text-xs font-medium text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 transition"
              >
                + This page
              </button>
              {/* Select all filtered */}
              <button
                onClick={handleSelectAll}
                disabled={selectAllLoading}
                className="text-xs font-medium text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 transition disabled:opacity-50"
              >
                {selectAllLoading ? "Loading…" : selectAll ? "Deselect all" : `Select all ${filteredTotal}`}
              </button>
              {/* Clear selection */}
              {selectedMembers.size > 0 && (
                <button
                  onClick={() => { setSelectedMembers(new Set()); setSelectAll(false); }}
                  className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 transition"
                >
                  Clear
                </button>
              )}
              {/* Export selected */}
              {selectedMembers.size > 0 && (
                <button
                  onClick={() => { setExportScope("selected"); setShowExportModal(true); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export {selectedMembers.size}
                </button>
              )}
            </div>
          </div>
        )}

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
            {members.map((member) => {
              const isSelected = selectedMembers.has(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => {
                    if (selectionMode) {
                      handleMemberSelect(member.id);
                    } else {
                      sessionStorage.setItem(
                        MEMBERS_RETURN_URL_KEY,
                        `${window.location.pathname}${window.location.search}`
                      );
                      window.location.href = `/admin/members/${member.username}`;
                    }
                  }}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden cursor-pointer group hover:shadow-md transition-all ${isSelected ? "border-emerald-400 ring-2 ring-emerald-400" : "border-gray-100"}`}
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
                    {/* Checkbox overlay in selection mode */}
                    {selectionMode && (
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isSelected ? "bg-emerald-500 border-emerald-500" : "bg-white/80 border-gray-300"}`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      <HighlightMatch text={`${member.first_name || ""} ${member.last_name || ""}`.trim()} query={nameSearchQuery || searchQuery} />
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
                    {/* Academic info — always show, highlight when actively filtered */}
                    {member.course && (
                      <p className={`text-xs truncate mt-0.5 font-medium ${valueMatchesAny(member.course, courseFilter) ? "text-purple-700" : "text-gray-500"}`}>
                        <HighlightMatch text={member.course} query={(courseFilter && courseFilter[0]) || ""} />
                      </p>
                    )}
                    {member.branch && (
                      <p className={`text-xs truncate mt-0.5 ${valueMatchesAny(member.branch, branchFilter) ? "text-purple-700 font-medium" : "text-gray-400"}`}>
                        <HighlightMatch text={member.branch} query={(branchFilter && branchFilter[0]) || ""} />
                      </p>
                    )}
                    {member.college_name && valueMatchesAny(member.college_name, collegeNameFilter) && (
                      <p className="text-xs truncate mt-0.5 text-purple-700 font-medium">Faculty: <HighlightMatch text={member.college_name} query={(collegeNameFilter && collegeNameFilter[0]) || ""} /></p>
                    )}
                    {member.passed_out_year && valueMatchesAny(member.passed_out_year, passedOutYearFilter) && (
                      <p className="text-xs truncate mt-0.5 text-purple-700 font-medium">Passed Out: {member.passed_out_year}</p>
                    )}
                    {member.state && valueMatchesAny(member.state, stateFilter) && (
                      <p className="text-xs truncate mt-0.5 text-gray-500">State: <HighlightMatch text={member.state} query={(stateFilter && stateFilter[0]) || ""} /></p>
                    )}
                    {member.country && valueMatchesAny(member.country, countryFilter) && (
                      <p className="text-xs truncate mt-0.5 text-gray-500">Country: <HighlightMatch text={member.country} query={(countryFilter && countryFilter[0]) || ""} /></p>
                    )}
                    {member.email && valueMatchesAny(member.email, emailFilter) && (
                      <p className="text-xs truncate mt-0.5 text-gray-500">
                        <HighlightMatch text={member.email} query={(emailFilter && emailFilter[0]) || ""} />
                      </p>
                    )}
                    {member.roll_no && valueMatchesAny(member.roll_no, rollNoFilter) && (
                      <p className="text-xs truncate mt-0.5 text-gray-500">Roll: <HighlightMatch text={member.roll_no} query={(rollNoFilter && rollNoFilter[0]) || ""} /></p>
                    )}
                  </div>
                </div>
              );
            })}
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
