import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Settings, Link as LinkIcon, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Events', path: '/event-types', icon: LinkIcon },
  { name: 'Booking', path: '/dashboard', icon: Calendar },
  { name: 'Availability', path: '/availability', icon: Clock },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Try to get user data from localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('Token in localStorage:', token ? 'Exists' : 'Not found');
    console.log('User data in localStorage:', userData ? 'Exists' : 'Not found');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user data:', parsedUser);
        // Use name from preferences if available, otherwise use the name from user object
        setUsername(parsedUser.name || parsedUser.username || parsedUser.email || 'User');
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUsername('User');
        setIsLoading(false);
      }
    } else {
      // If no user data in localStorage, try to fetch from API
      fetchUserProfile();
    }
  }, [navigate]);
  
  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // Check if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login if no token
        console.log('No token found in fetchUserProfile, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('Fetching user profile from API...');
      // Fetch user profile using the token
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data from API:', userData);
        setUsername(userData.name || userData.username || userData.email || 'User');
        
        // Save user data to localStorage for future use
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('API call failed:', response.status, response.statusText);
        // If token is invalid or expired, redirect to login
        if (response.status === 401) {
          console.log('Token invalid or expired, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        
        // Otherwise, use a default name
        setUsername('User');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUsername('User');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Clear any auth tokens or user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Navigate to landing page
    navigate('/');
  };

  // If still loading, show a minimal loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
          <div className="flex items-center mb-8">
            <img src="/logo.svg" alt="CNNCT" className="h-8" />
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm font-medium rounded-lg',
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Spacer to push logout to bottom */}
          <div className="flex-grow"></div>
          
          {/* Logout section */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-full hover:bg-gray-100"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600 border border-gray-300">
                      {username ? username.split(' ').map(name => name[0]).join('').toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{username || 'User'}</p>
                  </div>
                </div>
                <LogOut className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}