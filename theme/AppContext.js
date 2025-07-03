import React, { createContext, useState } from 'react';

export const AppContext = createContext({
  isDarkTheme: false,
  setIsDarkTheme: () => {},
});

export const AppContextProvider = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const contextValue = {
    isDarkTheme,
    setIsDarkTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};