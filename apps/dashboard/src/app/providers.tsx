"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDashboardStore } from "@/store/dashboard-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const { darkMode } = useDashboardStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return <TooltipProvider>{children}</TooltipProvider>;
}
