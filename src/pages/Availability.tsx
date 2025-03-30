import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

interface WeeklySchedule {
  [key: string]: DaySchedule;
}

interface Event {
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  color?: string;
  meetingType?: MeetingType;
  description?: string;
  hostName?: string;
  password?: string;
  attendees?: string[];
  location?: string;
  type?: 'blue' | 'gray' | 'purple';
  duration?: string;
  period?: 'AM' | 'PM';
}

interface DateSelectionPopup {
  isOpen: boolean;
  type: 'month' | 'year';
  position: { x: number; y: number };
}

// Add these type definitions at the top with other interfaces
type MeetingType = 'one-on-one' | 'group' | 'workshop' | 'interview' | 'presentation' | 'conference';
type EventStatus = 'past' | 'present' | 'future';

interface EventStyle {
  bg: string;
  text: string;
}

interface EventVariantStyles {
  status: Record<EventStatus, EventStyle>;
  meetingType: Record<MeetingType, EventStyle>;
}

export default function Availability() {
  const [activeView, setActiveView] = useState<'Availability' | 'Calendar View'>('Calendar View');
  const [viewType, setViewType] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventType, setEventType] = useState<string>('one-on-one');
  const [timeZone, setTimeZone] = useState<string>('EST GMT-5');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      title: 'Meeting-2',
      startTime: '10:00',
      endTime: '11:00',
      date: '2024-01-25',
      color: '#E5E7EB',
      meetingType: 'one-on-one' as MeetingType
    },
    {
      title: 'Meeting',
      startTime: '09:00',
      endTime: '12:00',
      date: '2024-01-28',
      color: '#93C5FD',
      meetingType: 'group' as MeetingType
    },
    {
      title: 'Meeting-2',
      startTime: '14:00',
      endTime: '16:00',
      date: '2024-01-28',
      color: '#DDD6FE',
      meetingType: 'workshop' as MeetingType
    }
  ]);
  
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    Sun: { isAvailable: false, timeSlots: [] },
    Mon: { isAvailable: true, timeSlots: [{ startTime: '', endTime: '' }] },
    Tue: { isAvailable: true, timeSlots: [{ startTime: '', endTime: '' }] },
    Wed: { isAvailable: true, timeSlots: [{ startTime: '', endTime: '' }] },
    Thu: { isAvailable: true, timeSlots: [{ startTime: '', endTime: '' }] },
    Fri: { isAvailable: true, timeSlots: [{ startTime: '', endTime: '' }] },
    Sat: { isAvailable: true, timeSlots: [{ startTime: '', endTime: '' }] },
  });

  const [datePopup, setDatePopup] = useState<DateSelectionPopup>({
    isOpen: false,
    type: 'month',
    position: { x: 0, y: 0 }
  });

  // Update the useEffect for fetching events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/events', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Transform the events data to match our Event interface
        const transformedEvents = response.data.map((event: any) => {
          try {
            // Check if event exists
            if (!event) {
              console.warn('Invalid event data:', event);
              return null;
            }

            // Parse the description to get meeting details
            let meetingDetails;
            try {
              meetingDetails = JSON.parse(event.description);
            } catch (e) {
              console.warn('Invalid description format:', event.description);
              return null;
            }

            // Parse the date from meetingDetails
            const dateStr = meetingDetails.date;
            if (!dateStr) {
              console.warn('Missing date in event:', event);
              return null;
            }

            // Parse date components
            const [, monthDay] = dateStr.split(', ');
            if (!monthDay) {
              console.warn('Invalid date format:', dateStr);
              return null;
            }

            const [monthName, day] = monthDay.split(' ');
            const year = new Date().getFullYear();
            const date = new Date(`${monthName} ${day}, ${year}`);

            // Parse time
            const timeStr = meetingDetails.time;
            if (!timeStr) {
              console.warn('Missing time in event:', event);
              return null;
            }

            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':').map(Number);

            // Convert to 24-hour format
            let startHour = hours;
            if (period === 'PM' && hours !== 12) startHour += 12;
            if (period === 'AM' && hours === 12) startHour = 0;

            // Calculate end time based on duration
            const durationStr = meetingDetails.duration;
            if (!durationStr) {
              console.warn('Missing duration in event:', event);
              return null;
            }

            const durationHours = parseInt(durationStr.split(' ')[0]);
            const endHour = startHour + durationHours;

            // Format the date as YYYY-MM-DD
            const formattedDate = date.toISOString().split('T')[0];

            // Determine event color based on meeting type
            let color = '#E5E7EB'; // default color
            const meetingType = meetingDetails.meetingType?.toLowerCase() || 'one-on-one';
            switch (meetingType) {
              case 'one-on-one':
                color = '#E5E7EB';
                break;
              case 'group meeting':
                color = '#93C5FD';
                break;
              case 'interview':
                color = '#DDD6FE';
                break;
              case 'presentation':
                color = '#FDE68A';
                break;
              case 'workshop':
                color = '#86EFAC';
                break;
              case 'conference':
                color = '#FCA5A5';
                break;
            }

            return {
              id: event._id,
              title: event.title || 'Untitled Event',
              startTime: `${startHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
              endTime: `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
              date: formattedDate,
              color: color,
              meetingType: meetingType.replace(/\s+/g, '-') as MeetingType,
              description: meetingDetails.description || '',
              hostName: meetingDetails.hostName || '',
              password: meetingDetails.password || '',
              attendees: event.emails || [],
              location: meetingDetails.location || '',
              duration: durationStr,
              period: period as 'AM' | 'PM'
            };
          } catch (error) {
            console.error('Error transforming event:', error);
            return null;
          }
        }).filter(Boolean); // Remove any null events

        console.log('Transformed events:', transformedEvents);
        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Set empty array on error to prevent undefined errors
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  // Update the saveAvailability function to handle errors better
  useEffect(() => {
    const saveAvailability = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for saving availability');
          return;
        }

        // Only save if there are actual changes
        if (!weeklySchedule || !eventType || !timeZone) {
          console.warn('Missing required data for saving availability');
          return;
        }

        const response = await axios.post('http://localhost:5000/api/availability', {
          weeklySchedule,
          eventType,
          timeZone
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status !== 200) {
          console.warn('Unexpected response status:', response.status);
        }
      } catch (error) {
        console.error('Error saving availability:', error);
        // Don't throw the error, just log it
      }
    };

    saveAvailability();
  }, [weeklySchedule, eventType, timeZone]);

  // Add these helper functions
  const calculateEndTime = (startTime: string, duration: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationHours = parseInt(duration.split(' ')[0]);
    const totalMinutes = hours * 60 + minutes + (durationHours * 60);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const eventTypes = [
    { label: 'One-on-One', value: 'one-on-one' },
    { label: 'Group Meeting', value: 'group' },
    { label: 'Interview', value: 'interview' },
    { label: 'Presentation', value: 'presentation' },
    { label: 'Workshop', value: 'workshop' },
    { label: 'Conference', value: 'conference' }
  ];

  const timeZoneOptions = [
    { label: 'Auto time (daylight)', value: 'EST GMT-5' },
    { label: 'PST GMT-8', value: 'PST GMT-8' },
    { label: 'UTC', value: 'UTC' },
    { label: '(UTC +5:30 Delhi)', value: '(UTC +5:30 Delhi)' }
  ];

  // Add event handler
  const handleAddEvent = () => {
    const newEvent = {
      title: `New ${eventType} Meeting`,
      startTime: '09:00',
      endTime: '10:00',
      date: currentDate.toISOString().split('T')[0],
      color: '#E5E7EB',
      meetingType: eventType as MeetingType
    };
    setEvents([...events, newEvent]);
  };

  // Time zone change handler
  const handleTimeZoneChange = (newTimeZone: string) => {
    setTimeZone(newTimeZone);
  };

  // Event type change handler
  const handleEventTypeChange = (newType: string) => {
    setEventType(newType);
  };

  // Copy and paste functionality
  const [copiedSchedule, setCopiedSchedule] = useState<any>(null);

  const copyDaySchedule = (day: string) => {
    const daySchedule = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day.toLowerCase();
    });
    setCopiedSchedule(daySchedule);
  };

  const pasteDaySchedule = (targetDay: string) => {
    if (!copiedSchedule) return;
    
    const targetDate = new Date(currentDate);
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = daysOfWeek.indexOf(targetDay.toLowerCase());
    targetDate.setDate(targetDate.getDate() - targetDate.getDay() + targetDayIndex);

    const newEvents = copiedSchedule.map((event: Event) => ({
      ...event,
      date: targetDate.toISOString().split('T')[0]
    }));

    setEvents([...events, ...newEvents]);
  };

  // Bottom toolbar functionality
  const handleBottomToolbarClick = (action: string) => {
    switch (action) {
      case 'add':
        handleAddEvent();
        break;
      case 'copy':
        copyDaySchedule(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
        break;
      case 'paste':
        pasteDaySchedule(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
        break;
      default:
        break;
    }
  };

  const addTimeSlot = (day: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [
          ...prev[day].timeSlots,
          { startTime: '', endTime: '' }
        ]
      }
    }));
  };

  const removeTimeSlot = (day: string, index: number) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  const toggleDayAvailability = (day: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable,
        timeSlots: !prev[day].isAvailable ? [{ startTime: '', endTime: '' }] : []
      }
    }));
  };

  const getDaysInWeek = () => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let i = 9; i <= 16; i++) {
      slots.push(`${i}:00`);
    }
    return slots;
  };

  const openDatePopup = (type: 'month' | 'year', event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDatePopup({
      isOpen: true,
      type,
      position: { x: rect.left, y: rect.bottom + 5 }
    });
  };

  const closeDatePopup = () => {
    setDatePopup(prev => ({ ...prev, isOpen: false }));
  };

  const handleDateSelection = (value: string | number) => {
    const newDate = new Date(currentDate);
    if (datePopup.type === 'month') {
      newDate.setMonth(parseInt(value as string));
    } else {
      newDate.setFullYear(parseInt(value as string));
    }
    setCurrentDate(newDate);
    closeDatePopup();
  };

  const renderDatePopup = () => {
    if (!datePopup.isOpen) return null;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div 
        className="fixed inset-0 z-50"
        onClick={closeDatePopup}
      >
        <div 
          className="absolute bg-white rounded-lg shadow-lg border border-gray-200 w-48"
          style={{ 
            left: datePopup.position.x,
            top: datePopup.position.y
          }}
        >
          <div className="p-2 max-h-60 overflow-y-auto">
            {datePopup.type === 'month' ? (
              months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleDateSelection(index.toString())}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                    index === currentMonth ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {month}
                </button>
              ))
            ) : (
              years.map(year => (
                <button
                  key={year}
                  onClick={() => handleDateSelection(year)}
                  className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                    year === currentYear ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {year}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add this function to determine if an event is past, present, or future
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const eventStartTime = new Date(`${event.date}T${event.startTime}`);
    const eventEndTime = new Date(`${event.date}T${event.endTime}`);

    // Set time to midnight for date comparison
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) return 'past';
    if (eventDate > today) return 'future';
    
    // For today's events, check if they're currently happening
    if (now >= eventStartTime && now <= eventEndTime) return 'present';
    if (now < eventStartTime) return 'future';
    return 'past';
  };

  // Update the eventVariantStyles object with proper typing
  const eventVariantStyles: EventVariantStyles = {
    status: {
      past: {
        bg: "bg-gray-100",
        text: "text-gray-600",
      },
      present: {
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      future: {
        bg: "bg-green-100",
        text: "text-green-600",
      }
    },
    meetingType: {
      'one-on-one': {
        bg: "bg-gray-100",
        text: "text-gray-700",
      },
      'group': {
        bg: "bg-blue-100",
        text: "text-blue-700",
      },
      'workshop': {
        bg: "bg-purple-100",
        text: "text-purple-700",
      },
      'interview': {
        bg: "bg-gray-100",
        text: "text-gray-700",
      },
      'presentation': {
        bg: "bg-blue-100",
        text: "text-blue-700",
      },
      'conference': {
        bg: "bg-purple-100",
        text: "text-purple-700",
      }
    }
  };

  // Update the getEventStyle function with proper typing
  const getEventStyle = (event: Event): EventStyle => {
    const status = getEventStatus(event);
    const statusStyle = eventVariantStyles.status[status];
    const meetingType = event.meetingType as MeetingType;
    const meetingTypeStyle = meetingType ? eventVariantStyles.meetingType[meetingType] : null;

    if (meetingTypeStyle) {
      return {
        bg: `${statusStyle.bg} ${meetingTypeStyle.bg}`,
        text: `${statusStyle.text} ${meetingTypeStyle.text}`
      };
    }

    return statusStyle;
  };

  const renderCalendarView = () => {
    // Filter events based on search query and event type
    const filteredEvents = events.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!eventType || event.meetingType === eventType)
    );

    // Get current week's dates
    const getWeekDates = () => {
      const dates = [];
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          date: date.getDate().toString(),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          fullDate: date.toISOString().split('T')[0]
        });
      }
      return dates;
    };

    const weekDays = getWeekDates();
    const timeSlots = Array.from({ length: 8 }, (_, i) => {
      const hour = i + 9;
      return {
        label: `${hour % 12 || 12}${hour >= 12 ? ' PM' : ' AM'}`,
        value: hour
      };
    });

    // Navigation functions
    const handlePreviousWeek = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    };

    const handleToday = () => {
      setCurrentDate(new Date());
    };

    // Update the getEventsForSlot function
    const getEventsForSlot = (day: string, hour: string) => {
      return filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        const slotDate = weekDays.find(d => d.day === day)?.fullDate;
        const eventStartHour = parseInt(event.startTime.split(':')[0]);
        const eventEndHour = parseInt(event.endTime.split(':')[0]);
        const slotHour = parseInt(hour);

        return (
          eventDate.toISOString().split('T')[0] === slotDate &&
          slotHour >= eventStartHour &&
          slotHour < eventEndHour
        );
      });
    };

    return (
      <div className="min-h-screen bg-white p-6 rounded-2xl">
        <div className="w-[950px] mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex flex-col">
              <div className="text-black text-base font-medium">Activity</div>
              <div className="flex items-center gap-1 text-[#1877F2] text-xs">
                <select
                  value={eventType}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer"
                >
                  <option value="">Event type</option>
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.16876 3.2231L5.24064 6.10498C5.17675 6.16818 5.09051 6.20363 5.00064 6.20363C4.91077 6.20363 4.82453 6.16818 4.76064 6.10498L1.83251 3.22373C1.76823 3.16055 1.6817 3.12516 1.59158 3.12516C1.50145 3.12516 1.41492 3.16055 1.35064 3.22373C1.31898 3.25459 1.29382 3.29147 1.27665 3.33221C1.25947 3.37294 1.25062 3.41671 1.25062 3.46091C1.25062 3.50512 1.25947 3.54889 1.27665 3.58962C1.29382 3.63036 1.31898 3.66724 1.35064 3.6981L4.27814 6.57935C4.47096 6.76868 4.7304 6.87476 5.00064 6.87476C5.27087 6.87476 5.53031 6.76868 5.72314 6.57935L8.65064 3.6981C8.68239 3.66723 8.70763 3.63031 8.72486 3.58952C8.7421 3.54872 8.75098 3.50489 8.75098 3.4606C8.75098 3.41632 8.7421 3.37248 8.72486 3.33169C8.70763 3.2909 8.68239 3.25397 8.65064 3.2231C8.58635 3.15993 8.49983 3.12453 8.4097 3.12453C8.31957 3.12453 8.23305 3.15993 8.16876 3.2231Z" fill="#1877F2"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-black text-base font-medium">Time Zone</div>
              <div className="flex items-center gap-1 text-[#1877F2] text-xs">
                <select
                  value={timeZone}
                  onChange={(e) => handleTimeZoneChange(e.target.value)}
                  className="bg-transparent border-none outline-none cursor-pointer"
                >
                  {timeZoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.16876 3.2231L5.24064 6.10498C5.17675 6.16818 5.09051 6.20363 5.00064 6.20363C4.91077 6.20363 4.82453 6.16818 4.76064 6.10498L1.83251 3.22373C1.76823 3.16055 1.6817 3.12516 1.59158 3.12516C1.50145 3.12516 1.41492 3.16055 1.35064 3.22373C1.31898 3.25459 1.29382 3.29147 1.27665 3.33221C1.25947 3.37294 1.25062 3.41671 1.25062 3.46091C1.25062 3.50512 1.25947 3.54889 1.27665 3.58962C1.29382 3.63036 1.31898 3.66724 1.35064 3.6981L4.27814 6.57935C4.47096 6.76868 4.7304 6.87476 5.00064 6.87476C5.27087 6.87476 5.53031 6.76868 5.72314 6.57935L8.65064 3.6981C8.68239 3.66723 8.70763 3.63031 8.72486 3.58952C8.7421 3.54872 8.75098 3.50489 8.75098 3.4606C8.75098 3.41632 8.7421 3.37248 8.72486 3.33169C8.70763 3.2909 8.68239 3.25397 8.65064 3.2231C8.58635 3.15993 8.49983 3.12453 8.4097 3.12453C8.31957 3.12453 8.23305 3.15993 8.16876 3.2231Z" fill="#1877F2"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#e0e0e000] mb-5" />

          {/* Navigation Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg overflow-hidden">
                <button 
                  onClick={handlePreviousWeek}
                  className="h-7 px-3 bg-[#F4F4F5] hover:bg-[#E4E4E7] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.4359 4.76375C11.6046 4.93253 11.6994 5.1614 11.6994 5.40005C11.6994 5.6387 11.6046 5.86758 11.4359 6.03635L8.47221 9.00005L11.4359 11.9638C11.5999 12.1335 11.6906 12.3608 11.6885 12.5968C11.6865 12.8328 11.5918 13.0585 11.4249 13.2254C11.2581 13.3923 11.0324 13.4869 10.7964 13.489C10.5604 13.491 10.3331 13.4003 10.1633 13.2364L6.56331 9.63635C6.39459 9.46758 6.2998 9.2387 6.2998 9.00005C6.2998 8.7614 6.39459 8.53253 6.56331 8.36375L10.1633 4.76375C10.3321 4.59503 10.561 4.50024 10.7996 4.50024C11.0383 4.50024 11.2671 4.59503 11.4359 4.76375Z" fill="#18181B"/>
                  </svg>
                </button>
                <button 
                  onClick={handleToday}
                  className="h-7 px-4 bg-[#F4F4F5] hover:bg-[#E4E4E7] transition-colors text-xs font-medium"
                >
                  Today
                </button>
                <button 
                  onClick={handleNextWeek}
                  className="h-7 px-3 bg-[#F4F4F5] hover:bg-[#E4E4E7] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.4637 13.2363C7.29498 13.0676 7.2002 12.8387 7.2002 12.6C7.2002 12.3614 7.29498 12.1325 7.4637 11.9637L10.4274 9.00005L7.4637 6.03635C7.29976 5.86661 7.20905 5.63927 7.2111 5.40329C7.21315 5.16731 7.3078 4.94158 7.47467 4.77471C7.64153 4.60785 7.86727 4.51319 8.10324 4.51114C8.33922 4.50909 8.56656 4.59981 8.7363 4.76375L12.3363 8.36375C12.505 8.53252 12.5998 8.7614 12.5998 9.00005C12.5998 9.2387 12.505 9.46757 12.3363 9.63635L8.7363 13.2363C8.56753 13.4051 8.33865 13.4999 8.1 13.4999C7.86136 13.4999 7.63248 13.4051 7.4637 13.2363Z" fill="#18181B"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="text-sm font-medium cursor-pointer hover:text-blue-600"
                  onClick={(e) => openDatePopup('month', e)}
                >
                  {currentDate.toLocaleString('default', { month: 'long' })}
                </div>
                <div 
                  className="text-sm font-medium cursor-pointer hover:text-blue-600"
                  onClick={(e) => openDatePopup('year', e)}
                >
                  {currentDate.getFullYear()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {["Day", "Week", "Month", "Year"].map((view) => (
                <button
                  key={view}
                  onClick={() => setViewType(view.toLowerCase() as any)}
                  className={`text-sm font-medium px-4 py-1 rounded-lg transition-colors ${
                    viewType.toLowerCase() === view.toLowerCase()
                      ? "bg-[#1877F2] text-white"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[175px] h-[26px] pl-8 pr-3 text-xs bg-[#F4F4F5] rounded placeholder-zinc-400 focus:outline-none"
              />
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-900" width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.79941 4.10001C6.84463 4.10001 5.92896 4.47929 5.25383 5.15442C4.5787 5.82955 4.19941 6.74523 4.19941 7.70001C4.19941 8.65479 4.5787 9.57046 5.25383 10.2456C5.92896 10.9207 6.84463 11.3 7.79941 11.3C8.75419 11.3 9.66987 10.9207 10.345 10.2456C11.0201 9.57046 11.3994 8.65479 11.3994 7.70001C11.3994 6.74523 11.0201 5.82955 10.345 5.15442C9.66987 4.47929 8.75419 4.10001 7.79941 4.10001ZM2.39941 7.70001C2.39931 6.85014 2.59979 6.01225 2.98457 5.25447C3.36934 4.4967 3.92754 3.84044 4.61377 3.33908C5.3 2.83771 6.09487 2.5054 6.93375 2.36916C7.77262 2.23291 8.63181 2.2966 9.44143 2.55502C10.2511 2.81345 10.9883 3.25932 11.5931 3.85637C12.1979 4.45343 12.6532 5.18481 12.9221 5.99103C13.1909 6.79724 13.2657 7.65554 13.1403 8.4961C13.0149 9.33667 12.6929 10.1358 12.2004 10.8284L16.5357 15.1637C16.6997 15.3334 16.7904 15.5608 16.7883 15.7968C16.7863 16.0327 16.6916 16.2585 16.5248 16.4253C16.3579 16.5922 16.1322 16.6869 15.8962 16.6889C15.6602 16.691 15.4329 16.6002 15.2631 16.4363L10.9287 12.1019C10.1208 12.6764 9.17043 13.0174 8.18162 13.0875C7.19282 13.1577 6.20378 12.9543 5.32288 12.4997C4.44199 12.0451 3.70323 11.3567 3.18757 10.5101C2.6719 9.66351 2.39922 8.6913 2.39941 7.70001Z" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-lg border border-[#E0E0E0] overflow-hidden bg-white">
            {/* Week days header */}
            <div className="grid grid-cols-[48px_repeat(7,1fr)_48px]">
              <div className="border-b border-[#E0E0E0]" />
              {weekDays.map(({ day, date, isWeekend }) => (
                <div
                  key={day}
                  className={`py-2 px-3 ${isWeekend ? 'bg-[#FAFAFA]' : 'bg-white'} border-b border-l border-[#E0E0E0] first:border-l-0`}
                >
                  <div className="text-[10px] font-medium text-zinc-500 mb-1">{day}</div>
                  <div className="text-[22px] font-medium text-zinc-900">{date}</div>
                </div>
              ))}
              <div className="border-b border-[#E0E0E0]" />
            </div>

            {/* Time zone indicator */}
            <div className="text-[10px] text-zinc-500 px-3 py-2 border-b border-[#E0E0E0]">
              {timeZone}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[48px_repeat(7,1fr)_48px]">
              {timeSlots.map(({ label, value }) => (
                <React.Fragment key={label}>
                  {/* Left time label cell */}
                  <div className="relative h-[60px]">
                    <div className="absolute -top-2 right-2 text-[10px] text-zinc-500">
                      {label}
                    </div>
                  </div>

                  {/* Day cells for this time slot */}
                  {weekDays.map(({ day, isWeekend }) => (
                    <div
                      key={`${day}-${label}`}
                      className={`relative h-[60px] border-l border-t border-[#E0E0E0] first:border-l-0 ${
                        isWeekend ? 'bg-[#FAFAFA]' : ''
                      }`}
                    >
                      {getEventsForSlot(day, value.toString()).map((event, index) => {
                        const duration = parseInt(event.endTime) - parseInt(event.startTime);
                        const startMinutes = parseInt(event.startTime.split(':')[1]) || 0;

                        return (
                          <div
                            key={index}
                            className="absolute inset-x-0 hover:opacity-90 transition-opacity cursor-pointer mx-[1px] overflow-hidden rounded-sm"
                            style={{ 
                              height: `${duration * 60}px`,
                              top: `${startMinutes}px`,
                              zIndex: 10,
                              backgroundColor: event.color
                            }}
                          >
                            <div className="p-2">
                              <div className="flex gap-1 text-xs font-medium text-white">
                                <span>{formatTime(event.startTime)}</span>
                              </div>
                              <div className="text-xs mt-1 font-medium truncate text-white">
                                {event.title}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Right time label cell */}
                  <div className="relative h-[60px]">
                    <div className="absolute -top-2 left-2 text-[10px] text-zinc-500">
                      {label}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        {renderDatePopup()}
      </div>
    );
  };

  const renderWeeklyHours = () => {
    return (
      <div className="px-6 py-5 border-t">
        <h3 className="text-base font-medium mb-6">Weekly hours</h3>
        <div className="space-y-5">
          {Object.entries(weeklySchedule).map(([day, schedule]) => (
            <div key={day} className="flex items-center">
              <div className="w-[90px] flex items-center">
                <input
                  type="checkbox"
                  checked={schedule.isAvailable}
                  onChange={() => toggleDayAvailability(day)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="ml-2.5 text-sm text-gray-600 font-medium">{day}</span>
              </div>

              <div className="flex-1">
                {!schedule.isAvailable ? (
                  <span className="text-sm text-gray-500">Unavailable</span>
                ) : (
                  <div className="space-y-2">
                    {schedule.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const newSchedule = { ...weeklySchedule };
                              newSchedule[day].timeSlots[index].startTime = e.target.value;
                              setWeeklySchedule(newSchedule);
                            }}
                            className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 w-[120px]"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const newSchedule = { ...weeklySchedule };
                              newSchedule[day].timeSlots[index].endTime = e.target.value;
                              setWeeklySchedule(newSchedule);
                            }}
                            className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 w-[120px]"
                          />
                        </div>
                        
                        {index > 0 && (
                          <button
                            onClick={() => removeTimeSlot(day, index)}
                            className="ml-2 text-gray-400 hover:text-gray-500"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {schedule.isAvailable && (
                  <button
                    onClick={() => addTimeSlot(day)}
                    className="text-gray-400 hover:text-gray-500"
                    title="Add time slot"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => copyDaySchedule(day)}
                  className="text-gray-400 hover:text-gray-500"
                  title="Copy schedule"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f3f1] py-8 ">
      <div className="mb-6">
        <h1 className="text-xl font-semibold ml-4">Availability</h1>
        <p className="text-sm text-gray-600 ml-4">
          Configure times when you are available for bookings
        </p>
      </div>
      <div className={`${activeView === 'Availability' ? 'max-w-2xl' : 'max-w-7xl'} mx-0 ml-10 text-left flex flex-col items-start`}>
        {/* Header */}

        {/* View Toggle */}
        <div className="mb-4  ">
          <div className="inline-flex rounded-lg bg-white shadow-sm border border-gray-200 ">
            <button
              onClick={() => setActiveView('Availability')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-2 ${
                activeView === 'Availability'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg 
                className="w-4 h-4"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              Availability
            </button>
            <button
              onClick={() => setActiveView('Calendar View')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-2 border-l ${
                activeView === 'Calendar View'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg 
                className="w-4 h-4"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Calendar View
            </button>
          </div>
        </div>

        <div className={`bg-white ${activeView === 'Availability' ? 'rounded-3xl' : 'rounded-lg'} shadow-sm border border-gray-200`}>
          {activeView === 'Availability' ? (
            <div>
              {/* Activity and Time Zone */}
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Activity</label>
                    <div className="relative">
                      <select
                        value={eventType}
                        onChange={(e) => handleEventTypeChange(e.target.value)}
                        className="block w-full pl-3 pr-8 py-1.5 text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md bg-transparent appearance-none text-gray-400"
                      >
                        <option value="">Event type</option>
                        {eventTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Time Zone</label>
                    <div className="relative">
                      <select
                        value={timeZone}
                        onChange={(e) => handleTimeZoneChange(e.target.value)}
                        className="block w-full pl-3 pr-8 py-1.5 text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md bg-transparent appearance-none text-blue-600"
                      >
                        {timeZoneOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {renderWeeklyHours()}
            </div>
          ) : (
            renderCalendarView()
          )}
        </div>
      </div>
    </div>
  );
}