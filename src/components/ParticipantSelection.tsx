import React from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface Participant {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  status?: 'Accepted' | 'Rejected' | 'Pending';
  selected?: boolean;
}

interface ParticipantSelectionProps {
  eventId: string;
  participants: Participant[];
  onParticipantStatusChange: (participantId: string, status: 'Accepted' | 'Rejected') => void;
}

export default function ParticipantSelection({ eventId, participants, onParticipantStatusChange }: ParticipantSelectionProps) {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const handleAccept = async (participantId: string) => {
    try {
      const response = await axios.put(
        `${apiBaseUrl}/api/events/${eventId}/participants/${participantId}`,
        { status: 'Accepted' },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.status === 200) {
        onParticipantStatusChange(participantId, 'Accepted');
        toast.success('Participant accepted successfully');
      }
    } catch (error) {
      console.error('Error accepting participant:', error);
      toast.error('Failed to accept participant');
    }
  };

  const handleReject = async (participantId: string) => {
    try {
      const response = await axios.put(
        `${apiBaseUrl}/api/events/${eventId}/participants/${participantId}`,
        { status: 'Rejected' },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.status === 200) {
        onParticipantStatusChange(participantId, 'Rejected');
        toast.success('Participant rejected successfully');
      }
    } catch (error) {
      console.error('Error rejecting participant:', error);
      toast.error('Failed to reject participant');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Participants</h3>
      <div className="space-y-3">
        {participants.map((participant) => (
          <div key={participant.user._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {participant.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{participant.user.name}</p>
                <p className="text-sm text-gray-500">{participant.user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {participant.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleAccept(participant.user._id)}
                    className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(participant.user._id)}
                    className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              {participant.status === 'Accepted' && (
                <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-md">
                  Accepted
                </span>
              )}
              {participant.status === 'Rejected' && (
                <span className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded-md">
                  Rejected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 