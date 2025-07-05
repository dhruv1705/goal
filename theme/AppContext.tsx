import React, { createContext, useState, ReactNode } from 'react';

interface AppContextType {
  isDarkTheme: boolean;
  setIsDarkTheme: (isDark: boolean) => void;
}

export const AppContext = createContext<AppContextType>({
  isDarkTheme: false,
  setIsDarkTheme: () => {},
});

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  const contextValue: AppContextType = {
    isDarkTheme,
    setIsDarkTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};