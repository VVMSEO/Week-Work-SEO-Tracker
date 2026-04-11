import React, { useState } from 'react';
import { getMonday } from '../utils/timeCalc';

export default function AddSessionModal({ dayDate, projects, onSave, onClose }) {
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(dayDate || new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [task, setTask] = useState('');
  const [status, setStatus] = useState('В работе');
  const [result, setResult] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectId) {
      alert('Выберите проект');
      return;
    }
    const totalMinutes = parseInt(hours || 0) * 60 + parseInt(minutes || 0);
    if (totalMinutes <= 0) {
      alert('Укажите время');
      return;
    }
    if (!task.trim()) {
      alert('Укажите задачу');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    
    onSave({
      projectId,
      projectName: project.name,
      date,
      weekStart: getMonday(date),
      month: date.slice(0, 7),
      minutes: totalMinutes,
      task,
      status,
      result
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Добавить сеанс</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Проект</label>
            <select 
              value={projectId} 
              onChange={e => setProjectId(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
              required
            >
              <option value="">Выберите проект...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Дата</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
              required
            />
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Часы</label>
              <input 
                type="number" 
                min="0" 
                max="23" 
                value={hours} 
                onChange={e => setHours(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Минуты</label>
              <input 
                type="number" 
                min="0" 
                max="59" 
                value={minutes} 
                onChange={e => setMinutes(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Задача</label>
            <textarea 
              value={task} 
              onChange={e => setTask(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
              rows="2"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
            >
              <option value="Не начата">Не начата</option>
              <option value="В работе">В работе</option>
              <option value="Сделана">Сделана</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Результат (опционально)</label>
            <textarea 
              value={result} 
              onChange={e => setResult(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
              rows="2"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
            >
              Отмена
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
