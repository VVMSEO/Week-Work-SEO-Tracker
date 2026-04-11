import React, { useState } from 'react';
import { useTimeLogsByWeek, addLog } from '../hooks/useTimeLogs';
import { getMonday, getPreviousMonday, getNextMonday, getWeekRange, formatMinutes } from '../utils/timeCalc';
import AddSessionModal from './AddSessionModal';

const DAYS = [
  { id: 1, name: 'Понедельник' },
  { id: 2, name: 'Вторник' },
  { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' },
  { id: 5, name: 'Пятница' },
  { id: 6, name: 'Суббота' },
  { id: 0, name: 'Воскресенье' }
];

export default function WeekView({ projects }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date().toISOString().split('T')[0]));
  const { logs, loading } = useTimeLogsByWeek(weekStart);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const handlePrevWeek = () => setWeekStart(getPreviousMonday(weekStart));
  const handleNextWeek = () => setWeekStart(getNextMonday(weekStart));

  const handleAddSession = (dayId) => {
    const d = new Date(weekStart);
    const offset = dayId === 0 ? 6 : dayId - 1;
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSaveSession = async (data) => {
    await addLog(data);
    setIsModalOpen(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Сделана': return 'bg-green-100 text-green-800';
      case 'В работе': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4 text-slate-600">Загрузка...</div>;

  const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  const completedTasks = logs.filter(l => l.status === 'Сделана').length;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Неделя</h2>
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded">←</button>
          <span className="font-medium text-slate-700">Неделя: [{getWeekRange(weekStart)}]</span>
          <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded">→</button>
        </div>
      </div>

      {logs.length === 0 && (
        <div className="bg-slate-50 p-6 rounded-lg text-center text-slate-500 mb-6">
          Нет данных за эту неделю
        </div>
      )}

      <div className="space-y-6">
        {DAYS.map(day => {
          const dayDate = new Date(weekStart);
          const offset = day.id === 0 ? 6 : day.id - 1;
          dayDate.setDate(dayDate.getDate() + offset);
          const dateStr = dayDate.toISOString().split('T')[0];
          
          const dayLogs = logs.filter(l => l.date === dateStr);
          const dayTotal = dayLogs.reduce((sum, l) => sum + l.minutes, 0);

          return (
            <div key={day.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">{day.name} <span className="text-slate-500 text-sm font-normal ml-2">{dateStr}</span></h3>
                <button 
                  onClick={() => handleAddSession(day.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Добавить сеанс
                </button>
              </div>
              
              {dayLogs.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {dayLogs.map(log => (
                    <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-full sm:w-48 shrink-0">
                        <div className="font-medium text-slate-800">{log.projectName}</div>
                        <div className="text-sm text-slate-500">{formatMinutes(log.minutes)}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-slate-700 mb-1">{log.task}</div>
                        {log.result && <div className="text-sm text-slate-500 mb-2">Результат: {log.result}</div>}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-right text-sm text-slate-600 font-medium">
                Итого за день: {formatMinutes(dayTotal)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-slate-800 text-white rounded-lg p-4 flex justify-between items-center">
        <div>
          <span className="opacity-80">Задач в плане:</span> <span className="font-bold ml-1">{logs.length}</span>
          <span className="mx-4 opacity-40">|</span>
          <span className="opacity-80">Выполнено:</span> <span className="font-bold ml-1">{completedTasks}</span>
        </div>
        <div className="text-lg">
          <span className="opacity-80">Итого:</span> <span className="font-bold ml-2">{formatMinutes(totalMinutes)}</span>
        </div>
      </div>

      {isModalOpen && (
        <AddSessionModal 
          dayDate={selectedDate}
          projects={projects.filter(p => p.active)}
          onSave={handleSaveSession}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
