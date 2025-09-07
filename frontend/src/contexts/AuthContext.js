import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api'

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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
  const login = async (email, password) => {
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
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Register function
  const register = async (userData) => {
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
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  // Logout function
  const logout = () => {
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
  const updateProfile = async (userData) => {
    try {
      const response = await api.patch(`/users/${user.id}`, userData);

      // Update stored user data
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile.'
      };
    }
  };

  const value = {
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
