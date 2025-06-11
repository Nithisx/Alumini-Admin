import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Map, Layers, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Base URL for media files
const MEDIA_BASE_URL = 'http://134.209.157.195:8000';

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
        `${MEDIA_BASE_URL}/user_locations/`,
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

  // Loading state with better UI
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl text-gray-700">Loading map data...</p>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-xl text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={fetchLocations}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={18} className="mr-2" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with search and controls */}
      <div className="bg-white shadow-md p-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Map size={24} className="text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">User Locations Map</h1>
          </div>
          
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* User sidebar */}
        <div className="w-64 bg-white shadow-md overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <Users size={18} className="text-blue-500 mr-2" />
              <h2 className="font-semibold">Users ({filteredLocations.length})</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredLocations.map((user) => {
              const iconUrl =
                user.user_details.profile_photo &&
                user.user_details.profile_photo.startsWith('/media')
                  ? `${MEDIA_BASE_URL}${user.user_details.profile_photo}`
                  : defaultIconUrl;
              
              return (
                <div 
                  key={user.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center">
                    <img 
                      src={iconUrl} 
                      alt={user.user_details.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">{user.user_details.username}</p>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredLocations.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No users match your search
              </div>
            )}
          </div>
        </div>
        
        {/* Map container */}
        <div className="flex-1 relative">
          <MapContainer
            center={defaultPosition}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
            zoomControl={false}
            whenCreated={mapInstance => {
              mapRef.current = mapInstance;
            }}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution={mapTileOptions[mapView].attribution}
              url={mapTileOptions[mapView].url}
            />

            {filteredLocations.map((user) => {
              const iconUrl =
                user.user_details.profile_photo &&
                user.user_details.profile_photo.startsWith('/media')
                  ? `${MEDIA_BASE_URL}${user.user_details.profile_photo}`
                  : defaultIconUrl;

              const userIcon = new L.Icon({
                iconUrl,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -35],
                className: 'rounded-full border-2 border-white shadow-lg',
              });

              return (
                <Marker
                  key={user.id}
                  position={[parseFloat(user.latitude), parseFloat(user.longitude)]}
                  icon={userIcon}
                  eventHandlers={{
                    click: () => {
                      navigate(`/admin/members/${user.user_details.username}`);
                    },
                  }}
                />
              );
            })}
          </MapContainer>
          
          {/* Map controls overlay */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-400">
            <div className="flex flex-col">
              <button 
                className={`p-2 rounded-lg mb-1 flex items-center ${mapView === 'streets' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                onClick={() => setMapView('streets')}
                title="Streets View"
              >
                <Map size={20} />
              </button>
              <button 
                className={`p-2 rounded-lg mb-1 flex items-center ${mapView === 'satellite' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                onClick={() => setMapView('satellite')}
                title="Satellite View"
              >
                <Layers size={20} />
              </button>
              <button 
                className={`p-2 rounded-lg flex items-center ${mapView === 'dark' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                onClick={() => setMapView('dark')}
                title="Dark Mode"
              >
                <Users size={20} />
              </button>
            </div>
          </div>
          
          {/* Mobile user list toggle */}
          <div className="md:hidden absolute bottom-4 left-4 right-4">
            <button 
              className="w-full bg-white rounded-lg shadow-lg p-3 flex items-center justify-center"
              onClick={() => {/* Toggle mobile user list */}}
            >
              <Users size={18} className="mr-2" />
              <span>Show Users ({filteredLocations.length})</span>
            </button>
          </div>
          
          {/* Refresh button */}
          <div className="absolute bottom-4 right-4 md:bottom-20">
            <button 
              className="bg-white rounded-full shadow-lg p-3 hover:bg-gray-50"
              onClick={fetchLocations}
              title="Refresh Data"
            >
              <RefreshCw size={20} className="text-blue-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
