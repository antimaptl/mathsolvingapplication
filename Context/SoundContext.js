import { createContext, useContext, useState } from "react";

export const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [isSoundOn, setIsSoundOn] = useState(true);

  const toggleSound = () => setIsSoundOn(prev => !prev);

  return (
    <SoundContext.Provider value={{ isSoundOn, toggleSound, setIsSoundOn }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
