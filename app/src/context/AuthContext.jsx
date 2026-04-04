import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem('wiseWasteUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch fresh data from server to sync approval status/profile
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${parsedUser.token}`
            }
          });

          if (response.ok) {
            const freshData = await response.json();
            const updatedUser = {
              ...parsedUser,
              name: freshData.name,
              email: freshData.email,
              role: freshData.role,
              isApproved: freshData.isApproved,
              profilePhoto: freshData.profilePhoto,
              phoneNumber: freshData.phoneNumber,
              companyDetails: freshData.companyDetails,
              companyName: freshData.role.includes('company') ? `${freshData.name} Corp` : undefined
            };
            setUser(updatedUser);
            localStorage.setItem('wiseWasteUser', JSON.stringify(updatedUser));
          } else if (response.status === 401) {
            // Token expired or invalid
            logout();
          }
        } catch (error) {
          console.error("Session sync failed:", error);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Prepare user data to match what the frontend expects
        const userData = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          token: data.token,
          isApproved: data.isApproved,
          profilePhoto: data.profilePhoto,
          phoneNumber: data.phoneNumber,
          companyDetails: data.companyDetails,
          // Optional: Add company name logic based on role if needed
          companyName: data.role.includes('company') ? `${data.name} Corp` : undefined
        };
        setUser(userData);
        localStorage.setItem('wiseWasteUser', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error("Login error", error);
      return { success: false, message: 'Server error during login' };
    }
  };

  const register = async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          token: data.token,
          isApproved: data.isApproved,
          profilePhoto: data.profilePhoto,
          phoneNumber: data.phoneNumber,
          companyDetails: data.companyDetails,
          companyName: data.role.includes('company') ? `${data.name} Corp` : undefined
        };
        setUser(userData);
        localStorage.setItem('wiseWasteUser', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error("Registration error", error);
      return { success: false, message: 'Server error during registration' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wiseWasteUser');
  };

  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('wiseWasteUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    register,
    updateUser,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
