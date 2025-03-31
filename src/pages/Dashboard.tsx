import { useState, useEffect } from 'react';
import axios from 'axios';
import { Meeting } from '../types';
import UpcomingTab from './tabs/UpcomingTab';
import PendingTab from './tabs/PendingTab';
import CanceledTab from './tabs/CanceledTab';
import PastTab from './tabs/PastTab';
import { toast, Toaster } from 'sonner';
import CreateEvent from './CreateEvent';

interface Tab {
  name: string;
  count: number;
}

type MeetingStatus = 'Accepted' | 'Pending' | 'Rejected' | 'Past';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

// Main Dashboard Component
export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const tabs: Tab[] = [
    { name: 'Upcoming', count: meetings.filter(m => m.status === 'Accepted').length },
    { name: 'Pending', count: meetings.filter(m => m.status === 'Pending').length },
    { name: 'Canceled', count: meetings.filter(m => m.status === 'Rejected').length },
    { name: 'Past', count: meetings.filter(m => m.status === ('Past' as MeetingStatus)).length }
  ];

  // Utility function for combining class names
  const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      await api.get('/events').then(response => {
        // Process and categorize meetings
        const categorizedMeetings: Meeting[] = response.data;
        setMeetings(categorizedMeetings);
      });
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  };

  const handleAccept = async (meetingId: string) => {
    try {
      // Update the event status to Accepted
      await api.put(`/events/${meetingId}`, { 
        status: 'Accepted'
      });
      
      // Update local state without fetching all meetings
      setMeetings(prevMeetings => {
        const updatedMeetings = [...prevMeetings];
        
        const updatedMeeting = updatedMeetings.find(m => m._id === meetingId);
        if (updatedMeeting) {
          updatedMeeting.status = 'Accepted';
          updatedMeeting.participants = updatedMeeting.participants?.map(p => ({
            ...p,
            status: 'Accepted'
          })) || [];
        }
        
        return updatedMeetings;
      });
      
      toast.success('All participants accepted successfully');
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
      const newStatus = action === 'Accept' ? 'Accepted' as const : 'Rejected' as const;
      
      // Update the entire event with the participant's new status
      await api.put(`/events/${meetingId}`, { 
        participantUpdate: {
          email,
          status: newStatus
        }
      });
      
      // Update local state without fetching all meetings
      setMeetings(prevMeetings => {
        const updatedMeetings = [...prevMeetings];
        
        const updatedMeeting = updatedMeetings.find(m => m._id === meetingId);
        if (updatedMeeting) {
          updatedMeeting.status = newStatus;
          updatedMeeting.participants = updatedMeeting.participants?.map(p => {
            const participantEmail = p.user?.email || p.email;
            if (participantEmail === email) {
              return {
                ...p,
                status: newStatus
              };
            }
            return p;
          }) || [];
        }
        
        return updatedMeetings;
      });

      toast.success(`Participant ${action === 'Accept' ? 'accepted' : 'rejected'} successfully`);
    } catch (error: any) {
      console.error(`Error ${action === 'Accept' ? 'accepting' : 'rejecting'} participant:`, error);
      toast.error(`Failed to ${action === 'Accept' ? 'accept' : 'reject'} participant`);
    }
  };

  const handleEventCreated = () => {
    fetchMeetings();
    setShowCreateEvent(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
              <h2 className="text-xl font-semibold text-gray-900">Meetings</h2>
              <button
                onClick={() => setShowCreateEvent(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Meeting
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={classNames(
                      tab.name === activeTab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                    )}
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span className={classNames(
                        tab.name === activeTab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900',
                        'ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium'
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="divide-y divide-gray-200">
            {activeTab === 'Upcoming' && (
              <UpcomingTab meetings={meetings.filter(m => m.status === 'Accepted')} />
            )}
            {activeTab === 'Pending' && (
              <PendingTab
                meetings={meetings.filter(m => m.status === 'Pending')}
                onAccept={handleAccept}
                onReject={handleReject}
                onParticipantAction={handleParticipantAction}
              />
            )}
            {activeTab === 'Canceled' && (
              <CanceledTab meetings={meetings.filter(m => m.status === 'Rejected')} />
            )}
            {activeTab === 'Past' && (
              <PastTab meetings={meetings.filter(m => m.status === ('Past' as MeetingStatus))} />
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateEvent(false)} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg sm:p-8">
              <CreateEvent onClose={() => setShowCreateEvent(false)} onEventCreated={handleEventCreated} />
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <Toaster position="bottom-right" />
    </div>
  );
}