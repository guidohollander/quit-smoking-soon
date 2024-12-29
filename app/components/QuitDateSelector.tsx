'use client';

import { useState, useEffect } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';

interface QuitDateSelectorProps {
  className?: string;
  onQuitDateChange?: (date: string) => void;
  onCigarettesPerDayChange: (value: number) => void;
  cigarettesPerDay: number;
  defaultQuitDate: string;
}

export default function QuitDateSelector({ 
  className = '', 
  onQuitDateChange, 
  onCigarettesPerDayChange,
  cigarettesPerDay,
  defaultQuitDate 
}: QuitDateSelectorProps) {
  const [quitDate, setQuitDate] = useState<string>(defaultQuitDate);
  const [daysUntil, setDaysUntil] = useState<number | null>(null);

  useEffect(() => {
    // Always use the default date
    setQuitDate(defaultQuitDate);
    localStorage.setItem('quitDate', defaultQuitDate);
    
    // Calculate days until quit date
    const today = new Date();
    const targetDate = parseISO(defaultQuitDate);
    const days = differenceInDays(targetDate, today);
    setDaysUntil(days);

    // Notify parent component
    if (onQuitDateChange) {
      onQuitDateChange(defaultQuitDate);
    }
  }, [defaultQuitDate, onQuitDateChange]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuitDate(e.target.value);
    if (onQuitDateChange) {
      onQuitDateChange(e.target.value);
    }
  };

  const handleCigarettesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 99) {
      onCigarettesPerDayChange(value);
    }
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
        <div className="flex flex-col space-y-2">
          <label htmlFor="cigarettesPerDay" className="text-sm text-gray-300">
            Cigarettes per day:
          </label>
          <input
            type="number"
            id="cigarettesPerDay"
            name="cigarettesPerDay"
            value={cigarettesPerDay}
            onChange={handleCigarettesChange}
            min="1"
            max="99"
            className="w-full px-3 py-2 bg-[#1a1b26] text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="quitDate" className="text-sm text-gray-300">
            Target quit date:
          </label>
          <input
            type="date"
            id="quitDate"
            name="quitDate"
            value={quitDate}
            onChange={handleDateChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full px-3 py-2 bg-[#1a1b26] text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
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
