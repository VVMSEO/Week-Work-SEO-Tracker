import React, { useState, useEffect } from 'react';
import { useTimeLogsByWeek } from '../hooks/useTimeLogs';
import { getMonday, getPreviousMonday, getNextMonday, getWeekRange } from '../utils/timeCalc';
import { improveText } from '../services/aiService';
import { Wand2, Loader2 } from 'lucide-react';

export default function ClientReport({ projects }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date().toISOString().split('T')[0]));
  const { logs, loading } = useTimeLogsByWeek(weekStart);
  const [reportData, setReportData] = useState({});
  const [improvingFields, setImprovingFields] = useState({});

  const handlePrevWeek = () => setWeekStart(getPreviousMonday(weekStart));
  const handleNextWeek = () => setWeekStart(getNextMonday(weekStart));

  useEffect(() => {
    if (loading) return;
    
    const completedLogs = logs.filter(l => l.status === 'Сделана');
    const grouped = {};
    
    completedLogs.forEach(log => {
      if (!grouped[log.projectId]) {
        grouped[log.projectId] = {
          projectName: log.projectName,
          done: [],
          next: '',
          fromClient: ''
        };
      }
      grouped[log.projectId].done.push(log.task + (log.result ? ` (${log.result})` : ''));
    });

    // Merge with existing state to preserve typed text
    setReportData(prev => {
      const merged = { ...prev };
      Object.keys(grouped).forEach(pid => {
        if (!merged[pid]) {
          merged[pid] = grouped[pid];
        } else {
          merged[pid].done = grouped[pid].done; // Update done list
        }
      });
      return merged;
    });
  }, [logs, loading]);

  const handleTextChange = (projectId, field, value) => {
    setReportData(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value
      }
    }));
  };

  const handleImprove = async (projectId, field, text) => {
    if (!text.trim()) return;
    const fieldKey = `${projectId}_${field}`;
    
    setImprovingFields(prev => ({ ...prev, [fieldKey]: true }));
    const improved = await improveText(text);
    handleTextChange(projectId, field, improved);
    setImprovingFields(prev => ({ ...prev, [fieldKey]: false }));
  };

  const handleCopy = () => {
    let md = `| Проект | Что сделано | Что дальше | От клиента |\n|---|---|---|---|\n`;
    Object.values(reportData).forEach(data => {
      if (data.done.length === 0 && !data.next && !data.fromClient) return;
      
      const doneText = data.done.map(d => `• ${d}`).join('<br>');
      const nextText = data.next.replace(/\n/g, '<br>');
      const clientText = data.fromClient.replace(/\n/g, '<br>');
      
      md += `| ${data.projectName} | ${doneText || '-'} | ${nextText || '-'} | ${clientText || '-'} |\n`;
    });
    
    navigator.clipboard.writeText(md).then(() => {
      alert('Отчёт скопирован в буфер обмена (Markdown)');
    });
  };

  if (loading) return <div className="p-4 text-slate-600">Загрузка...</div>;

  const projectIds = Object.keys(reportData);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Отчёт клиентам</h2>
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded">←</button>
          <span className="font-medium text-slate-700">Неделя: [{getWeekRange(weekStart)}]</span>
          <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded">→</button>
        </div>
      </div>

      {projectIds.length === 0 ? (
        <div className="bg-slate-50 p-6 rounded-lg text-center text-slate-500">
          Нет выполненных задач за эту неделю
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Проект</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Что сделано</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Что дальше</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">От клиента</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {projectIds.map(pid => {
                  const data = reportData[pid];
                  if (data.done.length === 0 && !data.next && !data.fromClient) return null;
                  
                  return (
                    <tr key={pid} className="align-top">
                      <td className="px-6 py-4 font-medium text-slate-900">{data.projectName}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <ul className="list-disc pl-4 space-y-1">
                          {data.done.map((task, idx) => <li key={idx}>{task}</li>)}
                        </ul>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <textarea 
                            className="w-full border border-slate-300 rounded p-2 text-sm pr-8"
                            rows="4"
                            value={data.next}
                            onChange={e => handleTextChange(pid, 'next', e.target.value)}
                            placeholder="Планы на следующую неделю..."
                          />
                          {data.next && (
                            <button
                              onClick={() => handleImprove(pid, 'next', data.next)}
                              disabled={improvingFields[`${pid}_next`]}
                              className="absolute bottom-2 right-2 p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 disabled:opacity-50"
                              title="Улучшить текст с помощью ИИ"
                            >
                              {improvingFields[`${pid}_next`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <textarea 
                            className="w-full border border-slate-300 rounded p-2 text-sm pr-8"
                            rows="4"
                            value={data.fromClient}
                            onChange={e => handleTextChange(pid, 'fromClient', e.target.value)}
                            placeholder="Что нужно от клиента..."
                          />
                          {data.fromClient && (
                            <button
                              onClick={() => handleImprove(pid, 'fromClient', data.fromClient)}
                              disabled={improvingFields[`${pid}_fromClient`]}
                              className="absolute bottom-2 right-2 p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 disabled:opacity-50"
                              title="Улучшить текст с помощью ИИ"
                            >
                              {improvingFields[`${pid}_fromClient`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleCopy}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
            >
              Копировать отчёт
            </button>
          </div>
        </>
      )}
    </div>
  );
}
