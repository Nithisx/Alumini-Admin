import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../Shared/ConfirmModal";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Search, Plus, Edit, Trash2, Globe, Phone, Mail, MapPin,
  Users, ChevronDown, ChevronRight, Building, Package, Settings,
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [industriesCollapsed, setIndustriesCollapsed] = useState(false);
  const [productsCollapsed, setProductsCollapsed] = useState(false);
  const [servicesCollapsed, setServicesCollapsed] = useState(false);

  const token = localStorage.getItem("Token");
  const BASE_URL = "https://api.karpagamalumni.in/api/v1";
  const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

  const [canModerate, setCanModerate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const canEditBusiness = (business) => {
    if (canModerate) return true;
    if (!currentUserId) return false;
    const ownerId = business.user ?? business.owner_details?.id ?? business.user_id;
    return ownerId && String(currentUserId) === String(ownerId);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [bRes, cRes, profileRes] = await Promise.all([
          axios.get(`${BASE_URL}/businesses/`, { headers: { Authorization: `Token ${token}` } }),
          axios.get(`${BASE_URL}/businesses/categories/`, { headers: { Authorization: `Token ${token}` } }),
          axios.get(`${BASE_URL}/profile/`, { headers: { Authorization: `Token ${token}` } }),
        ]);
        setBusinesses(bRes.data);
        setFilteredBusinesses(bRes.data);
        setCategories(cRes.data);
        const profile = profileRes.data;
        setCurrentUserId(profile?.id ?? null);
        const role = (profile?.role || "").toLowerCase();
        setCanModerate(Boolean(profile?.is_staff) || role === "admin" || role === "staff");
      } catch { }
      finally { setLoading(false); }
    })();
  }, [token]);

  useEffect(() => {
    let results = [...businesses];
    if (searchQuery) results = results.filter((b) =>
      b.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (categoryFilter) results = results.filter((b) => b.category === categoryFilter);
    if (cityFilter) results = results.filter((b) => b.city === cityFilter);
    if (stateFilter) results = results.filter((b) => b.state === stateFilter);
    if (selectedIndustry) results = results.filter((b) => b.category === selectedIndustry);
    if (selectedProduct) results = results.filter((b) => b.products?.includes(selectedProduct) || b.description?.toLowerCase().includes(selectedProduct.toLowerCase()));
    if (selectedService) results = results.filter((b) => b.services?.includes(selectedService) || b.description?.toLowerCase().includes(selectedService.toLowerCase()));
    setFilteredBusinesses(results);
  }, [searchQuery, categoryFilter, cityFilter, stateFilter, selectedIndustry, selectedProduct, selectedService, businesses]);

  const industries = categories.length > 0 ? categories :
    [...new Set(businesses.map((b) => b.category))].filter(Boolean).map((c) => ({ name: c, count: businesses.filter((b) => b.category === c).length }));
  const products = [...new Set(businesses.flatMap((b) => b.products || []))].filter(Boolean).map((p) => ({ name: p, count: businesses.filter((b) => b.products?.includes(p)).length }));
  const services = [...new Set(businesses.flatMap((b) => b.services || []))].filter(Boolean).map((s) => ({ name: s, count: businesses.filter((b) => b.services?.includes(s)).length }));

  const doDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/businesses/${id}/`, { headers: { Authorization: `Token ${token}` } });
      setBusinesses((p) => p.filter((b) => b.id !== id));
      setFilteredBusinesses((p) => p.filter((b) => b.id !== id));
      toast.success("Business deleted!");
    } catch { toast.error("Failed to delete business."); }
  };

  const SidebarSection = ({ title, items, collapsed, setCollapsed, selectedValue, onSelect, icon }) => (
    <div className="mb-5">
      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-between w-full text-left font-semibold text-gray-700 text-sm pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {React.createElement(icon, { className: "w-4 h-4 text-emerald-600" })}
          <span>{title}</span>
        </div>
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {!collapsed && (
        <div className="mt-2 space-y-1">
          {items.map((item) => (
            <label key={item.name} className="flex items-center cursor-pointer hover:bg-emerald-50 p-1.5 rounded-xl transition-colors">
              <input type="radio" name={title.toLowerCase()} value={item.name}
                checked={selectedValue === item.name}
                onChange={() => onSelect(selectedValue === item.name ? "" : item.name)}
                className="mr-2.5 text-emerald-600 accent-emerald-600" />
              <span className="text-sm text-gray-600 flex-1">{item.category || item.name}</span>
              {item.count && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{item.count}</span>}
            </label>
          ))}
          {selectedValue && (
            <button onClick={() => onSelect("")} className="text-xs text-emerald-600 hover:text-emerald-800 ml-1 mt-1">Clear</button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-6">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Business Listing"
        message="This will permanently delete this business listing."
        danger confirmText="Delete"
        onConfirm={() => { doDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* ── Sticky page header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-gray-900 flex-shrink-0">Business</h1>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search businesses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition ${showSidebar ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <Link
              to="/admin/business/add"
              className="flex-shrink-0 w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* ── Sidebar (slide in on mobile, static on desktop) ── */}
          {(showSidebar) && (
            <aside className="w-60 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-fit sticky top-32 hidden md:block">
              <SidebarSection title="Industries" items={industries} collapsed={industriesCollapsed} setCollapsed={setIndustriesCollapsed} selectedValue={selectedIndustry} onSelect={setSelectedIndustry} icon={Building} />
              <SidebarSection title="Products" items={products} collapsed={productsCollapsed} setCollapsed={setProductsCollapsed} selectedValue={selectedProduct} onSelect={setSelectedProduct} icon={Package} />
              <SidebarSection title="Services" items={services} collapsed={servicesCollapsed} setCollapsed={setServicesCollapsed} selectedValue={selectedService} onSelect={setSelectedService} icon={Settings} />
            </aside>
          )}

          {/* ── Mobile filter panel ── */}
          {showSidebar && (
            <>
              <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setShowSidebar(false)} />
              <div className="md:hidden fixed inset-x-0 bottom-14 bg-white border-t border-gray-200 z-40 p-4 rounded-t-3xl shadow-2xl max-h-[55vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">Filters</span>
                  <button onClick={() => setShowSidebar(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
                <SidebarSection title="Industries" items={industries} collapsed={industriesCollapsed} setCollapsed={setIndustriesCollapsed} selectedValue={selectedIndustry} onSelect={setSelectedIndustry} icon={Building} />
                <SidebarSection title="Products" items={products} collapsed={productsCollapsed} setCollapsed={setProductsCollapsed} selectedValue={selectedProduct} onSelect={setSelectedProduct} icon={Package} />
                <SidebarSection title="Services" items={services} collapsed={servicesCollapsed} setCollapsed={setServicesCollapsed} selectedValue={selectedService} onSelect={setSelectedService} icon={Settings} />
              </div>
            </>
          )}

          {/* ── Business feed ── */}
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-800">{filteredBusinesses.length}</span> businesses found
            </p>

            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Building className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No businesses found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredBusinesses.map((business) => (
                <Link
                  key={business.id}
                  to={`/admin/business/view/${business.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="flex gap-4 p-4">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {business.logo ? (
                        <img src={`${MEDIA_BASE_URL}${business.logo}`} alt={business.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                          <span className="text-emerald-600 text-xl font-bold">{business.business_name?.[0] || "B"}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-emerald-700 truncate">{business.business_name}</h3>
                          <p className="text-xs text-gray-400 font-medium">{business.category}</p>
                        </div>
                        {canEditBusiness(business) && (
                          <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                            <Link to={`/admin/business/edit/${business.id}`} onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition">
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(business.id); }}
                              className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {business.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{business.description}</p>
                      )}

                      {business.owner_details?.user_type === "admin" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 mb-2">
                          Official Listing
                        </span>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {business.address && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span className="truncate max-w-[120px]">{business.city}, {business.state}</span>
                          </div>
                        )}
                        {business.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{business.phone}</span>
                          </div>
                        )}
                        {business.website && (
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <Globe className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{business.website.replace(/(^\w+:|^)\/\//, "")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDirectory;
