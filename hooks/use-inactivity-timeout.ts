"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 25 * 60 * 1000; // 25 minutes (show warning 5 min before)
const THROTTLE_MS = 60 * 1000; // 1 minute throttle for activity listeners

interface UseInactivityTimeoutReturn {
  showWarning: boolean;
  remainingSeconds: number;
  resetTimer: () => void;
  handleLogout: () => void;
}

export function useInactivityTimeout(
  isAuthenticated: boolean
): UseInactivityTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(300);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setRemainingSeconds(300);
    countdownIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, WARNING_MS);

    logoutTimerRef.current = setTimeout(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    }, TIMEOUT_MS);
  }, [clearAllTimers, startCountdown]);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
    setRemainingSeconds(300);
    lastActivityRef.current = Date.now();
    startTimers();
  }, [startTimers]);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }, [clearAllTimers]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    startTimers();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current < THROTTLE_MS) {
        return;
      }
      lastThrottleRef.current = now;
      lastActivityRef.current = now;

      if (!showWarning) {
        startTimers();
      }
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [isAuthenticated, showWarning, startTimers, clearAllTimers]);

  return { showWarning, remainingSeconds, resetTimer, handleLogout };
}
