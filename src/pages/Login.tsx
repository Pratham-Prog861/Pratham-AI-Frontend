import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/chat');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Username is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Attempt to login
      const loginResponse = await api.login(trimmedUsername);
      
      try {
        // Create new chat if needed
        if (loginResponse.chats.length === 0) {
          await api.createChat(trimmedUsername);
        }
        
        // Complete login process
        login(trimmedUsername);
        navigate('/chat', { replace: true });
      } catch (chatError) {
        console.error('Chat creation error:', chatError);
        // Still allow login even if chat creation fails
        login(trimmedUsername);
        navigate('/chat', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        // Handle specific API errors
        const message = error.response?.data?.message || 'Failed to login. Please try again.';
        setError(message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Pratham AI
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Enter your username to continue
          </p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-xs sm:text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="block w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg 
                shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                text-sm sm:text-base
                transition-colors duration-200"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 sm:py-3 px-4 
                border border-transparent rounded-lg shadow-sm
                text-sm sm:text-base font-medium text-white
                bg-indigo-600 hover:bg-indigo-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg 
                    className="animate-spin h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>

        {/* Add responsive footer */}
        <div className="mt-8 text-center text-xs sm:text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

export default Login;