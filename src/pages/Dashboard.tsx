import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  status?: 'Accepted' | 'Rejected' | 'Pending';
}

interface Meeting {
  _id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  status: 'Accepted' | 'Rejected' | 'Pending';
  participants: Participant[];
  emails: string[];
  meetingDetails?: {
    date: string;
    time: string;
    duration: string;
    meetingType: string;
    hostName: string;
  };
}

type TabType = 'Upcoming' | 'Pending' | 'Canceled' | 'Past';

interface MeetingGroups {
  [key: string]: Meeting[]; // Add index signature
  Upcoming: Meeting[];
  Pending: Meeting[];
  Canceled: Meeting[];
  Past: Meeting[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [meetings, setMeetings] = useState<MeetingGroups>({
    Upcoming: [],
    Pending: [],
    Canceled: [],
    Past: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const tabs: TabType[] = ['Upcoming', 'Pending', 'Canceled', 'Past'];

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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

        if (meeting.status === 'Rejected') {
          categorizedMeetings.Canceled.push(meeting);
        } else if (meeting.status === 'Pending') {
          categorizedMeetings.Pending.push(meeting);
        } else if (meetingDate < now) {
          categorizedMeetings.Past.push(meeting);
        } else {
          categorizedMeetings.Upcoming.push(meeting);
        }
      });

      setMeetings(categorizedMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (meetingId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/events/${meetingId}`, 
        { status: 'Accepted' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchMeetings();
    } catch (error) {
      console.error('Error accepting meeting:', error);
    }
  };

  const handleReject = async (meetingId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/events/${meetingId}`, 
        { status: 'Rejected' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchMeetings();
    } catch (error) {
      console.error('Error rejecting meeting:', error);
    }
  };

  const handleParticipantAction = async (meetingId: string, email: string, action: 'Accept' | 'Reject') => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/events/${meetingId}/participant`,
        { email, status: action },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchMeetings();
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing participant:`, error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    }).replace(',', ',');
  };

  const formatTime = (time: string, period: string) => {
    const timeNum = parseInt(time);
    const startTime = `${time}${period.toLowerCase()}`;
    const endTimeHour = (timeNum + 1).toString().padStart(2, '0');
    const endTime = `${endTimeHour}:30${period.toLowerCase()}`;
    return `${startTime} - ${endTime}`;
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
            <div>
              {meetings[activeTab].map((meeting) => {
                const meetingDetails = meeting.meetingDetails || JSON.parse(meeting.description);
                const formattedDate = formatDate(meetingDetails.date);
                const formattedTime = formatTime(meetingDetails.time, meetingDetails.period);
                const participantCount = meeting.emails?.length || 0;
                
                return (
                  <div key={meeting._id} className="p-6 border-b last:border-b-0 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-12">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-[#666] font-poppins">{formattedDate}</span>
                          <span className="text-[13px] text-blue-500 font-poppins">{formattedTime}</span>
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-[15px] font-medium text-gray-900 mb-1">{meetingDetails.eventTopic}</h3>
                          <p className="text-[13px] text-gray-500">{meetingDetails.meetingType || 'One-on-One'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {activeTab === 'Upcoming' && (
                          <>
                            <span className="px-4 py-1.5 text-[13px] mr-12 border border-[#6e6e6ecb] rounded-3xl bg-[#F5F5F5] text-[#4B4B4B] font-medium min-w-[90px] text-center">
                              {meeting.status}<p>Accepted</p>
                            </span>
                            <div className="flex items-center gap-2">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="text-gray-500"
                              >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                              <span className="text-[13px] text-gray-600">
                                {participantCount} people
                              </span>
                            </div>
                          </>
                        )}
                        {activeTab === 'Pending' && (
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setShowParticipants(!showParticipants && selectedMeeting?._id === meeting._id);
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="text-gray-500"
                              >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                              <span className="text-[13px] text-gray-600">
                                {participantCount} people
                              </span>
                            </div>
                          </button>
                        )}
                        {activeTab === 'Canceled' && (
                          <span className="px-4 py-1.5 text-[13px] rounded-full bg-red-100 text-red-600 font-medium min-w-[90px] text-center">
                            Canceled
                          </span>
                        )}
                        {activeTab === 'Past' && (
                          <span className="px-4 py-1.5 text-[13px] rounded-full bg-gray-100 text-gray-600 font-medium min-w-[90px] text-center">
                            Past
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Participant List Popup for Pending Tab */}
                    {showParticipants && selectedMeeting?._id === meeting._id && activeTab === 'Pending' && (
                      <div className="absolute right-6 top-16 bg-white rounded-lg shadow-lg border border-gray-200 w-[400px] z-10">
                        <div className="p-4 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="text-[15px] font-medium">Participant ({participantCount})</h3>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleReject(meeting._id)}
                                className="px-3 py-1 text-sm rounded-full text-white bg-red-500 hover:bg-red-600"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => handleAccept(meeting._id)}
                                className="px-3 py-1 text-sm rounded-full text-white bg-green-500 hover:bg-green-600"
                              >
                                Accept
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {meeting.emails.map((email, index) => (
                            <div key={index} className="p-4 flex items-center justify-between border-b last:border-b-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  {email[0].toUpperCase()}
                                </div>
                                <span className="text-sm">{email}</span>
                              </div>
                              <input type="checkbox" className="w-4 h-4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}