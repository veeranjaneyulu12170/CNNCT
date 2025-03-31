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
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
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
      const response = await api.get('/api/events');
      console.log('API URL:', api.defaults.baseURL);
      console.log('Fetched events data:', response.data);

      // Process and categorize meetings
      const categorizedMeetings: MeetingGroups = {
        Upcoming: [],
        Pending: [],
        Canceled: [],
        Past: []
      };

      if (!Array.isArray(response.data) || response.data.length === 0) {
        console.log('No events found or invalid data format');
        setMeetings(categorizedMeetings);
        setLoading(false);
        return;
      }

      response.data.forEach((meeting: any) => {
        // Create a properly structured meeting object
        const formattedMeeting: Meeting = {
          ...meeting,
          _id: meeting._id || meeting.id || `temp-${Date.now()}`,
          date: '',
          time: '',
          title: meeting.title || '',
          description: meeting.description || '',
          status: meeting.status || 'Pending',
          participants: [],
          emails: meeting.emails || []
        };
        
        // Parse meeting details
        let meetingDetails;
        try {
          if (meeting.meetingDetails) {
            meetingDetails = meeting.meetingDetails;
          } else if (typeof meeting.description === 'string') {
            meetingDetails = JSON.parse(meeting.description);
          }
        } catch (err) {
          console.error('Error parsing meeting details:', err);
          meetingDetails = {};
        }
        
        // Ensure meetingDetails exists
        formattedMeeting.meetingDetails = meetingDetails || {};
        
        // Set date and time from meetingDetails
        if (meetingDetails) {
          formattedMeeting.date = meetingDetails.date || '';
          formattedMeeting.time = meetingDetails.time || '';
        }

        // Create participants array if it doesn't exist
        if (!meeting.participants && meeting.emails) {
          formattedMeeting.participants = meeting.emails.map((email: string) => ({
            email,
            status: 'Pending'
          }));
        } else {
          formattedMeeting.participants = meeting.participants || [];
        }

        // Parse meeting date for categorization
        let meetingDate = new Date();
        try {
          if (meetingDetails?.date) {
            meetingDate = new Date(meetingDetails.date);
          }
        } catch (err) {
          console.error('Error parsing date:', err);
        }

        const now = new Date();

        // Categorize by status and date
        // 1. Always add to Pending if status is Pending
        if (formattedMeeting.status === 'Pending') {
          categorizedMeetings.Pending.push(formattedMeeting);
        }
        
        // 2. Add to Upcoming if in the future and Accepted
        if (formattedMeeting.status === 'Accepted' && meetingDate > now) {
          categorizedMeetings.Upcoming.push(formattedMeeting);
        }
        
        // 3. Add to Past if in the past and Accepted
        if (formattedMeeting.status === 'Accepted' && meetingDate <= now) {
          categorizedMeetings.Past.push(formattedMeeting);
        }
        
        // 4. Add to Canceled if Rejected
        if (formattedMeeting.status === 'Rejected') {
          categorizedMeetings.Canceled.push(formattedMeeting);
        }
        
        // 5. If not categorized yet, add to Pending as a fallback
        if (!categorizedMeetings.Pending.includes(formattedMeeting) && 
            !categorizedMeetings.Upcoming.includes(formattedMeeting) && 
            !categorizedMeetings.Past.includes(formattedMeeting) && 
            !categorizedMeetings.Canceled.includes(formattedMeeting)) {
          categorizedMeetings.Pending.push(formattedMeeting);
        }
      });

      console.log('Categorized meetings:', categorizedMeetings);
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
      // Update the event status to Accepted
      const response = await api.put(`/events/${meetingId}`, { 
        status: 'Accepted'
      });
      
      if (response.status === 200) {
        // Update local state without fetching all meetings
        setMeetings(prevMeetings => {
          const updatedMeetings = { ...prevMeetings };
          
          Object.keys(updatedMeetings).forEach(tab => {
            updatedMeetings[tab] = updatedMeetings[tab].map(meeting => 
              meeting._id === meetingId 
                ? { 
                    ...meeting, 
                    status: 'Accepted' as const,
                    participants: (meeting.participants || []).map(p => ({
                      ...p,
                      status: 'Accepted' as const
                    }))
                  } 
                : meeting
            );
          });
          
          // Move the meeting to the Upcoming tab if it's in Pending
          if (updatedMeetings.Pending.some(m => m._id === meetingId)) {
            const acceptedMeeting = updatedMeetings.Pending.find(m => m._id === meetingId);
            if (acceptedMeeting) {
              updatedMeetings.Upcoming.push(acceptedMeeting);
              updatedMeetings.Pending = updatedMeetings.Pending.filter(m => m._id !== meetingId);
            }
          }
          
          return updatedMeetings;
        });
        
        toast.success('All participants accepted successfully');
      }
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
      const response = await api.put(`/events/${meetingId}`, { 
        participantUpdate: {
          email,
          status: newStatus
        }
      });
      
      // Update local state without fetching all meetings
      setMeetings(prevMeetings => {
        const updatedMeetings = { ...prevMeetings };
        
        // Find the meeting in all tabs and update the participant's status
        Object.keys(updatedMeetings).forEach(tab => {
          updatedMeetings[tab] = updatedMeetings[tab].map(meeting => {
            if (meeting._id === meetingId) {
              // Ensure participants array exists
              const currentParticipants = meeting.participants || [];
              
              // Update participant status
              const updatedParticipants = currentParticipants.map(participant => {
                const participantEmail = participant.user?.email || participant.email;
                if (participantEmail === email) {
                  return {
                    ...participant,
                    status: newStatus
                  };
                }
                return participant;
              });
              
              // Return updated meeting with type assertion
              return {
                ...meeting,
                participants: updatedParticipants,
                status: newStatus === 'Accepted' ? 'Accepted' as const : 
                       updatedParticipants.every(p => p.status === 'Rejected') ? 'Rejected' as const : 
                       meeting.status
              } as Meeting;
            }
            return meeting;
          });
        });
        
        return updatedMeetings;
      });

      toast.success(`Participant ${action === 'Accept' ? 'accepted' : 'rejected'} successfully`);
    } catch (error: any) {
      console.error(`Error ${action === 'Accept' ? 'accepting' : 'rejecting'} participant:`, error);
      toast.error(`Failed to ${action === 'Accept' ? 'accept' : 'reject'} participant`);
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Meetings</h2>
          <button
            onClick={fetchMeetings}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Refresh Dashboard
          </button>
        </div>
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