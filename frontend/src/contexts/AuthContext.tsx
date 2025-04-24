import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../utils/axios';
import { User, AuthState, RegisterData } from '../types';

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
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

  // Check if user is authenticated on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Save in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(accessToken);
      setUser(user);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/auth/register', userData);
      const { accessToken, user } = response.data;
      
      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Save in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(accessToken);
      setUser(user);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  // Logout function
  const logout = (): void => {
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state
    setToken(null);
    setUser(null);
    
    // Remove from axios headers
    delete api.defaults.headers.common['Authorization'];
  };

  // Update user profile data
  const updateProfile = async (userData: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'You must be logged in to update your profile.' };
      }

      const response = await api.patch(`/users/${user.id}`, userData);
      
      // Update stored user data
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile.'
      };
    }
  };

  const value: AuthState = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
