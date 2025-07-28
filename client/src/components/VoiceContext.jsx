import React, { createContext, useContext, useState } from 'react';

// Create the context
const VoiceContext = createContext();

// Custom hook to use the voice context
export const useVoice = () => {
  return useContext(VoiceContext);
};

// Provider component that wraps your app
export const VoiceProvider = ({ children }) => {
  const [voice, setVoice] = useState(0); // Default value for voice (can be 0 or 1 for Female/Male)

  // You can add more logic or functions here if necessary (e.g., for changing the voice)

  return (
    <VoiceContext.Provider value={{ voice, setVoice }}>
      {children}
    </VoiceContext.Provider>
  );
};
