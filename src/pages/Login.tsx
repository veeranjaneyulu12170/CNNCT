import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Define types for our form data
interface LoginFormData {
  username: string;
  password: string;
  showPassword: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [loginData, setLoginData] = useState<LoginFormData>({
    username: '',
    password: '',
    showPassword: false
  });
  
  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setLoginData({
      ...loginData,
      showPassword: !loginData.showPassword
    });
  };

  // Handle form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Trim and validate input
      const trimmedUsername = loginData.username.trim();
      const trimmedPassword = loginData.password;
      
      if (!trimmedUsername || !trimmedPassword) {
        setError('Username and password are required');
        return;
      }
      
      const credentials = {
        ...(trimmedUsername.includes('@') 
          ? { email: trimmedUsername } 
          : { username: trimmedUsername }
        ),
        password: trimmedPassword
      };
      
      console.log('Attempting login with:', {
        type: trimmedUsername.includes('@') ? 'email' : 'username',
        value: trimmedUsername.includes('@') ? trimmedUsername : trimmedUsername,
        hasPassword: !!trimmedPassword
      });
      
      // Send login request to the backend
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await axios.post(`${apiBaseUrl}/api/auth/login`, credentials);
      
      console.log('Login response received:', {
        success: true,
        hasToken: !!response.data.token,
        hasUserData: !!response.data._id
      });
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Store user data in a consistent format
        const userData = {
          id: response.data._id,
          name: response.data.name || '',
          email: response.data.email || '',
          username: response.data.username || ''
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User data stored successfully');
        
        // Navigate to dashboard after successful login
        navigate('/dashboard');
      } else {
        console.error('No token received in response');
        setError('Authentication failed: No token received');
      }
    } catch (err) {
      console.error('Login attempt failed:', err);
      
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'Login failed';
        console.error('Server error details:', {
          status: err.response?.status,
          message: err.response?.data?.message,
          data: err.response?.data
        });
        setError(`Authentication failed: ${errorMessage}`);
      } else {
        setError('An unexpected error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      {/* Left side: Login form - full width on mobile, half on larger screens */}
      <div className="w-full  flex flex-col p-4 md:p-10">
        <div className="flex items-center justify-center md:justify-start mb-6 md:mb-8">
          <div className="text-blue-500 font-bold flex items-center">
            <div className="inline-flex items-center gap-[3px]">
              <img
                className="w-24 md:w-24 h-4 md:h-6"
                alt="Cbi plug eu"
                src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742549448/bcxu4sgnwmnpwmlmk1vs.png"
              />
            </div>
          </div>
        </div>
        
        <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-center md:text-left">Sign in</h1>
          
          {error && (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLoginSubmit} className="w-full">
            <div className="mb-4">
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Username"
                value={loginData.username}
                onChange={handleLoginChange}
                required
                className="w-full p-3 bg-gray-100 !rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6 relative">
              <input
                type={loginData.showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                className="w-full p-3 bg-gray-100 !rounded-2xl pr-10"
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={togglePasswordVisibility}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                </svg>
              </button>
            </div>
            
            <button 
              type="submit" 
              className="w-full p-3 mt-6 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Log in'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p>
              Don't have an account? <Link to="/signup" className="text-blue-500">Sign up</Link>
            </p>
          </div>
          
          <div className="mt-8 text-xs text-gray-500 text-center">
            This site is protected by reCAPTCHA and the{' '}
            <a href="https://policies.google.com/privacy" className="text-gray-500">Google Privacy Policy</a> and{' '}
            <a href="https://policies.google.com/terms" className="text-gray-500">Terms of Service</a> apply.
          </div>
        </div>
      </div>
      
      {/* Right side: Background image - hidden on mobile, visible on larger screens */}
      <div className="hidden md:block md:w-1/2">
        <div className="h-full w-full flex items-center justify-center">
          <img
            className="h-screen w-full object-cover"
            src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742981917/images/yuvp766f5jqt4n6vutjk.png"
            alt="Login background"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;