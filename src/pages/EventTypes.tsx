import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Copy, Edit2, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Event {
  _id: string;
  title: string;
  backgroundColor: string;
  link: string;
  emails: string[];
  profileImage: string | null;
  meetingDetails?: {
    date: string;        // e.g., "Monday, March 18, 2024"
    time: string;        // e.g., "02:30 PM"
    duration: string;    // e.g., "1 hour"
    timeZone: string;    // e.g., "(UTC +5:30 Delhi)"
    meetingType: string; // from eventTopic
    hostName: string;
    description: string;
    password: string
  };
  description?: string;
  createdAt: string;
  isAvailable: boolean;
  duration?: string;
  meetingType?: string;
}

export default function EventTypes() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${apiBaseUrl}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Received events data:', response.data);
      setEvents(response.data);
    } catch (error: any) {
      console.error('Error fetching events:', error.response?.data || error.message);
      setError('Failed to load events: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      const updatedEvents = events.map(event => 
        event._id === eventId 
          ? { ...event, isAvailable: !event.isAvailable } 
          : event
      );

      const eventToUpdate = updatedEvents.find(event => event._id === eventId);

      await axios.patch(`${apiBaseUrl}/api/events/${eventId}`, 
        { isAvailable: eventToUpdate?.isAvailable }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setEvents(updatedEvents);
      toast.success(`Event availability updated`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleCopyEvent = async (event: Event) => {
    try {
      const token = localStorage.getItem('token');
      const { _id, ...eventToCopy } = event;
      
      const response = await axios.post(`${apiBaseUrl}/api/events`, 
        { ...eventToCopy, title: `Copy of ${event.title}` }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setEvents([...events, response.data]);
      toast.success('Event copied successfully');
    } catch (error: any) {
      console.error('Error copying event:', error);
      toast.error('Failed to copy event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiBaseUrl}/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setEvents(events.filter(event => event._id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [location.key]);

  // Add this useEffect for debugging
  useEffect(() => {
    console.log('Current events state:', events);
  }, [events]);

  return (
    <div className="p-6">
      <Toaster richColors />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Event Types</h1>
          <p className="text-gray-600">
            Create events to share for people to book on your calendar.
          </p>
        </div>
        <Link
          to="/event-types/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Event
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No event types created yet
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 ">
          {events.map((event) => {
            console.log('Rendering event:', event); // Add this log
            return (
              <div 
                key={event._id} 
                className="bg-white border rounded-3xl shadow-sm overflow-hidden h-[200px] scale-90"
              >
                <div className="bg-blue-500 h-6 w-full"></div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-medium">{event.title}</h2>
                    <Link 
                      to={`/event-types/edit/${event._id}`} 
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 size={16} />
                    </Link>
                  </div>
                  {(() => {
                    const meetingDetails = event.meetingDetails || (event.description ? JSON.parse(event.description) : null);
                    return (
                      <>
                        <p className="text-sm text-gray-600 mb-1">
                          {meetingDetails?.date || 'No date set'}
                        </p>
                        <p className="text-blue-600 font-medium mb-2">
                          {meetingDetails?.time || 'No time set'}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          {meetingDetails?.duration || 'No duration'}, {meetingDetails?.meetingType || 'No meeting type'}
                        </p>
                      </>
                    );
                  })()}
                  <div className="flex items-center justify-end space-x-1 border-t border-gray-300  mb-2 ">
                    <label className="flex cursor-pointer select-none items-center">
                      <div className="relative  scale-50  ">
                        <input 
                          type="checkbox" 
                          checked={event.isAvailable}
                          onChange={() => handleToggleAvailability(event._id)}
                          className="sr-only peer "
                        />
                        <div className="block h-8 w-14 rounded-full bg-gray-300 peer-checked:bg-blue-600 transition"></div>
                        <div className="dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:translate-x-6"></div>
                      </div>
                    </label>
                    <button 
                      onClick={() => handleCopyEvent(event)}
                      className="mb-2 flex items-center justify-center h-8 w-8 text-gray-500 hover:text-gray-700"
                      title="Copy Event"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event._id)}
                      className="mb-2 flex items-center justify-center h-8 w-8 text-gray-500 hover:text-gray-700"
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}