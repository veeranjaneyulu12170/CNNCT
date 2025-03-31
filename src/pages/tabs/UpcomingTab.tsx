import React from 'react';
import { Meeting } from '../../types';

interface UpcomingTabProps {
  meetings: Meeting[];
}

export default function UpcomingTab({ meetings }: UpcomingTabProps) {
  const formatTimeRange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startHour = hours % 12 || 12;
    const endHour = (hours + 1) % 12 || 12;
    return `${startHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${hours >= 12 ? 'pm' : 'am'} - ${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${(hours + 1) >= 12 ? 'pm' : 'am'}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const upcomingMeetings = meetings.filter(meeting => 
    meeting.status === 'Accepted' || 
    meeting.participants?.some(p => p.status === 'Accepted')
  );

  return (
    <div className="w-full">
      {upcomingMeetings.map((meeting) => {
        const meetingDetails = meeting.meetingDetails || JSON.parse(meeting.description);
        const acceptedParticipants = meeting.participants?.filter(p => p.status === 'Accepted') || [];
        
        return (
          <div key={meeting._id} className="p-4 sm:p-6 border-b last:border-b-0 hover:bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full sm:w-auto">
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[13px] text-blue-500 break-words">
                    {meetingDetails.time} - {meetingDetails.duration}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    {meetingDetails.date}
                  </span>
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <h3 className="text-[15px] font-medium text-gray-900 break-words">
                      {meeting.title || meetingDetails.eventTopic}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      Accepted
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 mt-1">
                    {meetingDetails.meetingType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center -space-x-2">
                  {acceptedParticipants.slice(0, 3).map((participant, index) => {
                    const email = participant.email || participant.user?.email || '';
                    const name = email.split('@')[0]
                      .split('.')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');

                    return (
                      <img
                        key={index}
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                        alt={name}
                        className="w-8 h-8 rounded-full border-2 border-white"
                      />
                    );
                  })}
                  {acceptedParticipants.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        +{acceptedParticipants.length - 3}
                      </span>
                    </div>
                  )}
                </div>
                
                <a
                  href={meeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join
                </a>
              </div>
            </div>
          </div>
        );
      })}
      
      {upcomingMeetings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming meetings</h3>
          <p className="text-sm text-gray-500">You don't have any accepted meetings yet.</p>
        </div>
      )}
    </div>
  );
} 