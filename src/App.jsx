import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProjects } from './hooks/useProjects';
import { useSettings } from './hooks/useSettings';
import { useReminders } from './hooks/useReminders';
import { useTelegramReminders } from './hooks/useTelegramReminders';
import { TimerProvider, useTimer } from './context/TimerContext';
import { Bell, BellOff } from 'lucide-react';

import WeekView from './components/WeekView';
import ProjectsTable from './components/ProjectsTable';
import MonthView from './components/MonthView';
import ClientReport from './components/ClientReport';
import Settings from './components/Settings';

function TelegramNotifier({ user, settings }) {
  const { activeTimer } = useTimer();
  useTelegramReminders(user, settings, activeTimer);
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Неделя');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { projects, addProject, updateProject } = useProjects();
  const { settings, updateSettings } = useSettings();
  
  useReminders(user);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает уведомления.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      alert('Уведомления включены! Мы напомним вам о невыполненных задачах на сегодня.');
    } else {
      alert('Вы запретили уведомления. Вы можете включить их в настройках браузера.');
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">SEO Tracker</h1>
          <p className="text-slate-500 mb-8">Учет времени и планирование для SEO-проектов</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Войти через Google
          </button>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'Неделя': return <WeekView projects={projects} />;
      case 'Проекты': return <ProjectsTable projects={projects} settings={settings} />;
      case 'Месяц': return <MonthView projects={projects} settings={settings} />;
      case 'Отчёт': return <ClientReport projects={projects} />;
      case 'Настройки': return <Settings settings={settings} updateSettings={updateSettings} projects={projects} addProject={addProject} updateProject={updateProject} />;
      default: return <WeekView projects={projects} />;
    }
  };

  const tabs = ['Неделя', 'Проекты', 'Месяц', 'Отчёт', 'Настройки'];

  return (
    <TimerProvider>
      <TelegramNotifier user={user} settings={settings} />
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-bold text-blue-600">SEO Tracker</h1>
                <nav className="hidden md:flex space-x-1">
                  {tabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={requestNotificationPermission}
                  className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  title={notificationsEnabled ? 'Браузерные уведомления включены' : 'Включить браузерные уведомления'}
                >
                  {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </button>
                <div className="flex items-center space-x-2">
                  {user.photoURL && <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />}
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.displayName}</span>
                </div>
                <button 
                  onClick={logOut}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Выйти
                </button>
              </div>
            </div>
            {/* Mobile nav */}
            <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-slate-100">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium ${
                    activeTab === tab 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="py-6">
          {renderTab()}
        </main>
      </div>
    </TimerProvider>
  );
}
