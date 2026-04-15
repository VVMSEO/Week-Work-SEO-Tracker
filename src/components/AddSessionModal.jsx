import React, { useState } from 'react';
import { getMonday } from '../utils/timeCalc';

export default function AddSessionModal({ dayDate, projects, categories = [], onSave, onClose, initialData = null }) {
  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [date, setDate] = useState(initialData?.date || dayDate || new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(initialData ? Math.floor(initialData.minutes / 60) : 0);
  const [minutes, setMinutes] = useState(initialData ? initialData.minutes % 60 : 0);
  const [workedHours, setWorkedHours] = useState(initialData ? Math.floor((initialData.workedMinutes || 0) / 60) : 0);
  const [workedMins, setWorkedMins] = useState(initialData ? (initialData.workedMinutes || 0) % 60 : 0);
  const [task, setTask] = useState(initialData?.task || '');
  const [status, setStatus] = useState(initialData?.status || 'В работе');
  const [result, setResult] = useState(initialData?.result || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectId) {
      alert('Выберите проект');
      return;
    }
    const totalMinutes = parseInt(hours || 0) * 60 + parseInt(minutes || 0);
    const totalWorkedMinutes = parseInt(workedHours || 0) * 60 + parseInt(workedMins || 0);
    
    if (totalMinutes <= 0 && totalWorkedMinutes <= 0) {
      alert('Укажите время (план или факт)');
      return;
    }
    if (!task.trim()) {
      alert('Укажите задачу');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    
    const dataToSave = {
      projectId,
      categoryId,
      projectName: project.name,
      date,
      weekStart: getMonday(date),
      month: date.slice(0, 7),
      minutes: totalMinutes,
      workedMinutes: totalWorkedMinutes,
      task,
      status,
      result
    };

    if (initialData?.id) {
      dataToSave.id = initialData.id;
    }

    onSave(dataToSave);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{initialData ? 'Редактировать сеанс' : 'Добавить сеанс'}</h2>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Категория (опционально)</label>
            <select 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
            >
              <option value="">Без категории</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">План (часы)</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">План (минуты)</label>
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

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-700 mb-1">Факт (часы)</label>
              <input 
                type="number" 
                min="0" 
                max="23" 
                value={workedHours} 
                onChange={e => setWorkedHours(e.target.value)}
                className="w-full border border-blue-200 rounded p-2 bg-blue-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-700 mb-1">Факт (минуты)</label>
              <input 
                type="number" 
                min="0" 
                max="59" 
                value={workedMins} 
                onChange={e => setWorkedMins(e.target.value)}
                className="w-full border border-blue-200 rounded p-2 bg-blue-50"
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
              <option value="Отложена">Отложена</option>
              <option value="Ждём клиента">Ждём клиента</option>
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
