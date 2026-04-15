import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const addProject = async (projectData) => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, 'projects'), {
      ...projectData,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
  };

  const updateProject = async (id, data) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'projects', id), data);
  };

  const deleteProject = async (id) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'projects', id));
  };

  return { projects, loading, addProject, updateProject, deleteProject };
}
