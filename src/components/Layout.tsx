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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Try to get user data from localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (token) {
      setIsAuthenticated(true);
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
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
    } else {
      // Only redirect to login if we're not already on the login page
      if (!location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
        navigate('/login');
      }
      setIsLoading(false);
    }
  }, [navigate, location.pathname]);
  
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
          navigate('/login');
        }
        return;
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiBaseUrl}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUsername(userData.name || userData.username || userData.email || 'User');
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        if (!location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
          navigate('/login');
        }
      } else {
        setUsername('User');
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUsername('User');
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
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

  // If not authenticated and not on login/signup page, don't render the layout
  if (!isAuthenticated && !location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-[220px] bg-white border-r border-gray-200 p-4 flex flex-col">
          <div className="inline-flex items-center gap-[3px] ml-2 mt-4 mb-6">
            <img
              className="w-24 md:w-24 h-4 md:h-6"
              alt="Cbi plug eu"
              src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742549448/bcxu4sgnwmnpwmlmk1vs.png"
            />
          </div>
          
          <nav className="space-y-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'flex items-center px-4 py-4 text-sm font-medium rounded-lg gap-2',
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon 
                    className={cn(
                      'mr-3 h-5 w-5',
                      location.pathname === item.path
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    )} 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Spacer to push logout to bottom */}
          <div className="flex-grow"></div>
          
          {/* Logout section */}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg gap-2"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}