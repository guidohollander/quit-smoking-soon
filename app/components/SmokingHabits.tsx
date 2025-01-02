'use client';

import { useState, useEffect, useCallback } from 'react';

interface SmokingHabits {
  cigarettesPerDay: number;
  cigarettesSmoked: number;
  startDate: string;
  targetDate: string;
  initialCount: number;
  lastSmokedTime: string;
}

interface CigaretteTimingInfo {
  progress: number;
  isOnSchedule: boolean;
  minutesUntilNext: number;
  secondsUntilNext: number;
  expectedCigarettes: number;
}

export function CircularSmokingTracker({ 
  cigarettesPerDay = 150,
  className = '',
  habits,
  timingInfo,
  onSmokeClick,
  onReset
}: { 
  cigarettesPerDay?: number,
  className?: string,
  habits: SmokingHabits,
  timingInfo: CigaretteTimingInfo | null,
  onSmokeClick: () => void,
  onReset: () => void
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !timingInfo) return null;

  const percentage = (habits.cigarettesSmoked / habits.cigarettesPerDay) * 100;
  const minutesPerCigarette = (16 * 60) / cigarettesPerDay;
  const nextCigarettePercentage = (timingInfo.minutesUntilNext * 60 + (timingInfo.secondsUntilNext % 60)) / (minutesPerCigarette * 60) * 100;
  
  return (
    <div className="relative w-full">
      <button 
        onClick={onSmokeClick}
        className="relative w-32 h-32 mx-auto block"
      >
        <svg className="transform -rotate-90 w-full h-full">
          {/* Outer ring background */}
          <circle
            cx="64"
            cy="64"
            r="62"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-700"
          />
          {/* Outer ring progress - Next cigarette countdown */}
          <circle
            cx="64"
            cy="64"
            r="62"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 62}`}
            strokeDashoffset={`${2 * Math.PI * 62 * (nextCigarettePercentage / 100)}`}
            className="text-green-500 transition-all duration-300"
          />
          {/* Inner ring background */}
          <circle
            cx="64"
            cy="64"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-700"
          />
          {/* Inner ring progress - Cigarettes smoked */}
          <circle
            cx="64"
            cy="64"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
            className="text-green-500 transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div>I Smoked</div>
          <div className="text-sm">
            {habits.cigarettesSmoked} / {habits.cigarettesPerDay}
          </div>
        </div>
      </button>
    </div>
  );
}

export default function SmokingHabits({ 
  cigarettesPerDay = 150,
  className = '',
  habits,
  onSmokeClick,
  onReset
}: { 
  cigarettesPerDay?: number,
  className?: string,
  habits: SmokingHabits,
  onSmokeClick: () => void,
  onReset: () => void
}) {
  const [mounted, setMounted] = useState(false);
  const [habitsState, setHabitsState] = useState<SmokingHabits>(() => {
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
      initialCount: cigarettesPerDay,
      lastSmokedTime: new Date().toISOString()
    };
  });
  const [timingInfo, setTimingInfo] = useState<CigaretteTimingInfo | null>(null);

  const calculateTimingInfo = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const now = new Date();
    const lastSmoked = new Date(habitsState.lastSmokedTime || now);
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
    
    const minutesPerCigarette = totalSmokingMinutes / cigarettesPerDay;
    
    // Calculate time since last cigarette
    const timeSinceLastSmokedMinutes = 
      (now.getTime() - lastSmoked.getTime()) / (1000 * 60);
    
    const nextCigaretteMinutes = minutesPerCigarette - timeSinceLastSmokedMinutes;
    
    const minutesUntilNext = Math.max(0, nextCigaretteMinutes);
    const secondsUntilNext = Math.max(0, Math.floor(minutesUntilNext * 60));

    const expectedCigarettes = Math.floor(
      (currentTimeInMinutes - startTimeInMinutes) / minutesPerCigarette
    );

    return {
      progress: (currentTimeInMinutes - startTimeInMinutes) / totalSmokingMinutes * 100,
      isOnSchedule: habitsState.cigarettesSmoked === expectedCigarettes,
      minutesUntilNext: Math.floor(minutesUntilNext),
      secondsUntilNext: Math.floor(secondsUntilNext),
      expectedCigarettes
    };
  }, [cigarettesPerDay, habitsState.cigarettesSmoked, habitsState.lastSmokedTime]);

  const handleSmokeClick = useCallback(() => {
    const updatedHabits = {
      ...habitsState,
      cigarettesSmoked: Math.min(habitsState.cigarettesSmoked + 1, habitsState.cigarettesPerDay),
      lastSmokedTime: new Date().toISOString()  // Reset the last smoked time to now
    };

    setHabitsState(updatedHabits);

    // Recalculate timing info immediately after smoking
    const timingAfterSmoke = calculateTimingInfo();
    if (timingAfterSmoke) {
      setTimingInfo(timingAfterSmoke);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
      } catch (error) {
        console.error('Failed to update smoking habits', error);
      }
    }
  }, [habitsState, calculateTimingInfo]);

  const handleReset = useCallback(() => {
    if (!mounted) return;

    const expectedCigarettes = Math.floor(
      (new Date().getHours() * 60 + new Date().getMinutes() - 8 * 60) / 
      (16 * 60) * cigarettesPerDay
    );

    const resetHabits: SmokingHabits = {
      ...habitsState,
      cigarettesSmoked: expectedCigarettes,  
      startDate: new Date().toISOString().split('T')[0],
      lastSmokedTime: new Date().toISOString(),  // Reset lastSmokedTime to current time
      cigarettesPerDay: 150,  // Explicitly set to 150
      initialCount: 150
    };

    setHabitsState(resetHabits);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('smokingHabits');
        localStorage.setItem('smokingHabits', JSON.stringify(resetHabits));
      } catch (error) {
        console.error('Failed to reset smoking habits', error);
      }
    }
  }, [mounted, habitsState, cigarettesPerDay]);

  useEffect(() => {
    setMounted(true);
    
    const initialInfo = calculateTimingInfo();
    setTimingInfo(initialInfo);

    const intervalId = setInterval(() => {
      const updatedInfo = calculateTimingInfo();
      setTimingInfo(updatedInfo);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [calculateTimingInfo, habitsState.lastSmokedTime]);

  const totalSmokingHours = 24 - 8;
  const totalSmokingMinutes = totalSmokingHours * 60;
  const minutesPerCigarette = totalSmokingMinutes / cigarettesPerDay;

  return (
    <div className={`${className} bg-[#1f2937] p-4 sm:p-6 rounded-lg relative`}>
      {mounted && timingInfo && (
        <div className="space-y-4">
          <CircularSmokingTracker 
            cigarettesPerDay={cigarettesPerDay} 
            habits={habitsState} 
            timingInfo={timingInfo} 
            onSmokeClick={handleSmokeClick} 
            onReset={handleReset} 
          />
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">
              Cigarettes: {habitsState.cigarettesSmoked} / {habitsState.cigarettesPerDay}
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
                style={{ width: `${(habitsState.cigarettesSmoked / habitsState.cigarettesPerDay) * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`
                text-sm font-medium
                ${timingInfo.isOnSchedule 
                  ? 'text-green-400' 
                  : habitsState.cigarettesSmoked < timingInfo.expectedCigarettes
                    ? 'text-red-400'
                    : habitsState.cigarettesSmoked > timingInfo.expectedCigarettes
                      ? 'text-blue-400'
                      : 'text-gray-400'
                }
              `}>
                {timingInfo.isOnSchedule 
                  ? 'On Schedule' 
                  : habitsState.cigarettesSmoked < timingInfo.expectedCigarettes
                    ? 'Behind Schedule' 
                    : habitsState.cigarettesSmoked > timingInfo.expectedCigarettes
                      ? 'Ahead of Schedule'
                      : 'On Track'
                }
              </span>
              <span className="text-sm text-gray-400">
                Next in: {timingInfo.minutesUntilNext}m {timingInfo.secondsUntilNext % 60}s
              </span>
            </div>
          </div>

          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300" 
              style={{ 
                width: `${Math.max(0, Math.min(100, (timingInfo.minutesUntilNext * 60 + (timingInfo.secondsUntilNext % 60)) / (minutesPerCigarette * 60) * 100))}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
