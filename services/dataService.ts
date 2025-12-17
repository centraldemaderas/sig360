
import { db, USE_CLOUD_DB } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, setDoc, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
// Added UserRole to the imports from ../types to fix the errors on lines 392, 401, and 410
import { Activity, User, StandardDefinition, AppSettings, StandardType, Notification, UserRole } from '../types';
import { MOCK_ACTIVITIES_GERENCIA, MOCK_USERS } from '../constants';

// Collection Names
const COLL_ACTIVITIES = 'activities';
const COLL_USERS = 'users';
const COLL_STANDARDS = 'standards';
const COLL_SETTINGS = 'settings';
const COLL_NOTIFICATIONS = 'notifications';
const DOC_SETTINGS_GENERAL = 'general';

class DataService {
  
  // --- SUBSCRIPTIONS (REAL-TIME UPDATES) ---
  
  subscribeToActivities(onUpdate: (data: Activity[]) => void, onError?: (error: any) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_ACTIVITIES));
      return onSnapshot(q, 
        (querySnapshot) => {
          const activities: Activity[] = [];
          querySnapshot.forEach((doc) => {
            activities.push({ ...doc.data(), id: doc.id } as Activity);
          });
          onUpdate(activities);
        },
        (error) => {
          console.error("Firestore Error (Activities):", error);
          if (onError) onError(error);
        }
      );
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_activities');
        if (saved) {
          onUpdate(JSON.parse(saved));
        } else {
          onUpdate(MOCK_ACTIVITIES_GERENCIA);
        }
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
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
          onUpdate(users);
        },
        (error) => {
          if (onError) onError(error);
        }
      );
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_users');
        if (saved) {
          onUpdate(JSON.parse(saved));
        } else {
          onUpdate(MOCK_USERS);
        }
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  subscribeToNotifications(userId: string, onUpdate: (data: Notification[]) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(
        collection(db, COLL_NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach(doc => notifs.push({ ...doc.data(), id: doc.id } as Notification));
        onUpdate(notifs);
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem(`notifs_${userId}`);
        onUpdate(saved ? JSON.parse(saved) : []);
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  subscribeToStandards(onUpdate: (data: StandardDefinition[]) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_STANDARDS));
      return onSnapshot(q, (snapshot) => {
        const stds: StandardDefinition[] = [];
        snapshot.forEach(doc => stds.push({ ...doc.data(), id: doc.id } as StandardDefinition));
        onUpdate(stds);
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_standards');
        if (saved) {
          onUpdate(JSON.parse(saved));
        } else {
          onUpdate([]);
        }
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  subscribeToSettings(onUpdate: (data: AppSettings) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(doc(db, COLL_SETTINGS, DOC_SETTINGS_GENERAL), (doc) => {
        if (doc.exists()) {
          onUpdate(doc.data() as AppSettings);
        } else {
          onUpdate({ companyLogo: null });
        }
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('company_logo');
        onUpdate({ companyLogo: saved || null });
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  // --- ACTIONS ---

  async createNotification(notif: Omit<Notification, 'id'>) {
    const usersSnapshot = await this.getUsersOnce();
    const targetUser = usersSnapshot.find(u => u.id === notif.userId);
    
    if (targetUser && targetUser.notifications) {
      const prefs = targetUser.notifications;
      let shouldNotify = false;

      if (notif.type === 'REJECTION' && prefs.notifyOnRejection) shouldNotify = true;
      if (notif.type === 'APPROVAL' && prefs.notifyOnApproval) shouldNotify = true;
      if (notif.type === 'NEW_UPLOAD' && prefs.notifyOnNewUpload) shouldNotify = true;
      if (notif.type === 'SYSTEM') shouldNotify = true;

      if (!shouldNotify) return;

      if (prefs.emailEnabled) {
        console.log(`%c[EMAIL SIMULATOR] Sending email to: ${targetUser.email}\nSubject: ${notif.title}\nMessage: ${notif.message}`, "color: #2563eb; font-weight: bold;");
      }
    }

    if (USE_CLOUD_DB && db) {
      const docRef = doc(collection(db, COLL_NOTIFICATIONS));
      await setDoc(docRef, this.cleanData(notif));
    } else {
      const saved = localStorage.getItem(`notifs_${notif.userId}`);
      const current: Notification[] = saved ? JSON.parse(saved) : [];
      const updated = [{ ...notif, id: `notif-${Date.now()}` }, ...current].slice(0, 50);
      localStorage.setItem(`notifs_${notif.userId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  async markNotificationAsRead(id: string, userId: string) {
    if (USE_CLOUD_DB && db) {
      await updateDoc(doc(db, COLL_NOTIFICATIONS, id), { read: true });
    } else {
      const saved = localStorage.getItem(`notifs_${userId}`);
      if (saved) {
        const current: Notification[] = JSON.parse(saved);
        const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem(`notifs_${userId}`, JSON.stringify(updated));
        window.dispatchEvent(new Event('local-data-changed'));
      }
    }
  }

  async getUsersOnce(): Promise<User[]> {
    if (USE_CLOUD_DB && db) {
      const snap = await getDocs(collection(db, COLL_USERS));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
    } else {
      return this.getLocalUsers();
    }
  }

  async addActivity(activity: Activity) {
    if (USE_CLOUD_DB && db) {
      try {
        const { id, ...data } = activity; 
        const sanitized = this.cleanData(data);
        await setDoc(doc(db, COLL_ACTIVITIES, activity.id), sanitized);
      } catch (error) {
        console.error("Error adding activity:", error);
        throw error;
      }
    } else {
      const current = this.getLocalActivities();
      const updated = [...current, activity];
      this.saveLocalActivities(updated);
    }
  }

  async updateActivity(activity: Activity) {
    if (USE_CLOUD_DB && db) {
      try {
        const { id, ...data } = activity;
        const sanitized = this.cleanData(data);
        const docRef = doc(db, COLL_ACTIVITIES, id);
        await updateDoc(docRef, sanitized);
      } catch (error) {
        console.error("Error updating activity:", error);
        throw error;
      }
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

  async addUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      const sanitized = this.cleanData(data);
      await setDoc(doc(db, COLL_USERS, user.id), sanitized);
    } else {
      const current = this.getLocalUsers();
      const updated = [...current, user];
      this.saveLocalUsers(updated);
    }
  }

  async updateUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      const sanitized = this.cleanData(data);
      const docRef = doc(db, COLL_USERS, id);
      await updateDoc(docRef, sanitized);
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

  async addStandard(std: StandardDefinition) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = std;
      const sanitized = this.cleanData(data);
      await setDoc(doc(db, COLL_STANDARDS, id), sanitized);
    } else {
      const current = this.getLocalStandards();
      const updated = [...current, std];
      this.saveLocalStandards(updated);
    }
  }

  async updateStandard(std: StandardDefinition) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = std;
      const sanitized = this.cleanData(data);
      await setDoc(doc(db, COLL_STANDARDS, id), sanitized);
    } else {
      const current = this.getLocalStandards();
      const updated = current.map(s => s.id === std.id ? std : s);
      this.saveLocalStandards(updated);
    }
  }

  async updateSettings(settings: AppSettings) {
    if (USE_CLOUD_DB && db) {
      const sanitized = this.cleanData(settings);
      await setDoc(doc(db, COLL_SETTINGS, DOC_SETTINGS_GENERAL), sanitized);
    } else {
      if (settings.companyLogo) {
        localStorage.setItem('company_logo', settings.companyLogo);
      } else {
        localStorage.removeItem('company_logo');
      }
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  private cleanData(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanData(item));
    } else if (obj !== null && typeof obj === 'object') {
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === undefined) {
          newObj[key] = null;
        } else {
          newObj[key] = this.cleanData(value);
        }
      });
      return newObj;
    }
    return obj;
  }

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

  private getLocalStandards(): StandardDefinition[] {
    const s = localStorage.getItem('app_standards');
    return s ? JSON.parse(s) : [];
  }

  private saveLocalStandards(data: StandardDefinition[]) {
    localStorage.setItem('app_standards', JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-changed'));
  }

  public async seedInitialData() {
    if (!USE_CLOUD_DB || !db) throw new Error("No hay conexión a la Nube");
    
    console.log("Iniciando carga de datos masiva...");
    const batchPromises = [];

    for (const act of MOCK_ACTIVITIES_GERENCIA) {
       const { id, ...data } = act;
       batchPromises.push(setDoc(doc(db, COLL_ACTIVITIES, id), this.cleanData(data)));
    }

    // Seed specifically requested users
    const seedUsers: User[] = [
      {
        id: 'u-david',
        name: 'David Marín',
        email: 'david@centralmaderas.com',
        role: UserRole.LEADER,
        assignedArea: 'Gerencia',
        password: '123',
        notifications: { notifyOnRejection: true, notifyOnApproval: true, notifyOnNewUpload: false, emailEnabled: true }
      },
      {
        id: 'u-sandra',
        name: 'Sandra Barbosa',
        email: 'sandra@centralmaderas.com',
        role: UserRole.LEADER,
        assignedArea: 'HSEQ',
        password: '123',
        notifications: { notifyOnRejection: true, notifyOnApproval: true, notifyOnNewUpload: false, emailEnabled: true }
      },
      {
        id: 'u-admin',
        name: 'Administrador SIG',
        email: 'admin@centralmaderas.com',
        role: UserRole.ADMIN,
        assignedArea: 'HSEQ',
        password: '123',
        notifications: { notifyOnRejection: true, notifyOnApproval: true, notifyOnNewUpload: true, emailEnabled: true }
      }
    ];

    for (const user of seedUsers) {
       const { id, ...data } = user;
       batchPromises.push(setDoc(doc(db, COLL_USERS, id), this.cleanData(data)));
    }

    const defaultStandards: StandardDefinition[] = [
      { id: 'std-iso', type: StandardType.ISO9001, description: 'Norma Internacional de Sistemas de Gestión de Calidad.', objective: 'Aumentar la satisfacción del cliente.', certifyingBody: 'ICONTEC', comments: [] },
      { id: 'std-sst', type: StandardType.SGSST, description: 'Sistema de Gestión de Seguridad y Salud en el Trabajo.', objective: 'Prevenir lesiones y deterioro de la salud.', certifyingBody: 'ARL / MinTrabajo', comments: [] },
      { id: 'std-fsc', type: StandardType.FSC, description: 'Certificación de manejo forestal responsable.', objective: 'Garantizar la trazabilidad de la madera.', certifyingBody: 'FSC International', comments: [] }
    ];

    for (const std of defaultStandards) {
      batchPromises.push(setDoc(doc(db, COLL_STANDARDS, std.id), this.cleanData(std)));
    }

    await Promise.all(batchPromises);
    console.log("¡Carga completada!");
  }
}

export const dataService = new DataService();
