'use client';

import { useState, useEffect, useCallback } from 'react';

interface SmokingHabits {
  cigarettesPerDay: number;
  cigarettesSmoked: number;
  startDate: string;
  targetDate: string;
  initialCount: number;
}

interface CigaretteTimingInfo {
  progress: number;
  isOnSchedule: boolean;
  minutesUntilNext: number;
  secondsUntilNext: number;
  expectedCigarettes: number;
}

export default function SmokingHabits({ 
  className = '', 
  cigarettesPerDay = 30 
}: { 
  className?: string, 
  cigarettesPerDay?: number 
}) {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<SmokingHabits>(() => {
    const storedHabits = typeof window !== 'undefined' 
      ? localStorage.getItem('smokingHabits') 
      : null;
    
    if (storedHabits) {
      try {
        return JSON.parse(storedHabits);
      } catch (error) {
        console.error('Failed to parse stored habits', error);
      }
    }

    return {
      cigarettesPerDay,
      cigarettesSmoked: 0,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '2025-01-31',
      initialCount: cigarettesPerDay
    };
  });
  const [timingInfo, setTimingInfo] = useState<CigaretteTimingInfo | null>(null);

  const calculateTimingInfo = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const startHour = 8;  // Fixed start at 8:00 AM
    const endHour = 24;   // Fixed end at midnight

    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startTimeInMinutes = startHour * 60;
    const endTimeInMinutes = endHour * 60;
    
    const isWithinSmokingHours = 
      currentHour >= startHour && 
      currentHour < endHour;

    if (!isWithinSmokingHours) {
      return null;
    }

    const totalSmokingHours = endHour - startHour;
    const totalSmokingMinutes = totalSmokingHours * 60;
    
    const minutesElapsed = currentTimeInMinutes - startTimeInMinutes;
    const expectedCigarettes = Math.floor(
      (minutesElapsed / totalSmokingMinutes) * cigarettesPerDay
    );

    const progress = (minutesElapsed / totalSmokingMinutes) * 100;

    const minutesPerCigarette = totalSmokingMinutes / cigarettesPerDay;
    const nextCigaretteMinutes = startTimeInMinutes + 
      ((Math.floor(expectedCigarettes) + 1) * minutesPerCigarette);
    
    const minutesUntilNext = nextCigaretteMinutes - currentTimeInMinutes;
    const secondsUntilNext = Math.floor(
      (minutesUntilNext * 60) - now.getSeconds()
    );

    return {
      progress,
      isOnSchedule: habits.cigarettesSmoked === expectedCigarettes,
      minutesUntilNext: Math.floor(minutesUntilNext),
      secondsUntilNext,
      expectedCigarettes
    };
  }, [cigarettesPerDay, habits.cigarettesSmoked]);

  const calculateExpectedCigarettes = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const startHour = 8;  // Fixed start at 8:00 AM
    const endHour = 24;   // Fixed end at midnight

    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startTimeInMinutes = startHour * 60;

    const isWithinSmokingHours = 
      currentHour >= startHour && 
      currentHour < endHour;

    if (!isWithinSmokingHours) {
      return 0;
    }

    const totalSmokingHours = endHour - startHour;
    const totalSmokingMinutes = totalSmokingHours * 60;
    
    const minutesElapsed = currentTimeInMinutes - startTimeInMinutes;
    return Math.floor(
      (minutesElapsed / totalSmokingMinutes) * cigarettesPerDay
    );
  }, [cigarettesPerDay]);

  const handleSmokeClick = useCallback(() => {
    if (!mounted || !timingInfo) return;

    setHabits(prev => {
      const updatedHabits = {
        ...prev,
        cigarettesSmoked: Math.min(prev.cigarettesSmoked + 1, prev.cigarettesPerDay)
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
        } catch (error) {
          console.error('Failed to save smoking habits', error);
        }
      }

      return updatedHabits;
    });
  }, [mounted, timingInfo]);

  const handleReset = useCallback(() => {
    if (!mounted) return;

    const expectedCigarettes = calculateExpectedCigarettes();

    const resetHabits: SmokingHabits = {
      ...habits,
      cigarettesSmoked: expectedCigarettes,
      startDate: new Date().toISOString().split('T')[0]
    };

    setHabits(resetHabits);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smokingHabits', JSON.stringify(resetHabits));
      } catch (error) {
        console.error('Failed to reset smoking habits', error);
      }
    }
  }, [mounted, habits, calculateExpectedCigarettes]);

  useEffect(() => {
    setMounted(true);
    
    const initialInfo = calculateTimingInfo();
    setTimingInfo(initialInfo);

    const intervalId = setInterval(() => {
      const updatedInfo = calculateTimingInfo();
      setTimingInfo(updatedInfo);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [calculateTimingInfo]);

  return (
    <div className={`${className} bg-[#1f2937] p-4 sm:p-6 rounded-lg relative`}>
      {mounted && timingInfo && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">
              Cigarettes: {habits.cigarettesSmoked} / {habits.cigarettesPerDay}
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>

          <div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  timingInfo.isOnSchedule 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${timingInfo.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`
                text-sm font-medium
                ${timingInfo.isOnSchedule 
                  ? 'text-green-400' 
                  : 'text-red-400'
                }
              `}>
                {timingInfo.isOnSchedule ? 'On Schedule' : 'Ahead of Schedule'}
              </span>
              <span className="text-sm text-gray-400">
                Next in: {timingInfo.minutesUntilNext}m {timingInfo.secondsUntilNext % 60}s
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSmokeClick}
              disabled={habits.cigarettesSmoked >= habits.cigarettesPerDay}
              className={`
                px-6 py-2 rounded-md text-white font-medium
                ${habits.cigarettesSmoked >= habits.cigarettesPerDay
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}
                transition-colors
              `}
            >
              I Smoked
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
