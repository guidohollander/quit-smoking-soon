'use client';

import { useState, useEffect } from 'react';
import QuitDateSelector from './components/QuitDateSelector';
import SmokingHabits from './components/SmokingHabits';

export default function Home() {
  const [cigarettesPerDay, setCigarettesPerDay] = useState(30);
  const [quitDate, setQuitDate] = useState('2025-01-31');

  useEffect(() => {
    // Clear localStorage on component mount
    localStorage.clear();
    
    // Set default values in localStorage
    const defaultHabits = {
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
      targetDate: '2025-01-31',
      initialCount: 30
    };
    
    localStorage.setItem('smokingHabits', JSON.stringify(defaultHabits));
    localStorage.setItem('quitDate', '2025-01-31');
  }, []);

  const handleQuitDateChange = (date: string) => {
    setQuitDate(date);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-24 bg-[#1a1b26] text-white">
      <div className="w-full max-w-4xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <QuitDateSelector 
            cigarettesPerDay={cigarettesPerDay} 
            onQuitDateChange={handleQuitDateChange}
            defaultQuitDate="2025-01-31"
          />
          <SmokingHabits 
            fixedStartTime="08:00"
            fixedEndTime="23:59"
          />
        </div>
      </div>
    </main>
  );
}
