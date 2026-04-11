export function calcPlannedMinutes(budget, overhead, hourlyRate) {
  if (!budget || !overhead || !hourlyRate) return 0;
  const clean = budget / overhead;
  const monthlyHours = clean / hourlyRate;
  const weeklyHours = monthlyHours / 4.33;
  return Math.round(weeklyHours * 60 / 5) * 5;
}

export function formatMinutes(min) {
  if (!min || isNaN(min)) return "0 ч 00 мин";
  return `${Math.floor(min / 60)} ч ${String(min % 60).padStart(2, '0')} мин`;
}

export function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function getWeekRange(mondayStr) {
  const monday = new Date(mondayStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (d) => {
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  
  return `${formatDate(monday)} — ${formatDate(sunday)}`;
}

export function getPreviousMonday(mondayStr) {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

export function getNextMonday(mondayStr) {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export function getMonthString(dateStr) {
  return dateStr.slice(0, 7);
}

export function getPreviousMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  let d = new Date(year, parseInt(month) - 1 - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getNextMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  let d = new Date(year, parseInt(month) - 1 + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthRussian(monthStr) {
  const [year, month] = monthStr.split('-');
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}
