'use client';

import { useState, useEffect, useCallback } from 'react';

interface SmokingHabitsProps {
  className?: string;
}

interface SmokingHabits {
  cigarettesPerDay: number;
  startTime: string;
  endTime: string;
  cigarettesSmoked: number;
  cigarettesSmokedPerPeriod: {
    morning: number;
    afternoon: number;
    evening: number;
  };
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
  startTime: '08:00',
  endTime: '23:59',
  cigarettesSmoked: 0,
  cigarettesSmokedPerPeriod: {
    morning: 0,
    afternoon: 0,
    evening: 0
  },
  startDate: new Date().toISOString().split('T')[0],
  targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  initialCount: 30
};

export default function SmokingHabits({ className = '' }: SmokingHabitsProps) {
  const [habits, setHabits] = useState<SmokingHabits>(defaultHabits);
  const [timingInfo, setTimingInfo] = useState<CigaretteTimingInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedHabits = localStorage.getItem('smokingHabits');
    if (savedHabits) {
      try {
        const parsed = JSON.parse(savedHabits);
        // Ensure numeric values are properly initialized
        setHabits({
          ...defaultHabits,
          ...parsed,
          cigarettesPerDay: Number(parsed.cigarettesPerDay) || defaultHabits.cigarettesPerDay,
          cigarettesSmoked: Number(parsed.cigarettesSmoked) || 0,
          initialCount: Number(parsed.initialCount) || defaultHabits.initialCount,
          cigarettesSmokedPerPeriod: {
            morning: Number(parsed.cigarettesSmokedPerPeriod?.morning) || 0,
            afternoon: Number(parsed.cigarettesSmokedPerPeriod?.afternoon) || 0,
            evening: Number(parsed.cigarettesSmokedPerPeriod?.evening) || 0
          }
        });
      } catch (e) {
        setHabits(defaultHabits);
      }
    }
  }, []);

  // Function to calculate timing information
  const calculateTimingInfo = useCallback(() => {
    const totalSmokingMinutes = getSmokingHoursPerDay(habits.startTime, habits.endTime) * 60;
    const minutesBetweenCigarettes = totalSmokingMinutes / habits.cigarettesPerDay;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const currentTimeInMinutes = currentHour * 60 + currentMinute + (currentSecond / 60);
    
    const [startHour, startMinute] = habits.startTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    
    const minutesSinceStart = currentTimeInMinutes - startTimeInMinutes;
    const expectedCigarettes = Math.floor(minutesSinceStart / minutesBetweenCigarettes);
    
    const lastCigaretteTime = startTimeInMinutes + (expectedCigarettes * minutesBetweenCigarettes);
    const nextCigaretteTime = startTimeInMinutes + ((expectedCigarettes + 1) * minutesBetweenCigarettes);
    
    const progress = (currentTimeInMinutes - lastCigaretteTime) / (nextCigaretteTime - lastCigaretteTime);
    
    const minutesUntilNext = nextCigaretteTime - currentTimeInMinutes;
    const secondsUntilNext = Math.round(minutesUntilNext * 60);
    
    return {
      progress: Math.min(1, Math.max(0, progress)),
      lastCigaretteTime,
      nextCigaretteTime,
      isOnSchedule: habits.cigarettesSmoked <= expectedCigarettes,
      minutesUntilNext,
      secondsUntilNext,
      expectedCigarettes
    };
  }, [habits.startTime, habits.endTime, habits.cigarettesPerDay, habits.cigarettesSmoked]);

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

  // Update timing info every 100ms for smoother animation
  useEffect(() => {
    const updateTiming = () => {
      setTimingInfo(calculateTimingInfo());
    };

    // Initial calculation
    updateTiming();

    // Set up interval for updates
    const interval = setInterval(updateTiming, 100);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [calculateTimingInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let updatedValue: string | number = value;

    // Convert to number for numeric fields
    if (name === 'cigarettesPerDay' || name === 'initialCount') {
      updatedValue = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    }

    const updatedHabits = {
      ...habits,
      [name]: updatedValue,
      ...(name === 'cigarettesPerDay' ? {
        cigarettesSmoked: 0,
        cigarettesSmokedPerPeriod: {
          morning: 0,
          afternoon: 0,
          evening: 0
        }
      } : {})
    };

    setHabits(updatedHabits);
    localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
  };

  const handleReset = () => {
    const updatedHabits = {
      ...habits,
      cigarettesPerDay: 30,
      cigarettesSmoked: 0,
      cigarettesSmokedPerPeriod: {
        morning: 0,
        afternoon: 0,
        evening: 0
      }
    };
    setHabits(updatedHabits);
    localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
  };

  const handleSmokeClick = () => {
    if (habits.cigarettesSmoked < habits.cigarettesPerDay) {
      // Find the first period that still has cigarettes available
      const periods = [
        { name: 'morning', start: 6, end: 12 },
        { name: 'afternoon', start: 12, end: 18 },
        { name: 'evening', start: 18, end: 24 }
      ];

      let periodToUpdate = null;
      for (const period of periods) {
        const hoursInPeriod = generateHourBlocks(habits.startTime, habits.endTime)
          .filter(h => h.hour >= period.start && h.hour < period.end);
        
        if (hoursInPeriod.length === 0) continue;

        const cigarettesPerHour = habits.cigarettesPerDay / getSmokingHoursPerDay(habits.startTime, habits.endTime);
        const totalInPeriod = Math.round(cigarettesPerHour * hoursInPeriod.length);
        const smokedInPeriod = habits.cigarettesSmokedPerPeriod[period.name as keyof typeof habits.cigarettesSmokedPerPeriod];

        if (smokedInPeriod < totalInPeriod) {
          periodToUpdate = period.name;
          break;
        }
      }

      if (periodToUpdate) {
        const updatedHabits = {
          ...habits,
          cigarettesSmoked: habits.cigarettesSmoked + 1,
          cigarettesSmokedPerPeriod: {
            ...habits.cigarettesSmokedPerPeriod,
            [periodToUpdate]: habits.cigarettesSmokedPerPeriod[periodToUpdate as keyof typeof habits.cigarettesSmokedPerPeriod] + 1
          }
        };
        setHabits(updatedHabits);
        localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
      }
    }
  };

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

  return (
    <div className={`${className} bg-[#1f2937] p-4 sm:p-6 rounded-lg relative`}>
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center">
        <span>Smoking Habits</span>
      </h2>
      
      {/* Only render dynamic content after mounting */}
      {mounted && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Right Block - Daily Tracking */}
            <div>
              <div>
                <label htmlFor="cigarettesPerDay" className="block text-sm font-medium text-gray-300 mb-2">
                  Current cigarettes per day:
                </label>
                <input
                  type="number"
                  id="cigarettesPerDay"
                  name="cigarettesPerDay"
                  value={habits?.cigarettesPerDay?.toString() || '0'}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 sm:px-4 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Smoking hours:
                </label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="time"
                    name="startTime"
                    value={habits.startTime}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={habits.endTime}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="mt-6 bg-[#374151] p-3 sm:p-4 rounded-lg">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base text-gray-300">
                        Cigarettes remaining today:
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-yellow-400 font-bold text-lg">
                        {(habits?.cigarettesPerDay ?? 0) - (habits?.cigarettesSmoked ?? 0)}
                      </span>
                      <button
                        onClick={handleReset}
                        className="px-3 py-1 text-sm rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Next cigarette timing indicator */}
                  {habits.cigarettesSmoked < habits.cigarettesPerDay && timingInfo && (
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-xs">Previous</span>
                          <span className="text-gray-300">{formatTime(timingInfo.lastCigaretteTime)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-gray-400 text-xs">Next cigarette</span>
                          <span className={timingInfo.isOnSchedule ? 'text-green-400' : 'text-red-400'}>
                            {formatTime(timingInfo.nextCigaretteTime)}
                          </span>
                        </div>
                      </div>

                      {timingInfo.isOnSchedule ? (
                        <div className="text-center">
                          <span className="text-sm text-gray-400">Time until next: </span>
                          <span className="text-green-400 font-medium">
                            {timingInfo.secondsUntilNext > 60
                              ? `${Math.floor(timingInfo.minutesUntilNext)}m ${Math.floor(timingInfo.secondsUntilNext % 60)}s`
                              : `${Math.max(0, timingInfo.secondsUntilNext)}s`}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center text-red-400 text-sm">
                          Behind schedule
                        </div>
                      )}

                      <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-yellow-400/30"
                          style={{ width: `${timingInfo.progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-200 mb-3">Your daily smoking pattern:</h3>
                <div className="space-y-4">
                  {[
                    { period: 'Morning', icon: '🌅', start: 6, end: 12 },
                    { period: 'Afternoon', icon: '☀️', start: 12, end: 18 },
                    { period: 'Evening', icon: '🌙', start: 18, end: 24 }
                  ].map(({ period, icon, start, end }) => {
                    const timeRange = getTimeRangeForPeriod(start, end);
                    const [periodStart, periodEnd] = timeRange.split(' - ');
                    const cigarettesPerHour = habits.cigarettesPerDay / getSmokingHoursPerDay(habits.startTime, habits.endTime);
                    const hoursInPeriod = generateHourBlocks(habits.startTime, habits.endTime)
                      .filter(h => h.hour >= start && h.hour < end)
                      .length;
                    const totalInPeriod = Math.round(cigarettesPerHour * hoursInPeriod);
                    const smokedInPeriod = habits.cigarettesSmokedPerPeriod[period.toLowerCase() as keyof typeof habits.cigarettesSmokedPerPeriod];

                    return (
                      <div key={period} className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{icon}</span>
                            <span className="text-gray-300">{period}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            ({periodStart} - {periodEnd})
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-2">
                          <span className="text-yellow-400">{smokedInPeriod?.toString() ?? '0'}</span>
                          <span className="text-gray-400">of</span>
                          <span className="text-yellow-400">{totalInPeriod?.toString() ?? '0'}</span>
                          <span className="text-sm text-gray-400">cigarettes</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${totalInPeriod > 0 ? (smokedInPeriod / totalInPeriod) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-200 mb-3">Set Your Quit Date</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="targetDate" className="block text-sm font-medium text-gray-300 mb-2">
                      Choose your quit date:
                    </label>
                    <input
                      type="date"
                      id="targetDate"
                      name="targetDate"
                      value={habits.targetDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 sm:px-4 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>

                  <div className="text-center">
                    <div className="text-[64px] text-[#60A5FA] font-bold">
                      {Math.max(0, Math.ceil((new Date(habits.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                    </div>
                    <div className="text-gray-400">until your quit date</div>
                  </div>

                  <div>
                    <div className="text-lg font-medium text-gray-200 mb-3">Reduction Schedule</div>
                    <div className="space-y-2">
                      <div className="bg-[#1e293b] rounded p-3 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">Day 0</span>
                          <span className="text-gray-500">({new Date().toISOString().split('T')[0]})</span>
                        </div>
                        <span className="text-yellow-400">{habits.initialCount} cig/day</span>
                      </div>
                      <div className="bg-[#1e293b] rounded p-3 flex justify-between items-center border border-green-500">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">Quit Date</span>
                          <span className="text-gray-500">({habits.targetDate})</span>
                        </div>
                        <span className="text-green-500">0 cig/day</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="initialCount" className="block text-sm font-medium text-gray-300 mb-2">
                      Initial cigarettes per day:
                    </label>
                    <input
                      type="number"
                      id="initialCount"
                      name="initialCount"
                      value={habits?.initialCount?.toString() || '30'}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 sm:px-4 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Design FAB with Progress Ring */}
      {mounted && (
        <div className="fixed bottom-6 right-6 flex flex-col items-center">
          <button
            onClick={handleSmokeClick}
            disabled={habits.cigarettesSmoked >= habits.cigarettesPerDay}
            className={`relative w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              habits.cigarettesSmoked >= habits.cigarettesPerDay
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
            }`}
            style={{
              boxShadow: habits.cigarettesSmoked >= habits.cigarettesPerDay 
                ? 'none' 
                : '0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12)'
            }}
          >
            {/* Progress Ring */}
            {timingInfo && habits.cigarettesSmoked < habits.cigarettesPerDay && (
              <svg 
                className="absolute inset-0 -rotate-90 w-16 h-16"
                viewBox="0 0 100 100"
              >
                {/* Background ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="8"
                />
                {/* Progress ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={timingInfo.isOnSchedule ? '#4ade80' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${timingInfo.progress * 289} 289`}
                  className="transition-all duration-200"
                />
              </svg>
            )}

            {/* Plus Icon */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-8 h-8 z-10"
            >
              <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" />
            </svg>
          </button>

          {/* Time until next cigarette */}
          {timingInfo && habits.cigarettesSmoked < habits.cigarettesPerDay && (
            <div className="mt-2 text-center">
              <span className={`text-sm font-medium ${timingInfo.isOnSchedule ? 'text-green-400' : 'text-red-400'}`}>
                {timingInfo.isOnSchedule ? (
                  timingInfo.secondsUntilNext > 60
                    ? `${Math.floor(timingInfo.minutesUntilNext)}m ${Math.floor(timingInfo.secondsUntilNext % 60)}s`
                    : `${Math.max(0, timingInfo.secondsUntilNext)}s`
                ) : (
                  'Behind schedule'
                )}
              </span>
            </div>
          )}
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
