import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Define types for our form data
interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  agreeToTerms: boolean;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [signupData, setSignupData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    agreeToTerms: false
  });
  
  // Handle signup form changes
  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSignupData({
      ...signupData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setSignupData({
        ...signupData,
        showPassword: !signupData.showPassword
      });
    } else {
      setSignupData({
        ...signupData,
        showConfirmPassword: !signupData.showConfirmPassword
      });
    }
  };

  // Handle form submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!signupData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create username from email, ensuring it's at least 3 characters
      let username = signupData.email.split('@')[0];
      if (username.length < 3) {
        username = username.padEnd(3, '0'); // Pad with zeros if too short
      }
      
      // Create the request payload for the API
      const userData = {
        username: username,
        email: signupData.email,
        password: signupData.password,
        name: `${signupData.firstName} ${signupData.lastName}`,
      };
      
      console.log('Sending registration request with data:', {
        username: userData.username,
        email: userData.email,
        name: userData.name
      });

      // Send signup request to the backend
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await axios.post(`${apiBaseUrl}/api/auth/register`, userData);
      
      console.log('Registration response received:', {
        success: true,
        hasToken: !!response.data.token,
        hasUserId: !!response.data._id
      });

      // Verify we have the required data
      if (!response.data.token || !response.data._id) {
        throw new Error('Registration response missing required data');
      }

      // Store token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data._id);
      localStorage.setItem('user', JSON.stringify({
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        username: response.data.username
      }));

      console.log('User data stored successfully');
      
      // Navigate to preferences page after successful signup
      navigate('/preferences');
    } catch (err) {
      console.error('Registration error:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Registration failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen   flex flex-col md:flex-row w-full">
      {/* Left side: Signup form - full width on mobile, half on larger screens */}
      <div className="w-full  flex flex-col p-4 md:p-5">
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
        <div className="flex items-center justify-between mb-6 md:mb-8">
    <h1 className="text-xl md:text-2xl font-bold">Create an account</h1>
    <Link to="/login" className="text-blue-500 text-sm md:text-base">Sign in</Link>
  </div>
          {error && (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignupSubmit} className="w-full">
            <div className="mb-4">
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="First Name"
                value={signupData.firstName}
                onChange={handleSignupChange}
                required
                className="w-full p-3 bg-gray-100 !rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Last Name"
                value={signupData.lastName}
                onChange={handleSignupChange}
                required
                className="w-full p-3 bg-gray-100 !rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
                className="w-full p-3 bg-gray-100 !rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4 relative">
              <input
                type={signupData.showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
                className="w-full p-3 bg-gray-100 !rounded-2xl pr-10"
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => togglePasswordVisibility('password')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                </svg>
              </button>
            </div>
            
            <div className="mb-6 relative">
              <input
                type={signupData.showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                required
                className="w-full p-3 bg-gray-100 !rounded-2xl pr-10"
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                </svg>
              </button>
            </div>
            
            <div className="mb-2 flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={signupData.agreeToTerms}
                onChange={handleSignupChange}
                required
                className="mt-1 mr-2"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-600">
                By creating an account, I agree to the{' '}
                <a href="/terms" className="text-blue-500">Terms of use</a> and{' '}
                <a href="/privacy" className="text-blue-500">Privacy Policy</a>
              </label>
            </div>
            
            <button 
              type="submit" 
              className="w-full p-3 mt-0 bg-gray-200 text-gray-700 !rounded-full hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create an account'}
            </button>
          </form>
          
       
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            This site is protected by reCAPTCHA and the{' '}
            <a href="https://policies.google.com/privacy" className="text-gray-500">Google Privacy Policy</a> and{' '}
            <a href="https://policies.google.com/terms" className="text-gray-500">Terms of Service</a> apply.
          </div>
        </div>
      </div>
      
      {/* Right side: Background image - hidden on mobile, visible on larger screens */}
      <div className="w-full md:block md:w-1/2">
        <div className="h-full w-full  flex items-center justify-end">
          <img
            className="h-screen w-full pr-1 object-cover"
            src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742981917/images/yuvp766f5jqt4n6vutjk.png"
            alt="Signup background"
          />
        </div>
      </div>
    </div>
  );
};

export default Signup;