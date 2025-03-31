import React from 'react';
import { Meeting } from '../../types';
import { formatTime, formatDate } from '../../utils/dateUtils';

interface PastTabProps {
  meetings: Meeting[];
}

export default function PastTab({ meetings }: PastTabProps) {
  return (
    <div>
      {meetings.map((meeting) => {
        const meetingDetails = meeting.meetingDetails || JSON.parse(meeting.description);
        
        return (
          <div key={meeting._id} className="p-6 border-b last:border-b-0 relative">
            <div className="flex justify-between items-center">
              <div className="flex gap-8">
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[13px] text-blue-500">
                    {formatTime(meetingDetails.time)}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    {formatDate(meetingDetails.date)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-medium text-gray-900">
                    {meetingDetails.eventTopic || meeting.title}
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    You and {meetingDetails.hostName || 'team'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-[13px] rounded-full bg-gray-100 text-gray-600">
                Past
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
} 