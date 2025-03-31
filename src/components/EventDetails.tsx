import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Meeting, Participant } from '../types';
import ParticipantSelection from './ParticipantSelection';
import { toast } from 'sonner';

interface EventDetailsProps {
  eventId: string;
}

export default function EventDetails({ eventId }: EventDetailsProps) {
  const [event, setEvent] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`          }
        });
        setEvent(response.data);
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleParticipantStatusChange = (participantId: string, status: 'Accepted' | 'Rejected') => {
    if (event) {
      setEvent({
        ...event,
        participants: event.participants.map(p => 
          p.id === participantId ? { ...p, status } : p
        )
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!event) {
    return <div className="p-6">Event not found</div>;
  }

  const meetingDetails = event.meetingDetails || JSON.parse(event.description);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{meetingDetails.meetingType}</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-base font-medium">{meetingDetails.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="text-base font-medium">{meetingDetails.time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-base font-medium">{meetingDetails.duration}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-base">{meetingDetails.description}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ParticipantSelection
          eventId={eventId}
          participants={event.participants}
          onParticipantStatusChange={handleParticipantStatusChange}
        />
      </div>
    </div>
  );
} 
