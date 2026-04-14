import { useEffect } from 'react';
import { sendTelegramMessage } from '../services/telegramService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useTelegramReminders(user, settings, activeTimer) {
  useEffect(() => {
    if (!user || !settings?.tgToken || !settings?.tgChatId) return;

    const checkReminders = async () => {
      const now = new Date();
      const hours = now.getHours();
      const today = now.toISOString().split('T')[0];
      
      const tgToken = settings.tgToken;
      const tgChatId = settings.tgChatId;

      // 0. Таймер истек
      if (activeTimer && activeTimer.plannedMinutes > 0) {
        const elapsedMs = Date.now() - activeTimer.startTime;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        const totalMinutes = activeTimer.initialWorkedMinutes + elapsedMinutes;

        if (totalMinutes >= activeTimer.plannedMinutes) {
          const expiredKey = `tg_expired_${activeTimer.logId}_${activeTimer.startTime}`;
          if (!localStorage.getItem(expiredKey)) {
            await sendTelegramMessage(
              tgToken, 
              tgChatId, 
              `⏰ Время вышло!\n\nЗапланированное время (${activeTimer.plannedMinutes} мин) на задачу:\n"${activeTimer.task}"\nпо проекту ${activeTimer.projectName} истекло.`
            );
            localStorage.setItem(expiredKey, 'true');
          }
        }
      }

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

      // 3. Конец рабочего дня (в 18:00)
      const eveningKey = `tg_evening_${today}`;
      if (hours === 18 && !localStorage.getItem(eveningKey)) {
        let msg = `🌇 Рабочий день подходит к концу!`;
        if (activeTimer) {
          msg += `\n\n⚠️ У вас до сих пор запущен таймер по задаче:\n"${activeTimer.task}"\nНе забудьте выключить!`;
        }
        await sendTelegramMessage(tgToken, tgChatId, msg);
        localStorage.setItem(eveningKey, 'true');
      }
    };

    const interval = setInterval(checkReminders, 5000);
    checkReminders();

    return () => clearInterval(interval);
  }, [user, settings, activeTimer]);
}
