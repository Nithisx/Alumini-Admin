import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Map, Layers, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen, ErrorScreen } from '../../Shared/ui';

// Base URL for media files
const API_BASE_URL = 'https://api.karpagamalumni.in/api/v1';
const MEDIA_BASE_URL = 'https://api.karpagamalumni.in';

// Fallback icon if user has no profile photo
const defaultIconUrl = 'https://img.icons8.com/fluency/48/000000/user-location.png';

// Main Map component
const MapComponent = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapView, setMapView] = useState('streets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  // Filter locations based on search query
  const filteredLocations = locations.filter(user =>
    user.user_details.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch user locations when the component mounts
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/user_locations/`,
        {
          method: 'GET',
          headers: {
            Authorization: 'Token ff33e87bb30f1e7e4c66548b5869a8cbf360bfb9',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setLocations(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    if (mapRef.current) {
      mapRef.current.flyTo(
        [parseFloat(user.latitude), parseFloat(user.longitude)],
        16,
        { duration: 1.5 }
      );
    }
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

  // Center the map based on the first user's location or default coordinates
  const defaultPosition =
    locations.length > 0
      ? [
        parseFloat(locations[0].latitude),
        parseFloat(locations[0].longitude),
      ]
      : [10.921, 76.978];

  if (loading) return <LoadingScreen message="Loading map data…" />;

  if (error) return <ErrorScreen message={error} onRetry={fetchLocations} retryLabel="Retry" />;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* Sub-header */}
      <div className="glass-header border-b border-gray-200/70 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900 flex-shrink-0 flex items-center gap-1.5">
            <Map size={16} className="text-emerald-600" /> Alumni Map
          </h1>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <span className="flex-shrink-0 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {filteredLocations.length}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* User sidebar (desktop only) */}
        <div className="w-60 bg-white border-r border-gray-100 overflow-y-auto hidden md:block flex-shrink-0">
          <div className="divide-y divide-gray-50">
            {filteredLocations.map((user) => {
              const iconUrl = user.user_details.profile_photo?.startsWith('/media')
                ? `${MEDIA_BASE_URL}${user.user_details.profile_photo}`
                : defaultIconUrl;
              return (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-emerald-50 border-l-2 border-emerald-500' : 'hover:bg-gray-50'}`}
                >
                  <img src={iconUrl} alt={user.user_details.username}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-100 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.user_details.username}</p>
                    <p className="text-xs text-gray-400">#{user.id}</p>
                  </div>
                </div>
              );
            })}
            {filteredLocations.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">No users found</div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={defaultPosition}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
            zoomControl={false}
            whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
          >
            <ZoomControl position="bottomright" />
            <TileLayer attribution={mapTileOptions[mapView].attribution} url={mapTileOptions[mapView].url} />
            {filteredLocations.map((user) => {
              const iconUrl = user.user_details.profile_photo?.startsWith('/media')
                ? `${MEDIA_BASE_URL}${user.user_details.profile_photo}`
                : defaultIconUrl;
              const userIcon = new L.Icon({ iconUrl, iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -35], className: 'rounded-full border-2 border-white shadow-lg' });
              return (
                <Marker key={user.id} position={[parseFloat(user.latitude), parseFloat(user.longitude)]} icon={userIcon}
                  eventHandlers={{ click: () => navigate(`/admin/members/${user.user_details.username}`) }}
                />
              );
            })}
          </MapContainer>

          {/* Map style controls */}
          <div className="absolute top-3 right-3 bg-white rounded-2xl shadow-lg p-1.5 z-[400] flex flex-col gap-1">
            {[["streets", Map], ["satellite", Layers], ["dark", Users]].map(([view, Icon]) => (
              <button key={view} onClick={() => setMapView(view)} title={view}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${mapView === view ? "bg-emerald-100 text-emerald-700" : "hover:bg-gray-100 text-gray-500"}`}>
                <Icon size={16} />
              </button>
            ))}
          </div>

          {/* Refresh */}
          <div className="absolute bottom-6 right-3 z-[400]">
            <button onClick={fetchLocations} title="Refresh"
              className="w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition">
              <RefreshCw size={16} className="text-emerald-600" />
            </button>
          </div>

          {/* Mobile users pill */}
          <div className="md:hidden absolute bottom-6 left-3 right-16 z-[400]">
            <div className="bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2">
              <Users size={15} className="text-emerald-600" />
              <span className="text-sm font-semibold text-gray-700">{filteredLocations.length} users on map</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
