import { useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useReminders(user) {
  useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const today = new Date().toISOString().split('T')[0];
      const lastNotified = localStorage.getItem('lastNotifiedDate');

      // Уведомляем только один раз в день
      if (lastNotified === today) return;

      const q = query(
        collection(db, 'timeLogs'),
        where('userId', '==', user.uid),
        where('date', '==', today)
      );

      try {
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(doc => doc.data());
        const pending = logs.filter(l => l.status === 'Не начата' || l.status === 'В работе');

        if (pending.length > 0) {
          new Notification('SEO Tracker: Задачи на сегодня', {
            body: `У вас ${pending.length} невыполненных задач на сегодня. Не забудьте их завершить!`,
            icon: '/vite.svg'
          });
          
          localStorage.setItem('lastNotifiedDate', today);
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Проверяем при загрузке
    checkReminders();

    // Проверяем каждый час
    const interval = setInterval(checkReminders, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
}
