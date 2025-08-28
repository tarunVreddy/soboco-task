import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OAuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token from URL
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        
        if (token) {
          console.log('Processing OAuth callback with token...');
          
          // Store the token
          localStorage.setItem('authToken', token);
          
          // Remove token from URL
          window.history.replaceState({}, document.title, '/oauth-callback');
          
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          console.error('No token found in OAuth callback');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleOAuthCallback();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Login...</h2>
        <p className="text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
