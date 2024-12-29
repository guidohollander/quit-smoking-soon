'use client';

import { useState, useEffect, useCallback } from 'react';

interface SmokingHabitsProps {
  className?: string;
  fixedStartTime: string;
  fixedEndTime: string;
  cigarettesPerDay?: number;
}

interface SmokingHabits {
  cigarettesPerDay: number;
  cigarettesSmoked: number;
  cigarettesSmokedPerPeriod: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  startTime: string;
  endTime: string;
  startDate: string;
  targetDate: string;
  initialCount: number;
}

interface CigaretteTimingInfo {
  progress: number;
  lastCigaretteTime: number;
  nextCigaretteTime: number;
  isOnSchedule: boolean;
  minutesUntilNext: number;
  secondsUntilNext: number;
  expectedCigarettes: number;
}

const defaultHabits: SmokingHabits = {
  cigarettesPerDay: 30,
  cigarettesSmoked: 0,
  cigarettesSmokedPerPeriod: {
    morning: 0,
    afternoon: 0,
    evening: 0
  },
  startTime: '08:00',
  endTime: '23:59',
  startDate: new Date().toISOString().split('T')[0],
  targetDate: '2025-01-31',
  initialCount: 30
};

export default function SmokingHabits({ 
  className = '', 
  fixedStartTime, 
  fixedEndTime,
  cigarettesPerDay = 30 
}: SmokingHabitsProps) {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<SmokingHabits>({
    cigarettesPerDay,
    cigarettesSmoked: 0,
    cigarettesSmokedPerPeriod: {
      morning: 0,
      afternoon: 0,
      evening: 0
    },
    startTime: fixedStartTime,
    endTime: fixedEndTime,
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '2025-01-31',
    initialCount: cigarettesPerDay
  });
  const [timingInfo, setTimingInfo] = useState<CigaretteTimingInfo | null>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('smokingHabits');
    if (stored) {
      const parsed = JSON.parse(stored);
      setHabits(parsed);
    }
  }, []);

  const calculateCurrentSmoked = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convert current time to minutes since start of day
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Convert smoking hours to minutes
    const startHour = parseInt(fixedStartTime.split(':')[0]);
    const startMinute = parseInt(fixedStartTime.split(':')[1]);
    const startTimeInMinutes = startHour * 60 + startMinute;
    
    const endHour = parseInt(fixedEndTime.split(':')[0]);
    const endMinute = parseInt(fixedEndTime.split(':')[1]);
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    // Calculate total smoking minutes in a day
    const totalSmokingMinutes = endTimeInMinutes - startTimeInMinutes;
    
    // If current time is before start time, return 0
    if (currentTimeInMinutes < startTimeInMinutes) {
      return 0;
    }
    
    // If current time is after end time, return total cigarettes
    if (currentTimeInMinutes > endTimeInMinutes) {
      return habits.cigarettesPerDay;
    }
    
    // Calculate elapsed smoking time
    const elapsedSmokingMinutes = Math.min(
      currentTimeInMinutes - startTimeInMinutes,
      totalSmokingMinutes
    );
    
    // Calculate expected cigarettes based on elapsed time
    const expectedCigarettes = Math.round(
      (elapsedSmokingMinutes / totalSmokingMinutes) * habits.cigarettesPerDay
    );
    
    return expectedCigarettes;
  }, [fixedStartTime, fixedEndTime, habits.cigarettesPerDay]);

  const updateSmokingStatus = useCallback(() => {
    const currentSmoked = calculateCurrentSmoked();
    setHabits(prev => ({
      ...prev,
      cigarettesSmoked: currentSmoked,
      cigarettesSmokedPerPeriod: calculateDailyPattern()
    }));
  }, [calculateCurrentSmoked, calculateDailyPattern]);

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
    updateSmokingStatus(); // Calculate initial status immediately
  }, [updateSmokingStatus]);

  // Update every minute
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      updateSmokingStatus();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [mounted, updateSmokingStatus]);

  const handleReset = useCallback(() => {
    localStorage.clear(); // Clear localStorage
    updateSmokingStatus(); // Immediately calculate new smoking status
  }, [updateSmokingStatus]);

  // Function to calculate timing information
  const calculateTimingInfo = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);

    // Convert smoking hours to minutes since midnight
    const startHour = parseInt(fixedStartTime.split(':')[0]);
    const startMinute = parseInt(fixedStartTime.split(':')[1]);
    const startTimeInMinutes = startHour * 60 + startMinute;
    
    const endHour = parseInt(fixedEndTime.split(':')[0]);
    const endMinute = parseInt(fixedEndTime.split(':')[1]);
    const endTimeInMinutes = endHour * 60 + endMinute;

    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // If outside smoking hours
    if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > endTimeInMinutes) {
      return null;
    }

    const totalSmokingMinutes = endTimeInMinutes - startTimeInMinutes;
    const minutesPerCigarette = totalSmokingMinutes / habits.cigarettesPerDay;
    
    // Calculate how many cigarettes should have been smoked by now
    const minutesElapsed = currentTimeInMinutes - startTimeInMinutes;
    const expectedCigarettes = Math.floor(minutesElapsed / minutesPerCigarette);
    
    // Calculate last and next cigarette times
    const lastCigaretteTime = startTimeInMinutes + (expectedCigarettes * minutesPerCigarette);
    const nextCigaretteTime = startTimeInMinutes + ((expectedCigarettes + 1) * minutesPerCigarette);
    
    const minutesUntilNext = nextCigaretteTime - currentTimeInMinutes;
    const secondsUntilNext = minutesUntilNext * 60;
    
    // Calculate progress towards next cigarette
    const progress = (currentTimeInMinutes - lastCigaretteTime) / minutesPerCigarette;
    
    // Determine if on schedule
    const isOnSchedule = habits.cigarettesSmoked >= expectedCigarettes;

    return {
      progress,
      lastCigaretteTime,
      nextCigaretteTime,
      isOnSchedule,
      minutesUntilNext,
      secondsUntilNext,
      expectedCigarettes
    };
  }, [habits.cigarettesPerDay, habits.cigarettesSmoked, fixedStartTime, fixedEndTime]);

  const handleSmokeClick = () => {
    const info = calculateTimingInfo();
    if (!info) return; // Don't allow smoking outside of smoking hours

    if (habits.cigarettesSmoked < habits.cigarettesPerDay) {
      const newTotal = habits.cigarettesSmoked + 1;
      const pattern = calculateDailyPattern();
      
      // Update both the total count and the pattern
      setHabits(prev => ({
        ...prev,
        cigarettesSmoked: newTotal,
        cigarettesSmokedPerPeriod: {
          morning: pattern.morning,
          afternoon: pattern.afternoon,
          evening: pattern.evening
        }
      }));

      // Update localStorage
      const updatedHabits = {
        ...habits,
        cigarettesSmoked: newTotal,
        cigarettesSmokedPerPeriod: {
          morning: pattern.morning,
          afternoon: pattern.afternoon,
          evening: pattern.evening
        }
      };
      localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
    }
  };

  const calculateDailyTarget = useCallback(() => {
    try {
      const startDate = new Date(habits.startDate || defaultHabits.startDate);
      const targetDate = new Date(habits.targetDate || defaultHabits.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // If we're past the target date, return 0
      if (daysElapsed >= totalDays) {
        return 0;
      }

      // Linear reduction
      const initialCount = Number(habits.initialCount) || defaultHabits.initialCount;
      const dailyReduction = initialCount / totalDays;
      return Math.max(0, Math.round(initialCount - (dailyReduction * daysElapsed)));
    } catch (e) {
      return defaultHabits.cigarettesPerDay;
    }
  }, [habits.startDate, habits.targetDate, habits.initialCount]);

  useEffect(() => {
    const targetCigarettes = calculateDailyTarget();
    if (targetCigarettes !== habits.cigarettesPerDay) {
      const updatedHabits = {
        ...habits,
        cigarettesPerDay: targetCigarettes
      };
      setHabits(updatedHabits);
      localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
    }
  }, [calculateDailyTarget, habits]);

  const getTimeRangeForPeriod = (start: number, end: number): string => {
    const [startHour] = habits.startTime.split(':').map(Number);
    const [endHour] = habits.endTime.split(':').map(Number);
    
    let periodStart = Math.max(start, startHour);
    let periodEnd = Math.min(end, endHour);
    
    if (endHour < startHour) {
      // Overnight case
      if (start < endHour) periodStart = start;
      if (end > startHour) periodEnd = end;
    }
    
    return `${periodStart.toString().padStart(2, '0')}:00 - ${periodEnd.toString().padStart(2, '0')}:00`;
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const calculateDailyPattern = useCallback(() => {
    // Define time periods (in hours)
    const morningStart = 8;   // 8:00 AM
    const afternoonStart = 12; // 12:00 PM
    const eveningStart = 18;   // 6:00 PM
    const dayEnd = 23.98;     // 23:59

    // Calculate duration of each period
    const morningHours = afternoonStart - morningStart;     // 4 hours (8:00-12:00)
    const afternoonHours = eveningStart - afternoonStart;   // 6 hours (12:00-18:00)
    const eveningHours = dayEnd - eveningStart;            // 5.98 hours (18:00-23:59)
    const totalHours = morningHours + afternoonHours + eveningHours;

    // Calculate cigarettes for each period based on duration
    const totalCigarettes = habits.cigarettesPerDay; // Use the actual daily target
    const morningTarget = Math.round((morningHours / totalHours) * totalCigarettes);
    const afternoonTarget = Math.round((afternoonHours / totalHours) * totalCigarettes);
    const eveningTarget = totalCigarettes - morningTarget - afternoonTarget; // Ensure total adds up

    // Calculate current progress
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);

    let morningSmoked = 0;
    let afternoonSmoked = 0;
    let eveningSmoked = 0;
    
    // Calculate smoked cigarettes based on current time and total smoked
    const totalSmoked = habits.cigarettesSmoked;
    
    if (currentTime >= dayEnd) {
      // After end time - all cigarettes smoked
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = Math.min(afternoonTarget, Math.max(0, totalSmoked - morningTarget));
      eveningSmoked = Math.min(eveningTarget, Math.max(0, totalSmoked - morningTarget - afternoonTarget));
    } else if (currentTime >= eveningStart) {
      // Evening period (18:00-23:59)
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = Math.min(afternoonTarget, Math.max(0, totalSmoked - morningTarget));
      eveningSmoked = Math.min(eveningTarget, Math.max(0, totalSmoked - morningTarget - afternoonTarget));
    } else if (currentTime >= afternoonStart) {
      // Afternoon period (12:00-18:00)
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = Math.min(afternoonTarget, Math.max(0, totalSmoked - morningTarget));
      eveningSmoked = 0;
    } else if (currentTime >= morningStart) {
      // Morning period (8:00-12:00)
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = 0;
      eveningSmoked = 0;
    }

    return {
      morning: morningSmoked,
      afternoon: afternoonSmoked,
      evening: eveningSmoked
    };
  }, [habits.cigarettesPerDay, habits.cigarettesSmoked]);

  const calculateDailyPatternWithSmoked = useCallback((habits: SmokingHabits, smoked: number) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Define time periods (in hours)
    const morningStart = 8;   // 8:00 AM
    const afternoonStart = 12; // 12:00 PM
    const eveningStart = 18;   // 6:00 PM
    const dayEnd = 23.98;     // 23:59

    // Calculate duration of each period
    const morningHours = afternoonStart - morningStart;     // 4 hours (8:00-12:00)
    const afternoonHours = eveningStart - afternoonStart;   // 6 hours (12:00-18:00)
    const eveningHours = dayEnd - eveningStart;            // 5.98 hours (18:00-23:59)
    const totalHours = morningHours + afternoonHours + eveningHours;

    // Calculate targets for each period based on duration
    const totalCigarettes = habits.cigarettesPerDay;
    const morningTarget = Math.round((morningHours / totalHours) * totalCigarettes);
    const afternoonTarget = Math.round((afternoonHours / totalHours) * totalCigarettes);
    const eveningTarget = totalCigarettes - morningTarget - afternoonTarget;

    // Calculate current progress based on time
    const currentTime = currentHour + (currentMinute / 60);
    
    let morningSmoked = 0;
    let afternoonSmoked = 0;
    let eveningSmoked = 0;

    // Calculate smoked cigarettes based on current time and total smoked
    const totalSmoked = smoked;
    
    if (currentTime >= dayEnd) {
      // After end time - all cigarettes smoked
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = Math.min(afternoonTarget, Math.max(0, totalSmoked - morningTarget));
      eveningSmoked = Math.min(eveningTarget, Math.max(0, totalSmoked - morningTarget - afternoonTarget));
    } else if (currentTime >= eveningStart) {
      // Evening period (18:00-23:59)
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = Math.min(afternoonTarget, Math.max(0, totalSmoked - morningTarget));
      eveningSmoked = Math.min(eveningTarget, Math.max(0, totalSmoked - morningTarget - afternoonTarget));
    } else if (currentTime >= afternoonStart) {
      // Afternoon period (12:00-18:00)
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = Math.min(afternoonTarget, Math.max(0, totalSmoked - morningTarget));
      eveningSmoked = 0;
    } else if (currentTime >= morningStart) {
      // Morning period (8:00-12:00)
      morningSmoked = Math.min(morningTarget, totalSmoked);
      afternoonSmoked = 0;
      eveningSmoked = 0;
    }

    return {
      morning: {
        smoked: morningSmoked,
        total: morningTarget
      },
      afternoon: {
        smoked: afternoonSmoked,
        total: afternoonTarget
      },
      evening: {
        smoked: eveningSmoked,
        total: eveningTarget
      }
    };
  }, []);

  // Update timing info every 100ms for smoother animation
  useEffect(() => {
    if (!mounted) return;
    
    const updateTiming = () => {
      setTimingInfo(calculateTimingInfo());
    };

    // Initial calculation
    updateTiming();

    // Set up interval for updates
    const interval = setInterval(updateTiming, 100);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [calculateTimingInfo, mounted]);

  return (
    <div className={`${className} bg-[#1f2937] p-4 sm:p-6 rounded-lg relative`}>
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center">
        <span>Smoking Habits</span>
      </h2>
      
      {/* Only render dynamic content after mounting */}
      {mounted && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Cigarettes today:</span>
                  <span className="text-lg font-semibold">{habits.cigarettesSmoked}</span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-200 mb-3">Your daily smoking pattern:</h3>
                <div className="space-y-4">
                  {Object.entries(calculateDailyPattern()).map(([period, data]) => (
                    <div key={period} className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm capitalize">{period}</span>
                        <span className="text-sm text-gray-400">
                          {data}/{habits.cigarettesPerDay}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{
                            width: `${(data / habits.cigarettesPerDay) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                >
                  Reset Progress
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-[#2d3748] rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-200 mb-4">Daily Schedule</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Cigarettes per Day:</span>
                    <span className="text-sm font-medium">32</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Start Time:</span>
                    <span className="text-sm font-medium">08:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">End Time:</span>
                    <span className="text-sm font-medium">23:59</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Hours per Day:</span>
                    <span className="text-sm font-medium">15.98</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Minutes per Cigarette:</span>
                    <span className="text-sm font-medium">
                      {Math.round((15.98 * 60) / 32)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating smoke button */}
      {mounted && (
        <div className="fixed bottom-4 right-4 z-50">
          {timingInfo && habits.cigarettesSmoked < habits.cigarettesPerDay && (
            <div className="bg-[#1f2937] rounded-lg shadow-lg p-4 mb-2 w-64">
              <div className="flex justify-between items-center text-sm mb-2">
                <div>
                  <span className="text-gray-400">Next in: </span>
                  <span className={timingInfo.isOnSchedule ? 'text-green-400' : 'text-yellow-400'}>
                    {timingInfo.minutesUntilNext > 0
                      ? `${Math.floor(timingInfo.minutesUntilNext)}m ${Math.floor(timingInfo.secondsUntilNext % 60)}s`
                      : 'Now'}
                  </span>
                </div>
                <span className={timingInfo.isOnSchedule ? 'text-green-400' : 'text-yellow-400'}>
                  {timingInfo.isOnSchedule ? 'On track' : 'Time for one'}
                </span>
              </div>
              <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500"
                  style={{ width: `${timingInfo.progress * 100}%` }}
                />
              </div>
            </div>
          )}
          <button
            onClick={handleSmokeClick}
            disabled={!timingInfo || habits.cigarettesSmoked >= habits.cigarettesPerDay}
            className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              !timingInfo || habits.cigarettesSmoked >= habits.cigarettesPerDay
                ? 'bg-gray-600 cursor-not-allowed'
                : timingInfo.isOnSchedule
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            🚬
          </button>
        </div>
      )}
    </div>
  );
}

function getSmokingHoursPerDay(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMinute - startMinute;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  return hours + (minutes / 60);
}

function generateHourBlocks(startTime: string, endTime: string): Array<{ hour: number; display: string }> {
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);
  const hours: Array<{ hour: number; display: string }> = [];
  
  if (endHour >= startHour) {
    // Normal case (e.g., 8:00 to 22:00)
    for (let hour = startHour; hour <= endHour; hour++) {
      hours.push({
        hour,
        display: `${hour.toString().padStart(2, '0')}:00`
      });
    }
  } else {
    // Overnight case (e.g., 22:00 to 2:00)
    for (let hour = startHour; hour < 24; hour++) {
      hours.push({
        hour,
        display: `${hour.toString().padStart(2, '0')}:00`
      });
    }
    for (let hour = 0; hour <= endHour; hour++) {
      hours.push({
        hour,
        display: `${hour.toString().padStart(2, '0')}:00`
      });
    }
  }
  
  return hours;
}
