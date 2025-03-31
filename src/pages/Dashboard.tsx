import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Meeting, MeetingGroups, TabType } from '../types';
import UpcomingTab from './tabs/UpcomingTab';
import PendingTab from './tabs/PendingTab';
import CanceledTab from './tabs/CanceledTab';
import PastTab from './tabs/PastTab';
import { toast } from 'sonner';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to add token and handle errors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Utility functions
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  const endHour = (hours + 2) % 24;
  const endHour12 = endHour % 12 || 12;
  const endPeriod = endHour >= 12 ? 'pm' : 'am';
  
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period} - ${endHour12}:${minutes.toString().padStart(2, '0')} ${endPeriod}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

// Main Dashboard Component
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [meetings, setMeetings] = useState<MeetingGroups>({
    Upcoming: [],
    Pending: [],
    Canceled: [],
    Past: []
  });
  const [loading, setLoading] = useState(true);
  
  const tabs: TabType[] = ['Upcoming', 'Pending', 'Canceled', 'Past'];

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');

      // Process and categorize meetings
      const categorizedMeetings: MeetingGroups = {
        Upcoming: [],
        Pending: [],
        Canceled: [],
        Past: []
      };

      response.data.forEach((meeting: Meeting) => {
        const meetingDate = new Date(meeting.meetingDetails?.date || '');
        const now = new Date();

        // Add to Pending if it's a new event or has pending status
        if (!meeting.status || meeting.status === 'Pending') {
          categorizedMeetings.Pending.push(meeting);
        }

        // Also add to Upcoming if it's in the future
        if (meetingDate > now) {
          categorizedMeetings.Upcoming.push(meeting);
        }

        // Handle other statuses
        if (meeting.status === 'Rejected') {
          categorizedMeetings.Canceled.push(meeting);
        } else if (meetingDate < now) {
          categorizedMeetings.Past.push(meeting);
        }
      });

      setMeetings(categorizedMeetings);
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (meetingId: string) => {
    try {
      await api.put(`/events/${meetingId}`, { 
        status: 'Accepted'
      });
      toast.success('Meeting accepted successfully');
      fetchMeetings();
    } catch (error: any) {
      console.error('Error accepting meeting:', error);
      toast.error('Failed to accept meeting');
    }
  };

  const handleReject = async (meetingId: string) => {
    try {
      await api.put(`/events/${meetingId}`, { 
        status: 'Rejected'
      });
      toast.success('Meeting rejected successfully');
      fetchMeetings();
    } catch (error: any) {
      console.error('Error rejecting meeting:', error);
      toast.error('Failed to reject meeting');
    }
  };

  const handleParticipantAction = async (meetingId: string, email: string, action: 'Accept' | 'Reject') => {
    try {
      await api.put(`/events/${meetingId}/participant`, { 
        email, 
        status: action
      });
      toast.success(`Participant ${action.toLowerCase()}ed successfully`);
      fetchMeetings();
    } catch (error: any) {
      console.error(`Error ${action.toLowerCase()}ing participant:`, error);
      toast.error(`Failed to ${action.toLowerCase()} participant`);
    }
  };

  return (
    <div className='bg-[#f3f3f1] min-h-screen'>
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-poppins font-semibold mb-1">Booking</h1>
        <p className="text-black opacity-90 text-sm font-poppins">
          See upcoming and past events booked through your event type links.
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 py-4 text-sm font-medium
                  ${activeTab === tab 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : meetings[activeTab].length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {activeTab.toLowerCase()} meetings
            </div>
          ) : (
            <>
              {activeTab === 'Upcoming' && <UpcomingTab meetings={meetings.Upcoming} />}
              {activeTab === 'Pending' && (
                <PendingTab 
                  meetings={meetings.Pending}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onParticipantAction={handleParticipantAction}
                />
              )}
              {activeTab === 'Canceled' && <CanceledTab meetings={meetings.Canceled} />}
              {activeTab === 'Past' && <PastTab meetings={meetings.Past} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}