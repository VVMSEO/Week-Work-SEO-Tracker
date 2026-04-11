import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'settings'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSettings({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setSettings(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const updateSettings = async (newSettings) => {
    if (!auth.currentUser) return;
    
    if (settings?.id) {
      await setDoc(doc(db, 'settings', settings.id), {
        ...newSettings,
        userId: auth.currentUser.uid
      }, { merge: true });
    } else {
      // Create new settings doc
      const newDocRef = doc(collection(db, 'settings'));
      await setDoc(newDocRef, {
        ...newSettings,
        userId: auth.currentUser.uid
      });
    }
  };

  return { settings, loading, updateSettings };
}
