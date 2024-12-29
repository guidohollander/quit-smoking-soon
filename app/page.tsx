'use client';

import { useState, useEffect } from 'react';
import SmokingHabits from './components/SmokingHabits';

const getDefaultCigarettesPerDay = () => {
  if (typeof window === 'undefined') return 25;
  
  try {
    const stored = localStorage.getItem('smokingHabits');
    if (stored) {
      const habits = JSON.parse(stored);
      return habits.cigarettesPerDay || 25;
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  return 25;
};

export default function Home() {
  const [cigarettesPerDay, setCigarettesPerDay] = useState<number>(() => {
    return typeof window !== 'undefined' 
      ? getDefaultCigarettesPerDay() 
      : 25;
  });

  useEffect(() => {
    setCigarettesPerDay(getDefaultCigarettesPerDay());
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-24 bg-[#1a1b26] text-white">
      <div className="w-full max-w-2xl">
        <SmokingHabits 
          fixedStartTime="08:00"
          fixedEndTime="23:59"
          cigarettesPerDay={cigarettesPerDay}
        />
      </div>
    </main>
  );
}
