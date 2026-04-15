import React, { useState, useEffect } from 'react';
import { useTimeLogsByWeek, updateLog } from '../hooks/useTimeLogs';
import { getMonday, getPreviousMonday, getNextMonday, getWeekRange } from '../utils/timeCalc';
import { improveText } from '../services/aiService';
import { Wand2, Loader2, Check } from 'lucide-react';

export default function ClientReport({ projects }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date().toISOString().split('T')[0]));
  const { logs, loading } = useTimeLogsByWeek(weekStart);
  const [reportData, setReportData] = useState({});
  const [improvingFields, setImprovingFields] = useState({});
  const [savingLogs, setSavingLogs] = useState({});

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
          doneLogs: [],
          next: '',
          fromClient: ''
        };
      }
      grouped[log.projectId].doneLogs.push({
        id: log.id,
        task: log.task,
        result: log.result || ''
      });
    });

    // Merge with existing state to preserve typed text
    setReportData(prev => {
      const merged = { ...prev };
      Object.keys(grouped).forEach(pid => {
        if (!merged[pid]) {
          merged[pid] = grouped[pid];
        } else {
          // Update doneLogs but keep local edits if they exist
          const newDoneLogs = grouped[pid].doneLogs.map(newLog => {
            const existingLog = merged[pid].doneLogs?.find(l => l.id === newLog.id);
            return existingLog ? { ...newLog, result: existingLog.result } : newLog;
          });
          merged[pid].doneLogs = newDoneLogs;
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

  const handleLogResultChange = (projectId, logId, newResult) => {
    setReportData(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        doneLogs: prev[projectId].doneLogs.map(l => l.id === logId ? { ...l, result: newResult } : l)
      }
    }));
  };

  const saveLogResult = async (logId, result) => {
    setSavingLogs(prev => ({ ...prev, [logId]: 'saving' }));
    await updateLog(logId, { result });
    setSavingLogs(prev => ({ ...prev, [logId]: 'saved' }));
    setTimeout(() => {
      setSavingLogs(prev => ({ ...prev, [logId]: null }));
    }, 2000);
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
      if ((!data.doneLogs || data.doneLogs.length === 0) && !data.next && !data.fromClient) return;
      
      const doneText = data.doneLogs.map(d => `• ${d.task}${d.result ? ` (${d.result})` : ''}`).join('<br>');
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Что сделано (Задачи и результаты)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">Что дальше</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">От клиента</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {projectIds.map(pid => {
                  const data = reportData[pid];
                  if ((!data.doneLogs || data.doneLogs.length === 0) && !data.next && !data.fromClient) return null;
                  
                  return (
                    <tr key={pid} className="align-top">
                      <td className="px-6 py-4 font-medium text-slate-900">{data.projectName}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="space-y-3">
                          {data.doneLogs?.map(log => (
                            <div key={log.id} className="bg-slate-50 p-2 rounded border border-slate-100">
                              <div className="font-medium text-slate-800 mb-1 flex items-start">
                                <span className="text-slate-400 mr-2">•</span>
                                <span>{log.task}</span>
                              </div>
                              <div className="relative mt-1 ml-4">
                                <textarea
                                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                  rows="2"
                                  placeholder="Результат выполнения..."
                                  value={log.result}
                                  onChange={e => handleLogResultChange(pid, log.id, e.target.value)}
                                  onBlur={() => saveLogResult(log.id, log.result)}
                                />
                                {savingLogs[log.id] === 'saving' && <Loader2 className="w-3 h-3 animate-spin absolute bottom-2 right-2 text-blue-500" />}
                                {savingLogs[log.id] === 'saved' && <Check className="w-3 h-3 absolute bottom-2 right-2 text-green-500" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative h-full">
                          <textarea 
                            className="w-full h-full min-h-[100px] border border-slate-300 rounded p-2 text-sm pr-8 resize-y"
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
                        <div className="relative h-full">
                          <textarea 
                            className="w-full h-full min-h-[100px] border border-slate-300 rounded p-2 text-sm pr-8 resize-y"
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
