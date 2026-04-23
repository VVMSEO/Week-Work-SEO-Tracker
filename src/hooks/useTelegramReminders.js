import { useEffect } from 'react';
import { sendTelegramMessage } from '../services/telegramService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { formatMinutes } from '../utils/timeCalc';

export function useTelegramReminders(user, settings, activeTimer, projects = []) {
  useEffect(() => {
    if (!user || !settings?.tgToken || !settings?.tgChatId) return;

    const checkReminders = async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const today = now.toISOString().split('T')[0];
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
      
      const tgToken = settings.tgToken;
      const tgChatId = settings.tgChatId;

      // 1. Утреннее напоминание (в 10:00)
      const morningKey = `tg_morning_${today}`;
      if (hours === 10 && !localStorage.getItem(morningKey)) {
        const q = query(collection(db, 'timeLogs'), where('userId', '==', user.uid), where('date', '==', today));
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(d => d.data());
        const pending = logs.filter(l => l.status === 'Не начата' || l.status === 'В работе');
        
        if (pending.length > 0) {
          let msg = `🌅 Доброе утро! План на сегодня:\n\n`;
          pending.forEach(l => msg += `- ${l.projectName}: ${l.task}\n`);
          await sendTelegramMessage(tgToken, tgChatId, msg);
        }
        localStorage.setItem(morningKey, 'true');
      }

      // 2. Напоминание о незапущенном таймере (с 11:00 до 18:00)
      if (hours >= 11 && hours < 18 && !activeTimer) {
        const lastStop = localStorage.getItem('lastTimerStop') || new Date().setHours(10,0,0,0);
        const elapsedSinceStop = Date.now() - parseInt(lastStop);
        
        // Если прошло больше 2 часов без таймера
        if (elapsedSinceStop > 2 * 60 * 60 * 1000) {
          const reminderKey = `tg_idle_${today}_${hours}`;
          if (!localStorage.getItem(reminderKey)) {
            await sendTelegramMessage(tgToken, tgChatId, `⏳ Вы не запускали таймер уже более 2 часов. Не забыли включить?`);
            localStorage.setItem(reminderKey, 'true');
          }
        }
      }

      // 3. Итоги дня (в 18:30)
      const summaryKey = `tg_summary_${today}`;
      if (hours === 18 && minutes === 30 && !localStorage.getItem(summaryKey)) {
        const q = query(collection(db, 'timeLogs'), where('userId', '==', user.uid), where('date', '==', today));
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(d => d.data());
        const done = logs.filter(l => l.status === 'Сделана');
        const dayTotal = logs.reduce((sum, l) => sum + (l.workedMinutes || 0), 0);

        let msg = `📊 Итоги дня:\n`;
        msg += `⏱ Отработано всего: ${formatMinutes(dayTotal)}\n\n`;
        if (done.length > 0) {
          msg += `✅ Выполненные задачи:\n`;
          done.forEach(l => msg += `- ${l.projectName}: ${l.task}\n`);
        } else {
          msg += `⏸ Нет закрытых задач сегодня.`;
        }
        await sendTelegramMessage(tgToken, tgChatId, msg);
        localStorage.setItem(summaryKey, 'true');
      }

      // 4. Пятничное напоминание об отчётах (Пятница, 17:00)
      const reportReminderKey = `tg_report_reminder_${today}`;
      if (dayOfWeek === 5 && hours === 17 && !localStorage.getItem(reportReminderKey)) {
        await sendTelegramMessage(tgToken, tgChatId, `📅 Пятница, 17:00! Не забудьте составить и отправить отчеты клиентам за неделю.`);
        localStorage.setItem(reportReminderKey, 'true');
      }

      // 5. Конец рабочего дня (в 19:00 - сдвинул чуть позже из-за итогов)
      const eveningKey = `tg_evening_${today}`;
      if (hours === 19 && !localStorage.getItem(eveningKey)) {
        let msg = `🌇 Рабочий день подходит к концу!`;
        if (activeTimer) {
          msg += `\n\n⚠️ У вас до сих пор запущен таймер по задаче:\n"${activeTimer.task}"\nНе забудьте выключить!`;
        }
        await sendTelegramMessage(tgToken, tgChatId, msg);
        localStorage.setItem(eveningKey, 'true');
      }
      // 6. Проверка перерасхода недельного бюджета
      const overrunKey = `tg_overrun_${today}`;
      if (hours >= 10 && hours <= 20 && projects.length > 0 && !localStorage.getItem(overrunKey)) {
        // Получаем начало недели
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];

        const q = query(
          collection(db, 'timeLogs'), 
          where('userId', '==', user.uid), 
          where('date', '>=', monday),
          where('date', '<=', today)
        );
        const snapshot = await getDocs(q);
        const weekLogs = snapshot.docs.map(d => d.data());

        let overruns = [];
        projects.forEach(p => {
          if (!p.active) return;
          const planned = (p.budget / (settings.hourlyRate || 1)) * 60;
          const actual = weekLogs.filter(l => l.projectId === p.id).reduce((sum, l) => sum + (l.workedMinutes || 0), 0);
          
          if (actual > planned) {
            // Чтобы не спамить, проверяем, сообщали ли мы уже об этом конкретном проекте сегодня
            const projectOverrunKey = `tg_overrun_${p.id}_${today}`;
            if (!localStorage.getItem(projectOverrunKey)) {
              overruns.push(`${p.name} (Факт: ${formatMinutes(actual)} / План: ${formatMinutes(planned)})`);
              localStorage.setItem(projectOverrunKey, 'true');
            }
          }
        });

        if (overruns.length > 0) {
          let msg = `⚠️ Внимание! Превышен недельный лимит по проектам:\n\n`;
          overruns.forEach(o => msg += `- ${o}\n`);
          await sendTelegramMessage(tgToken, tgChatId, msg);
        }
        // Ставим общую метку, чтобы не пересчитывать слишком часто (раз в 2 часа)
        localStorage.setItem(overrunKey, 'true');
        setTimeout(() => localStorage.removeItem(overrunKey), 2 * 60 * 60 * 1000);
      }
    };

    const interval = setInterval(checkReminders, 15000); // 15 секунд достаточно
    checkReminders();

    return () => clearInterval(interval);
  }, [user, settings, activeTimer, projects]);
}
