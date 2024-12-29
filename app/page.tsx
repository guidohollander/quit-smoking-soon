'use client';

import { useState, useEffect, useCallback } from 'react';
import SmokingHabits from './components/SmokingHabits';

interface SmokingHabits {
  cigarettesPerDay: number;
  cigarettesSmoked: number;
  startDate: string;
  targetDate: string;
  initialCount: number;
  lastSmokedTime: string;
}

const getDefaultCigarettesPerDay = () => {
  if (typeof window === 'undefined') return 150;
  
  try {
    const stored = localStorage.getItem('smokingHabits');
    if (stored) {
      const habits = JSON.parse(stored);
      return habits.cigarettesPerDay || 150;
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  return 150;
};

export default function Home() {
  const [habits, setHabits] = useState<SmokingHabits>(() => {
    if (typeof window === 'undefined') {
      return {
        cigarettesPerDay: 150,
        cigarettesSmoked: 0,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: '2025-01-31',
        initialCount: 150,
        lastSmokedTime: ''
      };
    }

    try {
      const stored = localStorage.getItem('smokingHabits');
      return stored 
        ? JSON.parse(stored) 
        : {
            cigarettesPerDay: 150,
            cigarettesSmoked: 0,
            startDate: new Date().toISOString().split('T')[0],
            targetDate: '2025-01-31',
            initialCount: 150,
            lastSmokedTime: ''
          };
    } catch (error) {
      console.error('Error parsing smoking habits:', error);
      return {
        cigarettesPerDay: 150,
        cigarettesSmoked: 0,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: '2025-01-31',
        initialCount: 150,
        lastSmokedTime: ''
      };
    }
  });

  const handleSmokeClick = useCallback(() => {
    const updatedHabits = {
      ...habits,
      cigarettesSmoked: Math.min(habits.cigarettesSmoked + 1, habits.cigarettesPerDay),
      lastSmokedTime: new Date().toISOString()  // Reset last smoked time to current time
    };

    setHabits(updatedHabits);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smokingHabits', JSON.stringify(updatedHabits));
      } catch (error) {
        console.error('Failed to save smoking habits', error);
      }
    }
  }, [habits]);

  const handleReset = useCallback(() => {
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

    const expectedCigarettes = isWithinSmokingHours
      ? Math.floor(
          ((currentTimeInMinutes - startTimeInMinutes) / ((endHour - startHour) * 60)) * 
          habits.cigarettesPerDay
        )
      : 0;

    const resetHabits = {
      ...habits,
      cigarettesSmoked: expectedCigarettes,  
      startDate: new Date().toISOString().split('T')[0],
      lastSmokedTime: '',
      cigarettesPerDay: 150,  // Explicitly set to 150
      initialCount: 150
    };

    setHabits(resetHabits);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('smokingHabits');
        localStorage.setItem('smokingHabits', JSON.stringify(resetHabits));
      } catch (error) {
        console.error('Failed to reset smoking habits', error);
      }
    }
  }, [habits]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-24 bg-[#1a1b26] text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <SmokingHabits 
          cigarettesPerDay={habits.cigarettesPerDay}
          habits={habits}
          onSmokeClick={handleSmokeClick}
          onReset={handleReset}
        />
      </div>
    </main>
  );
}
