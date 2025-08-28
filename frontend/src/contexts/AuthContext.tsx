import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to convert backend user to our User interface
const convertBackendUser = (backendUser: any): User => ({
  id: backendUser.id,
  email: backendUser.email || '',
  name: backendUser.name,
  created_at: backendUser.created_at,
  updated_at: backendUser.updated_at,
});

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for token in localStorage (from our OAuth flow)
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        try {
          // Validate token with backend
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          
          if (response.ok) {
            const { user } = await response.json();
            setUser(convertBackendUser(user));
            setToken(storedToken);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('authToken');
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Password login is not supported - only Google OAuth
    throw new Error('Password login is not supported. Please use Google OAuth.');
  };

  const loginWithGoogle = async () => {
    try {
      // Get the Google OAuth URL from our backend
      const response = await fetch('/api/auth/google-auth-url');
      const { authUrl } = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Google login failed');
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    // Password registration is not supported - only Google OAuth
    throw new Error('Password registration is not supported. Please use Google OAuth.');
  };

  const logout = async () => {
    try {
      if (token) {
        // Call backend logout endpoint
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      // Clear local storage and state
      localStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local state even if backend call fails
      localStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    loginWithGoogle,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
