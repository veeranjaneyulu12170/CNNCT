import React from 'react';
import { Meeting } from '../../types';
import { formatTime, formatDate } from '../../utils/dateUtils';

interface UpcomingTabProps {
  meetings: Meeting[];
}

export default function UpcomingTab({ meetings }: UpcomingTabProps) {
  const formatTimeRange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startHour = hours % 12 || 12;
    const endHour = (hours + 1) % 12 || 12;
    return `${startHour}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'} - ${endHour}:${minutes.toString().padStart(2, '0')} ${(hours + 1) >= 12 ? 'pm' : 'am'}`;
  };

  const formatDateSimple = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[date.getDay()]}, ${date.getDate()} feb`;
  };

  return (
    <div>
      {meetings.map((meeting) => {
        const meetingDetails = meeting.meetingDetails || JSON.parse(meeting.description);
        const acceptedParticipants = meeting.participants?.filter(p => p.status === 'Accepted') || [];
        const participantCount = acceptedParticipants.length;
        
        return (
          <div key={meeting._id} className="p-6 border-b last:border-b-0 relative">
            <div className="flex justify-between items-center">
              <div className="flex gap-8">
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[13px] text-blue-500">
                    {formatTimeRange(meetingDetails.time)}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    {formatDateSimple(meetingDetails.date)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-medium text-gray-900">
                    {meetingDetails.meetingType || 'Meeting-2'}
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    You and team {meetingDetails.teamNumber || '2'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 text-[13px] rounded-3xl bg-gray-100 text-gray-600">
                  Accepted
                </span>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="text-[13px] text-gray-600">
                    {participantCount} people
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 