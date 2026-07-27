'use client';

import { useEffect, useState } from 'react';

interface ExamCountdownProps {
  startDate: string | null;
  endDate: string | null;
  durationMinutes?: number;
}

export default function ExamCountdown({ startDate, endDate, durationMinutes }: ExamCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showEndTime, setShowEndTime] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    // Log the exact strings from API and timezone
    console.log('[Countdown] API Date Strings:', {
      startDate,
      endDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset()
    });

    if (!startDate) {
      setTimeLeft('No start time set');
      return;
    }

    /**
     * Simple: Parse UTC time from database, subtract 5 hours for Pakistan timezone
     */
    const parseToMs = (s: string | null): number | null => {
      if (!s) return null;
      s = s.trim();
      
      // Normalize +00:00 to Z
      if (s.endsWith('+00:00')) {
        s = s.slice(0, -6) + 'Z';
      }
      
      // Parse UTC time
      const utcTime = Date.parse(s);
      if (Number.isNaN(utcTime)) return null;
      
      // Subtract 5 hours for Pakistan timezone
      return utcTime - (5 * 60 * 60 * 1000);
    };

    const formatDiff = (ms: number): string => {
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    };

    const updateCountdown = () => {
      // Current time (no adjustment)
      const now = Date.now();
      
      // Exam times - UTC time minus 5 hours (Pakistan timezone)
      const examStart = parseToMs(startDate);
      const examEnd = parseToMs(endDate);

      if (!examStart) {
        setTimeLeft('No start time set');
        return;
      }

      // Compare: (UTC time - 5 hours) - current time
      const diffMs = examStart - now;

      if (diffMs > 0) {
        // Exam hasn't started yet - show countdown to start
        setIsStarted(false);
        setShowEndTime(false);
        setTimeLeft(formatDiff(diffMs));
      } else {
        // Exam has started - show countdown to end time
        setIsStarted(true);
        setShowEndTime(true);
        
        // Calculate end time
        let finalEnd: number | null = examEnd;
        if (!finalEnd && durationMinutes) {
          // Calculate end time from start + duration
          finalEnd = examStart + durationMinutes * 60 * 1000;
        }
        
        if (!finalEnd) {
          setTimeLeft('No end time set');
          return;
        }
        
        const now = Date.now(); // Current time (no adjustment)
        const untilEnd = finalEnd - now;
        
        if (untilEnd > 0) {
          setTimeLeft(`Ends in: ${formatDiff(untilEnd)}`);
        } else {
          setTimeLeft('Exam ended');
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [startDate, endDate, durationMinutes]);

  return (
    <div className="flex items-center gap-2 text-xs">
      {!isStarted ? (
        <span className="flex items-center gap-1 text-orange-600 font-medium">
          <span>Starts in:</span>
          <span className="font-bold">{timeLeft}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-600 font-medium">
          {timeLeft}
        </span>
      )}
    </div>
  );
}

