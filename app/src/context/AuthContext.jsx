import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('wiseWasteUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
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
      const response = await fetch('http://localhost:5000/api/auth/register', {
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
