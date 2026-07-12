import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { roleBase } from "../../../lib/useBasePath";
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Map as MapIcon, Layers, Moon, Users, RefreshCw, LocateFixed, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingScreen, ErrorScreen } from '../../Shared/ui';
import {
  API_MAP_SCATTER, API_USER_LOCATIONS, API_CHAPTER_MEMBERS,
  API_MAP_USER_SEARCH, API_USER_MAP_LOCATION, API_ORIGIN,
} from '../../../config/api';

const MEDIA_BASE_URL = API_ORIGIN;

// Fallback icon if user has no profile photo
const defaultIconUrl = 'https://img.icons8.com/fluency/48/000000/user-location.png';

// Zoom thresholds that switch scatter granularity: world view opens on
// country bubbles, and zooming in progressively reveals state, city, then
// the exact address pin (only for members who've shared a precise location).
const ZOOM_BREAKS = { country: 1, state: 5, city: 8, address: 11 };
const INITIAL_ZOOM = 3;
const BUCKET_ORDER = ['country', 'state', 'city', 'address'];
const BUCKET_KEY = { country: 'countries', state: 'states', city: 'cities', address: 'addresses' };
const BUCKET_COLOR = { country: '#059669', state: '#0d9488', city: '#0891b2' };
const BUCKET_LABEL = { country: 'Countries', state: 'States', city: 'Cities', address: 'Alumni' };
// Zoom to fly/jump to when revealing a single bubble/pin from a search result or drill-down click.
const REVEAL_ZOOM = { country: 4, state: 6, city: 10, address: 15 };

function bucketForZoom(zoom) {
  if (zoom >= ZOOM_BREAKS.address) return 'address';
  if (zoom >= ZOOM_BREAKS.city) return 'city';
  if (zoom >= ZOOM_BREAKS.state) return 'state';
  return 'country';
}

// Reports zoom changes up to the parent so layer visibility only recomputes
// when the zoom actually crosses a bucket boundary, not on every pixel of zoom.
function ZoomWatcher({ onZoom }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  return null;
}

// ─── Country / state: a scattered dot-cluster instead of one solid bubble ──
// Points are laid out with a golden-angle spiral (deterministic, no RNG) so
// re-renders are stable and the dots read as an organic "scatter" rather
// than a grid. Capped so a country of 18k members still draws a bounded,
// legible number of points.
const MAX_SCATTER_DOTS = 50;
const GOLDEN_ANGLE_RAD = (137.50776 * Math.PI) / 180;
const SCATTER_RADIUS_DEG = { country: 1.4, state: 0.55 };

function scatterOffsets(count, maxRadiusDeg) {
  const n = Math.min(count, MAX_SCATTER_DOTS);
  const points = [];
  for (let i = 0; i < n; i++) {
    const r = maxRadiusDeg * Math.sqrt(i / n);
    const theta = i * GOLDEN_ANGLE_RAD;
    points.push([r * Math.sin(theta), r * Math.cos(theta)]);
  }
  return points;
}

const ScatterCluster = React.memo(function ScatterCluster({ item, onDrillDown }) {
  const offsets = useMemo(
    () => scatterOffsets(item.count, SCATTER_RADIUS_DEG[item.bucket] || 1),
    [item.count, item.bucket]
  );
  const color = BUCKET_COLOR[item.bucket];
  return offsets.map(([dLat, dLng], i) => (
    <CircleMarker
      key={i}
      center={[item.lat + dLat, item.lng + dLng]}
      radius={5}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.7, opacity: 0.7, weight: 1 }}
      eventHandlers={{ click: () => onDrillDown(item) }}
    >
      {i === 0 && (
        <Tooltip direction="top" offset={[0, -6]}>
          <div className="text-xs">
            <p className="font-semibold">{item.label}{item.sublabel ? `, ${item.sublabel}` : ''}</p>
            <p className="text-gray-500">{item.count} alumni</p>
          </div>
        </Tooltip>
      )}
    </CircleMarker>
  ));
});

// ─── City: a pseudo-3D rectangular bar, height driven by member count ─────
// Pure-CSS isometric box (three clip-path faces) via a divIcon — no WebGL /
// 3D map library needed for a Leaflet map.
const CITY_FRONT = '#0891b2';
const CITY_TOP = '#67e8f9';
const CITY_SIDE = '#155e75';
const BAR_DEPTH = 8;
const BAR_WIDTH = 20;

const cityBarIconCache = new Map();
function cityBarIcon(count) {
  if (cityBarIconCache.has(count)) return cityBarIconCache.get(count);
  const h = Math.round(Math.min(70, Math.max(16, 16 + Math.log2(count + 1) * 9)));
  const w = BAR_WIDTH;
  const d = BAR_DEPTH;
  const iw = w + d;
  const ih = d + h;
  const label = count > 999 ? `${Math.round(count / 1000)}k` : count;
  const html = `
    <div style="position:relative;width:${iw}px;height:${ih}px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
      <div style="position:absolute;inset:0;background:${CITY_TOP};clip-path:polygon(0px ${d}px, ${w}px ${d}px, ${iw}px 0px, ${d}px 0px);"></div>
      <div style="position:absolute;inset:0;background:${CITY_SIDE};clip-path:polygon(${w}px ${d}px, ${iw}px 0px, ${iw}px ${h}px, ${w}px ${ih}px);"></div>
      <div style="position:absolute;inset:0;background:${CITY_FRONT};clip-path:polygon(0px ${d}px, ${w}px ${d}px, ${w}px ${ih}px, 0px ${ih}px);"></div>
      <div style="position:absolute;left:0;top:${ih - 15}px;width:${w}px;text-align:center;color:#fff;font-size:9px;font-weight:700;line-height:1;pointer-events:none;">${label}</div>
    </div>`;
  const icon = L.divIcon({
    html, className: 'bg-transparent border-0', iconSize: [iw, ih], iconAnchor: [Math.round(w / 2), ih],
  });
  cityBarIconCache.set(count, icon);
  return icon;
}

const CityBarMarker = React.memo(function CityBarMarker({ item, onDrillDown }) {
  const icon = useMemo(() => cityBarIcon(item.count), [item.count]);
  return (
    <Marker
      position={[item.lat, item.lng]}
      icon={icon}
      eventHandlers={{ click: () => onDrillDown(item) }}
    >
      <Tooltip direction="top" offset={[0, -80]}>
        <div className="text-xs">
          <p className="font-semibold">{item.label}{item.sublabel ? `, ${item.sublabel}` : ''}</p>
          <p className="text-gray-500">{item.count} alumni</p>
        </div>
      </Tooltip>
    </Marker>
  );
});

const UserMarker = React.memo(function UserMarker({ loc, onSelect }) {
  const details = loc.user_details || {};
  const iconUrl = details.profile_photo ? `${MEDIA_BASE_URL}${details.profile_photo}` : defaultIconUrl;
  const icon = useMemo(() => new L.Icon({
    iconUrl, iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -35],
    className: 'rounded-full border-2 border-white shadow-lg',
  }), [iconUrl]);

  return (
    <Marker
      position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(loc) }}
    >
      <Tooltip direction="top" offset={[0, -32]}>
        <div className="text-xs">
          <p className="font-semibold">{details.username}</p>
          {details.Address && <p className="text-gray-500">{details.Address}</p>}
        </div>
      </Tooltip>
    </Marker>
  );
});

const EMPTY_SCATTER = { countries: [], states: [], cities: [], addresses: [] };

// Main Map component
const MapComponent = () => {
  const [scatter, setScatter] = useState(EMPTY_SCATTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapView, setMapView] = useState('streets');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityMembers, setCityMembers] = useState(null);
  const [cityMembersLoading, setCityMembersLoading] = useState(false);
  const [cityMembersError, setCityMembersError] = useState(null);
  const [userMatches, setUserMatches] = useState([]);
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchScatter();
  }, []);

  useEffect(() => {
    if (!locationStatus) return;
    const t = setTimeout(() => setLocationStatus(null), 4000);
    return () => clearTimeout(t);
  }, [locationStatus]);

  // Debounced backend search across ALL alumni by name — the client-side
  // matching above only covers scatter data (place bubbles + the small set
  // of opted-in precise pins), not the full member directory.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setUserMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_MAP_USER_SEARCH}?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        setUserMatches(await res.json());
      } catch {
        // Local matches still show even if this fails.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Deep link from a member's profile ("View in map"): /map?user=<username>
  // flies to wherever the map would plot them once scatter data is loaded.
  useEffect(() => {
    const username = searchParams.get('user');
    if (!username || !mapRef.current) return;
    (async () => {
      try {
        const res = await fetch(`${API_USER_MAP_LOCATION}?username=${encodeURIComponent(username)}`);
        if (!res.ok) {
          setLocationStatus({ type: 'error', text: 'This member has no location on the map.' });
          return;
        }
        const loc = await res.json();
        mapRef.current.flyTo([loc.lat, loc.lng], ZOOM_BREAKS[loc.precision] ?? ZOOM_BREAKS.city, { duration: 1.2 });
      } finally {
        searchParams.delete('user');
        setSearchParams(searchParams, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const fetchScatter = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_MAP_SCATTER, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setScatter({
        countries: (data.countries || []).map((d) => ({ ...d, bucket: 'country' })),
        states: (data.states || []).map((d) => ({ ...d, bucket: 'state' })),
        cities: (data.cities || []).map((d) => ({ ...d, bucket: 'city' })),
        addresses: data.addresses || [],
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const zoomBucket = useMemo(() => bucketForZoom(zoom), [zoom]);
  const zoomRank = BUCKET_ORDER.indexOf(zoomBucket);

  // Layers stack: each bubble level only ever shows members who couldn't be
  // resolved any finer, so every level up to the current zoom rank renders
  // simultaneously (a country-only member never magically gets a city dot).
  const visibleBubbles = useMemo(() => {
    const out = [];
    if (zoomRank >= 0) out.push(...scatter.countries);
    if (zoomRank >= 1) out.push(...scatter.states);
    if (zoomRank >= 2) out.push(...scatter.cities);
    return out;
  }, [scatter, zoomRank]);
  const visibleAddresses = zoomRank >= 3 ? scatter.addresses : [];

  const totalOnMap = visibleBubbles.length + visibleAddresses.length;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const results = [];
    for (const bucket of ['countries', 'states', 'cities']) {
      for (const item of scatter[bucket]) {
        if (item.label.toLowerCase().includes(q) || (item.sublabel || '').toLowerCase().includes(q)) {
          results.push(item);
        }
      }
    }
    const seenUsernames = new Set();
    for (const loc of scatter.addresses) {
      const details = loc.user_details || {};
      if ((details.username || '').toLowerCase().includes(q)) {
        seenUsernames.add(details.username);
        results.push({
          bucket: 'address', key: `addr-${loc.id}`, label: details.username,
          sublabel: details.Address || [details.city, details.state, details.country].filter(Boolean).join(', '),
          count: 1, lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude), loc,
        });
      }
    }
    // Backend name search across the full directory — dedupe against the
    // opted-in pins already matched above.
    for (const u of userMatches) {
      if (seenUsernames.has(u.username)) continue;
      seenUsernames.add(u.username);
      results.push({
        bucket: 'address', key: `user-${u.username}`, label: u.name || u.username,
        sublabel: [u.city, u.state, u.country].filter(Boolean).join(', '),
        count: 1,
        loc: { user_details: { username: u.username, profile_photo: u.profile_photo, Address: null } },
      });
    }
    return results.slice(0, 50);
  }, [searchQuery, scatter, userMatches]);

  const flyToItem = useCallback((item) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([item.lat, item.lng], REVEAL_ZOOM[item.bucket], { duration: 1.2 });
  }, []);

  const handleDrillDown = useCallback((item) => {
    if (!mapRef.current) return;
    const nextBucket = BUCKET_ORDER[Math.min(BUCKET_ORDER.indexOf(item.bucket) + 1, BUCKET_ORDER.length - 1)];
    mapRef.current.flyTo([item.lat, item.lng], ZOOM_BREAKS[nextBucket], { duration: 1 });
  }, []);

  // City is the finest bubble level we have (no individual coordinates to
  // drill further into), so clicking a bar instead loads its members into
  // the sidebar rather than zooming in on nothing new.
  const handleCityClick = useCallback(async (item) => {
    setSearchQuery('');
    setSelectedCity(item);
    setCityMembersLoading(true);
    setCityMembersError(null);
    try {
      const res = await fetch(
        `${API_CHAPTER_MEMBERS}?type=city&value=${encodeURIComponent(item.label)}&page_size=50`
      );
      if (!res.ok) throw new Error('Failed to load members for this city');
      const data = await res.json();
      setCityMembers(data);
    } catch (err) {
      setCityMembersError(err.message);
      setCityMembers(null);
    } finally {
      setCityMembersLoading(false);
    }
  }, []);

  const closeCityPanel = useCallback(() => {
    setSelectedCity(null);
    setCityMembers(null);
    setCityMembersError(null);
  }, []);

  const handleResultClick = useCallback((item) => {
    if (item.bucket === 'address') {
      navigate(`${roleBase()}/members/${item.loc.user_details.username}`);
      return;
    }
    flyToItem(item);
  }, [flyToItem, navigate]);

  const shareMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus({ type: 'error', text: 'Geolocation is not supported by this browser.' });
      return;
    }
    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(API_USER_LOCATIONS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: String(pos.coords.latitude),
              longitude: String(pos.coords.longitude),
            }),
          });
          if (!res.ok) throw new Error('Failed to save your location');
          setLocationStatus({ type: 'success', text: 'Your location is now shared on the map.' });
          await fetchScatter();
          if (mapRef.current) {
            mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], ZOOM_BREAKS.address, { duration: 1.2 });
          }
        } catch (err) {
          setLocationStatus({ type: 'error', text: err.message });
        } finally {
          setSharingLocation(false);
        }
      },
      (err) => {
        setSharingLocation(false);
        setLocationStatus({ type: 'error', text: err.message || 'Could not get your location.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapTileOptions = {
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    dark: {
      url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href=\"https://stadiamaps.com/\">Stadia Maps</a>'
    }
  };

  // Center on the largest country bubble so the initial view frames where
  // alumni actually are, falling back to a neutral world view otherwise.
  const defaultPosition = useMemo(() => {
    if (scatter.countries.length > 0) {
      const top = [...scatter.countries].sort((a, b) => b.count - a.count)[0];
      return [top.lat, top.lng];
    }
    return [20, 0];
  }, [scatter.countries]);

  if (loading) return <LoadingScreen message="Loading map data…" />;

  if (error) return <ErrorScreen message={error} onRetry={fetchScatter} retryLabel="Retry" />;

  return (
    <div className="fixed left-0 right-0 top-14 bottom-0 pb-14 lg:pb-0 overflow-hidden flex flex-col bg-gray-50">
      {/* Sub-header */}
      <div className="glass-header border-b border-gray-200/70 z-30 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900 flex-shrink-0 flex items-center gap-1.5">
            <MapIcon size={16} className="text-emerald-600" /> Alumni Map
          </h1>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search country, state, city, or name…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedCity(null); }}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <span className="flex-shrink-0 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {totalOnMap}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar: city members, search results, or a level summary when idle (desktop only) */}
        <div className="w-60 bg-white border-r border-gray-100 hidden md:flex md:flex-col flex-shrink-0 overflow-hidden">
          {selectedCity ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2 flex-shrink-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{selectedCity.label}</p>
                  {selectedCity.sublabel && <p className="text-xs text-gray-400 truncate">{selectedCity.sublabel}</p>}
                  {cityMembers && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cityMembers.results.length} of {cityMembers.count} shown
                    </p>
                  )}
                </div>
                <button
                  onClick={closeCityPanel}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
                {cityMembersLoading && (
                  <div className="p-6 text-center text-sm text-gray-400">Loading members…</div>
                )}
                {cityMembersError && (
                  <div className="p-6 text-center text-sm text-red-400">{cityMembersError}</div>
                )}
                {cityMembers?.results.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => navigate(`${roleBase()}/members/${member.username}`)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={member.profile_photo || defaultIconUrl}
                      alt={member.username}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{member.name || member.username}</p>
                      {member.label && <p className="text-xs text-gray-400 truncate">{member.label}</p>}
                    </div>
                  </div>
                ))}
                {cityMembers && cityMembers.results.length === 0 && !cityMembersLoading && (
                  <div className="p-6 text-center text-sm text-gray-400">No members found</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {searchResults ? (
                <div className="divide-y divide-gray-50">
                  {searchResults.map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleResultClick(item)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {item.bucket === 'address' ? (
                        <img
                          src={item.loc.user_details.profile_photo ? `${MEDIA_BASE_URL}${item.loc.user_details.profile_photo}` : defaultIconUrl}
                          alt={item.label}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100 flex-shrink-0"
                        />
                      ) : (
                        <span
                          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                          style={{ background: BUCKET_COLOR[item.bucket] }}
                        >
                          {item.count}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                        <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="p-6 text-center text-sm text-gray-400">No matches found</div>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">On the map</p>
                  {['country', 'state', 'city'].map((bucket) => (
                    <div key={bucket} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-gray-50">
                      <span className="flex items-center gap-2 text-gray-600">
                        <span className="w-2 h-2 rounded-full" style={{ background: BUCKET_COLOR[bucket] || '#6b7280' }} />
                        {BUCKET_LABEL[bucket]}
                      </span>
                      <span className="font-semibold text-gray-800">{scatter[BUCKET_KEY[bucket]].length}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-2">
                    Search a country, state, city, or alumni name to jump straight to it. Click a city bar to see its members.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={defaultPosition}
            zoom={INITIAL_ZOOM}
            scrollWheelZoom={true}
            className="h-full w-full"
            zoomControl={false}
            ref={mapRef}
          >
            <ZoomWatcher onZoom={setZoom} />
            <ZoomControl position="bottomright" />
            <TileLayer attribution={mapTileOptions[mapView].attribution} url={mapTileOptions[mapView].url} />
            {visibleBubbles.map((item) => (
              item.bucket === 'city'
                ? <CityBarMarker key={`${item.bucket}-${item.key}`} item={item} onDrillDown={handleCityClick} />
                : <ScatterCluster key={`${item.bucket}-${item.key}`} item={item} onDrillDown={handleDrillDown} />
            ))}
            {visibleAddresses.map((loc) => (
              <UserMarker
                key={loc.id}
                loc={loc}
                onSelect={(l) => navigate(`${roleBase()}/members/${l.user_details.username}`)}
              />
            ))}
          </MapContainer>

          {/* Scatter level indicator */}
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur rounded-xl shadow px-3 py-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BUCKET_COLOR[zoomBucket] || '#059669' }} />
            <span className="text-xs font-semibold text-gray-600">
              Showing by {BUCKET_LABEL[zoomBucket]} · {totalOnMap}
            </span>
          </div>

          {/* Map controls — kept clear of the native zoom control (bottom-right)
              so neither stack of buttons hides the other. */}
          <div className="absolute top-3 right-3 bg-white rounded-2xl shadow-lg p-1.5 z-[400] flex flex-col gap-1">
            {[["streets", MapIcon], ["satellite", Layers], ["dark", Moon]].map(([view, Icon]) => (
              <button key={view} onClick={() => setMapView(view)} title={view}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${mapView === view ? "bg-emerald-100 text-emerald-700" : "hover:bg-gray-100 text-gray-500"}`}>
                <Icon size={16} />
              </button>
            ))}
            <div className="h-px bg-gray-100 mx-1" />
            <button onClick={shareMyLocation} disabled={sharingLocation} title="Share my location"
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500 transition disabled:opacity-60">
              <LocateFixed size={16} className={sharingLocation ? 'animate-pulse text-emerald-600' : ''} />
            </button>
            <button onClick={fetchScatter} title="Refresh"
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500 transition">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Mobile summary pill */}
          <div className="md:hidden absolute bottom-6 left-3 right-28 z-[400]">
            <div className="bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2">
              <Users size={15} className="text-emerald-600" />
              <span className="text-sm font-semibold text-gray-700">{totalOnMap} on map</span>
            </div>
          </div>

          {/* Location share status banner */}
          {locationStatus && (
            <div
              className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-[500] px-4 py-2.5 rounded-xl shadow-2xl text-sm font-semibold text-white transition-opacity ${locationStatus.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
            >
              {locationStatus.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
