import React, { createContext, useContext } from "react";
import { useGrabSystem } from "@/hooks/useGrabSystem";

type GrabSystemApi = ReturnType<typeof useGrabSystem>;

interface GrabSystemContextValue {
  grabSystem: GrabSystemApi;
}

export const GrabSystemContext = createContext<GrabSystemContextValue | null>(null);

export const useGrabSystemContext = () => {
  const context = useContext(GrabSystemContext);
  if (!context) {
    throw new Error("useGrabSystemContext must be used within GrabSystemProvider");
  }
  return context.grabSystem;
};

export const GrabSystemProvider: React.FC<{
  grabSystem: GrabSystemApi;
  children: React.ReactNode;
}> = ({ grabSystem, children }) => {
  return (
    <GrabSystemContext.Provider value={{ grabSystem }}>
      {children}
    </GrabSystemContext.Provider>
  );
};
