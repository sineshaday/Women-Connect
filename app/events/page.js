"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/NavBar";
import { ArrowLeftIcon, MoreVertical, Briefcase, School, Home, Calendar, MapPin, Link as LinkIcon, Plus } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { format, parseISO } from "date-fns";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    type: "online",
    location: "",
    description: "",
    category: "work"
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy("date", "asc"));
      const querySnapshot = await getDocs(q);
      
      const eventsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle both string dates and timestamps
          date: data.date instanceof Date ? data.date : new Date(data.date)
        };
      }).filter(event => event.date >= new Date()); // Only show upcoming events
      
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Unable to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError("Please login to create an event");
      return;
    }

    try {
      const eventData = {
        ...newEvent,
        createdBy: auth.currentUser.uid,
        creatorName: auth.currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        date: newEvent.date, // Store as string
        attendees: []
      };

      await addDoc(collection(db, "events"), eventData);
      setShowCreateModal(false);
      setNewEvent({
        title: "",
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        type: "online",
        location: "",
        description: "",
        category: "work"
      });
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      setError("Failed to create event. Please try again.");
    }
  };

  const formatEventDate = (date) => {
    try {
      return format(date, 'dd MMM yyyy HH:mm');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date unavailable";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'work':
        return <Briefcase className="inline h-5 w-5 text-pink-500" />;
      case 'education':
        return <School className="inline h-5 w-5 text-blue-500" />;
      case 'home':
        return <Home className="inline h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mt-40"/>
      <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <MoreVertical className="h-6 w-6 text-gray-600" />
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No upcoming events. Be the first to create one!
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border-2 border-pink-200 rounded-xl p-6 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      {getCategoryIcon(event.category)}
                      {event.title}
                    </h2>
                    <span className="text-sm font-medium text-pink-600">
                      {formatEventDate(event.date)}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-3">{event.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {event.type === 'online' ? (
                        <>
                          <LinkIcon className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">Online Event</span>
                          {event.location && (
                            <a 
                              href={event.location} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              Join
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-600 font-medium">{event.location}</span>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      By {event.creatorName}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {auth.currentUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="fixed bottom-6 right-6 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">Create Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  >
                    <option value="work">Work</option>
                    <option value="education">Education</option>
                    <option value="home">Home</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  >
                    <option value="online">Online</option>
                    <option value="venue">Venue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newEvent.type === 'online' ? 'Link' : 'Venue'}
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}