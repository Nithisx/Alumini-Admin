import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Building, Trash2, Eye, X, MapPin, Phone, Globe, Users, Calendar, Tag } from "lucide-react";
import { getMyPosts } from "../../../lib/mypostsCache";
import { ViewStats, LikesList } from "../../Shared/EngagementStats";
import { API_BASE, API_ORIGIN } from "../../../config/api";

const TOKEN = localStorage.getItem("Token");
const BASE_URL = API_BASE;
const MEDIA_BASE_URL = API_ORIGIN;

const BusinessCard = ({ business, onDelete, onView }) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
    <div className="flex gap-3 p-4">
      {/* Logo */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-50 flex-shrink-0">
        {business.logo ? (
          <img src={`${MEDIA_BASE_URL}${business.logo}`} alt={business.business_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-emerald-600 text-xl font-bold">{business.business_name?.[0]}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-emerald-700 truncate">{business.business_name}</h3>
            <p className="text-xs text-gray-400">{business.category}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => onView(business)}
              className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(business.id)}
              className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {business.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{business.description}</p>}

        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(business.city || business.state) && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3 text-emerald-500" />{business.city}{business.state ? `, ${business.state}` : ""}
            </span>
          )}
          {business.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="w-3 h-3 text-emerald-500" />{business.phone}</span>}
          {business.website && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Globe className="w-3 h-3" />{business.website.replace(/(^\w+:|^)\/\//, "").slice(0, 20)}
            </span>
          )}
        </div>

        {business.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {business.keywords.slice(0, 3).map((k, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">{k}</span>
            ))}
            {business.keywords.length > 3 && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{business.keywords.length - 3}</span>}
          </div>
        )}
      </div>
    </div>

    <ViewStats
      contentType="businesses"
      contentId={business.id}
      totalViews={business.total_views}
      uniqueViewers={business.unique_viewers}
      recentViewers={business.recent_viewers}
    />

    <LikesList
      totalLikes={business.total_likes}
      likers={business.likers}
      recentLikers={business.recent_likers}
    />
  </div>
);

const ViewModal = ({ business, onClose }) => {
  if (!business) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Business Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-50 flex-shrink-0">
              {business.logo ? (
                <img src={`${MEDIA_BASE_URL}${business.logo}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-emerald-600 text-2xl font-bold">{business.business_name?.[0]}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{business.business_name}</h3>
              <p className="text-sm text-emerald-600 font-medium">{business.category}</p>
            </div>
          </div>

          {business.description && <p className="text-sm text-gray-600">{business.description}</p>}

          <div className="space-y-2">
            {(business.address || business.city) && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{[business.address, business.city, business.state, business.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {business.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-emerald-500" />{business.phone}</div>}
            {business.email && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-4 h-4 text-emerald-500">@</span>{business.email}</div>}
            {business.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-emerald-500" />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{business.website}</a>
              </div>
            )}
            {business.year_founded && <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="w-4 h-4 text-emerald-500" />Founded {business.year_founded}</div>}
            {business.employee_count && <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4 text-emerald-500" />{business.employee_count} employees</div>}
          </div>

          {business.keywords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {business.keywords.map((k, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">{k}</span>
                ))}
              </div>
            </div>
          )}

          {business.images?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Images</p>
              <div className="grid grid-cols-3 gap-1.5">
                {business.images.map((img, i) => (
                  <img key={i} src={`${MEDIA_BASE_URL}${img.image}`} alt="" className="w-full h-20 object-cover rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {business.owner_details && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              {business.owner_details.profile_photo ? (
                <img src={`${MEDIA_BASE_URL}${business.owner_details.profile_photo}`} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-500">{business.owner_details.first_name?.[0]}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">{business.owner_details.first_name} {business.owner_details.last_name}</p>
                <p className="text-xs text-gray-400">@{business.owner_details.username}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ id, onConfirm, onCancel }) => {
  if (!id) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Delete Business?</h3>
        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-xl font-semibold">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-xl font-semibold">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default function BusinessContribution() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewBusiness, setViewBusiness] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getMyPosts(TOKEN);
        setBusinesses(data.business || []);
      } catch { setError("Failed to load businesses."); } finally { setLoading(false); }
    })();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(`${BASE_URL}/businesses/${deleteConfirm}/`, { method: "DELETE", headers: { Authorization: `Token ${TOKEN}` } });
      if (!res.ok) throw new Error();
      setBusinesses((p) => p.filter((b) => b.id !== deleteConfirm));
      toast.success("Business deleted!");
    } catch { toast.error("Failed to delete business."); } finally { setDeleteConfirm(null); }
  };

  if (loading) return (
    <div className="space-y-3 p-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
          <div className="flex gap-3"><div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/2" /><div className="h-2 bg-gray-100 rounded w-3/4" /></div></div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <p className="text-red-500 font-medium">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl">Retry</button>
    </div>
  );

  if (businesses.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <Building className="w-8 h-8 text-emerald-300" />
      </div>
      <p className="text-gray-500 font-medium">No businesses yet</p>
      <p className="text-gray-400 text-sm mt-1 text-center">Your business contributions will appear here.</p>
    </div>
  );

  return (
    <>
      <div className="space-y-3 p-4">
        {businesses.map((b) => (
          <BusinessCard key={b.id} business={b} onDelete={setDeleteConfirm} onView={setViewBusiness} />
        ))}
      </div>
      <ViewModal business={viewBusiness} onClose={() => setViewBusiness(null)} />
      <DeleteModal id={deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} />
    </>
  );
}
