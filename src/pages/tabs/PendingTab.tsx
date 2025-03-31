import React, { useState } from 'react';
import { Meeting } from '../../types';
import { formatTime, formatDate } from '../../utils/dateUtils';

interface PendingTabProps {
  meetings: Meeting[];
  onAccept: (meetingId: string) => void;
  onReject: (meetingId: string) => void;
  onParticipantAction: (meetingId: string, email: string, action: 'Accept' | 'Reject') => void;
}

export default function PendingTab({ meetings, onAccept, onReject, onParticipantAction }: PendingTabProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  return (
    <div>
      {meetings.map((meeting) => {
        const meetingDetails = meeting.meetingDetails || JSON.parse(meeting.description);
        const participantCount = meeting.emails?.length || 0;
        
        return (
          <div key={meeting._id} className="p-6 border-b last:border-b-0 relative hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex gap-8">
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[13px] text-blue-500">
                    {formatTime(meetingDetails.time || '10:30')}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    {formatDate(meetingDetails.date || new Date().toISOString())}
                  </span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-medium text-gray-900">
                    {meetingDetails.meetingType || 'Meeting'}
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    You and team {meetingDetails.teamNumber || '1'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setShowParticipants(!showParticipants || selectedMeeting?._id !== meeting._id);
                }}
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-[13px] text-gray-600">{participantCount} people</span>
              </button>
            </div>

            {/* Participant List Popup */}
            {showParticipants && selectedMeeting?._id === meeting._id && (
              <div className="absolute right-6 top-16 bg-white rounded-lg shadow-lg border border-gray-200 w-[400px] z-10">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[15px] font-medium">
                      Participant ({participantCount})
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onReject(meeting._id)}
                        className="px-4 py-1 text-sm rounded-full text-white bg-red-500 hover:bg-red-600"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => onAccept(meeting._id)}
                        className="px-4 py-1 text-sm rounded-full text-white bg-green-500 hover:bg-green-600"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {meeting.emails?.map((email, index) => {
                    const name = email.split('@')[0]
                      .split('.')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    
                    return (
                      <div key={index} className="p-4 flex items-center justify-between border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                            alt={name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm text-gray-700">{name}</span>
                        </div>
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            onParticipantAction(meeting._id, email, isChecked ? 'Accept' : 'Reject');
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 