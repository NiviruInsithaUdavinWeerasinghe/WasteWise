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

  const login = (role, name) => {
    // Mock login logic
    const userData = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      role: role, // 'admin', 'company-buyer', 'company-seller', 'individual'
      companyName: role.includes('company') ? `${name} Industries` : undefined
    };
    setUser(userData);
    localStorage.setItem('wiseWasteUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wiseWasteUser');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
