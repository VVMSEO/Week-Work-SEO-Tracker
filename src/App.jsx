import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useSettings } from './hooks/useSettings';
import { useProjects } from './hooks/useProjects';
import { useTelegramReminders } from './hooks/useTelegramReminders';
import { TimerProvider } from './context/TimerContext';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import ProjectsTable from './components/ProjectsTable';
import Settings from './components/Settings';
import Categories from './components/Categories';
import ClientReport from './components/ClientReport';
import { CalendarDays, Calendar, LayoutList, Settings as SettingsIcon, LogOut, Tags, FileBarChart } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Трекер');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">SEO Planner</h1>
        <button 
          onClick={signInWithGoogle}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Войти через Google
        </button>
      </div>
    );
  }

  return <MainApp user={user} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function MainApp({ user, activeTab, setActiveTab }) {
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { projects, addProject, updateProject, deleteProject, loading: projectsLoading } = useProjects();
  
  // Initialize Telegram Reminders
  useTelegramReminders(user, settings, null, projects);

  const renderContent = () => {
    switch (activeTab) {
      case 'Трекер':
        return <WeekView projects={projects} settings={settings} />;
      case 'Проекты':
        return <ProjectsTable projects={projects} settings={settings} />;
      case 'Месяц':
        return <MonthView projects={projects} settings={settings} />;
      case 'Клиенты':
        return <ClientReport projects={projects} settings={settings} />;
      case 'Категории':
        return <Categories />;
      case 'Настройки':
        return (
          <Settings 
            settings={settings} 
            updateSettings={updateSettings} 
            projects={projects} 
            addProject={addProject} 
            updateProject={updateProject} 
            deleteProject={deleteProject} 
          />
        );
      default:
        return <WeekView projects={projects} settings={settings} />;
    }
  };

  const tabs = [
    { name: 'Трекер', icon: <CalendarDays size={20} /> },
    { name: 'Месяц', icon: <Calendar size={20} /> },
    { name: 'Проекты', icon: <LayoutList size={20} /> },
    { name: 'Клиенты', icon: <FileBarChart size={20} /> },
    { name: 'Категории', icon: <Tags size={20} /> },
    { name: 'Настройки', icon: <SettingsIcon size={20} /> }
  ];

  if (settingsLoading || projectsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Загрузка данных...</div>;
  }

  return (
    <TimerProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen p-4 flex flex-col">
          <div className="text-white text-xl font-bold px-2 py-4 border-b border-slate-700 mb-4">
            SEO Planner
          </div>
          
          <nav className="flex-1 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.name 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-slate-700 flex items-center justify-between px-2">
            <span className="text-sm truncate w-32" title={user.email}>{user.email}</span>
            <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white transition" title="Выйти">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </TimerProvider>
  );
}
