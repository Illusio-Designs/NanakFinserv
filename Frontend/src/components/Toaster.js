import React, { createContext, useState, useContext } from 'react';
import './Toaster.css';

const ToasterContext = createContext();

export const ToasterProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type) => {
    const id = Math.random().toString(36).substring(7); // unique id
  
    // Use the functional form of setState to avoid issues with stale state
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  
    // Remove the toast after 3 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 3000);
  };

  console.log(toasts,'sds')
  return (
    <ToasterContext.Provider value={addToast}>
      <div className="toaster-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
      {children}
    </ToasterContext.Provider>
  );
};

export const useToaster = () => useContext(ToasterContext);
