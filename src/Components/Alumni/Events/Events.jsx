import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTrash, faSearch, faCalendarAlt, faMapMarkerAlt, faList, faThLarge 
} from "@fortawesome/free-solid-svg-icons";

// AuthorizedImage component fetches image with token
const AuthorizedImage = ({ url, alt, className }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const token = localStorage.getItem("Token");

  useEffect(() => {
    let isMounted = true;
    fetch(url, {
      method: "GET",
      headers: { Authorization: token ? `Token ${token}` : "" },
    })
      .then((res) => res.blob())
      .then((blob) => {
        if (isMounted) setImageUrl(URL.createObjectURL(blob));
      })
      .catch((e) => console.error(e));
    return () => (isMounted = false);
  }, [url, token]);

  return imageUrl ? (
    <img src={imageUrl} alt={alt} className={className} />
  ) : (
    <div className="bg-gray-200 animate-pulse w-full h-48" />
  );
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem("Token");
  const navigate = useNavigate(); // 👈 Add useNavigate hook

  useEffect(() => {
    setIsLoading(true);
    fetch("http://134.209.157.195:8000/events/", {
      headers: { Authorization: token ? `Token ${token}` : "" },
    })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setIsLoading(false);
      });
  }, [token]);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

 
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-green-700">Events Dashboard</h1>
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
              <div className="flex space-x-2 bg-gray-100 p-1 rounded-md">
                <button
                  className={`p-2 rounded ${
                    viewMode === "grid" ? "bg-white shadow text-green-600" : "text-gray-500"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <FontAwesomeIcon icon={faThLarge} />
                </button>
                <button
                  className={`p-2 rounded ${
                    viewMode === "list" ? "bg-white shadow text-green-600" : "text-gray-500"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => {
              const imgPath = event.images?.[0]?.image;
              const imgUrl = imgPath ? `http://134.209.157.195:8000${imgPath}` : null;
              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/alumni/event/${event.id}`)} // 👈 Navigate on click
                  className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden group relative hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative">
                    {imgUrl ? (
                      <AuthorizedImage
                        url={imgUrl}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-green-300 text-4xl" />
                      </div>
                    )}
                    
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{event.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2 h-12">{event.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-600" />
                      <span>{formatDate(event.from_date_time)}</span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-green-600" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => navigate(`/alumni/event/${event.id}`)} // 👈 Navigate on row click
                    className="hover:bg-gray-50 group cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{event.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.from_date_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.venue || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
