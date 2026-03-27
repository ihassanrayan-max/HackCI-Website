"use client";

import { useState, useEffect } from "react";

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

export function computeCountdown(targetDate: Date, now: Date): CountdownResult {
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
    };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds, isExpired: false };
}

/** Stable initial paint for SSR + hydration (avoids server/client clock drift). */
const COUNTDOWN_INITIAL: CountdownResult = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 0,
  isExpired: false,
};

export function useCountdown(targetDate: Date): CountdownResult {
  const [state, setState] = useState<CountdownResult>(COUNTDOWN_INITIAL);

  useEffect(() => {
    const tick = () => {
      setState(computeCountdown(targetDate, new Date()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return state;
}
