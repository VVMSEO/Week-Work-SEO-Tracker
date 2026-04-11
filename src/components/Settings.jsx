import React, { useState, useEffect } from 'react';

export default function Settings({ settings, updateSettings, projects, addProject, updateProject }) {
  const [hourlyRate, setHourlyRate] = useState(settings?.hourlyRate || 0);
  const [showArchived, setShowArchived] = useState(false);
  
  // New project form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [newProjectOverhead, setNewProjectOverhead] = useState(3);

  // Edit project state
  const [editingId, setEditingId] = useState(null);
  const [editBudget, setEditBudget] = useState('');
  const [editOverhead, setEditOverhead] = useState('');

  useEffect(() => {
    if (settings) {
      setHourlyRate(settings.hourlyRate || 0);
    }
  }, [settings]);

  const handleRateBlur = () => {
    if (hourlyRate !== settings?.hourlyRate) {
      updateSettings({ hourlyRate: Number(hourlyRate) });
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectBudget) return;
    
    await addProject({
      name: newProjectName.trim(),
      budget: Number(newProjectBudget),
      overhead: Number(newProjectOverhead),
      active: true
    });
    
    setNewProjectName('');
    setNewProjectBudget('');
    setNewProjectOverhead(3);
  };

  const startEdit = (project) => {
    setEditingId(project.id);
    setEditBudget(project.budget);
    setEditOverhead(project.overhead);
  };

  const saveEdit = async (id) => {
    await updateProject(id, {
      budget: Number(editBudget),
      overhead: Number(editOverhead)
    });
    setEditingId(null);
  };

  const toggleActive = async (project) => {
    await updateProject(project.id, { active: !project.active });
  };

  const filteredProjects = showArchived ? projects : projects.filter(p => p.active);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Настройки</h2>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Общие настройки</h3>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Часовая ставка (₽)
          </label>
          <input 
            type="number" 
            value={hourlyRate}
            onChange={e => setHourlyRate(e.target.value)}
            onBlur={handleRateBlur}
            className="w-full border border-slate-300 rounded p-2"
          />
          <p className="text-xs text-slate-500 mt-1">Сохраняется автоматически</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Проекты</h3>
          <label className="flex items-center text-sm text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="mr-2"
            />
            Показывать архивные
          </label>
        </div>

        <form onSubmit={handleAddProject} className="flex gap-4 mb-6 items-end bg-slate-50 p-4 rounded border border-slate-200">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Название</label>
            <input 
              type="text" 
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-slate-700 mb-1">Бюджет</label>
            <input 
              type="number" 
              value={newProjectBudget}
              onChange={e => setNewProjectBudget(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-700 mb-1">Коэфф.</label>
            <input 
              type="number" 
              step="0.1"
              value={newProjectOverhead}
              onChange={e => setNewProjectOverhead(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm"
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 h-[38px]">
            Добавить
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Название</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Бюджет</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Коэфф.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Статус</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.map(project => (
                <tr key={project.id} className={!project.active ? 'opacity-60 bg-slate-50' : ''}>
                  <td className="px-4 py-3 font-medium text-slate-900">{project.name}</td>
                  
                  {editingId === project.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={editBudget} 
                          onChange={e => setEditBudget(e.target.value)}
                          className="w-24 border border-slate-300 rounded p-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          step="0.1"
                          value={editOverhead} 
                          onChange={e => setEditOverhead(e.target.value)}
                          className="w-16 border border-slate-300 rounded p-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500">{project.active ? 'Активен' : 'В архиве'}</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => saveEdit(project.id)} className="text-green-600 text-sm font-medium hover:underline">Сохранить</button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 text-sm hover:underline">Отмена</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-600">{project.budget}</td>
                      <td className="px-4 py-3 text-slate-600">{project.overhead}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => toggleActive(project)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${project.active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}
                        >
                          {project.active ? 'Активен' : 'В архиве'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => startEdit(project)} className="text-blue-600 text-sm font-medium hover:underline">Изменить</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-slate-500">Нет проектов</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
