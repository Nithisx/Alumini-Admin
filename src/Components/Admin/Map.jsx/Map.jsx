// map.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Icon - using an external icon URL from Icons8 (you can swap this URL with one of your choosing)
const peopleIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/fluency/48/000000/user-location.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Main Map component
const MapComponent = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user locations when the component mounts
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('http://134.209.157.195:8000/user_locations/', {
          method: 'GET',
          headers: {
            'Authorization': 'Token ff33e87bb30f1e7e4c66548b5869a8cbf360bfb9',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setLocations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // While data loads, or in case of error, display appropriate messages.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  // Center the map based on the first user's location or default coordinates
  const defaultPosition =
    locations.length > 0
      ? [parseFloat(locations[0].latitude), parseFloat(locations[0].longitude)]
      : [10.921, 76.978];

  return (
    <div className="container mx-auto p-4">
      <MapContainer
        center={defaultPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="h-[80vh] w-full rounded-lg shadow-lg"
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((user) => (
          <Marker
            key={user.id}
            position={[parseFloat(user.latitude), parseFloat(user.longitude)]}
            icon={peopleIcon}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-lg">{user.username}</h3>
                <p>ID: {user.id}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
