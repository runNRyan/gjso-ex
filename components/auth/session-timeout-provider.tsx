"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import { SessionTimeoutDialog } from "./session-timeout-dialog";

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

export function SessionTimeoutProvider({
  children,
}: SessionTimeoutProviderProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const { showWarning, remainingSeconds, resetTimer, handleLogout } =
    useInactivityTimeout(isAuthenticated);

  return (
    <>
      {children}
      {showWarning && (
        <SessionTimeoutDialog
          remainingSeconds={remainingSeconds}
          onLogout={handleLogout}
          onContinue={resetTimer}
        />
      )}
    </>
  );
}
