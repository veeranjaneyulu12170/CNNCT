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
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, Record<string, boolean>>>({});

  // Handle clicking outside to close popup
  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.participants-popup') && !target.closest('.participants-button')) {
      setShowParticipants(false);
      setSelectedMeeting(null);
    }
  };

  // Handle Accept All action
  const handleAcceptAll = async (meetingId: string) => {
    try {
      // Call the onAccept function
      await onAccept(meetingId);
      
      // Update local state
      setParticipantStatuses(prev => {
        const updatedStatuses = { ...prev };
        if (selectedMeeting?.emails) {
          updatedStatuses[meetingId] = selectedMeeting.emails.reduce((acc, email) => ({
            ...acc,
            [email]: true
          }), {});
        }
        return updatedStatuses;
      });

      // Close the popup
      setShowParticipants(false);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Error accepting all participants:', error);
    }
  };

  // Handle participant status change locally
  const handleParticipantStatusChange = async (meetingId: string, email: string, isChecked: boolean) => {
    // Update local state first
    setParticipantStatuses(prev => ({
      ...prev,
      [meetingId]: {
        ...(prev[meetingId] || {}),
        [email]: isChecked
      }
    }));

    // Call the API
    try {
      await onParticipantAction(meetingId, email, isChecked ? 'Accept' : 'Reject');
    } catch (error) {
      // Revert local state if API call fails
      setParticipantStatuses(prev => ({
        ...prev,
        [meetingId]: {
          ...(prev[meetingId] || {}),
          [email]: !isChecked
        }
      }));
    }
  };

  return (
    <div onClick={handleClickOutside}>
      {meetings.map((meeting) => {
        const meetingDetails = meeting.meetingDetails || JSON.parse(meeting.description);
        const participantCount = meeting.emails?.length || 0;
        const isSelected = selectedMeeting?._id === meeting._id;
        
        return (
          <div key={meeting._id} className="p-6 border-b last:border-b-0 relative hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex gap-8">
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[13px] text-blue-500">
                    {meetingDetails.time} - {meetingDetails.duration}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    {meetingDetails.date}
                  </span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-medium text-gray-900">
                    {meeting.title || meetingDetails.eventTopic}
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    {meetingDetails.meetingType}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSelected) {
                    setShowParticipants(!showParticipants);
                  } else {
                    setSelectedMeeting(meeting);
                    setShowParticipants(true);
                  }
                }}
                className="participants-button flex items-center gap-2 hover:text-blue-500"
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
            {showParticipants && isSelected && (
              <div 
                className="participants-popup absolute right-6 top-16 bg-white rounded-lg shadow-lg border border-gray-200 w-[400px] z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[15px] font-medium">
                      Participant ({participantCount})
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject(meeting._id);
                        }}
                        className="px-4 py-1 text-sm rounded-full text-white bg-red-500 hover:bg-red-600"
                      >
                        Reject All
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptAll(meeting._id);
                        }}
                        className="px-4 py-1 text-sm rounded-full text-white bg-green-500 hover:bg-green-600"
                      >
                        Accept All
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
                    
                    const isChecked = participantStatuses[meeting._id]?.[email] ?? false;
                    
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
                          checked={isChecked}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onChange={(e) => {
                            e.stopPropagation();
                            handleParticipantStatusChange(meeting._id, email, e.target.checked);
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