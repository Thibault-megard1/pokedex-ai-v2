"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ShinyContextType {
  isShiny: boolean;
  setIsShiny: (value: boolean) => void;
}

const ShinyContext = createContext<ShinyContextType | undefined>(undefined);

export function ShinyProvider({ children }: { children: ReactNode }) {
  const [isShiny, setIsShiny] = useState(false);
  
  return (
    <ShinyContext.Provider value={{ isShiny, setIsShiny }}>
      {children}
    </ShinyContext.Provider>
  );
}

export function useShiny() {
  const context = useContext(ShinyContext);
  if (context === undefined) {
    throw new Error("useShiny must be used within a ShinyProvider");
  }
  return context;
}
