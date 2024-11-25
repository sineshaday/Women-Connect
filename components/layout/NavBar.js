"use client";
import Link from 'next/link';
import { User2, Search, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { searchEvents } from '@/utils/search';

export default function Navbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch events for search
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);
        
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date instanceof Date ? doc.data().date : new Date(doc.data().date)
        }));
        
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    const results = searchEvents(events, searchTerm);
    setSearchResults(results);
    setLoading(false);
  };

  // Handle result click
  const handleResultClick = (eventId) => {
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
    router.push(`/events/${eventId}`);
  };


  return (
    <header className="w-full bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center py-4 px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex-shrink-0">
            <img src="/logo.png" alt="WomenConnect Logo" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/stories" 
              className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
            >
              Story Sharing
            </Link>
            <Link 
              href="/stories/create" 
              className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
            >
              Community Forum
            </Link>
            <Link 
              href="/events" 
              className="text-gray-700 hover:text-pink-600 font-medium transition-colors"
            >
              Events Calendar
            </Link>
          </nav>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search Button */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="text-gray-700 hover:text-pink-600 transition-colors"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Profile Link/Button */}
            <Link 
              href="/profile" 
              className="text-gray-700 hover:text-pink-600 transition-colors"
            >
              <User className="h-6 w-6" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {showSearch && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg p-4 min-h-[100px] max-h-[80vh] overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Search Events</h3>
                <button 
                  onClick={() => {
                    setShowSearch(false);
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, category, location, or keywords..."
                    className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-600"
                    disabled={loading}
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>

              {/* Search Results */}
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleResultClick(event.id)}
                      className="cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-pink-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{event.title}</h4>
                        <span className="text-sm text-gray-500">
                          {event.type === 'online' ? '🌐 Online' : '📍 Venue'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.date.toLocaleDateString()} • {event.category}
                      </p>
                      {event.description && (
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : searchTerm && !loading ? (
                  <div className="text-center text-gray-500 py-4">
                    No events found for "{searchTerm}"
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <p className="mb-2">Try searching for events and posts</p>
                    
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t">
            <nav className="flex flex-col px-4 py-2">
              <Link 
                href="/dashboard" 
                className="py-2 text-gray-700 hover:text-pink-600 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              <Link 
                href="/stories" 
                className="py-2 text-gray-700 hover:text-pink-600 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Story Sharing
              </Link>
              <Link 
                href="/stories/create" 
                className="py-2 text-gray-700 hover:text-pink-600 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Community Forum
              </Link>
              <Link 
                href="/events" 
                className="py-2 text-gray-700 hover:text-pink-600 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Events Calendar
              </Link>
              <Link 
                href="/profile" 
                className="py-2 text-gray-700 hover:text-pink-600 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Profile
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Auth Status Indicator */}
      {auth.currentUser && (
        <div className="absolute top-16 right-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
          Signed in as {auth.currentUser.displayName || auth.currentUser.email}
        </div>
      )}
    </header>
  );
}