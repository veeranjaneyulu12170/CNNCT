import React, { useState, useEffect } from 'react';
import { Meeting } from '../../types';
import axios from 'axios';
import { toast } from 'sonner';

interface PendingTabProps {
  meetings: Meeting[];
  onAccept: (meetingId: string) => void;
  onReject: (meetingId: string) => void;
  onParticipantAction: (meetingId: string, email: string, action: 'Accept' | 'Reject') => void;
}

export default function PendingTab({ meetings, onAccept, onReject, onParticipantAction }: PendingTabProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, Record<string, 'Accepted' | 'Rejected' | 'Pending'>>>({});

  // Initialize participant statuses from meeting data
  useEffect(() => {
    const initialStatuses: Record<string, Record<string, 'Accepted' | 'Rejected' | 'Pending'>> = {};
    
    meetings.forEach(meeting => {
      initialStatuses[meeting._id] = {};
      
      // Get participants from either participants array or emails array
      const participants = meeting.participants || 
        (meeting.emails?.map(email => ({ email, status: 'Pending' as const })) || []);
      
      participants.forEach(participant => {
        const email = participant.email || (participant.user?.email || '');
        if (email) {
          initialStatuses[meeting._id][email] = participant.status || 'Pending';
        }
      });
    });
    
    setParticipantStatuses(initialStatuses);
  }, [meetings]);

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
      const meeting = meetings.find(m => m._id === meetingId);
      if (!meeting) {
        toast.error('Meeting not found');
        return;
      }

      // Get all pending participants
      const pendingParticipants = meeting.participants.filter(p => p.status !== 'Accepted');
      
      if (pendingParticipants.length === 0) {
        toast.info('No pending participants to accept');
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading(`Accepting ${pendingParticipants.length} participants...`);
      
      // Update each participant's status
      let successCount = 0;
      let errorCount = 0;
      
      for (const participant of pendingParticipants) {
        const email = participant.email || (participant.user?.email || '');
        if (email) {
          try {
            await onParticipantAction(meetingId, email, 'Accept');
            successCount++;
          } catch (error) {
            console.error(`Error accepting participant ${email}:`, error);
            errorCount++;
          }
        }
      }
      
      // Update toast based on results
      toast.dismiss(loadingToast);
      if (errorCount === 0) {
        toast.success(`Successfully accepted all ${successCount} participants`);
      } else {
        toast.warning(`Accepted ${successCount} participants, ${errorCount} failed`);
      }

      // Close the popup
      setShowParticipants(false);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Error accepting all participants:', error);
      toast.error('Failed to accept participants');
    }
  };

  // Handle Reject All action
  const handleRejectAll = async (meetingId: string) => {
    try {
      const meeting = meetings.find(m => m._id === meetingId);
      if (!meeting) {
        toast.error('Meeting not found');
        return;
      }

      // Get all pending participants
      const pendingParticipants = meeting.participants.filter(p => p.status !== 'Rejected');
      
      if (pendingParticipants.length === 0) {
        toast.info('No pending participants to reject');
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading(`Rejecting ${pendingParticipants.length} participants...`);
      
      // Update each participant's status
      let successCount = 0;
      let errorCount = 0;
      
      for (const participant of pendingParticipants) {
        const email = participant.email || (participant.user?.email || '');
        if (email) {
          try {
            await onParticipantAction(meetingId, email, 'Reject');
            successCount++;
          } catch (error) {
            console.error(`Error rejecting participant ${email}:`, error);
            errorCount++;
          }
        }
      }
      
      // Update toast based on results
      toast.dismiss(loadingToast);
      if (errorCount === 0) {
        toast.success(`Successfully rejected all ${successCount} participants`);
      } else {
        toast.warning(`Rejected ${successCount} participants, ${errorCount} failed`);
      }

      // Close the popup
      setShowParticipants(false);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Error rejecting all participants:', error);
      toast.error('Failed to reject participants');
    }
  };

  // Handle participant status change locally
  const handleParticipantStatusChange = async (meetingId: string, email: string, isAccepted: boolean) => {
    // Update local state first
    setParticipantStatuses(prev => ({
      ...prev,
      [meetingId]: {
        ...(prev[meetingId] || {}),
        [email]: isAccepted ? 'Accepted' : 'Rejected'
      }
    }));

    // Call the API
    try {
      await onParticipantAction(meetingId, email, isAccepted ? 'Accept' : 'Reject');
      toast.success(`Participant ${isAccepted ? 'accepted' : 'rejected'}`);
    } catch (error) {
      // Revert local state if API call fails
      console.error('Error updating participant status:', error);
      toast.error('Failed to update participant status');
      
      setParticipantStatuses(prev => ({
        ...prev,
        [meetingId]: {
          ...(prev[meetingId] || {}),
          [email]: isAccepted ? 'Rejected' : 'Accepted'
        }
      }));
    }
  };

  return (
    <div onClick={handleClickOutside}>
      {meetings.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No pending events found
        </div>
      ) : (
        meetings.map((meeting) => {
          // Extract meeting details from either meetingDetails or description
          let meetingDetails;
          try {
            meetingDetails = meeting.meetingDetails || 
              (typeof meeting.description === 'string' 
                ? JSON.parse(meeting.description) 
                : meeting.description);
          } catch (err) {
            console.error('Error parsing meeting details:', err);
            meetingDetails = {};
          }
          
          // Get participants from either participants array or emails array
          const participants = meeting.participants || 
            (meeting.emails?.map(email => ({ email, status: 'Pending' as const })) || []);
          
          const participantCount = participants.length;
          const isSelected = selectedMeeting?._id === meeting._id;
          
          return (
            <div key={meeting._id} className="h-screen p-6 border-b last:border-b-0 relative hover:bg-gray-50">
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

                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 text-[13px] rounded-3xl bg-yellow-100 text-yellow-600">
                    Pending
                  </span>
                  
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
              </div>

              {/* Participant List Popup */}
              {showParticipants && isSelected && (
                <div 
                  className="participants-popup absolute right-6 top-16 bg-white rounded-lg shadow-lg border border-gray-200 w-[400px] z-50 overflow-visible"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[15px] font-medium">
                        Participants ({participantCount})
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectAll(meeting._id);
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
                    {participants.map((participant, index) => {
                      const email = participant.email || (participant.user?.email || '');
                      if (!email) return null;
                      
                      const name = email.split('@')[0]
                        .split('.')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      
                      const status = participantStatuses[meeting._id]?.[email] || participant.status || 'Pending';
                      const isAccepted = status === 'Accepted';
                      
                      return (
                        <div key={index} className="p-4 flex items-center justify-between border-b last:border-b-0">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                              alt={name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="text-sm text-gray-700">{name}</div>
                              <div className="text-xs text-gray-500">{email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'
                              }`}
                              onClick={() => handleParticipantStatusChange(meeting._id, email, false)}
                              title="Reject"
                            >
                              ✕
                            </button>
                            <button
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                status === 'Accepted' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                              }`}
                              onClick={() => handleParticipantStatusChange(meeting._id, email, true)}
                              title="Accept"
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
} 