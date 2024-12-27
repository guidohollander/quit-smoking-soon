'use client';

import { useState, useEffect } from 'react';
import QuitDateSelector from './components/QuitDateSelector';
import SmokingHabits from './components/SmokingHabits';

export default function Home() {
  const [cigarettesPerDay, setCigarettesPerDay] = useState(30);
  const [quitDate, setQuitDate] = useState('');

  useEffect(() => {
    // Load saved habits from localStorage
    const savedHabits = localStorage.getItem('smokingHabits');
    if (savedHabits) {
      const parsed = JSON.parse(savedHabits);
      setCigarettesPerDay(parsed.cigarettesPerDay || 30);
    }
  }, []);

  const handleQuitDateChange = (date: string) => {
    setQuitDate(date);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-24 bg-[#1a1b26] text-white">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left">Quit Smoking Soon</h1>
        
        <div className="bg-[#1f2937] p-4 sm:p-6 rounded-lg">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center">
            <span className="text-red-400 mr-2">❤️</span>
            Welcome
          </h2>
          <p className="text-sm sm:text-base text-gray-300">
            Your journey to a smoke-free life starts here. Take the first step towards a healthier future.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <QuitDateSelector 
            cigarettesPerDay={cigarettesPerDay} 
            onQuitDateChange={handleQuitDateChange}
          />
          <SmokingHabits />
        </div>
      </div>
    </main>
  );
}
