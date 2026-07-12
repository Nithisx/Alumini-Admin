import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Pagination from "./Pagination";
import { getProfilePlaceholderByGender } from "../../lib/profilePlaceholders";
import { useBreadcrumb } from "./BreadcrumbContext";
import { API_ORIGIN } from "../../config/api";
import { useMembersStore } from "../../stores";
import { useBasePath } from "../../lib/useBasePath";

const MEDIA_BASE_URL = API_ORIGIN;
const PAGE_SIZE = 24;


const CHAPTER_TYPE_LABELS = {
  country: "Country",
  city: "City",
  state: "State",
  chapter: "Chapter",
};

const getMediaUrl = (uri) => {
  if (!uri) return "";
  if (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("data:") || uri.startsWith("blob:")) return uri;
  return uri.startsWith("/") ? `${MEDIA_BASE_URL}${uri}` : `${MEDIA_BASE_URL}/${uri}`;
};

function MemberCard({ member, memberPath }) {
  const { first_name, last_name, username, profile_photo, gender, company, position, city, state, country, chapter, passed_out_year } = member;
  const avatar = profile_photo ? getMediaUrl(profile_photo) : getProfilePlaceholderByGender(gender);
  const location = [city, state, country].filter(Boolean).join(", ");

  return (
    <Link
      to={`${memberPath}/${username}`}
      className="bg-white rounded-2xl shadow hover:shadow-lg border border-green-100 p-5 flex flex-col items-center text-center gap-3 transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
    >
      <img
        src={avatar}
        alt={username}
        className="w-20 h-20 rounded-full object-cover border-4 border-green-100 group-hover:border-green-300 transition-colors"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = getProfilePlaceholderByGender(gender);
        }}
      />
      <div>
        <p className="font-bold text-green-800 text-base leading-tight">
          {[first_name, last_name].filter(Boolean).join(" ") || username}
        </p>
        {(position || company) && (
          <p className="text-green-600 text-xs mt-0.5 line-clamp-1">
            {[position, company].filter(Boolean).join(" @ ")}
          </p>
        )}
      </div>
      {location && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </span>
      )}
      {passed_out_year && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          Batch {passed_out_year}
        </span>
      )}
      {chapter && (
        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
          {chapter}
        </span>
      )}
    </Link>
  );
}

export default function ChapterDetail() {
  const membersStore = useMembersStore();
  const { type, value } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbLabel } = useBreadcrumb();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Prefix-free routing since the refactor (useBasePath() returns ""), so the
  // back/member links are just "/dashboard" and "/members". The old
  // pathSegments[1] logic broke here — it resolved to "chapters" from
  // /chapters/:type/:value and produced /chapters/dashboard etc.
  const roleBase = useBasePath();
  const backPath = `${roleBase}/dashboard`;
  const memberPath = `${roleBase}/members`;

  const decodedValue = decodeURIComponent(value || "");
  const typeLabel = CHAPTER_TYPE_LABELS[type] || type;

  // Register chapter name as breadcrumb label for the :value segment
  useEffect(() => {
    if (decodedValue) setBreadcrumbLabel(value, decodedValue);
  }, [value, decodedValue]);

  const fetchMembers = useCallback(async (page, q) => {
    setLoading(true);
    setError(null);
    try {
      const data = await membersStore.fetchChapterMembers({
        type,
        value: decodedValue,
        page,
        pageSize,
        search: q,
      });
      setMembers(data.results ?? data);
      setTotalCount(data.count ?? (data.results ? data.count : (data.length ?? 0)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, decodedValue, pageSize, membersStore]);

  useEffect(() => {
    setCurrentPage(1);
    fetchMembers(1, search);
  }, [type, value, pageSize]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
    fetchMembers(1, searchInput);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchMembers(page, search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-6 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-green-200 text-sm font-medium uppercase tracking-wide">{typeLabel} Chapter</p>
                <h1 className="text-2xl sm:text-3xl font-bold">{decodedValue}</h1>
                {!loading && (
                  <p className="text-green-200 text-sm mt-1">{totalCount} member{totalCount !== 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search members by name..."
            className="flex-1 border border-green-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setCurrentPage(1); fetchMembers(1, ""); }}
              className="px-4 py-2.5 border border-green-300 bg-white hover:bg-green-50 text-green-700 text-sm rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent mb-3"></div>
              <p className="text-green-700 font-medium">Loading members...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-200 shadow">
            <p className="text-red-600 font-semibold mb-2">Failed to load members</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={() => fetchMembers(currentPage, search)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              Retry
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-green-200 shadow">
            <svg className="w-12 h-12 text-green-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-green-700 font-medium">No members found</p>
            {search && <p className="text-gray-500 text-sm mt-1">Try a different search term</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {members.map((member) => (
                <MemberCard key={member.id || member.username} member={member} memberPath={memberPath} />
              ))}
            </div>

            {totalCount > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
