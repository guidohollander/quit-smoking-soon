'use client';

import { useState, useEffect } from 'react';
import QuitDateSelector from '../components/QuitDateSelector';
import Link from 'next/link';

export default function Settings() {
  const [cigarettesPerDay, setCigarettesPerDay] = useState(30);
  const [quitDate, setQuitDate] = useState('');

  useEffect(() => {
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
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 bg-[#1a1b26] text-white">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Settings</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Back to Timer
          </Link>
        </div>
        
        <div className="bg-[#1f2937] p-4 sm:p-6 rounded-lg space-y-6">
          <QuitDateSelector 
            cigarettesPerDay={cigarettesPerDay} 
            onQuitDateChange={handleQuitDateChange}
          />
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Smoking Hours</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  className="w-full px-3 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  className="w-full px-3 py-2 rounded bg-[#2d3748] text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
