'use client';

import { useState, useEffect } from 'react';
import QuitDateSelector from './components/QuitDateSelector';
import SmokingHabits from './components/SmokingHabits';

const getDefaultQuitDate = () => {
  const today = new Date();
  const lastDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  return lastDayNextMonth.toISOString().split('T')[0];
};

export default function Home() {
  const [cigarettesPerDay, setCigarettesPerDay] = useState(25);
  const [quitDate, setQuitDate] = useState(getDefaultQuitDate());

  // Initialize from localStorage or set defaults
  useEffect(() => {
    const storedQuitDate = localStorage.getItem('quitDate');
    const storedCigarettes = localStorage.getItem('cigarettesPerDay');

    if (storedQuitDate) {
      setQuitDate(storedQuitDate);
    } else {
      const defaultDate = getDefaultQuitDate();
      setQuitDate(defaultDate);
      localStorage.setItem('quitDate', defaultDate);
    }

    if (storedCigarettes) {
      setCigarettesPerDay(parseInt(storedCigarettes));
    } else {
      localStorage.setItem('cigarettesPerDay', '25');
    }
  }, []);

  const handleQuitDateChange = (date: string) => {
    setQuitDate(date);
    localStorage.setItem('quitDate', date);
  };

  const handleCigarettesPerDayChange = (value: number) => {
    if (value >= 1 && value <= 99) {
      setCigarettesPerDay(value);
      localStorage.setItem('cigarettesPerDay', value.toString());
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-24 bg-[#1a1b26] text-white">
      <div className="w-full max-w-4xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <QuitDateSelector 
            cigarettesPerDay={cigarettesPerDay}
            onCigarettesPerDayChange={handleCigarettesPerDayChange}
            onQuitDateChange={handleQuitDateChange}
            defaultQuitDate={quitDate}
          />
          <SmokingHabits 
            fixedStartTime="08:00"
            fixedEndTime="23:59"
            cigarettesPerDay={cigarettesPerDay}
          />
        </div>
      </div>
    </main>
  );
}
