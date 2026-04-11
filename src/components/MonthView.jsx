import React, { useState } from 'react';
import { useTimeLogsByMonth } from '../hooks/useTimeLogs';
import { getPreviousMonth, getNextMonth, formatMonthRussian, formatMinutes, calcPlannedMinutes } from '../utils/timeCalc';

export default function MonthView({ projects, settings }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { logs, loading } = useTimeLogsByMonth(month);

  const handlePrevMonth = () => setMonth(getPreviousMonth(month));
  const handleNextMonth = () => setMonth(getNextMonth(month));

  if (loading) return <div className="p-4 text-slate-600">Загрузка...</div>;

  // Generate calendar days
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const monthIdx = parseInt(monthStr) - 1;
  const firstDay = new Date(year, monthIdx, 1);
  const lastDay = new Date(year, monthIdx + 1, 0);
  
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0 = Mon, 6 = Sun

  const calendarCells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayLogs = logs.filter(l => l.date === dateStr);
    const minutes = dayLogs.reduce((sum, l) => sum + l.minutes, 0);
    calendarCells.push({ day: i, dateStr, minutes });
  }

  const getHeatmapColor = (minutes) => {
    if (minutes === 0) return 'bg-slate-100 text-slate-400';
    if (minutes <= 120) return 'bg-blue-200 text-blue-800';
    if (minutes <= 240) return 'bg-blue-400 text-white';
    return 'bg-blue-700 text-white';
  };

  const totalMinutes = logs.reduce((sum, l) => sum + l.minutes, 0);
  const activeDays = new Set(logs.map(l => l.date)).size;
  const avgMinutes = activeDays > 0 ? totalMinutes / activeDays : 0;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Месяц</h2>
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded">←</button>
          <span className="font-medium text-slate-700 w-32 text-center">{formatMonthRussian(month)}</span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded">→</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="text-center text-sm font-medium text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell, idx) => (
            <div 
              key={idx} 
              className={`aspect-square rounded flex flex-col items-center justify-center p-1 ${cell ? getHeatmapColor(cell.minutes) : 'bg-transparent'}`}
            >
              {cell && (
                <>
                  <span className="text-sm font-bold">{cell.day}</span>
                  {cell.minutes > 0 && <span className="text-xs opacity-80">{formatMinutes(cell.minutes)}</span>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-sm text-slate-500 mb-1">Всего часов за месяц</div>
          <div className="text-2xl font-bold text-slate-800">{formatMinutes(totalMinutes)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-sm text-slate-500 mb-1">Рабочих дней</div>
          <div className="text-2xl font-bold text-slate-800">{activeDays}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-sm text-slate-500 mb-1">В среднем в день</div>
          <div className="text-2xl font-bold text-slate-800">{formatMinutes(avgMinutes)}</div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-4">Сводка по проектам</h3>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Проект</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Факт</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">План</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {projects.filter(p => p.active || logs.some(l => l.projectId === p.id)).map(project => {
              const projectLogs = logs.filter(l => l.projectId === project.id);
              const factMin = projectLogs.reduce((sum, l) => sum + l.minutes, 0);
              const plannedMin = calcPlannedMinutes(project.budget, project.overhead, settings?.hourlyRate || 0) * 4.33;
              
              if (factMin === 0 && !project.active) return null;

              return (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatMinutes(factMin)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatMinutes(plannedMin)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
