import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Meeting, MeetingGroups, TabType, Participant } from '../types';
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

// Utility function to normalize email for comparison
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim().replace(/\.(?=.*@)/g, '');
};

// Enhanced email matching function with detailed similarity checks
const emailsMatch = (email1: string, email2: string): boolean => {
  // Normalize both emails
  const normalizedEmail1 = normalizeEmail(email1);
  const normalizedEmail2 = normalizeEmail(email2);

  console.log('Comparing emails:', {
    original1: email1,
    original2: email2,
    normalized1: normalizedEmail1,
    normalized2: normalizedEmail2
  });

  // Direct match after normalization
  if (normalizedEmail1 === normalizedEmail2) {
    console.log('Emails match after normalization');
    return true;
  }

  // Split into username and domain parts
  const [user1, domain1] = normalizedEmail1.split('@');
  const [user2, domain2] = normalizedEmail2.split('@');

  // Check if domains match after removing all dots
  const cleanDomain1 = domain1?.replace(/\./g, '');
  const cleanDomain2 = domain2?.replace(/\./g, '');

  if (user1 === user2 && cleanDomain1 === cleanDomain2) {
    console.log('Emails match after cleaning domains');
    return true;
  }

  // Check for typos in domain (e.g., gmailcom vs gmail.com)
  if (user1 === user2) {
    const commonDomains: { [key: string]: string[] } = {
      'gmailcom': ['gmail.com'],
      'yahoocom': ['yahoo.com'],
      'hotmailcom': ['hotmail.com'],
      'outlookcom': ['outlook.com']
    };

    const domainWithoutDots1 = domain1?.replace(/\./g, '').toLowerCase();
    const domainWithoutDots2 = domain2?.replace(/\./g, '').toLowerCase();

    for (const [typo, corrections] of Object.entries(commonDomains)) {
      if ((domainWithoutDots1 === typo && corrections.includes(domain2)) ||
          (domainWithoutDots2 === typo && corrections.includes(domain1))) {
        console.log('Emails match after domain typo correction');
        return true;
      }
    }
  }

  // Calculate similarity for close matches
  const similarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const longerLength = longer.length;
    
    if (longerLength === 0) return 1.0;
    
    const editDistance = (s1: string, s2: string): number => {
      const costs: number[] = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) costs[j] = j;
          else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };
    
    const distance = editDistance(longer, shorter);
    return (longerLength - distance) / longerLength;
  };

  const similarityScore = similarity(normalizedEmail1, normalizedEmail2);
  console.log('Email similarity score:', similarityScore);

  // If emails are very similar (90% match), consider them a match
  if (similarityScore > 0.9) {
    console.log('Emails match based on similarity score');
    return true;
  }

  console.log('Emails do not match');
  return false;
};

// Utility function to get participant email with enhanced logging
const getParticipantEmail = (participant: Participant): string => {
  const email = participant.user?.email || participant.email || '';
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log('Getting participant email:', {
    original: email,
    normalized: normalizedEmail,
    fromUser: participant.user?.email,
    directEmail: participant.email
  });
  
  return normalizedEmail;
};

// Utility function to find meeting by ID
const findMeetingById = (meetings: MeetingGroups, id: string): Meeting | undefined => {
  return Object.values(meetings)
    .flat()
    .find((m: Meeting) => m._id === id || m._id === `${id}-upcoming`);
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

        // Ensure all participants have a consistent structure
        formattedMeeting.participants = formattedMeeting.participants.map(p => ({
          ...p,
          email: getParticipantEmail(p),
          status: p.status || 'Pending'
        }));

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

        // Keep all Pending meetings in the Pending tab
        if (formattedMeeting.status === 'Pending') {
          categorizedMeetings.Pending.push(formattedMeeting);
        }

        // Add all past meetings to the Past tab
        if (meetingDate <= now) {
          categorizedMeetings.Past.push(formattedMeeting);
        }

        // Add meetings with accepted participants to the Upcoming tab
        const hasAcceptedParticipants = formattedMeeting.participants?.some(p => p.status === 'Accepted');
        if (hasAcceptedParticipants && meetingDate > now) {
          const meetingDetails = {
            date: '',
            time: '',
            duration: '',
            meetingType: '',
            hostName: '',
            eventTopic: '',
            teamNumber: '',
            ...formattedMeeting.meetingDetails
          };
          
          // Create a copy for the Upcoming tab with only accepted participants
          const upcomingMeeting = {
            ...formattedMeeting,
            _id: `${formattedMeeting._id}-upcoming`,
            meetingDetails,
            participants: formattedMeeting.participants.filter(p => p.status === 'Accepted')
          };
          
          // Remove any existing copies of this meeting from Upcoming tab
          const existingIndex = categorizedMeetings.Upcoming.findIndex(
            m => m._id.includes(formattedMeeting._id)
          );
          if (existingIndex !== -1) {
            categorizedMeetings.Upcoming.splice(existingIndex, 1);
          }
          
          categorizedMeetings.Upcoming.push(upcomingMeeting);
        }

        // Add Rejected meetings to Canceled tab
        if (formattedMeeting.status === 'Rejected') {
          categorizedMeetings.Canceled.push(formattedMeeting);
        }

        // If not categorized yet, add to Pending as fallback
        if (!categorizedMeetings.Pending.includes(formattedMeeting) && 
            !categorizedMeetings.Upcoming.some(m => m._id.startsWith(formattedMeeting._id)) && 
            !categorizedMeetings.Past.some(m => m._id.startsWith(formattedMeeting._id)) && 
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
      // Get original meeting ID (without -upcoming suffix)
      const originalMeetingId = meetingId.replace('-upcoming', '');
      
      // Get the current user's email from localStorage
      const userString = localStorage.getItem('user');
      if (!userString) {
        console.error('User not found in localStorage');
        toast.error('User information not found');
        return;
      }
      
      const userInfo = JSON.parse(userString);
      const userEmail = userInfo.email;
      
      if (!userEmail) {
        console.error('User email not found');
        toast.error('User email not found');
        return;
      }

      console.log(`Accepting meeting: ${originalMeetingId} for user: ${userEmail}`);
      
      // Find the meeting in the current state (use the helper function)
      const meeting = findMeetingById(meetings, originalMeetingId);
      
      if (!meeting) {
        console.error(`Meeting not found with ID: ${originalMeetingId}`);
        toast.error('Meeting not found');
        return;
      }

      // Find the participant in the meeting using the new emailsMatch function
      let participant = meeting.participants?.find(p => emailsMatch(getParticipantEmail(p), userEmail));
      
      // If participant is not found, create a new participant entry
      if (!participant) {
        console.log(`Creating new participant entry for email: ${userEmail}`);
        participant = {
          email: userEmail,
          status: 'Pending'
        };
        meeting.participants.push(participant);
      }

      // Use the participant's email for the update
      const participantEmail = getParticipantEmail(participant);

      // Make sure the API request format is correct
      const response = await api.put(`/api/events/${originalMeetingId}/participants/${participantEmail}`, {
        status: 'Accepted'
      });
      
      if (response.status === 200) {
        // Update local state without fetching all meetings
        setMeetings(prevMeetings => {
          const updatedMeetings = { ...prevMeetings };
          
          // First, update the participant status in the Pending tab
          updatedMeetings.Pending = updatedMeetings.Pending.map(meeting => 
            meeting._id === originalMeetingId 
              ? { 
                  ...meeting,
                  participants: [
                    ...meeting.participants.filter(p => getParticipantEmail(p) !== userEmail),
                    { ...participant!, status: 'Accepted' }
                  ]
                } 
              : meeting
          );

          // Find the meeting that was just updated
          const updatedMeeting = updatedMeetings.Pending.find(m => m._id === originalMeetingId);
          
          if (updatedMeeting) {
            // Create a copy for the Upcoming tab with only accepted participants
            const upcomingCopy: Meeting = {
              ...updatedMeeting,
              _id: `${updatedMeeting._id}-upcoming`,
              participants: updatedMeeting.participants.filter(p => p.status === 'Accepted'),
              meetingDetails: {
                date: updatedMeeting.meetingDetails?.date || updatedMeeting.date,
                time: updatedMeeting.meetingDetails?.time || updatedMeeting.time,
                duration: updatedMeeting.meetingDetails?.duration || '1 hour',
                meetingType: updatedMeeting.meetingDetails?.meetingType || 'default',
                hostName: updatedMeeting.meetingDetails?.hostName || 'Unknown Host',
                ...(updatedMeeting.meetingDetails?.eventTopic ? { eventTopic: updatedMeeting.meetingDetails.eventTopic } : {}),
                ...(updatedMeeting.meetingDetails?.teamNumber ? { teamNumber: updatedMeeting.meetingDetails.teamNumber } : {})
              }
            };

            // Add to Upcoming tab if it has accepted participants
            if (upcomingCopy.participants.length > 0) {
              // Remove any existing copies of this meeting from Upcoming tab
              updatedMeetings.Upcoming = updatedMeetings.Upcoming.filter(
                m => !m._id.includes(originalMeetingId)
              );
              // Add the new copy
              updatedMeetings.Upcoming.push(upcomingCopy);
            }
          }
          
          return updatedMeetings;
        });
        
        toast.success('Meeting accepted successfully');
      }
    } catch (error: any) {
      console.error('Error accepting meeting:', error);
      if (error.response?.data?.message) {
        toast.error(`Failed to accept meeting: ${error.response.data.message}`);
      } else {
        toast.error('Failed to accept meeting');
      }
    }
  };

  const handleReject = async (meetingId: string) => {
    try {
      // Get original meeting ID (without -upcoming suffix)
      const originalMeetingId = meetingId.replace('-upcoming', '');
      
      // Get the current user's email from localStorage
      const userString = localStorage.getItem('user');
      if (!userString) {
        console.error('User not found in localStorage');
        toast.error('User information not found');
        return;
      }
      
      const userInfo = JSON.parse(userString);
      const userEmail = userInfo.email;
      
      if (!userEmail) {
        console.error('User email not found');
        toast.error('User email not found');
        return;
      }

      // Make sure the API request format is correct
      await api.put(`/api/events/${originalMeetingId}/participants/${userEmail}`, {
        status: 'Rejected'
      });

      toast.success('Meeting rejected successfully');
      fetchMeetings();
    } catch (error: any) {
      console.error('Error rejecting meeting:', error);
      if (error.response?.data?.message) {
        toast.error(`Failed to reject meeting: ${error.response.data.message}`);
      } else {
        toast.error('Failed to reject meeting');
      }
    }
  };

  const handleParticipantAction = async (meetingId: string, email: string, action: 'Accept' | 'Reject') => {
    try {
      const originalMeetingId = meetingId.replace('-upcoming', '');
      const newStatus = action === 'Accept' ? 'Accepted' as const : 'Rejected' as const;
      
      const meeting = findMeetingById(meetings, originalMeetingId);
      
      if (!meeting) {
        console.error(`Meeting not found with ID: ${originalMeetingId}`);
        toast.error('Meeting not found');
        return;
      }

      const participant = meeting.participants?.find(p => emailsMatch(getParticipantEmail(p), email));
      if (!participant) {
        toast.error('Participant not found');
        return;
      }

      const participantEmail = getParticipantEmail(participant);
      console.log(`Updating participant ${participantEmail} in meeting ${originalMeetingId} to ${newStatus}`);

      // Properly encode the email address for the URL
      const encodedEmail = encodeURIComponent(participantEmail);
      
      const response = await api.put(`/api/events/${originalMeetingId}/participants/${encodedEmail}`, {
        status: newStatus
      });

      if (response.status === 200) {
        setMeetings(prevMeetings => {
          const updatedMeetings = { ...prevMeetings } as MeetingGroups;
          
          if (updatedMeetings.Pending) {
            updatedMeetings.Pending = updatedMeetings.Pending.map(meeting => {
              if (meeting._id === originalMeetingId) {
                const updatedParticipants = meeting.participants.map(p => 
                  emailsMatch(getParticipantEmail(p), email) ? { ...p, status: newStatus } : p
                );
                return { ...meeting, participants: updatedParticipants };
              }
              return meeting;
            });

            const updatedMeeting = updatedMeetings.Pending.find(m => m._id === originalMeetingId);
            
            if (updatedMeeting) {
              const acceptedParticipants = updatedMeeting.participants.filter(p => p.status === 'Accepted');
              
              // Handle Upcoming tab
              if (acceptedParticipants.length > 0) {
                const upcomingCopy = {
                  ...updatedMeeting,
                  _id: `${updatedMeeting._id}-upcoming`,
                  participants: acceptedParticipants,
                  meetingDetails: {
                    ...updatedMeeting.meetingDetails,
                    date: updatedMeeting.meetingDetails?.date || updatedMeeting.date,
                    time: updatedMeeting.meetingDetails?.time || updatedMeeting.time,
                    duration: updatedMeeting.meetingDetails?.duration || '1 hour',
                    meetingType: updatedMeeting.meetingDetails?.meetingType || 'default',
                    hostName: updatedMeeting.meetingDetails?.hostName || 'Unknown Host'
                  }
                };

                if (!updatedMeetings.Upcoming) {
                  updatedMeetings.Upcoming = [];
                }
                updatedMeetings.Upcoming = [
                  ...updatedMeetings.Upcoming.filter(m => !m._id.includes(originalMeetingId)),
                  upcomingCopy
                ];
              } else {
                // Remove from Upcoming if no accepted participants
                if (updatedMeetings.Upcoming) {
                  updatedMeetings.Upcoming = updatedMeetings.Upcoming.filter(
                    m => !m._id.includes(originalMeetingId)
                  );
                }
              }

              // Handle Rejected tab
              if (updatedMeeting.participants.every(p => p.status === 'Rejected')) {
                if (!updatedMeetings.Rejected) {
                  updatedMeetings.Rejected = [];
                }
                updatedMeetings.Rejected = [
                  ...updatedMeetings.Rejected.filter(m => m._id !== originalMeetingId),
                  updatedMeeting
                ];
                updatedMeetings.Pending = updatedMeetings.Pending.filter(m => m._id !== originalMeetingId);
              }

              // Remove from Pending if all participants have responded
              if (updatedMeeting.participants.every(p => p.status === 'Accepted' || p.status === 'Rejected')) {
                updatedMeetings.Pending = updatedMeetings.Pending.filter(m => m._id !== originalMeetingId);
              }
            }
          }
          
          return updatedMeetings;
        });

        toast.success(`Participant ${action.toLowerCase()}ed successfully`);
      }
    } catch (error: any) {
      console.error(`Error ${action.toLowerCase()}ing participant:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action.toLowerCase()} participant`);
    }
  };

  return (
    <div className='bg-[#f3f3f1] min-h-screen'>
      <div className="p-6 border-b bg-[#f3f3f1]">
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