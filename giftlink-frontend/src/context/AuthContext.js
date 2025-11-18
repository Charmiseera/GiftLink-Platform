import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user is already logged in from localStorage
    const savedLoginState = localStorage.getItem('isLoggedIn');
    return savedLoginState === 'true';
  });
  
  const [userName, setUserName] = useState(() => {
    // Get saved username from localStorage
    return localStorage.getItem('userName') || '';
  });

  // Update localStorage whenever login state changes
  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    if (isLoggedIn && userName) {
      localStorage.setItem('userName', userName);
    } else if (!isLoggedIn) {
      localStorage.removeItem('userName');
    }
  }, [isLoggedIn, userName]);

  return (
    <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn, userName, setUserName }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
