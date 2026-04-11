import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export function useTimeLogsByWeek(weekStart) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !weekStart) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'timeLogs'),
      where('userId', '==', auth.currentUser.uid),
      where('weekStart', '==', weekStart)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching weekly logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, weekStart]);

  return { logs, loading };
}

export function useTimeLogsByMonth(month) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !month) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'timeLogs'),
      where('userId', '==', auth.currentUser.uid),
      where('month', '==', month)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching monthly logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, month]);

  return { logs, loading };
}

export const addLog = async (logData) => {
  if (!auth.currentUser) return;
  await addDoc(collection(db, 'timeLogs'), {
    ...logData,
    userId: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });
};

export const updateLog = async (id, data) => {
  if (!auth.currentUser) return;
  await updateDoc(doc(db, 'timeLogs', id), data);
};

export const deleteLog = async (id) => {
  if (!auth.currentUser) return;
  // Soft delete via status update
  await updateDoc(doc(db, 'timeLogs', id), { status: 'Удалена' });
};
