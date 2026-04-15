import React, { useState, useEffect } from 'react';
import { useTimeLogsByWeek, addLog, deleteLog, updateLog } from '../hooks/useTimeLogs';
import { useSettings } from '../hooks/useSettings';
import { useCategories } from '../hooks/useCategories';
import { useTimer } from '../context/TimerContext';
import { getMonday, getPreviousMonday, getNextMonday, getWeekRange, formatMinutes, calcPlannedMinutes } from '../utils/timeCalc';
import { distributeProjects } from '../services/aiService';
import { Wand2, Loader2, Trash2, Edit2, Play, Square } from 'lucide-react';
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

const LiveTimerDisplay = ({ activeTimer }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = Math.max(0, now - activeTimer.startTime);
  const totalMs = (activeTimer.initialWorkedMinutes || 0) * 60000 + elapsedMs;

  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);

  return (
    <div className="text-blue-600 font-medium mt-0.5 flex items-center">
      Факт: <span className="font-mono ml-1 bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 border border-blue-100">
        {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
      </span>
      <span className="ml-2 text-red-500 text-xs font-medium animate-pulse">⏱️ Идет отсчет...</span>
    </div>
  );
};

export default function WeekView({ projects }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date().toISOString().split('T')[0]));
  const { logs, loading } = useTimeLogsByWeek(weekStart);
  const { categories } = useCategories();
  const { settings } = useSettings();
  const { activeTimer, startTimer, stopTimer } = useTimer();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  const handlePrevWeek = () => setWeekStart(getPreviousMonday(weekStart));
  const handleNextWeek = () => setWeekStart(getNextMonday(weekStart));

  const handleClearDrafts = async () => {
    const drafts = logs.filter(l => l.status === 'Не начата' && l.task === 'План на неделю');
    if (drafts.length === 0) {
      alert('Нет черновиков для удаления.');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите удалить ${drafts.length} черновиков?`)) {
      for (const draft of drafts) {
        await deleteLog(draft.id);
      }
    }
  };

  const generatePlan = async () => {
    if (!settings?.hourlyRate) {
      alert('Сначала укажите часовую ставку в Настройках.');
      return;
    }

    const activeProjects = projects.filter(p => p.active);
    if (activeProjects.length === 0) {
      alert('Нет активных проектов для планирования.');
      return;
    }

    if (logs.length > 0) {
      if (!window.confirm('На этой неделе уже есть задачи. Вы уверены, что хотите добавить новые черновики?')) {
        return;
      }
    }

    setIsPlanning(true);

    const projectsToPlan = activeProjects.map(p => ({
      id: p.id,
      name: p.name,
      minutes: calcPlannedMinutes(p.budget, p.overhead, settings.hourlyRate)
    })).filter(p => p.minutes > 0);

    const aiResult = await distributeProjects(projectsToPlan);
    
    let schedule = [];
    if (aiResult && aiResult.schedule) {
      schedule = aiResult.schedule;
    } else {
      alert('Не удалось получить ответ от ИИ. Используем стандартное распределение.');
      let currentDayIdx = 1;
      schedule = projectsToPlan.map(p => {
        const item = { projectId: p.id, day: currentDayIdx };
        currentDayIdx = currentDayIdx > 4 ? 1 : currentDayIdx + 1;
        return item;
      });
    }

    // Подсчитываем, сколько раз каждый проект встречается в расписании,
    // чтобы разделить его недельное время поровну между этими днями
    const projectCounts = {};
    schedule.forEach(item => {
      projectCounts[item.projectId] = (projectCounts[item.projectId] || 0) + 1;
    });

    for (const item of schedule) {
      const project = projectsToPlan.find(p => p.id === item.projectId);
      if (!project) continue;

      const d = new Date(weekStart);
      d.setDate(d.getDate() + (item.day - 1));
      const dateStr = d.toISOString().split('T')[0];

      // Делим общее время проекта на количество дней, в которые он запланирован
      const sessionMinutes = Math.round(project.minutes / projectCounts[item.projectId]);

      await addLog({
        projectId: project.id,
        projectName: project.name,
        date: dateStr,
        weekStart: weekStart,
        month: dateStr.slice(0, 7),
        minutes: sessionMinutes,
        task: 'План на неделю',
        status: 'Не начата',
        result: ''
      });
    }
    
    setIsPlanning(false);
  };

  const handleAddSession = (dayId) => {
    const d = new Date(weekStart);
    const offset = dayId === 0 ? 6 : dayId - 1;
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
    setEditingLog(null);
    setIsModalOpen(true);
  };

  const handleEditSession = (log) => {
    setEditingLog(log);
    setSelectedDate(log.date);
    setIsModalOpen(true);
  };

  const handleSaveSession = async (data) => {
    if (data.id) {
      const { id, ...updateData } = data;
      await updateLog(id, updateData);
    } else {
      await addLog(data);
    }
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Сделана': return 'bg-green-100 text-green-800';
      case 'В работе': return 'bg-blue-100 text-blue-800';
      case 'Отложена': return 'bg-orange-100 text-orange-800';
      case 'Ждём клиента': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  if (loading) return <div className="p-4 text-slate-600">Загрузка...</div>;

  const getLiveElapsedMinutes = (logId) => {
    if (activeTimer?.logId === logId) {
      const elapsedMs = Math.max(0, now - activeTimer.startTime);
      return Math.floor(elapsedMs / 60000);
    }
    return 0;
  };

  const totalPlanMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  const totalFactMinutes = logs.reduce((sum, log) => sum + (log.workedMinutes || 0) + getLiveElapsedMinutes(log.id), 0);
  const completedTasks = logs.filter(l => l.status === 'Сделана').length;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Неделя</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleClearDrafts}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium border border-red-200"
          >
            Очистить черновики
          </button>
          <button 
            onClick={generatePlan}
            disabled={isPlanning}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium border border-blue-200 disabled:opacity-50"
          >
            {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>{isPlanning ? 'Планируем...' : 'Умный план'}</span>
          </button>
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
          const dayTotalPlan = dayLogs.reduce((sum, l) => sum + l.minutes, 0);
          const dayTotalFact = dayLogs.reduce((sum, l) => sum + (l.workedMinutes || 0) + getLiveElapsedMinutes(l.id), 0);

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
                <>
                  {/* Daily Timeline View */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-200">
                      {dayLogs.map((log, idx) => {
                        const fact = (log.workedMinutes || 0) + getLiveElapsedMinutes(log.id);
                        const width = dayTotalFact > 0 ? (fact / dayTotalFact) * 100 : 0;
                        const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-rose-500'];
                        return fact > 0 ? (
                          <div 
                            key={log.id} 
                            style={{ width: `${width}%` }} 
                            className={`${colors[idx % colors.length]} border-r border-white/30 last:border-0 transition-all duration-500`} 
                            title={`${log.task} (${formatMinutes(fact)})`} 
                          />
                        ) : null;
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                      <span>Таймлайн (Факт)</span>
                      <span>{formatMinutes(dayTotalFact)}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {dayLogs.map(log => {
                      const isTimerActive = activeTimer?.logId === log.id;
                      const currentFact = (log.workedMinutes || 0) + getLiveElapsedMinutes(log.id);
                      const progress = log.minutes > 0 ? Math.round((currentFact / log.minutes) * 100) : 0;
                      const isOvertime = log.minutes > 0 && currentFact > log.minutes;
                      
                      return (
                        <div key={log.id} className={`p-4 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors relative ${isTimerActive ? 'bg-red-50/50 border border-red-200 rounded-lg' : ''}`}>
                          {isTimerActive && (
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                              <span className="text-xs font-medium text-red-600 uppercase tracking-wider">В процессе</span>
                            </div>
                          )}
                          <div className="w-full sm:w-56 shrink-0">
                            <div className="font-medium text-slate-800 pr-24 sm:pr-0">{log.projectName}</div>
                            {log.categoryId && (
                              <div className="text-xs text-slate-500 mb-1">
                                {categories?.find(c => c.id === log.categoryId)?.name}
                              </div>
                            )}
                            <div className="text-sm text-slate-500 mt-1">
                              <div>План: {formatMinutes(log.minutes)}</div>
                              {isTimerActive ? (
                                <LiveTimerDisplay activeTimer={activeTimer} />
                              ) : (
                                <div className="text-blue-600 font-medium mt-0.5">
                                  Факт: {formatMinutes(log.workedMinutes || 0)}
                                </div>
                              )}
                              
                              {/* Progress Bar */}
                              {log.minutes > 0 && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className={isOvertime ? 'text-red-500 font-medium' : 'text-slate-500'}>
                                      {progress}% {isOvertime && '(Переработка)'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-1.5 rounded-full transition-all duration-500 ${isOvertime ? 'bg-red-500' : 'bg-blue-500'}`} 
                                      style={{ width: `${Math.min(100, progress)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-slate-700 mb-1">{log.task}</div>
                            {log.result && <div className="text-sm text-slate-500 mb-2">Результат: {log.result}</div>}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                                {log.status}
                              </span>
                              <div className="flex space-x-1">
                                {isTimerActive ? (
                                  <button
                                    onClick={stopTimer}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    title="Остановить таймер"
                                  >
                                    <Square className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => startTimer(log)}
                                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                                    title="Запустить таймер"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditSession(log)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                  title="Редактировать запись"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Удалить эту запись?')) {
                                      if (activeTimer?.logId === log.id) stopTimer();
                                      deleteLog(log.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                                  title="Удалить запись"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-right text-sm text-slate-600 font-medium">
                Итого за день: План {formatMinutes(dayTotalPlan)} / Факт {formatMinutes(dayTotalFact)}
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
          <span className="opacity-80">План:</span> <span className="font-bold ml-2">{formatMinutes(totalPlanMinutes)}</span>
          <span className="mx-4 opacity-40">|</span>
          <span className="opacity-80">Факт:</span> <span className="font-bold ml-2 text-blue-300">{formatMinutes(totalFactMinutes)}</span>
        </div>
      </div>

      {isModalOpen && (
        <AddSessionModal 
          dayDate={selectedDate}
          projects={projects.filter(p => p.active)}
          categories={categories}
          onSave={handleSaveSession}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLog(null);
          }}
          initialData={editingLog}
        />
      )}
    </div>
  );
}
