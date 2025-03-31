import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Frame62.css';
import line12 from '/public/images/line-120.svg';
import axios from 'axios';

interface FirstFormData {
  eventTopic: string;
  password: string;
  hostName: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  timeZone: string;
  period: 'AM' | 'PM';
  meetingType?: string;
}

interface SecondFormData {
  title: string;
  backgroundColor: string;
  link: string;
  emails: string[];
  profileImage: string | null;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { id: eventId } = useParams(); // Get event ID from URL if editing
  const isEditMode = !!eventId;
  
  const [showSecondForm, setShowSecondForm] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  
  const [firstFormData, setFirstFormData] = useState<FirstFormData>({
    eventTopic: '',
    password: '',
    hostName: '',
    description: '',
    date: '',
    time: '02:30',
    duration: '1 hour',
    timeZone: '(UTC +5:30 Delhi)',
    period: 'PM',
    meetingType: ''
  });

  const [secondFormData, setSecondFormData] = useState<SecondFormData>({
    title: '',
    backgroundColor: '#000000',
    link: '',
    emails: [],
    profileImage: null
  });

  const [emailInput, setEmailInput] = useState('');

  const colorOptions = [
    '#FF6B00', // Orange
    '#FFFFFF', // White
    '#000000', // Black
  ];

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const handleFirstFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFirstFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFirstFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!firstFormData.eventTopic || !firstFormData.hostName || !firstFormData.date) {
      alert('Please fill in all required fields');
      return;
    }

    // Set the title in secondFormData based on eventTopic
    setSecondFormData(prev => ({
      ...prev,
      title: firstFormData.eventTopic.trim()
    }));

    // Show the second form
    setShowSecondForm(true);
  };

  const handleSecondFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secondFormData.link || !secondFormData.emails.length) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Format the date
      const date = new Date(firstFormData.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      // Format time to match the expected format (e.g., "02:30pm")
      const time = firstFormData.time;
      const period = firstFormData.period.toLowerCase();
      const formattedTime = `${time}${period}`;

      const eventData = {
        title: firstFormData.eventTopic,
        description: JSON.stringify({
          ...firstFormData,
          date: formattedDate,
          time: formattedTime
        }),
        link: secondFormData.link,
        emails: secondFormData.emails,
        backgroundColor: secondFormData.backgroundColor,
        profileImage: secondFormData.profileImage,
        status: 'Pending',
        participants: secondFormData.emails.map(email => ({
          email,
          status: 'Pending'
        })),
        meetingDetails: {
          date: formattedDate,
          time: formattedTime,
          duration: firstFormData.duration,
          timeZone: firstFormData.timeZone,
          meetingType: firstFormData.meetingType || 'One-on-One',
          hostName: firstFormData.hostName,
          description: firstFormData.description,
          password: firstFormData.password
        }
      };

      let response;
      
      // Use PUT for updating, POST for creating
      if (isEditMode && eventId) {
        response = await axios.put(`${apiBaseUrl}/api/events/${eventId}`, eventData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Event updated:', response.data);
      } else {
        response = await axios.post(`${apiBaseUrl}/api/events`, eventData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Event created:', response.data);
      }

      if (response.status === 200 || response.status === 201) {
        setShowSuccessNotification(true);
        setTimeout(() => {
          navigate('/event-types');
        }, 1500);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} event. Please try again.`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dvvhyfrjr/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        console.log('Upload response:', data);
        if (data.secure_url) {
          console.log('Setting profile image:', data.secure_url);
          setSecondFormData(prev => {
            const updated = {
              ...prev,
              profileImage: data.secure_url
            };
            console.log('Updated form data:', updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      }
    }
  };

  // Add function to determine text color based on background
  const getTextColor = (bgColor: string) => {
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Add function to handle title edit
  const handleTitleEdit = () => {
    const newTitle = prompt('Edit event name:', secondFormData.title);
    if (newTitle !== null) {
      setSecondFormData(prev => ({ ...prev, title: newTitle }));
    }
  };

  const handleAddEmails = (input: string) => {
    // Split by commas, clean up the entries, and filter empty values
    const newEmails = input
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== '');
    
    console.log('Processing emails:', newEmails);
    
    if (newEmails.length === 0) return;
    
    // Add new emails to the existing list (avoiding duplicates)
    setSecondFormData(prev => {
      const existingEmails = new Set(prev.emails);
      newEmails.forEach(email => existingEmails.add(email));
      return {
        ...prev,
        emails: Array.from(existingEmails)
      };
    });
    
    // Clear the input after adding emails
    setEmailInput('');
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget.value;
      if (input.trim()) {
        handleAddEmails(input);
        // Clear the input
        e.currentTarget.value = '';
      }
    }
  };

  const formContainerStyle = {
   
    backgroundColor: '#f3f3f1',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '20px',
  };

  const formCardStyle = {
    backgroundColor: 'white',
    borderRadius: '40px',
    padding: '40px',
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };

  // Add useEffect to fetch event data if in edit mode
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await axios.get(`${apiBaseUrl}/api/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const event = response.data;
        console.log('Fetched event for editing:', event);
        
        // Process meeting details
        let meetingDetails;
        try {
          meetingDetails = event.meetingDetails || 
            (event.description ? JSON.parse(event.description) : null);
        } catch (err) {
          console.error('Error parsing meeting details:', err);
          meetingDetails = {};
        }
        
        // Parse time and period
        let time = meetingDetails?.time || '02:30';
        let period: 'AM' | 'PM' = 'PM';
        
        if (time.toLowerCase().includes('am')) {
          period = 'AM' as 'AM';
          time = time.toLowerCase().replace('am', '');
        } else if (time.toLowerCase().includes('pm')) {
          period = 'PM' as 'PM';
          time = time.toLowerCase().replace('pm', '');
        }
        
        // Format date for input field
        let formattedDate = '';
        try {
          const dateString = meetingDetails?.date;
          if (dateString) {
            const date = new Date(dateString);
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (err) {
          console.error('Error formatting date:', err);
        }
        
        // Update form data
        setFirstFormData({
          eventTopic: event.title || '',
          password: meetingDetails?.password || '',
          hostName: meetingDetails?.hostName || '',
          description: meetingDetails?.description || '',
          date: formattedDate || '',
          time: time || '02:30',
          duration: meetingDetails?.duration || '1 hour',
          timeZone: meetingDetails?.timeZone || '(UTC +5:30 Delhi)',
          period: period,
          meetingType: meetingDetails?.meetingType || ''
        });
        
        setSecondFormData({
          title: event.title || '',
          backgroundColor: event.backgroundColor || '#000000',
          link: event.link || '',
          emails: event.emails || [],
          profileImage: event.profileImage || null
        });
        
        // Show second form if we have event data
        setShowSecondForm(true);
      } catch (error) {
        console.error('Error fetching event data:', error);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };
    
    if (isEditMode) {
      fetchEventData();
    }
  }, [eventId, apiBaseUrl, isEditMode]);

  if (loading) {
    return (
      <div style={formContainerStyle} className="flex items-center justify-center">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={formContainerStyle} className="flex items-center justify-center">
        <div className="text-center py-12 text-red-600">
          {error}
          <div className="mt-4">
            <button
              onClick={() => navigate('/event-types')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showSecondForm) {
    return (
      <div style={formContainerStyle}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-black font-poppins">
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="text-black opacity-90 text-sm font-poppins">Create events to share for people to book on your calendar.</p>
          <p className="text-black opacity-90 text-sm font-poppins">New</p>
        </div>

        <div className="frame-62">
          <div className="label2">Add Event</div>
          <img className="line-12" src={line12} alt="Divider line" />
         
          
          <form onSubmit={handleFirstFormSubmit}>
            <div className="frame-63">
              <div className="event-topic">
                <span>
                  <span className="event-topic-span">Event Topic</span>
                  <span className="event-topic-span2"></span>
                  <span className="event-topic-span3">*</span>
                </span>
              </div>
              <div className="text-input">
                <input
                  type="text"
                  name="eventTopic"
                  placeholder="Set a conference topic before it starts"
                  value={firstFormData.eventTopic}
                  onChange={handleFirstFormChange}
                  className="set-a-conference-topic-before-it-starts"
                  required
                />
              </div>
            </div>

            <div className="frame-64">
              <div className="meeting-type">
                <span>Meeting Type</span>
                <span className="meeting-type-span3">*</span>
              </div>
              <div className="meeting-type-input">
                <select
                  name="meetingType"
                  value={firstFormData.meetingType || ''}
                  onChange={handleFirstFormChange}
                  required
                >
                  <option value="">Select type</option>
                  <option value="One-on-One">One-on-One</option>
                  <option value="Group Meeting">Group Meeting</option>
                  <option value="Interview">Interview</option>
                  <option value="Presentation">Presentation</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                </select>
              </div>
            </div>

            <div className="frame-65">
              <div className="password">
                <span>
                  <span className="password-span">Password</span>
                  <span className="password-span2"></span>
                </span>
              </div>
              <div className="text-input3">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={firstFormData.password}
                  onChange={handleFirstFormChange}
                  className="password2"
                />
              </div>
            </div>

            <div className="frame-66">
              <div className="host-name">
                <span>
                  <span className="host-name-span">Host name</span>
                  <span className="host-name-span2"></span>
                  <span className="host-name-span3">*</span>
                </span>
              </div>
              <div className="text-input5">
                <input
                  type="text"
                  name="hostName"
                  placeholder="Enter host name"
                  value={firstFormData.hostName}
                  onChange={handleFirstFormChange}
                  className="sarthak-pal"
                  required
                />
              </div>
            </div>

            <div className="desciption">Description</div>
            <div className="text-input4">
              <textarea
                name="description"
                placeholder="Description"
                value={firstFormData.description}
                onChange={handleFirstFormChange}
                style={{ width: '100%', height: '100%', border: 'none', padding: '0px' ,outline: 'none' }}
              />
            </div>

            <div className="line-13"></div>

            <div className="date-and-time">
              <span>
                <span className="date-and-time-span">Date and time</span>
                <span className="date-and-time-span2">*</span>
              </span>
            </div>

            <div className="text-input2">
              <input
                type="date"
                name="date"
                value={firstFormData.date}
                onChange={handleFirstFormChange}
                className="dd-mm-yy"
                required
              />
            </div>

            <div className="text-input6">
              <input
                type="text"
                name="time"
                placeholder="02:30"
                value={firstFormData.time}
                onChange={handleFirstFormChange}
                className="_02-30"
                required
              />
              <div className="right2">
                <div className="bg2"></div>
                <img className="icon-right2" src="icon-right1.svg" alt="" />
              </div>
            </div>

            <div className="text-input8">
              <select
                name="period"
                value={firstFormData.period}
                onChange={handleFirstFormChange}
                className="pm"
              >
                <option value="PM">PM</option>
                <option value="AM">AM</option>
              </select>
              <div className="right2">
                <div className="bg4"></div>
                <img className="icon-right4" src="icon-right3.svg" alt="" />
              </div>
            </div>

            <div className="text-input9">
              <select
                name="timeZone"
                value={firstFormData.timeZone}
                onChange={handleFirstFormChange}
                className="utc-5-00-delhi"
              >
                <option value="(UTC +5:30 Delhi)">(UTC +5:30 Delhi)</option>
              </select>
              <div className="right2">
                <div className="bg5"></div>
                <img className="icon-right5" src="icon-right4.svg" alt="" />
              </div>
            </div>

            <div className="set-duration">Set duration</div>
            <div className="text-input7">
              <select
                name="duration"
                value={firstFormData.duration}
                onChange={handleFirstFormChange}
                className="_1-hour"
              >
                <option value="1 hour">1 hour</option>
                <option value="30 mins">30 mins</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
              </select>
              <div className="right2">
                <div className="bg3"></div>
                <img className="icon-right3" src="icon-right2.svg" alt="" />
              </div>
            </div>

            <div className="frame-1171274819">
              <button
                type="button"
                onClick={() => navigate('/event-types')}
                className="cancel"
              >
                Cancel
              </button>
            </div>

            <div className="frame-1171274818">
              <button type="submit" className="save">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={formContainerStyle}>
      {showSuccessNotification && (
        <div className="success-notification">
          <span>Successfully {isEditMode ? 'updated' : 'added'} event</span>
          <button 
            onClick={() => setShowSuccessNotification(false)}
            className="close-button"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-black font-poppins">
          {isEditMode ? 'Edit Event' : 'Create Event'}
        </h1>
        <p className="text-black font-poppins opacity-90 text-sm">Create events to share for people to book on your calendar.</p>
        <p className="text-black font-poppins opacity-90 text-sm">New</p>
      </div>
<div style={formCardStyle} className="box-border px-12 py-11 mx-auto max-w-none bg-neutral-400 h-[1034px] rounded-[40px] w-[1087px] max-md:p-8 max-md:h-auto max-md:max-w-[991px] max-md:w-[90%] max-sm:p-5 max-sm:max-w-screen-sm max-sm:rounded-3xl">
        <h2 className="mb-8 text-3xl font-medium text-center text-blue-600 max-sm:text-2xl">Add Event</h2>
        <div className="mx-0 my-5 h-px bg-zinc-400" />

        <form onSubmit={handleSecondFormSubmit} className="px-0 py-8">
          <div className="mb-5 text-xl font-semibold">Banner</div>
          <div className="w-[580px] max-md:w-full">
            <div>
              <div
                className="flex relative flex-col justify-center items-center w-full rounded-md h-[304px] max-sm:h-[250px]"
                style={{ backgroundColor: secondFormData.backgroundColor }}
              >
                <div className="flex items-center justify-center flex-col">
                  <div className="mb-4 h-[100px] w-[100px] relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label 
                      htmlFor="profile-image-upload" 
                      className="cursor-pointer w-full h-full flex items-center justify-center"
                    >
                      <div className="relative w-full h-full flex items-center justify-center">
                        {secondFormData.profileImage ? (
                          <img 
                            src={secondFormData.profileImage}
                            alt="Profile" 
                            className="w-full h-full object-cover rounded-full bg-white"
                          />
                        ) : (
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                            <svg 
                              className="w-8 h-8 text-gray-400" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
               
                  <div className="relative mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={secondFormData.title}
                      onChange={(e) => setSecondFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter event name"
                      style={{ color: getTextColor(secondFormData.backgroundColor) }}
                      className="text-xl font-medium bg-transparent border-none outline-none text-center w-full placeholder-current"
                    />
                    <button 
                      type="button"
                      onClick={handleTitleEdit}
                      className="bg-transparent border-none cursor-pointer p-1 hover:opacity-80 transition-opacity"
                      title="Edit event name"
                    >
                      <svg 
                        className="w-4 h-4"
                        style={{ color: getTextColor(secondFormData.backgroundColor) }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </div>
                  </div>
                </div>
              </div>

            <div className="mt-2.5">
              <div className="mb-2.5 text-sm">Custom Background Color</div>
              <div className="flex gap-3.5 mb-4">
                {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                    className={`w-12 h-12 rounded-full cursor-pointer ${
                      secondFormData.backgroundColor === color 
                        ? 'border-2 border-blue-500' 
                        : ''
                      }`}
                      style={{ 
                        backgroundColor: color,
                        border: color === '#FFFFFF' ? '1px solid #E5E7EB' : undefined 
                      }}
                    onClick={() => setSecondFormData(prev => ({ ...prev, backgroundColor: color }))}
                    aria-label={`Select color ${color}`}
                    />
                  ))}
              </div>
              <div className="flex gap-3.5 items-center">
                <div 
                  className="w-12 h-12 rounded-lg" 
                  style={{ backgroundColor: secondFormData.backgroundColor }} 
                />
                    <input
                      type="text"
                  value={secondFormData.backgroundColor}
                  onChange={(e) => setSecondFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="px-4 py-0 h-12 text-sm rounded-lg bg-stone-100 border-none w-[231px]"
                />
              </div>
            </div>
          </div>

          <div className="mx-0 my-5 h-px bg-zinc-400" />

            <div>
            <div className="flex gap-7 items-center mb-3 max-md:flex-col max-md:gap-2.5">
              <div className="text-xl w-[228px] max-md:w-full">
                <span>Add link</span>
                <span className="text-red-600">*</span>
              </div>
              <input
                type="url"
                required
                placeholder="Enter URL Here"
                value={secondFormData.link}
                onChange={(e) => setSecondFormData(prev => ({ ...prev, link: e.target.value }))}
                className="px-5 py-0 text-sm rounded-2xl border-solid border-[1.6px] border-neutral-200 h-[63px] text-zinc-500 w-[653px] max-md:w-full"
              />
            </div>

            <div className="flex gap-7 items-center mb-3 max-md:flex-col max-md:gap-2.5">
              <div className="text-xl w-[228px] max-md:w-full">
                <span>Add Emails</span>
                <span className="text-red-600">*</span>
              </div>
              <div className="w-full max-w-[653px]">
                <input
                  type="text"
                  placeholder="Add member emails (comma-separated)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onBlur={() => {
                    if (emailInput.trim()) {
                      handleAddEmails(emailInput);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (emailInput.trim()) {
                        handleAddEmails(emailInput);
                        setEmailInput('');
                      }
                    }
                  }}
                  className="px-4 py-2 text-sm !rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none h-[50px] w-full text-gray-600"
                />
                {secondFormData.emails.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                    <strong>{secondFormData.emails.length} email(s) added:</strong>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {secondFormData.emails.map((email, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-flex items-center">
                          {email}
                          <button 
                            type="button" 
                            onClick={() => {
                              const newEmails = [...secondFormData.emails];
                              newEmails.splice(index, 1);
                              setSecondFormData(prev => ({
                                ...prev,
                                emails: newEmails
                              }));
                            }} 
                            className="ml-1 text-blue-800 hover:text-blue-900 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          

            <div className="flex gap-9 justify-end mr-12 mt-12 max-sm:flex-col max-sm:gap-4">
              <button
                type="button"
    onClick={() => setShowSecondForm(false)}
    className="text-lg rounded-2xl cursor-pointer bg-stone-100 border-none h-[50px] w-[190px] max-sm:w-full"
              >
                Cancel
              </button>
              <button
                type="submit"
    className="text-lg text-white bg-blue-600 rounded-2xl cursor-pointer border-none h-[50px] w-[190px] max-sm:w-full"
              >
                Save
              </button>
</div>

         
            </div>
          </form>
      </div>
    </div>
  );
}