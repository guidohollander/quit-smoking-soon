'use client';

import { useState, useEffect } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';

interface QuitDateSelectorProps {
  className?: string;
  onQuitDateChange?: (date: string) => void;
  cigarettesPerDay: number;
}

export default function QuitDateSelector({ className = '', onQuitDateChange, cigarettesPerDay }: QuitDateSelectorProps) {
  const [quitDate, setQuitDate] = useState<string>('');
  const [daysUntil, setDaysUntil] = useState<number | null>(null);

  useEffect(() => {
    // Load saved quit date from localStorage
    const savedDate = localStorage.getItem('quitDate');
    if (savedDate) {
      setQuitDate(savedDate);
    }
  }, []);

  useEffect(() => {
    if (quitDate) {
      // Save to localStorage whenever quit date changes
      localStorage.setItem('quitDate', quitDate);
      
      // Calculate days until quit date
      const today = new Date();
      const targetDate = parseISO(quitDate);
      const days = differenceInDays(targetDate, today);
      setDaysUntil(days);

      // Notify parent component
      if (onQuitDateChange) {
        onQuitDateChange(quitDate);
      }
    }
  }, [quitDate, onQuitDateChange]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuitDate(e.target.value);
  };

  // Calculate reduction schedule
  const getReductionSchedule = () => {
    if (!quitDate || !cigarettesPerDay) return [];

    const schedule = [];
    const today = new Date();
    const targetDate = parseISO(quitDate);
    const totalDays = Math.max(1, differenceInDays(targetDate, today));
    const weeksLeft = Math.ceil(totalDays / 7);
    const reductionPerDay = cigarettesPerDay / totalDays;
    
    for (let week = 0; week <= weeksLeft; week++) {
      const date = new Date(today);
      date.setDate(date.getDate() + week * 7);
      
      if (date > targetDate) break;
      
      const daysFromStart = week * 7;
      const cigarettesTarget = Math.max(0, Math.round(cigarettesPerDay - (reductionPerDay * daysFromStart)));
      
      schedule.push({
        week,
        date: format(date, 'yyyy-MM-dd'),
        cigarettes: date >= targetDate ? 0 : cigarettesTarget
      });
    }
    
    // Add the quit date as the final entry if it's not already included
    const lastEntry = schedule[schedule.length - 1];
    if (!lastEntry || lastEntry.date !== quitDate) {
      schedule.push({
        week: schedule.length,
        date: quitDate,
        cigarettes: 0
      });
    }
    
    return schedule;
  };

  return (
    <div className={`${className} bg-[#1f2937] p-4 sm:p-6 rounded-lg`}>
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center">
        <span className="text-blue-400 mr-2">📅</span>
        Set Your Quit Date
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="quitDate" className="block text-sm font-medium text-gray-300 mb-2">
            Choose your quit date:
          </label>
          <input
            type="date"
            id="quitDate"
            value={quitDate}
            onChange={handleDateChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full px-3 sm:px-4 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
          />
        </div>

        {daysUntil !== null && (
          <div className="mt-4 text-center">
            <div className="text-4xl sm:text-5xl font-bold text-blue-400">
              {daysUntil} {Math.abs(daysUntil) === 1 ? 'day' : 'days'}
            </div>
            <div className="text-sm sm:text-base text-gray-300">
              {daysUntil > 0 
                ? 'until your quit date' 
                : daysUntil < 0 
                  ? 'since you quit smoking'
                  : 'Today is your quit day!'}
            </div>
          </div>
        )}

        {quitDate && cigarettesPerDay > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Reduction Schedule</h3>
            <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
              {getReductionSchedule().map(({ week, date, cigarettes }) => {
                const isCurrentWeek = new Date(date).getTime() <= new Date().getTime() && 
                  new Date(date).getTime() + 7 * 24 * 60 * 60 * 1000 > new Date().getTime();
                const isQuitDate = date === quitDate;
                
                return (
                  <div 
                    key={week}
                    className={`flex items-center justify-between p-2 rounded ${
                      isQuitDate ? 'bg-green-400/10 border border-green-400/30' :
                      isCurrentWeek ? 'bg-blue-400/10 border border-blue-400/30' : 
                      'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">
                        {isQuitDate ? 'Quit Date' : `Week ${week}`}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({format(parseISO(date), 'yyyy-MM-dd')})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        isQuitDate ? 'text-green-400' :
                        isCurrentWeek ? 'text-blue-400' : 
                        'text-gray-300'
                      }`}>
                        {cigarettes}
                      </span>
                      <span className="text-sm text-gray-400">cig/day</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
