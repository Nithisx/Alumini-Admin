import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Map, Camera, Users, Clock, MapPin } from 'lucide-react';

const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const BASE_URL = "http://134.209.157.195:8000";
  const TOKEN = localStorage.getItem('Token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/home/`, {
          headers: {
            Authorization: `Token ${TOKEN}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h3 className="text-xl font-bold text-red-600 mb-4">Error Loading Data</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
    {/* Hero Section */}
        <div className="bg-white text-green-600 py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4"> Alumni Portal</h1>
            
          </div>
        </div>


        <section className="mb-16">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800"> News</h2>
            <div className="ml-auto">
              <button 
                onClick={() => navigate('/admin/news/')}
                className="text-green-600 hover:text-green-800 font-medium flex items-center"
              >
                View All 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.featured_news.map(news => (
              <div
                key={news.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition group"
                onClick={() => navigate(`/admin/news/${news.id}/`)}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={`${BASE_URL}${news.thumbnail}`}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent w-full h-24"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-green-600 transition">{news.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{news.content.substring(0, 150)}...</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Published {formatDate(news.created_at || new Date())}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
      <div className="bg-white shadow-md py-6 mb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <p className="text-3xl font-bold text-green-600">{data.upcoming_events.length}</p>
              <p className="text-gray-600">Upcoming Events</p>
            </div>
            <div className="text-center p-4">
              <p className="text-3xl font-bold text-green-600">{data.featured_news.length}</p>
              <p className="text-gray-600">News Articles</p>
            </div>
            <div className="text-center p-4">
              <p className="text-3xl font-bold text-green-600">{data.latest_album_images.length}</p>
              <p className="text-gray-600">Photo Albums</p>
            </div>
            <div className="text-center p-4">
              <p className="text-3xl font-bold text-green-600">{data.latest_members.length}</p>
              <p className="text-gray-600">New Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
       

        {/* Upcoming Events */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
            <div className="ml-auto">
              <button 
                onClick={() => navigate('/admin/event/')}
                className="text-green-600 hover:text-green-800 font-medium flex items-center"
              >
                View All 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.upcoming_events.map(event => (
              <div
                key={event.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer"
                onClick={() => navigate(`/admin/event/${event.id}`)}
              >
                {event.images && event.images[0] ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={`${BASE_URL}${event.images[0].image}`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-green-600 text-white py-1 px-3 rounded-full text-sm font-medium">
                      {formatDate(event.from_date_time)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-green-600 to-green-700 h-32 flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-white opacity-70" />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-3">{event.title}</h3>
                  
                  <div className="flex items-start mb-2">
                    <Clock className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-gray-700">
                        {formatDate(event.from_date_time)}
                        {event.to_date_time && ` - ${formatDate(event.to_date_time)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start mb-4">
                    <MapPin className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                    <p className="text-gray-700">{event.venue}</p>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  
                  <button className="text-green-600 font-medium hover:text-green-800 transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest Photo Albums */}
          <section className="lg:col-span-2 mb-16">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Latest Photo Albums</h2>
              <div className="ml-auto">
                <button 
                  onClick={() => navigate('/admin/albums/')}
                  className="text-green-600 hover:text-green-800 font-medium flex items-center"
                >
                  View All 
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.latest_album_images.map(album => (
                <div
                  key={album.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                  onClick={() => navigate(`/admin/albums/${album.id}/`)}
                >
                  <div className="relative h-40 overflow-hidden">
                    {album.cover_image ? (
                      <img
                        src={`${BASE_URL}${album.cover_image}`}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium px-3 py-1 bg-green-600 rounded-full text-sm">View Album</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 truncate">{album.title}</h3>
                    <p className="text-gray-500 text-sm truncate">{album.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* New Members */}
          <section className="lg:col-span-1 mb-16">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">New Members</h2>
              <div className="ml-auto">
                <button 
                  onClick={() => navigate('/admin/members/')}
                  className="text-green-600 hover:text-green-800 font-medium flex items-center"
                >
                  View All 
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              {data.latest_members.map((member, index) => (
                <div 
                  key={member.id}
                  className={`flex items-center py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition ${
                    index !== data.latest_members.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                  onClick={() => navigate(`/admin/members/${member.username}/`)}
                >
                  <div className="mr-4">
                    {member.profile_photo ? (
                      <img
                        src={`${BASE_URL}${member.profile_photo}`}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">
                        {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{member.first_name} {member.last_name}</h3>
                    <p className="text-sm text-gray-500">{member.role || "Member"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      
    </div>
  );
};

export default HomePage;