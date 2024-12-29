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
  const [timingInfo, setTimingInfo] = useState<CigaretteTimingInfo | null>(null);

  const calculateTimingInfo = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const now = new Date();
    const lastSmoked = new Date(habits.lastSmokedTime || now);
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
      isOnSchedule: habits.cigarettesSmoked === expectedCigarettes,
      minutesUntilNext: Math.floor(minutesUntilNext),
      secondsUntilNext: Math.floor(secondsUntilNext),
      expectedCigarettes
    };
  }, [cigarettesPerDay, habits.cigarettesSmoked, habits.lastSmokedTime]);

  useEffect(() => {
    setMounted(true);
    
    const initialInfo = calculateTimingInfo();
    setTimingInfo(initialInfo);

    const intervalId = setInterval(() => {
      const updatedInfo = calculateTimingInfo();
      setTimingInfo(updatedInfo);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [calculateTimingInfo, habits.lastSmokedTime]);

  if (!mounted || !timingInfo) return null;

  // Calculate angles and positions for the circular tracker
  const totalTime = timingInfo.minutesUntilNext + timingInfo.secondsUntilNext / 60;
  const remainingTime = timingInfo.minutesUntilNext + timingInfo.secondsUntilNext / 60;
  const progressPercentage = 1 - (remainingTime / totalTime);
  const outerRingProgress = 360 * progressPercentage;
  const cigaretteAngle = 360 / cigarettesPerDay;
  const smokedCigaretteAngles = habits.cigarettesSmoked * cigaretteAngle;

  return (
    <div className={`${className} relative w-64 h-64`}>
      {/* Outer Ring - Time Progress */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
        <circle 
          cx="50" 
          cy="50" 
          r="48" 
          fill="none" 
          stroke="#374151" 
          strokeWidth="4"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="48" 
          fill="none" 
          stroke={timingInfo.isOnSchedule ? '#10B981' : '#EF4444'}
          strokeWidth="4"
          strokeDasharray={301.59}
          strokeDashoffset={301.59 - (timingInfo.progress / 100) * 301.59}
          transform="rotate(-90 50 50)"
        />
      </svg>

      {/* Inner Ring - Cigarette Progress */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
        <circle 
          cx="50" 
          cy="50" 
          r="35" 
          fill="none" 
          stroke="#374151" 
          strokeWidth="4"
        />
        {[...Array(cigarettesPerDay)].map((_, index) => {
          const angle = index * cigaretteAngle;
          return (
            <line
              key={index}
              x1="50"
              y1="15"
              x2="50"
              y2="20"
              stroke={index < habits.cigarettesSmoked ? '#10B981' : '#6B7280'}
              strokeWidth="2"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}
      </svg>

      {/* Smoke Button */}
      <button
        onClick={onSmokeClick}
        disabled={habits.cigarettesSmoked >= habits.cigarettesPerDay}
        className={`
          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-24 h-24 rounded-full text-white font-bold
          flex items-center justify-center
          ${timingInfo.isOnSchedule 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-500 hover:bg-red-600'}
          transition-colors duration-300
          ${habits.cigarettesSmoked >= habits.cigarettesPerDay 
            ? 'opacity-50 cursor-not-allowed' 
            : 'opacity-100'}
        `}
      >
        <div className="text-center">
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

  return (
    <div className={`${className} bg-[#1f2937] p-4 sm:p-6 rounded-lg relative`}>
      {mounted && timingInfo && (
        <div className="space-y-4">
          <CircularSmokingTracker 
            cigarettesPerDay={cigarettesPerDay} 
            habits={habitsState} 
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
                style={{ width: `${timingInfo.progress}%` }}
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

          <div className="flex justify-center">
            <button
              onClick={handleSmokeClick}
              disabled={habitsState.cigarettesSmoked >= habitsState.cigarettesPerDay}
              className={`
                px-6 py-2 rounded-md text-white font-medium
                ${habitsState.cigarettesSmoked >= habitsState.cigarettesPerDay
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
