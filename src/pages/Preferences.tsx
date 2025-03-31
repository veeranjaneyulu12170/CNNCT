import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface PreferencesData {
  username: string;
  category: string | null;
}

const Preferences: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    username: '',
    category: null
  });
  
  // Get user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const { username } = JSON.parse(userData);
      if (username) {
        setPreferencesData(prev => ({ ...prev, username }));
      }
    }
  }, []);
  
  // Handle preferences form changes
  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPreferencesData({
      ...preferencesData,
      [name]: value
    });
  };

  // Set category in preferences
  const selectCategory = (category: string) => {
    setPreferencesData({
      ...preferencesData,
      category
    });
  };

  // Handle form submission
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!preferencesData.username) {
      setError('Username is required');
      return;
    }
    
    if (!preferencesData.category) {
      setError('Please select a category');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Update user preferences in the backend
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.put(
        `${apiBaseUrl}/api/users/profile`,
        {
          username: preferencesData.username,
          preferences: {
            category: preferencesData.category
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Navigate to dashboard after setting preferences
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to update preferences');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Preferences update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'Sales', icon: '📊', name: 'Sales' },
    { id: 'Education', icon: '🎓', name: 'Education' },
    { id: 'Finance', icon: '💰', name: 'Finance' },
    { id: 'Government', icon: '⚖️', name: 'Government & Politics' },
    { id: 'Consulting', icon: '💼', name: 'Consulting' },
    { id: 'Recruiting', icon: '📝', name: 'Recruiting' },
    { id: 'Tech', icon: '💻', name: 'Tech' },
    { id: 'Marketing', icon: '🚀', name: 'Marketing' }
  ];

  return (
    <div className="app">
                 <div className="top-10 left-4 mt-8 ml-8 items-center gap-[3px]">
              <img
                className="w-24 md:w-24 h-4 md:h-6"
                alt="Cbi plug eu"
                src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742549448/bcxu4sgnwmnpwmlmk1vs.png"
              />
            </div>
      <div className="container flex flex-col md:flex-row">
        <div className="form-container pr-10 mr-[180px] w-full">
   
          <div className= "text-3xl font-extrabold font-inter mt-10 mb-5">   <h1>Your Preferences</h1></div>
       
          
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handlePreferencesSubmit}>
            <div className="form-group w-[600px] ">
              
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Tell your username"
                value={preferencesData.username}
                onChange={handlePreferencesChange}
                required
                className="h-10 w-full p-3 bg-gray-500 !rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:bg-blue-900"
              />
            </div>
            
            <div className="category-section mt-5 mb-5 font-inter font-extrabold text-black font-weight-bold" >
              <p>Select one category that best describes your CNNCT:</p>
              
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">                {categories.map(category => (
                  <div 
                    key={category.id}
                    className= {`category-item ${preferencesData.category === category.id ?  'bg-blue-500 text-white' : 'bg-gray-100 text-black'}
                    `}
                    onClick={() => selectCategory(category.id)} 
                    style={{ borderRadius: '12px',height: '48px' ,width: '200px' }}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary rounded-full h-12 w-[600px]"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
        
        <div className="image-container ">
          {/* This div will contain the background image */}
          <div className="h-screen w-full  flex items-center justify-end">
          <img
            className="h-screen w-full  object-cover"
            src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742981917/images/yuvp766f5jqt4n6vutjk.png"
            alt="Signup background"
          />
        </div>
      
        </div>
      </div>
    </div>
  );
};

export default Preferences; 