import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  profileImage?: string;
}

interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    timezone: '',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  const [passwords, setPasswords] = useState<PasswordUpdate>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Language options
  const languages = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' }
  ];

  // Date format options
  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  // Time format options
  const timeFormats = [
    { value: '12h', label: '12-hour' },
    { value: '24h', label: '24-hour' }
  ];

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        setMessage({ type: 'error', text: 'Please log in to access settings' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        console.log('Initializing form with user data:', parsedUser);
        
        // Split the name into firstName and lastName
        let firstName = '', lastName = '';
        if (parsedUser.name) {
          const nameParts = parsedUser.name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        // Set initial form data from localStorage
        setProfile({
          firstName: firstName,
          lastName: lastName,
          email: parsedUser.email || '',
          username: parsedUser.username || '',
          phoneNumber: '',
          timezone: '',
          language: 'English',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        });
        
        // Then fetch the complete profile data
        await fetchUserProfile(parsedUser.id);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        setMessage({ type: 'error', text: 'Error loading user data' });
      }
    };

    checkAuthAndFetchData();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please log in to access settings' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      console.log('Fetching profile with token:', token);
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      // First get the registration data
      const registrationResponse = await axios.get(`${apiBaseUrl}/api/auth/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const registrationData = registrationResponse.data;
      console.log('Fetched registration data:', registrationData);
      
      // Split the name into firstName and lastName
      let firstName = '', lastName = '';
      if (registrationData.name) {
        const nameParts = registrationData.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Then get any additional profile data
      const profileResponse = await axios.get(`${apiBaseUrl}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const profileData = profileResponse.data;
      console.log('Fetched profile data:', profileData);

      // Combine registration and profile data, prioritizing registration data for core fields
      setProfile(prevProfile => ({
        firstName: firstName || prevProfile.firstName || '',
        lastName: lastName || prevProfile.lastName || '',
        email: registrationData.email || prevProfile.email || '',
        username: registrationData.username || prevProfile.username || '',
        phoneNumber: profileData.phoneNumber || prevProfile.phoneNumber || '',
        timezone: profileData.timezone || prevProfile.timezone || '',
        language: profileData.language || prevProfile.language || 'English',
        dateFormat: profileData.dateFormat || prevProfile.dateFormat || 'MM/DD/YYYY',
        timeFormat: profileData.timeFormat || prevProfile.timeFormat || '12h'
      }));

    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch user profile' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        setMessage({ type: 'error', text: 'Please log in to access settings' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      const parsedUser = JSON.parse(userData);
      console.log('Updating profile with data:', {
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        username: profile.username
      });

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      // Update user data
      const response = await axios.put(`${apiBaseUrl}/api/users/profile`, {
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        username: profile.username,
        phoneNumber: profile.phoneNumber,
        timezone: profile.timezone,
        language: profile.language,
        dateFormat: profile.dateFormat,
        timeFormat: profile.timeFormat
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Profile update response:', response.data);

      // Update the stored user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: parsedUser.id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        username: profile.username
      }));

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
      
      // Refresh the profile data
      await fetchUserProfile(parsedUser.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 1500);
        } else {
          setMessage({ type: 'error', text: error.response?.data.message || 'Failed to update profile' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.put(`${apiBaseUrl}/api/user/password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f1] py-8">
            <div className="mb-6 ml-5">
          <h1 className="text-2xl font-bold font-poppins">Profile</h1>
          <p className="text-lg text-gray-600">
            Manage settings for your profile
          </p>
        </div>
      <div className="w-[1000px] mx-auto px-4">


        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Edit Profile</h2>
              {!isEditing && !isLoading && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
              )}
            </div>

            {message.text && (
              <div className={`mb-4 p-3 rounded ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      First name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      Language
                    </label>
                    <select
                      value={profile.language}
                      onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      Time Zone
                    </label>
                    <input
                      type="text"
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      Date Format
                    </label>
                    <select
                      value={profile.dateFormat}
                      onChange={(e) => setProfile({ ...profile, dateFormat: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                    >
                      {dateFormats.map(format => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      Time Format
                    </label>
                    <select
                      value={profile.timeFormat}
                      onChange={(e) => setProfile({ ...profile, timeFormat: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm disabled:bg-gray-50"
                    >
                      {timeFormats.map(format => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        //fetchUserProfile(); // Reset to original values
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                )}
              </form>
            )}
        </div>

          <div className="border-t border-gray-200">
        <div className="p-6">
              <h2 className="text-lg font-medium mb-6">Change Password</h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-200 !rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}