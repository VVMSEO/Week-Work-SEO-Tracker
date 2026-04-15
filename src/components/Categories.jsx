import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Trash2, Edit2, Plus } from 'lucide-react';

export default function Categories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  if (loading) return <div className="p-4 text-slate-600">Загрузка...</div>;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleUpdate = (id) => {
    if (!editName.trim()) return;
    updateCategory(id, { name: editName.trim() });
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Категории</h2>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Добавить категорию</h3>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Название категории..."
            className="flex-1 border border-slate-300 rounded p-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Добавить
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Название</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === cat.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-slate-300 rounded p-1 w-full max-w-xs"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                    />
                  ) : (
                    <span className="font-medium text-slate-900">{cat.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === cat.id ? (
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleUpdate(cat.id)} className="text-green-600 hover:text-green-900">Сохранить</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700">Отмена</button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Удалить категорию?')) {
                            deleteCategory(cat.id);
                          }
                        }} 
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-center text-slate-500">Нет категорий</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
