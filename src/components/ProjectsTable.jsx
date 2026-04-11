import React, { useState } from 'react';
import { useTimeLogsByWeek, useTimeLogsByMonth } from '../hooks/useTimeLogs';
import { calcPlannedMinutes, formatMinutes, getMonday } from '../utils/timeCalc';

export default function ProjectsTable({ projects, settings }) {
  const [weekStart] = useState(getMonday(new Date().toISOString().split('T')[0]));
  const [month] = useState(new Date().toISOString().slice(0, 7));
  
  const { logs: weekLogs, loading: weekLoading } = useTimeLogsByWeek(weekStart);
  const { logs: monthLogs, loading: monthLoading } = useTimeLogsByMonth(month);

  if (weekLoading || monthLoading) return <div className="p-4 text-slate-600">Загрузка...</div>;

  const activeProjects = projects.filter(p => p.active);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Проекты (План / Факт)</h2>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Проект</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Бюджет</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">План/нед</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Факт/нед</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Остаток/нед</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Факт/мес</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">План/мес</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Остаток/мес</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {activeProjects.map(project => {
              const hourlyRate = settings?.hourlyRate || 0;
              const plannedWeekMin = calcPlannedMinutes(project.budget, project.overhead, hourlyRate);
              const plannedMonthMin = plannedWeekMin * 4.33;
              
              const factWeekMin = weekLogs.filter(l => l.projectId === project.id).reduce((sum, l) => sum + l.minutes, 0);
              const factMonthMin = monthLogs.filter(l => l.projectId === project.id).reduce((sum, l) => sum + l.minutes, 0);
              
              const diffWeek = plannedWeekMin - factWeekMin;
              const diffMonth = plannedMonthMin - factMonthMin;

              return (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{project.budget}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatMinutes(plannedWeekMin)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatMinutes(factWeekMin)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${diffWeek >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {formatMinutes(Math.abs(diffWeek))} {diffWeek < 0 ? 'перерасход' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatMinutes(factMonthMin)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatMinutes(plannedMonthMin)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${diffMonth >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {formatMinutes(Math.abs(diffMonth))} {diffMonth < 0 ? 'перерасход' : ''}
                  </td>
                </tr>
              );
            })}
            {activeProjects.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-slate-500">Нет активных проектов</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
