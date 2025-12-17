import { db, storage, USE_CLOUD_DB } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, setDoc, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Activity, User } from '../types';
import { MOCK_ACTIVITIES_GERENCIA, MOCK_USERS } from '../constants';

// Collection Names
const COLL_ACTIVITIES = 'activities';
const COLL_USERS = 'users';

class DataService {
  
  // --- SUBSCRIPTIONS (REAL-TIME UPDATES) ---
  
  subscribeToActivities(onUpdate: (data: Activity[]) => void, onError?: (error: any) => void) {
    if (USE_CLOUD_DB && db) {
      // Cloud Mode: Listen to Firestore
      const q = query(collection(db, COLL_ACTIVITIES));
      return onSnapshot(q, 
        (querySnapshot) => {
          const activities: Activity[] = [];
          querySnapshot.forEach((doc) => {
            activities.push({ ...doc.data(), id: doc.id } as Activity);
          });
          if (activities.length === 0) {
            this.seedInitialData();
          } else {
            onUpdate(activities);
          }
        },
        (error) => {
          console.error("Firestore Error (Activities):", error);
          if (onError) onError(error);
        }
      );
    } else {
      // Local Mode: Load from localStorage
      const saved = localStorage.getItem('app_activities');
      if (saved) {
        onUpdate(JSON.parse(saved));
      } else {
        onUpdate(MOCK_ACTIVITIES_GERENCIA);
      }
      return () => {};
    }
  }

  subscribeToUsers(onUpdate: (data: User[]) => void, onError?: (error: any) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_USERS));
      return onSnapshot(q, 
        (querySnapshot) => {
          const users: User[] = [];
          querySnapshot.forEach((doc) => {
            users.push({ ...doc.data(), id: doc.id } as User);
          });
          if (users.length === 0) {
             onUpdate(MOCK_USERS); 
          } else {
             onUpdate(users);
          }
        },
        (error) => {
          console.error("Firestore Error (Users):", error);
          if (onError) onError(error);
        }
      );
    } else {
      const saved = localStorage.getItem('app_users');
      if (saved) {
        onUpdate(JSON.parse(saved));
      } else {
        onUpdate(MOCK_USERS);
      }
      return () => {};
    }
  }

  // --- ACTIONS ---

  async addActivity(activity: Activity) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = activity; 
      await setDoc(doc(db, COLL_ACTIVITIES, activity.id), data);
    } else {
      const current = this.getLocalActivities();
      const updated = [...current, activity];
      this.saveLocalActivities(updated);
    }
  }

  async updateActivity(activity: Activity) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = activity;
      const docRef = doc(db, COLL_ACTIVITIES, id);
      await updateDoc(docRef, data);
    } else {
      const current = this.getLocalActivities();
      const updated = current.map(a => a.id === activity.id ? activity : a);
      this.saveLocalActivities(updated);
    }
  }

  async deleteActivity(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_ACTIVITIES, id));
    } else {
      const current = this.getLocalActivities();
      const updated = current.filter(a => a.id !== id);
      this.saveLocalActivities(updated);
    }
  }

  // --- FILE UPLOAD (STORAGE) ---
  
  async uploadEvidence(file: File, activityId: string, year: number): Promise<string> {
    if (USE_CLOUD_DB && storage) {
      try {
        // Path: evidence/2025/ACT-001/filename.pdf
        const storageRef = ref(storage, `evidence/${year}/${activityId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("No se pudo subir el archivo a la nube.");
      }
    } else {
      // Local Mode Fallback: Create a fake local URL
      console.warn("Upload simulado (Modo Local)");
      return URL.createObjectURL(file);
    }
  }

  // --- USER ACTIONS ---

  async addUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      await setDoc(doc(db, COLL_USERS, user.id), data);
    } else {
      const current = this.getLocalUsers();
      const updated = [...current, user];
      this.saveLocalUsers(updated);
    }
  }

  async updateUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      const docRef = doc(db, COLL_USERS, id);
      await updateDoc(docRef, data);
    } else {
      const current = this.getLocalUsers();
      const updated = current.map(u => u.id === user.id ? user : u);
      this.saveLocalUsers(updated);
    }
  }

  async deleteUser(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_USERS, id));
    } else {
      const current = this.getLocalUsers();
      const updated = current.filter(u => u.id !== id);
      this.saveLocalUsers(updated);
    }
  }

  // --- LOCAL STORAGE HELPERS (Internal) ---
  
  private getLocalActivities(): Activity[] {
    const s = localStorage.getItem('app_activities');
    return s ? JSON.parse(s) : MOCK_ACTIVITIES_GERENCIA;
  }

  private saveLocalActivities(data: Activity[]) {
    localStorage.setItem('app_activities', JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-changed'));
  }

  private getLocalUsers(): User[] {
    const s = localStorage.getItem('app_users');
    return s ? JSON.parse(s) : MOCK_USERS;
  }

  private saveLocalUsers(data: User[]) {
    localStorage.setItem('app_users', JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-changed'));
  }

  private async seedInitialData() {
    if (!USE_CLOUD_DB || !db) return;
    console.log("Seeding initial data to Cloud...");
    try {
      for (const act of MOCK_ACTIVITIES_GERENCIA) {
         const { id, ...data } = act;
         await setDoc(doc(db, COLL_ACTIVITIES, id), data);
      }
      for (const user of MOCK_USERS) {
         const { id, ...data } = user;
         await setDoc(doc(db, COLL_USERS, id), data);
      }
    } catch (e) {
      console.error("Error seeding data (likely permissions):", e);
    }
  }
}

export const dataService = new DataService();