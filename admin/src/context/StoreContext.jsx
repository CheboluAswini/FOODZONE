import { createContext, useState } from 'react';

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [admin, setAdmin] = useState(localStorage.getItem('admin') === 'true');

  const contextValue = {
    token,
    setToken,
    admin,
    setAdmin
  };

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
};

export default StoreContextProvider;
