import { db, USE_CLOUD_DB } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { Activity, User, StandardDefinition, AppSettings, Notification, Plant, Area } from '../types';
import { MOCK_ACTIVITIES_GERENCIA, MOCK_USERS } from '../constants';

const COLL_ACTIVITIES = 'activities';
const COLL_USERS = 'users';
const COLL_STANDARDS = 'standards';
const COLL_SETTINGS = 'settings';
const COLL_NOTIFICATIONS = 'notifications';
const COLL_PLANTS = 'plants';
const COLL_AREAS = 'areas';
const DOC_SETTINGS_GENERAL = 'general';

class DataService {
  
  private cleanPlantIds(pids: string[] | undefined): string[] {
    if (!pids || !Array.isArray(pids)) return ['MOSQUERA'];
    const cleaned = pids.map(id => String(id || '').trim().toUpperCase()).filter(id => id !== '');
    if (cleaned.length === 0) return ['MOSQUERA'];
    return Array.from(new Set(cleaned));
  }

  subscribeToActivities(onUpdate: (data: Activity[]) => void, onError?: (error: any) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(collection(db, COLL_ACTIVITIES), 
        (snap) => {
          const acts = snap.docs.map(d => ({ ...d.data(), id: d.id, plantIds: this.cleanPlantIds((d.data() as any).plantIds) } as Activity));
          onUpdate(acts);
        },
        (error) => { console.error("Error Actividades:", error); if (onError) onError(error); }
      );
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_activities');
        onUpdate(saved ? JSON.parse(saved) : MOCK_ACTIVITIES_GERENCIA);
      };
      load();
      window.addEventListener('local-data-changed', load);
      return () => window.removeEventListener('local-data-changed', load);
    }
  }

  subscribeToNotifications(userId: string, onUpdate: (data: Notification[]) => void) {
    if (USE_CLOUD_DB && db) {
      // FIX: Solo filtro básico para evitar errores de 'failed-precondition'
      const q = query(collection(db, COLL_NOTIFICATIONS), where('userId', '==', userId));
      return onSnapshot(q, (snap) => {
        const notifs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
        notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(notifs.slice(0, 50));
      }, (err) => {
        console.error("Error Notificaciones:", err);
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem(`notifs_${userId}`);
        onUpdate(saved ? JSON.parse(saved) : []);
      };
      load();
      window.addEventListener('local-data-changed', load);
      return () => window.removeEventListener('local-data-changed', load);
    }
  }

  subscribeToUsers(onUpdate: (data: User[]) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(collection(db, COLL_USERS), (snap) => {
        onUpdate(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_users');
        onUpdate(saved ? JSON.parse(saved) : MOCK_USERS);
      };
      load();
      window.addEventListener('local-data-changed', load);
      return () => window.removeEventListener('local-data-changed', load);
    }
  }

  subscribeToPlants(onUpdate: (data: Plant[]) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(collection(db, COLL_PLANTS), (snap) => {
        onUpdate(snap.docs.map(d => ({ ...d.data(), id: d.id } as Plant)));
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_plants');
        onUpdate(saved ? JSON.parse(saved) : []);
      };
      load();
      window.addEventListener('local-data-changed', load);
      return () => window.removeEventListener('local-data-changed', load);
    }
  }

  subscribeToAreas(onUpdate: (data: Area[]) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(collection(db, COLL_AREAS), (snap) => {
        onUpdate(snap.docs.map(d => ({ ...d.data(), id: d.id } as Area)));
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_areas');
        onUpdate(saved ? JSON.parse(saved) : []);
      };
      load();
      window.addEventListener('local-data-changed', load);
      return () => window.removeEventListener('local-data-changed', load);
    }
  }

  subscribeToStandards(onUpdate: (data: StandardDefinition[]) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(collection(db, COLL_STANDARDS), (snap) => {
        onUpdate(snap.docs.map(d => ({ ...d.data(), id: d.id } as StandardDefinition)));
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_standards');
        onUpdate(saved ? JSON.parse(saved) : []);
      };
      load();
      window.addEventListener('local-data-changed', load);
      return () => window.removeEventListener('local-data-changed', load);
    }
  }

  subscribeToSettings(onUpdate: (data: AppSettings) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(doc(db, COLL_SETTINGS, DOC_SETTINGS_GENERAL), (d) => {
        onUpdate(d.exists() ? (d.data() as AppSettings) : { companyLogo: null });
      });
    } else {
      const load = () => onUpdate({ companyLogo: localStorage.getItem('company_logo') });
      load();
      window.addEventListener('local-data-changed', load);
      return () => window.removeEventListener('local-data-changed', load);
    }
  }

  async updateSettings(settings: AppSettings) {
    const data = this.cleanData(settings);
    if (USE_CLOUD_DB && db) {
      await setDoc(doc(db, COLL_SETTINGS, DOC_SETTINGS_GENERAL), data, { merge: true });
    } else {
      if (data.companyLogo !== undefined) {
        if (data.companyLogo === null) localStorage.removeItem('company_logo');
        else localStorage.setItem('company_logo', data.companyLogo);
      }
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  async markNotificationAsRead(id: string, userId: string) {
    if (USE_CLOUD_DB && db) {
      await updateDoc(doc(db, COLL_NOTIFICATIONS, id), { read: true });
    } else {
      const saved = localStorage.getItem(`notifs_${userId}`);
      if (saved) {
        const notifs = JSON.parse(saved).map((n: any) => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem(`notifs_${userId}`, JSON.stringify(notifs));
        window.dispatchEvent(new Event('local-data-changed'));
      }
    }
  }

  async addActivity(activity: Activity) {
    const data = this.cleanData({ ...activity, plantIds: this.cleanPlantIds(activity.plantIds) });
    if (USE_CLOUD_DB && db) {
      await setDoc(doc(db, COLL_ACTIVITIES, activity.id), data);
    } else {
      const current = JSON.parse(localStorage.getItem('app_activities') || '[]');
      localStorage.setItem('app_activities', JSON.stringify([...current, data]));
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  async updateActivity(activity: Activity) {
    const data = this.cleanData(activity);
    if (USE_CLOUD_DB && db) {
      await updateDoc(doc(db, COLL_ACTIVITIES, activity.id), data);
    } else {
      const current = JSON.parse(localStorage.getItem('app_activities') || '[]');
      localStorage.setItem('app_activities', JSON.stringify(current.map((a: any) => a.id === activity.id ? data : a)));
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  async deleteActivity(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_ACTIVITIES, id));
    } else {
      const current = JSON.parse(localStorage.getItem('app_activities') || '[]');
      localStorage.setItem('app_activities', JSON.stringify(current.filter((a: any) => a.id !== id)));
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  async addPlant(p: Plant) {
    if (USE_CLOUD_DB && db) await setDoc(doc(db, COLL_PLANTS, p.id), this.cleanData(p));
  }
  async updatePlant(p: Plant) {
    if (USE_CLOUD_DB && db) await updateDoc(doc(db, COLL_PLANTS, p.id), this.cleanData(p));
  }
  async deletePlant(id: string) {
    if (USE_CLOUD_DB && db) await deleteDoc(doc(db, COLL_PLANTS, id));
  }

  async addArea(a: Area) {
    if (USE_CLOUD_DB && db) await setDoc(doc(db, COLL_AREAS, a.id), this.cleanData(a));
  }
  async updateArea(a: Area) {
    if (USE_CLOUD_DB && db) await updateDoc(doc(db, COLL_AREAS, a.id), this.cleanData(a));
  }
  async deleteArea(id: string) {
    if (USE_CLOUD_DB && db) await deleteDoc(doc(db, COLL_AREAS, id));
  }

  async addStandard(s: StandardDefinition) {
    if (USE_CLOUD_DB && db) await setDoc(doc(db, COLL_STANDARDS, s.id), this.cleanData(s));
  }
  async updateStandard(s: StandardDefinition) {
    if (USE_CLOUD_DB && db) await updateDoc(doc(db, COLL_STANDARDS, s.id), this.cleanData(s));
  }

  async addUser(u: User) {
    if (USE_CLOUD_DB && db) await setDoc(doc(db, COLL_USERS, u.id), this.cleanData(u));
  }
  async updateUser(u: User) {
    if (USE_CLOUD_DB && db) await updateDoc(doc(db, COLL_USERS, u.id), this.cleanData(u));
  }
  async deleteUser(id: string) {
    if (USE_CLOUD_DB && db) await deleteDoc(doc(db, COLL_USERS, id));
  }

  private cleanData(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(v => this.cleanData(v));
    if (typeof obj === 'object') {
      const n: any = {};
      Object.keys(obj).forEach(k => {
        if (k !== 'id') n[k] = this.cleanData(obj[k]);
      });
      return n;
    }
    return obj;
  }
}

export const dataService = new DataService();