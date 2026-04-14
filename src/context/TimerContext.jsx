import React, { createContext, useState, useEffect, useContext } from 'react';
import { updateLog } from '../hooks/useTimeLogs';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState(() => {
    const saved = localStorage.getItem('activeTimer');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('activeTimer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('activeTimer');
    }
  }, [activeTimer]);

  const startTimer = (log) => {
    setActiveTimer({ 
      logId: log.id, 
      startTime: Date.now(), 
      initialWorkedMinutes: log.workedMinutes || 0, 
      projectName: log.projectName, 
      task: log.task 
    });
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const elapsedMs = Date.now() - activeTimer.startTime;
    const elapsedMinutes = Math.round(elapsedMs / 60000);
    const newWorked = activeTimer.initialWorkedMinutes + elapsedMinutes;
    
    try {
      await updateLog(activeTimer.logId, { workedMinutes: newWorked, status: 'В работе' });
    } catch (e) {
      console.error("Failed to update log on timer stop", e);
    }
    
    setActiveTimer(null);
    localStorage.setItem('lastTimerStop', Date.now().toString());
  };

  return (
    <TimerContext.Provider value={{ activeTimer, startTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
