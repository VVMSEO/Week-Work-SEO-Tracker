import React, { createContext, useState, useEffect, useContext } from 'react';
import { updateLog } from '../hooks/useTimeLogs';
import { Bell, X } from 'lucide-react';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState(() => {
    const saved = localStorage.getItem('activeTimer');
    return saved ? JSON.parse(saved) : null;
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().catch(e => console.log('Notification permission request failed:', e));
    }
  }, []);

  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('activeTimer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('activeTimer');
    }
  }, [activeTimer]);

  // Global tick for notifications
  useEffect(() => {
    if (!activeTimer || activeTimer.notified || !activeTimer.plannedMinutes) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - activeTimer.startTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const totalMinutes = activeTimer.initialWorkedMinutes + elapsedMinutes;

      if (activeTimer.plannedMinutes > 0 && totalMinutes >= activeTimer.plannedMinutes) {
        // Trigger notification
        const title = 'Время вышло!';
        const message = `Запланированное время (${activeTimer.plannedMinutes} мин) на задачу "${activeTimer.task}" истекло.`;
        
        setNotification({ title, message });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, { body: message });
          } catch (e) {
            console.log('Browser notification failed:', e);
          }
        }
        
        // Play a sound if possible
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio play blocked:', e));
        } catch (e) {}

        setActiveTimer(prev => ({ ...prev, notified: true }));
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = (log) => {
    setActiveTimer({ 
      logId: log.id, 
      startTime: Date.now(), 
      initialWorkedMinutes: log.workedMinutes || 0, 
      plannedMinutes: log.minutes || 0,
      projectName: log.projectName, 
      task: log.task,
      notified: false
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

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border-l-4 border-red-500 rounded shadow-lg p-4 max-w-sm animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">{notification.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
              </div>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 ml-4"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
