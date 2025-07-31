"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../lib/stores/authStore";
import { useAppStore } from "../../lib/stores/appStore";

interface HydrationWrapperProps {
  children: React.ReactNode;
}

export default function HydrationWrapper({ children }: HydrationWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Manually hydrate the stores with error handling
    try {
      useAuthStore.persist.rehydrate();
      if (useAppStore.persist?.rehydrate) {
        useAppStore.persist.rehydrate();
      }
    } catch (error) {
      console.warn("Store hydration failed:", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-cyber-blue text-xl animate-pulse">
          Loading CyberSecChat...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
